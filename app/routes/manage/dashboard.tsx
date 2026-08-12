import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useEffect, useMemo, useState } from 'react';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  dashboardApi,
  type DashboardSummary,
  feedbackApi,
  type SurveyResponse,
  manageUsersApi,
  manageCallAnalysisApi,
  type CallAnalysisSummaryResponse,
} from '../../util/api';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { MSIG_COMPANY_ID } from '~/util/constants';
import { useQuery } from '@tanstack/react-query';
import { useManageAuthStore } from '~/store/manageAuth';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import {
  getLocalStorageWithExpiry,
  setLocalStorageWithExpiry,
} from '~/util/utils';

import ReportModal, { ReportType } from '~/components/ReportModal';
import WelcomeHeader from '~/components/manage/dashboard/WelcomeHeader';
import ReportsDropdown from '~/components/manage/dashboard/ReportsDropdown';
import AccountSummary from '~/components/manage/dashboard/AccountSummary';
import PracticeSummary from '~/components/manage/dashboard/PracticeSummary';
import SkillProgression from '~/components/manage/dashboard/SkillProgression';
import PostPracticeSurvey from '~/components/manage/dashboard/PostPracticeSurvey';
import CallSummary from '~/components/manage/dashboard/CallSummary';
import { MultiselectTeamDropdown } from './settings/components/MultiselectTeamDropdown';

export function meta() {
  return [{ title: 'Hupo Sales AI | Admin Dashboard' }];
}

const SKILL_PROGRESSION_MODULE_KEY = 'dashboard-skill-progression-module';

export default withAuthenticationRequired(function AdminDashboard() {
  const { t } = useTranslation();
  const posthog = usePostHog();

  const email = useManageAuthStore((state) => state.email);
  const name = useManageAuthStore((state) => state.name);
  const userId = useManageAuthStore((state) => state.id);
  const company = useManageAuthStore((state) => state.company);

  const [selectedTeams, setSelectedTeams] = useState<string[] | undefined>(
    undefined,
  );

  // Temporary state for teams filter (only committed on dropdown close)
  const [tempSelectedTeams, setTempSelectedTeams] = useState<
    string[] | undefined
  >(selectedTeams);

  const userName = useManageAuthStore((state) => state.name);
  const [selectedModule, setSelectedModule] = useState(() => {
    if (typeof window !== 'undefined') {
      return getLocalStorageWithExpiry(SKILL_PROGRESSION_MODULE_KEY) || '';
    }
    return '';
  });
  const [surveyPage, setSurveyPage] = useState(1);
  const [surveyLimit] = useState(5);
  const postRoleplaySurveyEnabled = useFeatureFlagEnabled(
    'post-roleplay-survey',
  );
  const adminSettingsEnabled = useFeatureFlagEnabled('admin-settings');
  const selfServeEnabled = useFeatureFlagEnabled('self-serve');

  // Report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType | null>(null);

  const handleReportClick = (reportType: ReportType) => {
    setSelectedReportType(reportType);
    setIsReportModalOpen(true);
  };

  const handleTeamsFilterChange = (values: string[] | undefined) => {
    setTempSelectedTeams(values);
  };

  const handleTeamsFilterClose = () => {
    if (
      JSON.stringify(tempSelectedTeams) !== JSON.stringify(selectedTeams)
    ) {
      setSelectedTeams(tempSelectedTeams);
    }
  };

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

  // Sync temp state with actual filter state when they change from other sources
  useEffect(() => {
    setTempSelectedTeams(selectedTeams);
  }, [selectedTeams]);

  useEffect(() => {
    if (userId.length > 0) {
      Sentry.setUser({ id: userId, email, username: name, isAdminApp: true });
      posthog.identify(userId, {
        email,
        name,
        company: company.name,
        companyId: company._id,
        isAdminApp: true,
      });
      posthog.capture('dashboard_page_viewed');
    }
  }, [userId, name, email, posthog]);

  // Save selected module to localStorage with 30 minute expiry
  useEffect(() => {
    if (selectedModule) {
      setLocalStorageWithExpiry(SKILL_PROGRESSION_MODULE_KEY, selectedModule, 30);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(SKILL_PROGRESSION_MODULE_KEY);
    }
  }, [selectedModule]);

  // Validate stored module is still available when filter options load
  useEffect(() => {
    if (filterOptions?.modules && selectedModule) {
      const isValidModule = filterOptions.modules.some(
        (m) => m.id === selectedModule,
      );
      if (!isValidModule) {
        setSelectedModule('');
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SKILL_PROGRESSION_MODULE_KEY);
        }
      }
    }
  }, [filterOptions, selectedModule]);

  // Build query params for all dashboard queries
  const dashboardParams = useMemo(
    () => ({
      teams: selectedTeams,
    }),
    [selectedTeams],
  );

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useQuery<
    DashboardSummary & { lastUpdated?: string; calculationDuration?: number }
  >({
    queryKey: ['dashboard-summary', dashboardParams],
    queryFn: () => dashboardApi.getDashboardSummary(dashboardParams),
  });

  const refreshMutation = {
    mutate: () =>
      dashboardApi.refreshDashboard(dashboardParams).then(() => refetch()),
    isPending: false,
  };

  const { data: practiceDetails } = useQuery({
    queryKey: ['practice-details', dashboardParams],
    queryFn: () => {
      return dashboardApi.getPracticeDetails(dashboardParams);
    },
    enabled: !!dashboardData,
  });

  const {
    data: progressData,
    isLoading: isLoadingChart,
    error: chartError,
  } = useQuery({
    queryKey: ['progress-data', selectedModule, dashboardParams, selfServeEnabled],
    queryFn: () => {
      const params: any = { months: 6, ...dashboardParams };
      if (selectedModule) {
        params.module = selectedModule;
      }
      return selfServeEnabled
        ? dashboardApi.getProgressDataV2(params)
        : dashboardApi.getProgressData(params);
    },
    enabled: !!dashboardData && (!selfServeEnabled || !!selectedModule),
  });

  const {
    data: surveyData,
    isLoading: isLoadingSurvey,
    error: surveyError,
  } = useQuery<SurveyResponse>({
    queryKey: ['manage-survey', surveyPage, surveyLimit, dashboardParams],
    queryFn: () =>
      feedbackApi.getSurvey({
        page: surveyPage,
        limit: surveyLimit,
        ...dashboardParams,
      }),
    enabled: !!dashboardData,
  });

  const isMsig = company._id === MSIG_COMPANY_ID;

  const { data: callSummaryData } = useQuery<CallAnalysisSummaryResponse>({
    queryKey: ['manage-call-analysis-summary'],
    queryFn: () => manageCallAnalysisApi.getSummary(),
    enabled: !!dashboardData && isMsig,
  });

  // Merge the additional data back into dashboardData for rendering
  const mergedDashboardData = useMemo(() => {
    return dashboardData
      ? {
          ...dashboardData,
          practiceDetails:
            practiceDetails?.breakdown || dashboardData.practiceDetails,
          progressData: progressData || dashboardData.progressData,
        }
      : null;
  }, [dashboardData, practiceDetails, progressData]);
  console.log('---mergedDashboardData', mergedDashboardData);

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
            {t('manage.dashboard.errors.loadFailed')}
          </p>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {refreshMutation.isPending
              ? t('common.loading')
              : t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!mergedDashboardData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">{t('manage.dashboard.noData')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row">
        <WelcomeHeader
          userName={userName}
          lastUpdated={dashboardData?.lastUpdated}
          calculationDuration={dashboardData?.calculationDuration}
          onRefresh={() => refreshMutation.mutate()}
          isRefreshing={refreshMutation.isPending}
        />

        <ReportsDropdown onReportClick={handleReportClick} />
      </div>

      {/* Teams Filter */}
      {adminSettingsEnabled && (
        <div className="w-40">
          <MultiselectTeamDropdown
            options={filterTeams?.teams || []}
            selectedValues={tempSelectedTeams}
            onChange={handleTeamsFilterChange}
            onClose={handleTeamsFilterClose}
            placeholder="All teams"
          />
        </div>
      )}

      {/* Account Summary */}
      <AccountSummary accountSummary={mergedDashboardData.accountSummary} />

      {/* Practice Summary */}
      <PracticeSummary
        practiceSummary={mergedDashboardData.practiceSummary}
        practiceDetails={mergedDashboardData.practiceDetails}
      />

      {/* Skill Progression */}
      <SkillProgression
        filterOptions={filterOptions}
        selectedModule={selectedModule}
        onModuleChange={setSelectedModule}
        progressData={mergedDashboardData.progressData}
        isLoadingChart={isLoadingChart}
        chartError={chartError}
      />

      {/* Post Practice Survey */}
      {postRoleplaySurveyEnabled && (
        <PostPracticeSurvey
          surveyData={surveyData}
          isLoading={isLoadingSurvey}
          error={surveyError}
          surveyPage={surveyPage}
          onPageChange={setSurveyPage}
        />
      )}

      {/* Call Summary */}
      {isMsig && callSummaryData && <CallSummary data={callSummaryData} />}

      {selectedReportType && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportType={selectedReportType}
          teams={selectedTeams}
        />
      )}
    </div>
  );
}, withManageAuthenticationRequiredOptions);
