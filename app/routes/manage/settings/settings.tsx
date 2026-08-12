import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  manageUsersApi,
  type ManageUser,
  type ManageUsersResponse,
  type Team,
  type TeamsResponse,
  manageTeamsApi,
} from '../../../util/api';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useDebounce } from '~/hooks/useDebounce';
import { useManageAuthStore } from '~/store/manageAuth';

import { EditUserModal } from './components/EditUserModal';
import {
  TeamManagementModal,
  type TeamModalMode,
} from './components/TeamManagementModal';

import { UsersTable } from './UsersTable';
import { TeamsTable } from './TeamsTable';
import ReportModal, { ReportType } from '~/components/ReportModal';
import clsx from 'clsx';
import { useURLSearchParams } from '~/util/search-params';
import { InviteUserModal } from './components/InviteUserModal';
import { BulkInviteModal } from './components/BulkInviteModal';
import { MultiselectTeamDropdown } from './components/MultiselectTeamDropdown';
import {
  MultiselectDropdown,
  type MultiselectOption,
} from './components/MultiselectDropdown';

export const FILTER_ROLES: MultiselectOption[] = [
  {
    id: 'superadmin',
    name: 'Superadmin',
    description: 'manage.settings.roles.superadmin.description',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'manage.settings.roles.admin.description',
  },
  {
    id: 'user',
    name: 'User',
    description: 'manage.settings.roles.user.description',
  },
];

export const FILTER_STATUS: MultiselectOption[] = [
  {
    id: 'active',
    name: 'Active',
  },
  {
    id: 'inactive',
    name: 'Deactivated',
  },
  {
    id: 'invited',
    name: 'Invited',
  },
];

export type TabType = 'users' | 'teams';

export interface SettingsFilters {
  searchTerm: string;
  roleFilter: string[] | undefined;
  teamsFilter: string[] | undefined;
  statusFilter: string[] | undefined;
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Settings' }];
}
export default withAuthenticationRequired(function SettingsPage() {
  const { t } = useTranslation();
  const userRole = useManageAuthStore((state) => state.role);
  const [searchParams, setSearchParams] = useURLSearchParams();

  // Translated filter roles
  const translatedFilterRoles = useMemo(
    () =>
      FILTER_ROLES.map((role) => ({
        id: role.id,
        name: role.name,
      })),
    [t],
  );
  const [teamModalState, setTeamModalState] = useState<{
    isOpen: boolean;
    mode: TeamModalMode;
    team: Team | null;
  }>({
    isOpen: false,
    mode: 'create',
    team: null,
  });

  // Get initial values from URL params
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get('tab');
    return (tabParam === 'teams' ? 'teams' : 'users') as TabType;
  };

  const getInitialPage = (): number => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) || 1 : 1;
  };

  const getInitialRowsPerPage = (): number => {
    const rowsParam = searchParams.get('rows');
    return rowsParam ? parseInt(rowsParam, 10) || 10 : 10;
  };

  const getInitialTeamsFilter = (): string[] | undefined => {
    const teamsParam = searchParams.get('teams');
    if (!teamsParam || teamsParam === 'all') {
      return undefined;
    }
    return teamsParam.split(',').filter(Boolean);
  };

  const getInitialRolesFilter = (): string[] | undefined => {
    const rolesParam = searchParams.get('roles');
    if (!rolesParam || rolesParam === 'all') {
      return undefined;
    }
    return rolesParam.split(',').filter(Boolean);
  };

  const getInitialStatusFilter = (): string[] | undefined => {
    const statusParam = searchParams.get('status');
    if (!statusParam || statusParam === 'all') {
      return undefined;
    }
    return statusParam.split(',').filter(Boolean);
  };

  // State management - initialize from URL params
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );
  const [roleFilter, setRoleFilter] = useState<string[] | undefined>(
    getInitialRolesFilter(),
  );
  const [teamsFilter, setTeamsFilter] = useState<string[] | undefined>(
    getInitialTeamsFilter(),
  );
  const [statusFilter, setStatusFilter] = useState<string[] | undefined>(
    getInitialStatusFilter(),
  );
  const [currentPage, setCurrentPage] = useState(getInitialPage());
  const [rowsPerPage, setRowsPerPage] = useState(getInitialRowsPerPage());

  // Temporary state for filters (only committed on dropdown close)
  const [tempRoleFilter, setTempRoleFilter] = useState<string[] | undefined>(
    roleFilter,
  );
  const [tempTeamsFilter, setTempTeamsFilter] = useState<string[] | undefined>(
    teamsFilter,
  );
  const [tempStatusFilter, setTempStatusFilter] = useState<
    string[] | undefined
  >(statusFilter);

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManageUser | null>(null);
  const [isUserInviteModalOpen, setIsUserInviteModalOpen] = useState(false);
  const [isBulkInviteModalOpen, setIsBulkInviteModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to update URL params
  const updateUrlParams = (
    updates: Partial<{
      tab: TabType;
      search: string;
      roles: string;
      teams: string;
      status: string;
      page: number;
      rows: number;
    }>,
  ) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        (key === 'roles' && (value === 'all' || value === '')) ||
        (key === 'status' && (value === 'all' || value === '')) ||
        (key === 'teams' && (value === 'all' || value === '')) ||
        (key === 'page' && value === 1) ||
        (key === 'rows' && value === 10)
      ) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    setSearchParams(newParams, { replace: true });
  };

  // Update URL when activeTab changes
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);

    // Reset all filters to their default values
    setRoleFilter(undefined);
    setTeamsFilter(undefined);
    setStatusFilter(undefined);
    setSearchTerm('');
    setCurrentPage(1);

    // Update URL with clean parameters (removing all filter params)
    const newParams = new URLSearchParams();
    if (newTab !== 'users') {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Sync temp state with actual filter state when they change from other sources
  useEffect(() => {
    setTempRoleFilter(roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    setTempTeamsFilter(teamsFilter);
  }, [teamsFilter]);

  useEffect(() => {
    setTempStatusFilter(statusFilter);
  }, [statusFilter]);

  // Update URL when search changes
  useEffect(() => {
    updateUrlParams({ search: debouncedSearchTerm, page: 1 });
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Update URL when filters change
  const handleRoleFilterChange = (values: string[] | undefined) => {
    setTempRoleFilter(values);
  };

  const handleRoleFilterClose = () => {
    if (
      JSON.stringify(tempRoleFilter) !== JSON.stringify(roleFilter)
    ) {
      setRoleFilter(tempRoleFilter);
      setCurrentPage(1);

      let rolesParam: string | undefined;
      if (tempRoleFilter === undefined) {
        rolesParam = undefined;
      } else {
        rolesParam = tempRoleFilter.join(',');
      }

      updateUrlParams({ roles: rolesParam, page: 1 });
    }
  };

  const handleTeamsFilterChange = (values: string[] | undefined) => {
    setTempTeamsFilter(values);
  };

  const handleTeamsFilterClose = () => {
    if (
      JSON.stringify(tempTeamsFilter) !== JSON.stringify(teamsFilter)
    ) {
      setTeamsFilter(tempTeamsFilter);
      setCurrentPage(1);

      let teamsParam: string | undefined;
      if (tempTeamsFilter === undefined) {
        teamsParam = undefined;
      } else {
        teamsParam = tempTeamsFilter.join(',');
      }

      updateUrlParams({ teams: teamsParam, page: 1 });
    }
  };

  const handleStatusFilterChange = (values: string[] | undefined) => {
    setTempStatusFilter(values);
  };

  const handleStatusFilterClose = () => {
    if (
      JSON.stringify(tempStatusFilter) !== JSON.stringify(statusFilter)
    ) {
      setStatusFilter(tempStatusFilter);
      setCurrentPage(1);

      let statusParam: string | undefined;
      if (tempStatusFilter === undefined) {
        statusParam = undefined;
      } else {
        statusParam = tempStatusFilter.join(',');
      }

      updateUrlParams({ status: statusParam, page: 1 });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams({ page });
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
    updateUrlParams({ rows, page: 1 });
  };

  const openCreateTeamModal = () => {
    setTeamModalState({
      isOpen: true,
      mode: 'create',
      team: null,
    });
  };

  const openViewTeamModal = (team: Team) => {
    setTeamModalState({
      isOpen: true,
      mode: 'view',
      team: team,
    });
  };

  const openEditTeamModal = (team: Team) => {
    setTeamModalState({
      isOpen: true,
      mode: 'edit',
      team: team,
    });
  };

  const closeTeamModal = () => {
    setTeamModalState({
      isOpen: false,
      mode: 'create',
      team: null,
    });
  };

  const { data: filterTeams } = useQuery({
    queryKey: ['settings-filter-teams'],
    queryFn: () => manageUsersApi.getFilterTeams(),
    enabled: activeTab === 'users',
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery<ManageUsersResponse>({
    queryKey: [
      'manage-users',
      currentPage,
      rowsPerPage,
      debouncedSearchTerm,
      roleFilter,
      teamsFilter,
      statusFilter,
    ],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
      };

      // Add search parameter if exists
      if (debouncedSearchTerm?.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      // Add role filter - undefined means all roles, array means specific roles
      if (roleFilter !== undefined) {
        params.roles = roleFilter;
      }

      // Add status filter - undefined means all status, array means specific status
      if (statusFilter !== undefined) {
        params.status = statusFilter;
      }

      // Add teams filter - undefined means all teams, array means specific teams
      if (teamsFilter !== undefined) {
        params.teams = teamsFilter;
      }

      return manageUsersApi.getUsers(params);
    },
    enabled: activeTab === 'users',
    // Add a key to ensure query is properly invalidated when filters change
    refetchOnWindowFocus: false,
  });

  const {
    data: teamsData,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useQuery<TeamsResponse>({
    queryKey: ['teams', currentPage, rowsPerPage, debouncedSearchTerm],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
      };

      if (debouncedSearchTerm) params.search = debouncedSearchTerm;

      return manageTeamsApi.getTeams(params);
    },
    enabled: activeTab === 'teams',
  });

  const isLoading = activeTab === 'users' ? usersLoading : teamsLoading;
  const error = activeTab === 'users' ? usersError : teamsError;

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
            Failed to load {activeTab === 'users' ? 'users' : 'teams'}
          </p>
          <button
            onClick={() =>
              activeTab === 'users' ? refetchUsers() : refetchTeams()
            }
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {userRole === 'superadmin' && (
          <>
            {activeTab === 'users' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkInviteModalOpen(true)}
                  className="flex items-center rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                  style={{ backgroundColor: '#FFF0EB', color: '#FF4B0A' }}
                >
                  {t('manage.settings.importUsers', 'Import users')}
                </button>
                <button
                  onClick={() => setIsUserInviteModalOpen(true)}
                  className="flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                >
                  {t('manage.settings.inviteUser', 'Invite user')}
                </button>
              </div>
            ) : (
              <button
                onClick={openCreateTeamModal}
                className="flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
              >
                {t('manage.settings.createTeam', ' Create team')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex">
        <div className="flex rounded-lg bg-gray-100 p-1 transition hover:bg-gray-200">
          <nav
            className="flex gap-x-1"
            aria-label="Tabs"
            role="tablist"
            aria-orientation="horizontal"
          >
            <button
              type="button"
              className={clsx(
                'rounded-lg px-4 py-2 text-sm transition-colors',
                activeTab === 'users'
                  ? 'bg-white text-gray-700 shadow'
                  : 'text-gray-500 hover:text-gray-700',
              )}
              onClick={() => handleTabChange('users')}
            >
              {t('manage.userManagement', 'User Management')}
            </button>
            <button
              type="button"
              className={clsx(
                'rounded-lg px-4 py-2 text-sm transition-colors',
                activeTab === 'teams'
                  ? 'bg-white text-gray-700 shadow'
                  : 'text-gray-500 hover:text-gray-700',
              )}
              onClick={() => handleTabChange('teams')}
            >
              {t('manage.teamManagement', 'Team Management')}
            </button>
          </nav>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex gap-4">
            {activeTab === 'users' && (
              <>
                <MultiselectDropdown
                  options={translatedFilterRoles}
                  selectedValues={tempRoleFilter}
                  onChange={handleRoleFilterChange}
                  onClose={handleRoleFilterClose}
                  placeholder="All roles"
                  allOptionLabel="All roles"
                  minWidth="min-w-48"
                />

                <MultiselectTeamDropdown
                  options={filterTeams?.teams || []}
                  selectedValues={tempTeamsFilter}
                  onChange={handleTeamsFilterChange}
                  onClose={handleTeamsFilterClose}
                  placeholder="All teams"
                />

                <MultiselectDropdown
                  options={FILTER_STATUS}
                  selectedValues={tempStatusFilter}
                  onChange={handleStatusFilterChange}
                  onClose={handleStatusFilterClose}
                  placeholder="All status"
                  allOptionLabel={t('manage.settings.allStatus', 'All status')}
                  minWidth="min-w-48 mr-4"
                />
              </>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={
                activeTab === 'users' ? 'Search users...' : 'Search teams...'
              }
              className="w-64 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'users' && usersData && (
        <UsersTable data={usersData} onEditUser={setEditingUser} userRole={userRole} />
      )}

      {activeTab === 'teams' && teamsData && (
        <TeamsTable
          data={teamsData}
          onViewTeam={openViewTeamModal}
          onEditTeam={openEditTeamModal}
          userRole={userRole}
        />
      )}

      {/* Pagination - kept inline */}
      {((activeTab === 'users' && usersData) ||
        (activeTab === 'teams' && teamsData)) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Rows per page</span>
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700">
              {activeTab === 'users' && usersData
                ? `Showing ${(usersData.pagination.currentPage - 1) * usersData.pagination.limit + 1} to ${Math.min(
                    usersData.pagination.currentPage *
                      usersData.pagination.limit,
                    usersData.pagination.totalUsers,
                  )} of ${usersData.pagination.totalUsers} users`
                : teamsData
                  ? `Showing ${(teamsData.pagination.currentPage - 1) * teamsData.pagination.limit + 1} to ${Math.min(
                      teamsData.pagination.currentPage *
                        teamsData.pagination.limit,
                      teamsData.pagination.totalTeams,
                    )} of ${teamsData.pagination.totalTeams} teams`
                  : ''}
            </span>
          </div>

          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-2">
              <span className="text-sm text-gray-700">Page</span>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
              >
                {Array.from(
                  {
                    length:
                      activeTab === 'users' && usersData
                        ? usersData.pagination.totalPages
                        : teamsData?.pagination.totalPages || 0,
                  },
                  (_, i) => i + 1,
                ).map((page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-700">
                of{' '}
                {activeTab === 'users' && usersData
                  ? usersData.pagination.totalPages
                  : teamsData?.pagination.totalPages || 0}
              </span>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                  handlePageChange(
                    Math.min(
                      activeTab === 'users' && usersData
                        ? usersData.pagination.totalPages
                        : teamsData?.pagination.totalPages || 0,
                      currentPage + 1,
                    ),
                  )
                }
                disabled={
                  activeTab === 'users' && usersData
                    ? !usersData.pagination.hasNextPage
                    : teamsData
                      ? !teamsData.pagination.hasNextPage
                      : true
                }
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
      )}

      {/* Modals */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportType={ReportType.USERS}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        teams={filterTeams?.teams}
      />

      <TeamManagementModal
        isOpen={teamModalState.isOpen}
        onClose={closeTeamModal}
        mode={teamModalState.mode}
        team={teamModalState.team}
      />

      <InviteUserModal
        isOpen={isUserInviteModalOpen}
        onClose={() => setIsUserInviteModalOpen(false)}
        teams={filterTeams?.teams}
      />

      <BulkInviteModal
        isOpen={isBulkInviteModalOpen}
        onClose={() => setIsBulkInviteModalOpen(false)}
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
