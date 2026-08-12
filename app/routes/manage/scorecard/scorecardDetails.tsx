import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { apiManage } from '~/util/api';
import toast from 'react-hot-toast';
import { cn } from '~/util/utils';
import { ConfirmationModal } from '~/components/ConfirmationModal';
import { Pagination } from '~/components/Pagination';
import { formatDate } from '~/util/date';

interface ScorecardSection {
  id: string;
  name: string;
  description: string;
  // Add other section fields as needed
}

interface Scorecard {
  id: string;
  friendlyId: string;
  name: string;
  sections: ScorecardSection[];
  hasCompletedRoleplay: boolean;
  hasLinkedScenario: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: {
    name: string;
    email: string;
  };
}

interface Scenario {
  id: string;
  title: string;
  productName: string | null;
}

interface ScorecardResponse {
  success: boolean;
  scorecard: Scorecard;
}

interface UsageResponse {
  success: boolean;
  scenarios: Scenario[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Scorecard Details' }];
}

type TabType = 'overview' | 'used-in';

export default withAuthenticationRequired(function ScorecardDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageRowsPerPage, setUsageRowsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch scorecard
  const {
    data: scorecardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scorecard', id],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/scorecard/${id}`)
          .get()
          .json<ScorecardResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Scorecard Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id,
    retryDelay: 5000,
    retry: 3,
  });

  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: ['scorecard-usage', id, usageCurrentPage, usageRowsPerPage],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/scorecard/${id}/usage`)
          .query({ page: usageCurrentPage, limit: usageRowsPerPage })
          .get()
          .json<UsageResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Scorecard Usage Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id && activeTab === 'used-in',
    retryDelay: 5000,
    retry: 3,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (scorecardId: string) => {
      try {
        await apiManage()
          .url(`/manage/scorecard/${scorecardId}`)
          .delete()
          .json();
      } catch (error: unknown) {
        console.error('[Delete Scorecard] Failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scorecards'] });
      toast.success('Scorecard successfully deleted.');
      navigate('/manage/scorecard');
    },
  });

  const scorecard = scorecardData?.scorecard;
  const scenarios = usageData?.scenarios || [];
  const pagination = usageData?.pagination;
  const handleEdit = () => {
    navigate(`/manage/scorecard/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!scorecard) return;
    try {
      await deleteMutation.mutateAsync(scorecard.id);
    } catch (error) {
      console.error('Error deleting scorecard:', error);
      toast.error('Failed to delete scorecard');
    }
  };

  const handlePageChange = (newPage: number) => {
    setUsageCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setUsageRowsPerPage(newRowsPerPage);
    setUsageCurrentPage(1); // Reset to first page when changing rows per page
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Failed to load scorecard</p>
          <button
            onClick={() => navigate('/manage/scorecard')}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Back to Scorecards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen px-6 py-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span
            className="cursor-pointer text-blue-600 hover:underline"
            onClick={() => navigate('/manage/scorecard')}
          >
            Scorecard
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Scorecard detail</span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">
              {scorecard.name}
            </h1>
            <p className="text-sm text-gray-500">
              Last updated by {scorecard.updatedBy?.email} on{' '}
              {formatDate(scorecard.updatedAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="group relative">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={scorecard.hasLinkedScenario}
                className={cn(
                  'w-[120px] rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-red-500 hover:bg-gray-200',
                  scorecard.hasLinkedScenario &&
                    'cursor-not-allowed opacity-50',
                )}
              >
                Delete
              </button>

              {scorecard.hasLinkedScenario && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Scorecards that are linked to a roleplay cannot be deleted.
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/manage/scorecard/new?duplicate=${scorecard.id}`)}
              className="w-[120px] rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-gray-900 hover:bg-gray-200"
            >
              Duplicate
            </button>
            <div className="group relative">
              <button
                onClick={handleEdit}
                disabled={scorecard.hasCompletedRoleplay ? true : false}
                className={cn(
                  'bg-primary w-[120px] rounded-full px-5 py-2 text-sm text-white hover:bg-orange-700',
                  scorecard.hasCompletedRoleplay &&
                    'cursor-not-allowed opacity-50',
                )}
              >
                Edit
              </button>

              {scorecard.hasCompletedRoleplay && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Scorecards that are used in a completed roleplay cannot be
                  edited.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative pb-3 text-[15px] font-normal transition-colors ${
                activeTab === 'overview'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('used-in')}
              className={`relative pb-3 text-[15px] font-normal transition-colors ${
                activeTab === 'used-in'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Used in
              {activeTab === 'used-in' && (
                <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-[280px_1fr] gap-4 rounded-2xl bg-[#F6F8F8] p-4">
              {/* Sidebar - Score Summary */}
              <div className="max-h-[max-content] space-y-6 rounded-xl bg-white p-4">
                {/* Overall Score Circle */}
                <div className="mb-6 flex">
                  <div className="flex h-22 w-22 items-center justify-center rounded-full bg-[#EFEFEF]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
                      <div className="flex h-18 w-18 items-center justify-center rounded-full bg-[#EFEFEF]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                          <span className="text-xl font-semibold text-gray-900">
                            0
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-1 text-sm text-gray-700">Overall score</div>
                <div className="text-xl font-semibold text-gray-900">-</div>

                {/* Section Scores */}
                <div className="space-y-4">
                  {scorecard.sections?.map((section: any) => (
                    <div key={section.id}>
                      <div className="flex items-center space-x-2">
                        <span
                          className="inline-block h-3 w-1 rounded-full bg-gray-200"
                          aria-hidden="true"
                        />
                        <span
                          className={`text-[14px] font-normal text-gray-500`}
                        >
                          {section.name}
                        </span>
                      </div>
                      <div className="text-sm">
                        0 /<span className="text-gray-500">100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content - Sections and Criteria */}
              <div className="space-y-4">
                {scorecard.sections?.map((section: any) => (
                  <div key={section.id} className="rounded-xl bg-white p-4">
                    <h2 className="text-md mb-4 font-semibold text-gray-900">
                      {section.name}
                    </h2>
                    <div className="space-y-4">
                      {section.criteria?.map((criteria: any) => (
                        <div key={criteria.id}>
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {criteria.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              <span className="font-semibold text-gray-900">
                                0
                              </span>{' '}
                              / {Math.round(100 / section.criteria.length)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-line text-gray-500">
                            {criteria.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Used In Tab
            <div>
              <div className="space-y-4 overflow-hidden rounded-2xl">
                {isUsageLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F6F8F8]">
                        <th className="rounded-l-xl px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Roleplay
                        </th>
                        <th className="rounded-r-xl px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Product
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {scenarios?.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-6 py-12 text-center">
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900">
                                No roleplays yet
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Roleplays using this scorecard will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        scenarios?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4">
                              <span
                                className="cursor-pointer text-[15px] text-blue-600"
                                onClick={() =>
                                  navigate(`/manage/scenario/${item.id}`)
                                }
                              >
                                {item.title}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[15px] text-gray-900">
                              {item.productName}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalItems > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.itemsPerPage}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleRowsPerPageChange}
                  itemLabel="Rows"
                />
              )}
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onSubmit={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
        title="Delete scorecard?"
        description="This will permanently remove the scorecard. This action cannot be undone."
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
