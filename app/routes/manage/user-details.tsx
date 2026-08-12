import { withAuthenticationRequired } from '@auth0/auth0-react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Fragment, useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import SimpleChart from '../../components/SimpleChart';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useQuery } from '@tanstack/react-query';
import {
  usersApi,
  dashboardApi,
  formatDuration,
  formatDate,
} from '../../util/api';
import type { SessionHistoryItem } from '../../util/api';
import { getScoreBadge } from '../../util/manage';
import { ChevronDown, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MANULIFE_COMPANY_ID } from '~/util/constants';
import { useManageAuthStore } from '~/store/manageAuth';

// Removed unused interfaces as we now use the API types

export function meta() {
  return [{ title: 'Hupo Sales AI | User Details' }];
}

export default withAuthenticationRequired(function UserDetailsPage() {
  const { t } = useTranslation();
  const { userId } = useParams();
  const company = useManageAuthStore((state) => state.company);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial tab from URL or default to 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [progressDifficultyFilter, setProgressDifficultyFilter] =
    useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab === 'overview') {
      // Remove tab param for default tab to keep URL clean
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', activeTab);
    }
    setSearchParams(newSearchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Sync tab state with URL changes (e.g., back/forward navigation)
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'overview';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const { data: filterOptions } = useQuery({
    queryKey: ['dashboard-filter-options'],
    queryFn: () => dashboardApi.getFilterOptions(),
  });

  const {
    data: userDetails,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-details', userId, moduleFilter, difficultyFilter],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      const params: any = {};
      if (moduleFilter && moduleFilter !== 'all') params.module = moduleFilter;
      if (difficultyFilter && difficultyFilter !== 'all')
        params.difficulty = difficultyFilter;
      return usersApi.getUserDetails(userId, params);
    },
    enabled: !!userId,
  });

  const { data: practiceBreakdown } = useQuery({
    queryKey: ['user-practice-breakdown', userId, difficultyFilter],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      const params: any = {};
      if (difficultyFilter && difficultyFilter !== 'all')
        params.difficulty = difficultyFilter;
      return usersApi.getUserPracticeBreakdown(userId, params);
    },
    enabled: !!userId,
  });

  const { data: practiceSummary } = useQuery({
    queryKey: ['user-practice-summary', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return usersApi.getUserPracticeSummary(userId);
    },
    enabled: !!userId,
  });

  const { data: progressData } = useQuery({
    queryKey: ['user-progress', userId, moduleFilter, progressDifficultyFilter],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      const params: any = { months: 6 };
      if (moduleFilter && moduleFilter !== 'all') params.module = moduleFilter;
      if (progressDifficultyFilter && progressDifficultyFilter !== 'all')
        params.difficulty = progressDifficultyFilter;
      return usersApi.getUserProgress(userId, params);
    },
    enabled: !!userId,
  });

  // Fetch session history (server-side pagination)
  const {
    data: sessionHistoryData,
    isLoading: _isSessionHistoryLoading,
    error: _sessionHistoryError,
  } = useQuery({
    queryKey: ['user-session-history', userId, currentPage, rowsPerPage],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return usersApi.getUserSessionHistory(userId, {
        page: currentPage,
        limit: rowsPerPage,
      });
    },
    enabled: !!userId,
  });

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
            {t('manage.userDetails.errors.loadFailed')}
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

  if (!userDetails) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('manage.userDetails.notFound')}
          </h1>
          <Link
            to="/manage/users"
            className="mt-4 inline-block text-orange-500 hover:text-orange-600"
          >
            ← {t('manage.userDetails.returnToList')}
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = sessionHistoryData?.pagination.totalPages || 1;
  const totalSessions = sessionHistoryData?.pagination.totalSessions || 0;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + (sessionHistoryData?.sessions.length || 0);
  const currentSessions: SessionHistoryItem[] =
    sessionHistoryData?.sessions || [];

  const overallBadge = getScoreBadge(userDetails.averageScore || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link
          to="/manage/users"
          className="flex items-center gap-x-2 text-sm text-gray-600 transition-colors hover:text-gray-800"
        >
          <span>←</span> <span>{t('manage.userDetails.returnToList')}</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="flex items-end gap-x-3">
        <h1 className="text-2xl font-bold text-gray-900">{userDetails.name}</h1>
        <p className="text-gray-600">{userDetails.email}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-x-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {t('manage.userDetails.tabs.overview')}
          </button>
          <button
            onClick={() => handleTabChange('practice-list')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'practice-list'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {t('manage.userDetails.tabs.practiceList')}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Practice Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('manage.userDetails.practiceSummary.title')}
            </h2>
            <div className="flex items-start gap-4">
              <div className="grid min-w-[200px] grid-cols-1 divide-y divide-gray-200">
                <div className="pb-4">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      {t('manage.userDetails.practiceSummary.totalCompleted')}
                    </p>
                    <RadixTooltip.Provider delayDuration={300}>
                      <RadixTooltip.Root>
                        <RadixTooltip.Trigger asChild>
                          <div className="cursor-help">
                            <Info className="h-4 w-4 text-gray-400" />
                          </div>
                        </RadixTooltip.Trigger>
                        <RadixTooltip.Portal>
                          <RadixTooltip.Content
                            className="max-w-[300px] rounded-md border border-gray-200 bg-white p-3 text-xs shadow-md"
                            sideOffset={5}
                            side="bottom"
                            align="start"
                          >
                            <p className="text-sm leading-normal text-gray-600">
                              {t(
                                'manage.dashboard.practiceSummary.totalCompletedTooltip',
                              )}
                            </p>
                            <RadixTooltip.Arrow className="fill-white" />
                          </RadixTooltip.Content>
                        </RadixTooltip.Portal>
                      </RadixTooltip.Root>
                    </RadixTooltip.Provider>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {practiceSummary?.finishedPractices ||
                      userDetails.totalPractices}
                  </p>
                </div>
                <div className="py-4">
                  <p className="mb-1 text-sm text-gray-600">
                    {t('manage.userDetails.practiceSummary.avgDuration')}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatDuration(
                      practiceSummary?.averageDurationSeconds ||
                        userDetails.averageDurationSeconds ||
                        0,
                    )}
                  </p>
                </div>
                <div className="pt-4">
                  <p className="mb-1 text-sm text-gray-600">
                    {t('manage.userDetails.practiceSummary.overallAvgScore')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xl font-bold text-gray-900">
                      {practiceSummary?.overallAverageScore ??
                        userDetails.averageScore ??
                        '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[400px] flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="rounded-l-lg"></th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {t('manage.userDetails.table.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {t('manage.userDetails.table.total')}
                      </th>
                      <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {t('manage.userDetails.table.avgScore')}
                      </th>
                      <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                        {t('manage.userDetails.table.bestResult')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {practiceBreakdown?.breakdown &&
                    practiceBreakdown.breakdown.length > 0 ? (
                      practiceBreakdown.breakdown.map(
                        (practice: any, index: number) => {
                          const isExpanded = expandedRows.has(index);
                          const practiceBreakdownLayout =
                            practiceBreakdown?.layout || 'regular';

                          return (
                            <Fragment key={index}>
                              <tr
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleRow(index)}
                              >
                                <td className="w-6 py-3 pr-0 pl-6 align-top">
                                  <ChevronDown
                                    className={`mt-1 size-4 shrink-0 transition-transform ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </td>
                                <td className="px-6 py-3 text-sm whitespace-pre-line">
                                  <div className="font-medium text-gray-900">
                                    {practice.type}
                                  </div>
                                  {practice.productName && (
                                    <div className="text-gray-500">
                                      {practice.productName}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                  {practice.totalPractices}
                                </td>
                                <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                  {practice.averageScore ?? '-'}
                                </td>
                                <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                  {practiceBreakdownLayout === 'regular' &&
                                    practice.bestScore && (
                                      <div>
                                        <div className="flex items-center">
                                          {practice.bestScore.level}:
                                          <span
                                            className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                            style={{
                                              backgroundColor:
                                                practice.bestScore
                                                  .backgroundColor,
                                              color:
                                                practice.bestScore.textColor,
                                            }}
                                          >
                                            {practice.bestScore.grade}
                                          </span>
                                        </div>
                                        <div className="text-gray-500">
                                          {t('manage.userDetails.scoreLabel')}{' '}
                                          {practice.bestScore.score}
                                        </div>
                                      </div>
                                    )}
                                  {practiceBreakdownLayout === 'prudential' &&
                                    practice.bestStanding && (
                                      <div>
                                        <div className="flex items-center">
                                          L{practice.bestStanding.tierLevel}:
                                          <span
                                            className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                            style={{
                                              backgroundColor:
                                                practice.bestStanding
                                                  .backgroundColor,
                                              color:
                                                practice.bestStanding.textColor,
                                            }}
                                          >
                                            {practice.bestStanding.tierLevel ===
                                              1 &&
                                              t(
                                                'practice.standings.salesNovice',
                                                'Sales Novice',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              2 &&
                                              t(
                                                'practice.standings.skilledAdvisor',
                                                'Skilled Advisor',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              3 &&
                                              t(
                                                'practice.standings.strategicConsultant',
                                                'Strategic Consultant',
                                              )}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  {practiceBreakdownLayout === 'manulife' &&
                                    practice.bestStanding && (
                                      <div>
                                        <div className="flex items-center">
                                          L{practice.bestStanding.tierLevel}:
                                          <span
                                            className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                            style={{
                                              backgroundColor:
                                                practice.bestStanding
                                                  .backgroundColor,
                                              color:
                                                practice.bestStanding.textColor,
                                            }}
                                          >
                                            {practice.bestStanding.tierLevel ===
                                              1 &&
                                              t(
                                                'practice.standings.failed',
                                                'Failed',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              2 &&
                                              t(
                                                'practice.standings.pass',
                                                'Pass',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              3 &&
                                              t(
                                                'practice.standings.champion',
                                                'Champion',
                                              )}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  {practiceBreakdownLayout === 'msig' &&
                                    practice.bestStanding && (
                                      <div>
                                        <div className="flex items-center">
                                          L{practice.bestStanding.tierLevel}:
                                          <span
                                            className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                            style={{
                                              backgroundColor:
                                                practice.bestStanding
                                                  .backgroundColor,
                                              color:
                                                practice.bestStanding.textColor,
                                            }}
                                          >
                                            {practice.bestStanding.tierLevel ===
                                              1 &&
                                              t(
                                                'practice.standings.salesNovice',
                                                'Sales Novice',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              2 &&
                                              t(
                                                'practice.standings.emergingSeller',
                                                'Emerging Seller',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              3 &&
                                              t(
                                                'practice.standings.skilledAdvisor',
                                                'Skilled Advisor',
                                              )}
                                            {practice.bestStanding.tierLevel ===
                                              4 &&
                                              t(
                                                'practice.standings.strategicConsultant',
                                                'Strategic Consultant',
                                              )}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </td>
                              </tr>
                              {isExpanded &&
                                practice.breakdown.map(
                                  (item: any, itemIndex: number) => (
                                    <tr
                                      key={`${index}-${itemIndex}`}
                                      className="hover:bg-gray-50"
                                    >
                                      <td></td>
                                      <td className="px-6 py-3 text-sm whitespace-pre-line text-gray-900">
                                        <div className="flex items-center">
                                          {item.level === 'N/A' && (
                                            <>
                                              <div className="flex items-center gap-2">
                                                <span>{item.grade}</span>
                                                <RadixTooltip.Provider
                                                  delayDuration={300}
                                                >
                                                  <RadixTooltip.Root>
                                                    <RadixTooltip.Trigger
                                                      asChild
                                                    >
                                                      <div className="cursor-help">
                                                        <Info className="h-4 w-4 text-gray-400" />
                                                      </div>
                                                    </RadixTooltip.Trigger>
                                                    <RadixTooltip.Portal>
                                                      <RadixTooltip.Content
                                                        className="max-w-[300px] rounded-md border border-gray-200 bg-white p-3 text-xs shadow-md"
                                                        sideOffset={5}
                                                        side="bottom"
                                                        align="start"
                                                      >
                                                        <p className="text-sm leading-normal text-gray-600">
                                                          {t(
                                                            'manage.common.notAwardedTooltip',
                                                          )}
                                                        </p>
                                                        <RadixTooltip.Arrow className="fill-white" />
                                                      </RadixTooltip.Content>
                                                    </RadixTooltip.Portal>
                                                  </RadixTooltip.Root>
                                                </RadixTooltip.Provider>
                                              </div>
                                            </>
                                          )}
                                          {item.level !== 'N/A' && (
                                            <>
                                              {item.level}:
                                              <span
                                                className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                                style={{
                                                  backgroundColor:
                                                    item.backgroundColor,
                                                  color: item.textColor,
                                                }}
                                              >
                                                {item.grade}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                        {item.totalPractices}
                                      </td>
                                      <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                        {item.averageScore ?? '-'}
                                      </td>
                                      <td></td>
                                    </tr>
                                  ),
                                )}
                            </Fragment>
                          );
                        },
                      )
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <div className="text-sm">
                              {t('manage.common.noPracticeData')}
                            </div>
                            <div className="mt-1 text-xs">
                              {t('manage.common.noPracticeDataHint')}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('manage.dashboard.skillProgression.title')}
                </h2>
                <div className="flex space-x-2">
                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    value={moduleFilter}
                    onChange={(e) => setModuleFilter(e.target.value)}
                  >
                    {filterOptions?.modules.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {moduleFilter === 'all' ||
              !filterOptions?.modules?.some((m) => m.id === moduleFilter) ? (
                <div className="col-span-2 flex h-64 items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-base font-medium">
                      {t('manage.userDetails.skillProgression.hint')}
                    </p>
                  </div>
                </div>
              ) : (
                progressData?.charts?.map((chartData, index) => (
                  <div key={index}>
                    <SimpleChart
                      series={[
                        {
                          name: chartData.name,
                          data: chartData.data,
                          color: chartData.color,
                        },
                      ]}
                      xAxisLabels={progressData.months || []}
                    />
                  </div>
                )) || (
                  <div className="col-span-2 text-center text-gray-500">
                    {t('manage.dashboard.skillProgression.noData')}
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'practice-list' && (
        <>
          {/* Practice List */}
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="rounded-l-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {t('manage.userDetails.practiceList.table.completedAt')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {t('manage.userDetails.practiceList.table.type')}
                    </th>
                    <th className="max-w-80 px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {t('manage.userDetails.practiceList.table.client')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {t('manage.userDetails.practiceList.table.duration')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      {t('manage.userDetails.practiceList.table.resultScore')}
                    </th>
                    <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentSessions.length > 0 ? (
                    currentSessions.map((session) => {
                      return (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                            {formatDate(session.endedAt)}
                          </td>
                          <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                            <div className="font-medium">{session.type}</div>
                            <div className="text-gray-500">
                              {session.productName}
                            </div>
                          </td>
                          <td className="max-w-80 px-6 py-3 text-sm text-gray-900">
                            {session.personaName ? (
                              <>
                                {session.personaName}
                                {session.personaOccupation && (
                                  <span className="text-gray-500">
                                    , {session.personaOccupation}
                                  </span>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                            {formatDuration(session.durationSeconds)}
                          </td>
                          <td className="px-6 py-3 text-sm whitespace-nowrap">
                            {session.standingLevel && session.standingGrade ? (
                              // Prudential standing display - match dashboard format
                              <div>
                                <div className="flex items-center">
                                  {session.standingLevel}:
                                  <span
                                    className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: (() => {
                                        if (session.standingLevel === 'L3')
                                          return '#E7F8F3';
                                        if (session.standingLevel === 'L2')
                                          return '#E8F1FD';
                                        return '#FFF4EB';
                                      })(),
                                      color: (() => {
                                        if (session.standingLevel === 'L3')
                                          return '#058A62';
                                        if (session.standingLevel === 'L2')
                                          return '#1C7AEB';
                                        return '#B25300';
                                      })(),
                                    }}
                                  >
                                    {session.standingGrade}
                                  </span>
                                </div>
                                {session.score &&
                                  company?._id === MANULIFE_COMPANY_ID && (
                                    <div className="text-gray-500">
                                      {t('manage.userDetails.scoreLabel')}{' '}
                                      {session.score}
                                    </div>
                                  )}
                              </div>
                            ) : session.standing ? (
                              // Fallback for backward compatibility
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                {session.standing}
                              </span>
                            ) : (
                              // Regular score display with grade badges
                              <div className="text-sm">
                                {session.score !== null ? (
                                  <>
                                    <div className="flex items-center">
                                      {(() => {
                                        if (session.score! >= 80) return 'L4';
                                        if (session.score! >= 60) return 'L3';
                                        if (session.score! >= 40) return 'L2';
                                        return 'L1';
                                      })()}
                                      :
                                      <span
                                        className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                        style={{
                                          backgroundColor: (() => {
                                            if (session.score! >= 80)
                                              return '#E7F8F3';
                                            if (session.score! >= 60)
                                              return '#E8F1FD';
                                            if (session.score! >= 40)
                                              return '#FFF4EB';
                                            return '#fee2e2';
                                          })(),
                                          color: (() => {
                                            if (session.score! >= 80)
                                              return '#058A62';
                                            if (session.score! >= 60)
                                              return '#1C7AEB';
                                            if (session.score! >= 40)
                                              return '#B25300';
                                            return '#dc2626';
                                          })(),
                                        }}
                                      >
                                        {(() => {
                                          if (session.score! >= 80)
                                            return t(
                                              'assessment.ratings.excellent',
                                              'Excellent',
                                            );
                                          if (session.score! >= 60)
                                            return t(
                                              'assessment.ratings.good',
                                              'Good',
                                            );
                                          if (session.score! >= 40)
                                            return t(
                                              'assessment.ratings.fair',
                                              'Fair',
                                            );
                                          return t(
                                            'assessment.ratings.poor',
                                            'Poor',
                                          );
                                        })()}
                                      </span>
                                    </div>
                                    <div className="text-gray-500">
                                      {t('manage.userDetails.scoreLabel')}{' '}
                                      {session.score}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-gray-500">
                                    incomplete
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-sm">
                            <Link
                              to={`/manage/sessions/${session.id}/assessment`}
                              className="inline-block max-w-24 rounded-4xl border border-gray-300 px-3 py-1.5 text-center text-gray-600 hover:text-gray-800 hover:underline"
                            >
                              {t('manage.userDetails.viewAssessment')}
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {t('manage.userDetails.practiceList.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
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
                    from: startIndex + 1,
                    to: Math.min(endIndex, totalSessions),
                    total: totalSessions,
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <option key={page} value={page}>
                          {page}
                        </option>
                      ),
                    )}
                  </select>
                  <span className="text-sm text-gray-700">
                    {t('manage.pagination.of', { totalPages })}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
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
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
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
          </div>
        </>
      )}
    </div>
  );
}, withManageAuthenticationRequiredOptions);
