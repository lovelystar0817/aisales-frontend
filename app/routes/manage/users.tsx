import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  dashboardApi,
  usersApi,
  type UsersResponse,
  formatDuration,
  formatDate,
  manageUsersApi,
} from '../../util/api';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '~/hooks/useDebounce';
import {
  getManulifeScoreBadge,
  getScoreBadge,
  getStandingColors,
} from '../../util/manage';
import { useTranslation } from 'react-i18next';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

import ReportModal, { ReportType } from '~/components/ReportModal';
import { MultiselectTeamDropdown } from './settings/components/MultiselectTeamDropdown';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useManageAuthStore } from '~/store/manageAuth';
import { MANULIFE_COMPANY_ID } from '~/util/constants';

export function meta() {
  return [{ title: 'Hupo Sales AI | Users' }];
}

export default withAuthenticationRequired(function UsersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const company = useManageAuthStore((state) => state.company);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [teamsFilter, setTeamsFilter] = useState<string[] | undefined>(
    undefined,
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Temporary state for teams filter (only committed on dropdown close)
  const [tempTeamsFilter, setTempTeamsFilter] = useState<string[] | undefined>(
    teamsFilter,
  );

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Debounce search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const adminSettingsEnabled = useFeatureFlagEnabled('admin-settings');
  const selfServeEnabled = useFeatureFlagEnabled('self-serve');

  // Reset to page 1 when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, moduleFilter, teamsFilter, statusFilter]);

  // Sync temp state with actual filter state when they change from other sources
  useEffect(() => {
    setTempTeamsFilter(teamsFilter);
  }, [teamsFilter]);

  const { data: filterOptions } = useQuery({
    queryKey: ['dashboard-filter-options', selfServeEnabled],
    queryFn: () =>
      selfServeEnabled
        ? dashboardApi.getFilterOptionsV2()
        : dashboardApi.getFilterOptions(),
  });

  const { data: filterTeams } = useQuery({
    queryKey: ['settings-filter-teams'],
    queryFn: () => manageUsersApi.getFilterTeams(),
  });

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery<UsersResponse>({
    queryKey: [
      'users',
      currentPage,
      rowsPerPage,
      debouncedSearchTerm,
      moduleFilter,
      teamsFilter,
      statusFilter,
    ],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (moduleFilter && moduleFilter !== 'all') params.module = moduleFilter;

      // Add teams filter - undefined means all teams, array means specific teams
      if (teamsFilter !== undefined) {
        params.teams = teamsFilter;
      }

      // Add status filter
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      return usersApi.getUsers(params);
    },
  });

  const handleTeamsFilterChange = (values: string[] | undefined) => {
    setTempTeamsFilter(values);
  };

  const handleTeamsFilterClose = () => {
    if (
      JSON.stringify(tempTeamsFilter) !== JSON.stringify(teamsFilter)
    ) {
      setTeamsFilter(tempTeamsFilter);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">
            {t('manage.errors.usersLoadFailed')}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!usersData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">{t('manage.usersPage.noData')}</div>
      </div>
    );
  }

  const { users, pagination } = usersData;

  const handleUserClick = (userId: string) => {
    navigate(`/manage/users/${userId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('manage.menuUsers')}
        </h1>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="text-primary-500 focus:ring-primary-500 rounded-full bg-[#FFF0EB] px-6 py-3 text-sm/5 hover:bg-[#FFD8D0] focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:bg-gray-200 disabled:text-gray-500"
        >
          {t('manage.downloadReport')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-4">
          <select
            className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            {filterOptions?.modules.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name === 'All modules'
                  ? t('manage.allScenarios')
                  : option.name}
              </option>
            ))}
          </select>

          {/* Add Teams Filter */}
          {adminSettingsEnabled && (
            <MultiselectTeamDropdown
              options={filterTeams?.teams || []}
              selectedValues={tempTeamsFilter}
              onChange={handleTeamsFilterChange}
              onClose={handleTeamsFilterClose}
              placeholder="All teams"
            />
          )}

          {/* Status Filter */}
          <select
            className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t('manage.usersPage.searchPlaceholder')}
            className="w-64 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="rounded-l-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.usersPage.table.user')}
              </th>
              {adminSettingsEnabled && (
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.team')}
                </th>
              )}
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.usersPage.table.totalCompleted')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.usersPage.table.avgLength')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.usersPage.table.avgScore')}
              </th>
              <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.usersPage.table.lastSession')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <div className="text-gray-500">
                    <div className="text-sm">
                      {t('manage.usersPage.empty.title')}
                    </div>
                    <div className="mt-1 text-xs">
                      {t('manage.usersPage.empty.description')}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const scoreBadge = user.averageScore
                  ? company?._id === MANULIFE_COMPANY_ID
                    ? getManulifeScoreBadge(user.averageScore)
                    : getScoreBadge(user.averageScore)
                  : null;
                return (
                  <tr
                    key={user.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.status === 'inactive' && (
                          <div className="mt-1">
                            <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              Deactivated
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {adminSettingsEnabled && (
                      <td
                        className="align-center cursor-pointer px-6 py-4 text-sm whitespace-nowrap text-gray-900"
                        onClick={() => handleUserClick(user.id)}
                      >
                        {user.role === 'superadmin' ? (
                          'All teams'
                        ) : user.teams?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.teams.map((team, index, array) => (
                              <span
                                key={team.id}
                                className="text-sm text-gray-900"
                              >
                                {team.name}
                                {index < array.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm">
                            {t('manage.noTeams', 'No teams assigned')}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                      {user.totalPractices}
                    </td>
                    <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                      {formatDuration(user.averageDurationSeconds)}
                    </td>
                    <td className="px-6 py-4 align-top whitespace-nowrap">
                      <div>
                        {user.standings && user.standings.length > 0 ? (
                          <>
                            <div className="mb-0.5 flex items-center gap-1.5 text-sm">
                              {(() => {
                                const topStanding = user.standings.reduce(
                                  (prev, current) =>
                                    current.count > prev.count ? current : prev,
                                );
                                const colors = getStandingColors(
                                  topStanding.level,
                                );
                                return (
                                  <>
                                    <span className="text-gray-900">
                                      {topStanding.level}:
                                    </span>
                                    <span
                                      className="rounded-xl px-2 py-0.5 text-xs font-medium"
                                      style={{
                                        backgroundColor: colors.backgroundColor,
                                        color: colors.textColor,
                                      }}
                                    >
                                      {topStanding.grade}
                                    </span>
                                  </>
                                );
                              })()}
                              <div className="group relative">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden min-w-[200px] -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg group-hover:block">
                                  {user.standings.map((standing, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between gap-4 text-gray-900"
                                    >
                                      <span>{standing.grade}</span>
                                      <span className="font-bold">
                                        {standing.count}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                </div>
                              </div>
                            </div>
                            {scoreBadge && (
                              <div
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge.color}`}
                              >
                                {scoreBadge.label}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center">
                            <div className="mb-0.5 text-sm text-gray-900">
                              {user.averageScore || '-'}
                              {(scoreBadge && company?._id !== MANULIFE_COMPANY_ID) ? ': ' : ''}
                            </div>
                            {(scoreBadge && company?._id !== MANULIFE_COMPANY_ID) && (
                              <div
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge.color}`}
                              >
                                {scoreBadge.label}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                      {formatDate(user.lastSessionDate)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            {t('manage.pagination.rowsPerPage')}
          </span>
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">
            {t('manage.pagination.showing', {
              from: (pagination.currentPage - 1) * pagination.limit + 1,
              to: Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalUsers,
              ),
              total: pagination.totalUsers,
            })}
          </span>
        </div>

        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="text-sm text-gray-700">
              {t('manage.pagination.page')}
            </span>
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
            >
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">
              {t('manage.pagination.of', { totalPages: pagination.totalPages })}
            </span>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() =>
                setCurrentPage(Math.max(1, pagination.currentPage - 1))
              }
              disabled={!pagination.hasPrevPage}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  Math.min(pagination.totalPages, pagination.currentPage + 1),
                )
              }
              disabled={!pagination.hasNextPage}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportType={ReportType.USERS}
        teams={teamsFilter}
        module={moduleFilter !== 'all' ? moduleFilter : undefined}
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
