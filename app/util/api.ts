import wretch from 'wretch';
import FormDataAddon from 'wretch/addons/formData';
import QueryStringAddon from 'wretch/addons/queryString';
import i18n from '../i18n/i18n';
import dayjs from 'dayjs';

import { useAuthStore } from '../store/auth';
import { useManageAuthStore } from '~/store/manageAuth';
import { getBackendUrl, waitForBackendReady } from './netlify-backend';

// Utility functions for formatting raw API data
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '-';

  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  // Format as MM:SS with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

export function formatDate(date: Date | null | string): string {
  if (!date) return '-';
  const dayjsObj = dayjs(date);
  if (!dayjsObj.isValid()) return '-';
  return dayjsObj.format('D MMM YYYY');
}

// Middleware to wait for backend mapping readiness and prefix correct base url
const backendBaseUrlMiddleware =
  (next: any) => async (url: string, opts: any) => {
    await waitForBackendReady();
    const base = getBackendUrl();

    // If the url is already absolute, don't rewrite
    const isAbsolute = /^https?:\/\//i.test(url);
    const finalUrl = isAbsolute ? url : new URL(url || '/', base).toString();

    return next(finalUrl, opts);
  };

export function api() {
  return wretch('', { mode: 'cors' })
    .addon(FormDataAddon)
    .addon(QueryStringAddon)
    .middlewares([backendBaseUrlMiddleware])
    .errorType('json');
}

export function apiProtected() {
  const token = useAuthStore.getState().getToken();
  const guestMode = useAuthStore.getState().guestMode;

  if (!token) {
    if (guestMode) {
      location.href = '/guest/auth';
    } else {
      location.href = '/auth';
    }
    throw new Error('Unauthorized');
  }

  // Get the current language from i18n
  const currentLanguage = i18n.language || 'en';

  return api()
    .auth(`Bearer ${token}`)
    .headers({
      'Accept-Language': currentLanguage,
    })
    .catcher(401, async (error, request) => {
      const response = error.json as { ok: false; message: string };
      useAuthStore.setState(useAuthStore.getInitialState());
      return Promise.reject(response.message);
    })
    .catcher(400, async (error) => {
      // Catch validation errors and log them, but don't expose raw messages to users
      console.error('API validation error:', error.json);
      return Promise.reject(new Error('Request failed'));
    })
    .catcher(500, async (error) => {
      // Catch server errors and log them, but don't expose raw messages to users
      console.error('API server error:', error.json);
      return Promise.reject(new Error('Server error'));
    });
}

export function apiManage() {
  const token = useManageAuthStore.getState().getToken();
  if (!token) {
    location.href = '/manage/auth';
    throw new Error('Unauthorized');
  }

  // Get the current language from i18n
  const currentLanguage = i18n.language || 'en';

  return api()
    .auth(`Bearer ${token}`)
    .headers({
      'Accept-Language': currentLanguage,
      'X-Client': 'manage',
    })
    .catcher(401, async (error, request) => {
      const response = error.json as { ok: false; message: string };
      useManageAuthStore.setState(useManageAuthStore.getInitialState());
      return Promise.reject(response.message);
    });
}

// Dashboard API calls
export interface DashboardAccountSummary {
  accountsCreated: number;
  monthlyActiveUsers: number;
  monthlyActiveUsersGrowth: number;
  repeatUsers: number;
}

export interface DashboardPracticeSummary {
  finishedPractices: number;
  averageDurationMinutes?: number;
  averageDurationSeconds?: number;
  overallAverageScore: number | null;
}

export interface DashboardPracticeDetail {
  type: string;
  totalPractices: number;
  averageScore: number;
  grade: string;
}

export interface DashboardPracticeBreakdown {
  layout: 'regular' | 'prudential' | 'manulife' | 'msig';
  breakdown: DashboardPracticeDetail[];
}

export interface ChartData {
  name: string;
  data: number[];
  color: string;
}

export interface DashboardProgressData {
  months: string[];
  charts: ChartData[];
}

export interface DashboardSummary {
  accountSummary: DashboardAccountSummary;
  practiceSummary: DashboardPracticeSummary;
  practiceDetails: DashboardPracticeDetail[];
  progressData: DashboardProgressData;
}

export interface FilterOption {
  id: string;
  name: string;
}

export interface DashboardFilterOptions {
  modules: FilterOption[];
  difficulties: FilterOption[];
}

export interface SettingsFilterRoles {
  roles: FilterOption[];
}

export interface DashboardQueryParams {
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  months?: number;
  difficulty?: string;
  module?: string;
}

// Users API types
export interface Standing {
  level: string;
  grade: string;
  count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  totalPractices: number;
  averageDurationMinutes: number;
  averageDurationSeconds: number;
  averageScore: number | null;
  lastSessionDate: Date | null;
  role: string;
  teams: { id: string; name: string }[];
  standings: Standing[] | null;
  status: 'active' | 'inactive';
}

export interface UserDetail extends User {}

export interface SessionHistoryResponse {
  sessions: SessionHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSessions: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SessionHistoryItem {
  id: string;
  type: string;
  endedAt: Date | null | string;
  durationSeconds: number;
  score: number | null;
  standing?: string | null;
  standingLevel?: string | null;
  standingGrade?: string | null;
  productName?: string | null;
  personaName?: string | null;
  personaOccupation?: string | null;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UsersQueryParams {
  companyId?: string;
  module?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
  teams?: string[];
}

export interface PracticeBreakdownItem {
  type: string;
  totalPractices: number;
  averageScore: number;
  grade: string;
}

export interface UserProgressData {
  months: string[];
  charts: ChartData[];
}

export interface DashboardRefreshResponse {
  message: string;
  timestamp: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDetail extends Team {
  company: {
    id: string;
    name: string;
  };
  members: TeamMember[];
  lastModifiedBy?: ManageUser;
  lastModifiedAt?: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: ManageUserRole;
  status: ManageUserStatus;
  teams: Team[];
}

export interface TeamsResponse {
  teams: Team[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTeams: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  role: ManageUserRole;
  status: ManageUserStatus;
  isInTeam: boolean;
}

export interface AvailableUsersResponse {
  users: AvailableUser[];
}

// Updated User types for manage users
export type ManageUserRole = 'superadmin' | 'admin' | 'user';
export type ManageUserStatus = 'active' | 'inactive' | 'invited';

export interface ManageUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: ManageUserRole;
  status: ManageUserStatus;
  teams: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ManageUserDetail extends ManageUser {
  company: {
    id: string;
    name: string;
  };
  invitedAt?: Date;
}

export interface ManageUsersResponse {
  users: ManageUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ManageUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  team?: string;
  companyId?: string;
}

export interface ManageCallAnalysis {
  id: string;
  analyzedOn: string;
  product: 'traveleasy' | 'parecoveryplus' | 'dentiplus';
  fileName: string;
  score: number | null;
  tier: string | null;
  status: string;
  duration: number | null;
  uploadedBy: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ManageCallAnalysisResponse {
  analyses: ManageCallAnalysis[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ManageCallAnalysisQueryParams {
  page?: number;
  limit?: number;
  product?: string;
  search?: string;
  status?: string;
}

export interface CallAnalysisSummaryBand {
  level: string;
  label: string;
  count: number;
  averageScore: number;
}

export interface CallAnalysisSummaryProduct {
  product: string;
  totalUploaded: number;
  totalAnalysed: number;
  averageScore: number;
  bands: CallAnalysisSummaryBand[];
  noResultCount?: number;
}

export interface CallAnalysisSummaryResponse {
  totals: {
    totalUploaded: number;
    totalAnalysed: number;
    averageScore: number;
  };
  byProduct: CallAnalysisSummaryProduct[];
}

export interface TeamsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
}

export interface SettingsFilterTeams {
  teams: FilterOption[];
}

export type BulkImportStatus = 'processing' | 'completed' | 'failed';

export interface BulkInviteItem {
  rowNumber: number;
  email: string;
  role: string;
  teams: string[];
  isValid: boolean;
  errors?: string[];
  emailSent?: boolean;
  emailSentAt?: string | Date;
  emailError?: string;
  retryCount?: number;
}

export interface BulkInvitePrecheckResponse {
  success: boolean;
  summary: {
    totalRows: number;
    validCount: number;
    invalidCount: number;
    fileName: string;
  };
  items: BulkInviteItem[];
}

export interface BulkInviteImportResponse {
  success: boolean;
  bulkInviteId: string;
  summary: {
    totalRows: number;
    validCount: number;
    invalidCount: number;
  };
  message: string;
}

export interface BulkImport {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string | Date;
  status: BulkImportStatus;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  sentCount: number;
  failedCount: number;
  completedAt?: string | Date;
}

export interface BulkImportDetail extends BulkImport {
  items: BulkInviteItem[];
}

export interface BulkImportsResponse {
  history: BulkImport[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export interface BulkImportsQueryParams {
  page?: number;
  limit?: number;
}

// Update your dashboard API client to include teams parameter

export interface DashboardQueryParams {
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  difficulty?: string;
  months?: number;
  module?: string;
  teams?: string[]; // Add teams parameter
}

export const dashboardApi = {
  async getFilterOptions(): Promise<DashboardFilterOptions> {
    return apiManage().url('/manage/dashboard/filter-options').get().json();
  },

  async getFilterOptionsV2(): Promise<DashboardFilterOptions> {
    return apiManage().url('/manage/dashboard/filter-options-v2').get().json();
  },

  async getPracticeDetails(
    params: Pick<
      DashboardQueryParams,
      'companyId' | 'dateFrom' | 'dateTo' | 'difficulty' | 'teams'
    > = {},
  ): Promise<DashboardPracticeBreakdown> {
    return apiManage()
      .url('/manage/dashboard/practice-breakdown')
      .query(params)
      .get()
      .json();
  },

  async getProgressData(
    params: Pick<
      DashboardQueryParams,
      'companyId' | 'months' | 'module' | 'difficulty' | 'teams'
    > = {},
  ): Promise<DashboardProgressData> {
    return apiManage()
      .url('/manage/dashboard/progress')
      .query(params)
      .get()
      .json();
  },

  async getProgressDataV2(
    params: Pick<
      DashboardQueryParams,
      'companyId' | 'months' | 'module' | 'difficulty' | 'teams'
    > = {},
  ): Promise<DashboardProgressData> {
    return apiManage()
      .url('/manage/dashboard/progress-v2')
      .query(params)
      .get()
      .json();
  },

  async getDashboardSummary(
    params: Pick<DashboardQueryParams, 'teams'> = {},
  ): Promise<
    DashboardSummary & { lastUpdated?: string; calculationDuration?: number }
  > {
    return apiManage()
      .url('/manage/dashboard/summary')
      .query(params)
      .get()
      .json();
  },

  async refreshDashboard(
    params: Pick<DashboardQueryParams, 'teams'> = {},
  ): Promise<DashboardRefreshResponse> {
    return apiManage()
      .url('/manage/dashboard/refresh')
      .json(params)
      .post()
      .json();
  },
};

// API functions for teams
export const manageTeamsApi = {
  async getTeams(params: TeamsQueryParams = {}): Promise<TeamsResponse> {
    return apiManage().url('/manage/settings/teams').query(params).get().json();
  },

  async getTeamDetails(teamId: string): Promise<TeamDetail> {
    return apiManage().url(`/manage/settings/teams/${teamId}`).get().json();
  },

  async createTeam(data: {
    name: string;
    emails?: string[];
  }): Promise<Team> {
    return apiManage().url('/manage/settings/teams').post(data).json();
  },

  async updateTeam(
    teamId: string,
    data: {
      name?: string;
      description?: string;
      emails?: string[];
    },
  ): Promise<Team> {
    return apiManage().url(`/manage/settings/teams/${teamId}`).put(data).json();
  },
};

// API functions for manage users
export const manageUsersApi = {
  async getUsers(
    params: ManageUsersQueryParams = {},
  ): Promise<ManageUsersResponse> {
    return apiManage().url('/manage/settings/users').query(params).get().json();
  },

  async inviteUser(data: {
    email: string;
    role: string;
    teamIds: string[];
  }): Promise<ManageUserDetail> {
    return apiManage().url('/manage/settings/users/invite').post(data).json();
  },

  async updateUser(
    email: string,
    data: {
      role?: ManageUserRole;
      teamIds: string[];
    },
  ): Promise<ManageUserDetail> {
    return apiManage().url(`/manage/settings/users/${email}`).put(data).json();
  },

  async deactivateManageUser(email: string): Promise<{ message: string }> {
    return apiManage().url(`/manage/settings/users/${email}`).delete().json();
  },

  async reactivateManageUser(email: string): Promise<{ success: boolean }> {
    return apiManage().url(`/manage/settings/users/${email}/reactivate`).put().json();
  },

  async getFilterRoles(): Promise<SettingsFilterRoles> {
    return apiManage().url('/manage/settings/users/filter-roles').get().json();
  },

  async getFilterTeams(
    params: { companyId?: string } = {},
  ): Promise<SettingsFilterTeams> {
    return apiManage()
      .url('/manage/settings/users/filter-teams')
      .query(params)
      .get()
      .json();
  },

  async reportIssue(data: {
    description: string;
    userAgent: string;
    url: string;
    metadata: any;
  }): Promise<{ message: string }> {
    return apiManage().url('/manage/issues').post(data).json();
  },

  async getCurrentUser(): Promise<{
    id: string;
    name: string;
    email: string;
    picture: string;
    company: {
      _id: string;
      name: string;
      trialEndsAt: string | null;
    };
    role: ManageUserRole;
    teams: string[] | null;
  }> {
    return apiManage()
      .url('/manage/auth/me')
      .catcher(403, async (error) => {
        const response = error.json as { ok: false; message: string };
        if (response.message === 'Account has been deactivated') {
          useManageAuthStore.setState(useManageAuthStore.getInitialState());
          location.href = '/manage/auth/inactive';
        }
        return Promise.reject(response.message);
      })
      .get()
      .json();
  },

  async precheckBulkInvite(file: File): Promise<BulkInvitePrecheckResponse> {
    await waitForBackendReady();
    const base = getBackendUrl();
    const url = new URL('/manage/settings/bulk-invite/precheck', base).toString();

    const formData = new FormData();
    formData.append('file', file);

    const token = useManageAuthStore.getState().getToken();
    const currentLanguage = i18n.language || 'en';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': currentLanguage,
        'X-Client': 'manage',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw { json: error, message: error.error || 'Failed to validate file' };
    }

    return response.json();
  },

  async importBulkInvite(file: File): Promise<BulkInviteImportResponse> {
    await waitForBackendReady();
    const base = getBackendUrl();
    const url = new URL('/manage/settings/bulk-invite/import', base).toString();

    const formData = new FormData();
    formData.append('file', file);

    const token = useManageAuthStore.getState().getToken();
    const currentLanguage = i18n.language || 'en';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': currentLanguage,
        'X-Client': 'manage',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw { json: error, message: error.error || 'Failed to import file' };
    }

    return response.json();
  },

  async getBulkInviteHistory(
    params: BulkImportsQueryParams = {},
  ): Promise<BulkImportsResponse> {
    return apiManage()
      .url('/manage/settings/bulk-invite/history')
      .query(params)
      .get()
      .json();
  },

  async getBulkInviteDetail(id: string): Promise<BulkImportDetail> {
    return apiManage()
      .url(`/manage/settings/bulk-invite/${id}`)
      .get()
      .json();
  },

  async downloadErrorReport(id: string): Promise<Blob> {
    return apiManage()
      .url(`/manage/settings/bulk-invite/${id}/download-error-report`)
      .get()
      .blob();
  },
};

export const manageCallAnalysisApi = {
  async getAnalyses(
    params: ManageCallAnalysisQueryParams = {},
  ): Promise<ManageCallAnalysisResponse> {
    return apiManage()
      .url('/manage/call-analysis')
      .query(params)
      .get()
      .json();
  },

  async getSummary(): Promise<CallAnalysisSummaryResponse> {
    return apiManage()
      .url('/manage/call-analysis/summary')
      .get()
      .json();
  },
};

export const usersApi = {
  async getUsers(params: UsersQueryParams = {}): Promise<UsersResponse> {
    return apiManage().url('/manage/users').query(params).get().json();
  },

  async getUserDetails(
    userId: string,
    params: Pick<UsersQueryParams, 'module' | 'difficulty'> = {},
  ): Promise<UserDetail> {
    return apiManage()
      .url(`/manage/users/${userId}`)
      .query(params)
      .get()
      .json();
  },

  async getUserPracticeBreakdown(
    userId: string,
    params: Pick<UsersQueryParams, 'difficulty'> = {},
  ): Promise<DashboardPracticeBreakdown> {
    return apiManage()
      .url(`/manage/users/${userId}/practice-breakdown`)
      .query(params)
      .get()
      .json();
  },

  async getUserPracticeSummary(userId: string): Promise<{
    finishedPractices: number;
    averageDurationMinutes: number;
    averageDurationSeconds: number;
    overallAverageScore: number;
  }> {
    return apiManage()
      .url(`/manage/users/${userId}/practice-summary`)
      .get()
      .json();
  },

  async getUserProgress(
    userId: string,
    params: Pick<UsersQueryParams, 'module' | 'difficulty'> & {
      months?: number;
    } = {},
  ): Promise<UserProgressData> {
    return apiManage()
      .url(`/manage/users/${userId}/progress`)
      .query(params)
      .get()
      .json();
  },

  async getUserSessionHistory(
    userId: string,
    params: Pick<UsersQueryParams, 'page' | 'limit'> = {},
  ): Promise<SessionHistoryResponse> {
    return apiManage()
      .url(`/manage/users/${userId}/session-history`)
      .query(params)
      .get()
      .json();
  },
};

export interface ReportParams {
  dateFrom?: string;
  dateTo?: string;
  teams?: string[];
  module?: string;
  tc?: number;
}

export const reportsApi = {
  async downloadAccountCreationReport(
    params: ReportParams = {},
  ): Promise<Blob> {
    return apiManage()
      .url('/manage/report/account-creation')
      .query(params)
      .get()
      .blob();
  },

  async downloadActiveUsersReport(params: ReportParams = {}): Promise<Blob> {
    return apiManage()
      .url('/manage/report/active-users')
      .query(params)
      .get()
      .blob();
  },

  async downloadRepeatUsersReport(params: ReportParams = {}): Promise<Blob> {
    return apiManage()
      .url('/manage/report/repeat-users')
      .query(params)
      .get()
      .blob();
  },

  async downloadCompletedPracticesReport(
    params: ReportParams = {},
  ): Promise<Blob> {
    return apiManage()
      .url('/manage/report/completed-practices')
      .query(params)
      .get()
      .blob();
  },

  async downloadUsersReport(params: ReportParams = {}): Promise<Blob> {
    return apiManage().url('/manage/report/users').query(params).get().blob();
  },
};

// Feedback / survey for manage dashboard
export interface SurveyEntry {
  user: string;
  answer: 'Yes' | 'No' | string;
  reason: string;
  createdAt: string;
}

export interface SurveySummary {
  yes: number;
  no: number;
  total: number;
  yesPercent: number;
  noPercent: number;
}

export interface SurveyResponse {
  question: string;
  summary: SurveySummary;
  entries: SurveyEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const feedbackApi = {
  async getSurvey(
    params: { page?: number; limit?: number; teams?: string[] } = {},
  ): Promise<SurveyResponse> {
    return apiManage()
      .url('/manage/feedback/survey')
      .query(params)
      .get()
      .json();
  },
};

// Manage Products API (import -> status -> publish)
export type IngestionStatus =
  | 'pending'
  | 'processing'
  | 'parsed'
  | 'failed'
  | 'published'
  | 'aborted';

export interface IngestionCreateResponse {
  ingestionId: string;
  draftId: string;
  status: IngestionStatus;
  product?: { name?: string; friendlyId?: string };
  warnings?: string[];
}

export interface IngestionStatusResponse {
  ingestionId: string;
  draftId: string;
  status: IngestionStatus;
  parsedPreview?: any;
  errors?: string[];
  warnings?: string[];
}

export interface PublishResponse {
  product: any;
  moduleBindings: string[];
  scenariosCreated: number;
  status: 'published';
}

export interface PendingIngestion {
  ingestionId: string;
  draftId: string;
  name?: string;
  fileCount: number;
  status: IngestionStatus;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingIngestionsResponse {
  success: boolean;
  ingestions: PendingIngestion[];
}

export const productsManageApi = {
  async importFiles(params: {
    files: File[];
    name?: string;
    friendlyId?: string;
    languageCode?: string;
    publishNow?: boolean;
    generateCompetitiveIntelligence?: boolean;
    duplicateCompetitiveIntelligence?: boolean;
    duplicateId?: string | null;
  }): Promise<IngestionCreateResponse> {
    // Step 1: Request presigned URLs from backend
    const presignedPayload = {
      files: params.files.map((file) => ({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })),
      name: params.name,
      duplicateId: params.duplicateId,
    };

    const presignedResponse = await apiManage()
      .url('/manage/products/presigned-urls')
      .post(presignedPayload)
      .json<{
        ingestionId: string;
        uploads: Array<{
          fileName: string;
          uploadUrl?: string;
          s3Key: string;
          copied?: boolean;
        }>;
      }>();

    // Step 2: Upload files directly to S3 (skip files that were copied)
    const uploadPromises = params.files.map(async (file, index) => {
      const upload = presignedResponse.uploads[index];

      // Skip upload if file was copied from source product
      if (upload.copied) {
        return {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          s3Key: upload.s3Key,
        };
      }

      // Upload new file to S3 using presigned URL
      if (!upload.uploadUrl) {
        throw new Error(`No upload URL provided for ${file.name}`);
      }

      const response = await fetch(upload.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name} to S3`);
      }

      return {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        s3Key: upload.s3Key,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Step 3: Complete the import with S3 keys
    const importPayload = {
      ingestionId: presignedResponse.ingestionId,
      name: params.name,
      friendlyId: params.friendlyId,
      languageCode: params.languageCode || 'en',
      generateCompetitiveIntelligence:
        params.generateCompetitiveIntelligence || false,
      duplicateCompetitiveIntelligence:
        params.duplicateCompetitiveIntelligence || false,
      duplicateId: params.duplicateId,
      files: uploadedFiles,
    };

    return apiManage()
      .url('/manage/products/import')
      .post(importPayload)
      .json();
  },

  async getIngestionStatus(
    ingestionId: string,
  ): Promise<IngestionStatusResponse> {
    return apiManage()
      .url(`/manage/products/import/${ingestionId}`)
      .get()
      .json();
  },

  async getPendingIngestions(): Promise<PendingIngestionsResponse> {
    return apiManage().url('/manage/products/import/pending').get().json();
  },

  async abortIngestion(ingestionId: string): Promise<{ status: 'aborted' }> {
    return apiManage()
      .url(`/manage/products/import/${ingestionId}/abort`)
      .post({})
      .json();
  },

  async publishDraft(
    draftId: string,
    overrides: any = {},
  ): Promise<PublishResponse> {
    return apiManage()
      .url(`/manage/products/drafts/${draftId}/publish`)
      .post(overrides)
      .json();
  },

  async checkSlug(friendlyId: string): Promise<{ available: boolean }> {
    return apiManage()
      .url('/manage/products/check-slug')
      .query({ friendlyId })
      .get()
      .json();
  },

  async updateProduct(params: {
    productId: string;
    name?: string;
    filesToAdd?: File[];
    filesToRemove?: number[];
    featureHighlight?: { title?: string; description?: string };
    keyFeatures?: string[];
  }): Promise<{ success: boolean; product: any }> {
    const {
      productId,
      name,
      filesToAdd,
      filesToRemove,
      featureHighlight,
      keyFeatures,
    } = params;

    // If there are new files to add, use presigned URL flow
    if (filesToAdd && filesToAdd.length > 0) {
      // Step 1: Request presigned URLs from backend
      const presignedResponse = await apiManage()
        .url(`/manage/products/${productId}/presigned-urls`)
        .post({
          files: filesToAdd.map((file) => ({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          })),
        })
        .json<{
          uploads: Array<{
            fileName: string;
            uploadUrl: string;
            s3Key: string;
          }>;
        }>();

      // Step 2: Upload files directly to S3
      const uploadPromises = filesToAdd.map(async (file, index) => {
        const upload = presignedResponse.uploads[index];

        // Upload to S3 using presigned URL
        const response = await fetch(upload.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name} to S3`);
        }

        return {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          s3Key: upload.s3Key,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Step 3: Update product with S3 keys
      return apiManage()
        .url(`/manage/products/${productId}`)
        .put({
          name,
          filesToRemove,
          filesToAdd: uploadedFiles,
          featureHighlight,
          keyFeatures,
        })
        .json();
    }

    // Otherwise, just update metadata fields
    return apiManage()
      .url(`/manage/products/${productId}`)
      .put({
        name,
        filesToRemove,
        featureHighlight,
        keyFeatures,
      })
      .json();
  },
};
