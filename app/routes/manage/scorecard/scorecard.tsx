import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useDebounce } from '~/hooks/useDebounce';
import { useNavigate } from 'react-router';
import { ActionDropdown } from '../settings/components/ActionDropdown';
import { apiManage } from '~/util/api';
import { Pagination } from '~/components/Pagination';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '~/components/ConfirmationModal';

interface Scorecard {
  id: string;
  name: string;
  sections: string[];
  scenarioCount: number;
  hasCompletedRoleplay: boolean;
  hasLinkedScenario: boolean;
}

interface ScorecardsResponse {
  success: boolean;
  scorecards: Scorecard[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalScorecards: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Scorecards' }];
}

export default withAuthenticationRequired(function ScorecardManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedScorecardId, setSelectedScorecardId] = useState<string | null>(
    null,
  );

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: scorecardsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['scorecard', currentPage, rowsPerPage, debouncedSearch],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url('/manage/scorecard')
          .query({
            page: currentPage,
            limit: rowsPerPage,
            ...(debouncedSearch && { search: debouncedSearch }),
          })
          .get()
          .json<Promise<ScorecardsResponse>>();

        return response;
      } catch (error: unknown) {
        console.error('[SelectClient Query] Failed:', error);
        throw error;
      }
    },
    retryDelay: 5000,
    retry: 5,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiManage()
        .url(`/manage/scorecard/${id}`)
        .delete()
        .json<Promise<{ success: boolean }>>();

      if (!response.success) {
        throw new Error('Failed to delete scorecard');
      }
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['scorecard'] });
      toast.success('Scorecard deleted successfully!');
    },
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setRowsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDeleteScorecard = async () => {
    if (!selectedScorecardId) return;
    try {
      await deleteMutation.mutateAsync(selectedScorecardId);
    } catch (error) {
      console.error('Error deleting scorecard:', error);
      alert('Failed to delete scorecard');
    }
  };

  const getScorecardActions = (scorecard: Scorecard) => [
    {
      label: 'View',
      onClick: () => navigate(`/manage/scorecard/${scorecard.id}`),
    },
    {
      label: 'Edit',
      onClick: () => navigate(`/manage/scorecard/${scorecard.id}/edit`),
      disabled: scorecard.hasCompletedRoleplay,
      tooltip: scorecard.hasCompletedRoleplay
        ? 'Scorecards that are used in a completed roleplay cannot be edited.'
        : '',
    },
    {
      label: 'Duplicate',
      onClick: () => navigate(`/manage/scorecard/new?duplicate=${scorecard.id}`),
    },
    {
      label: 'Delete',
      onClick: () => {
        setIsDeleteModalOpen(true);
        setSelectedScorecardId(scorecard.id);
      },
      disabled: scorecard.hasLinkedScenario,
      className: 'text-red-600',
      tooltip: scorecard.hasLinkedScenario
        ? 'Scorecards that are linked to a roleplay cannot be deleted.'
        : '',
    },
  ];

  const scorecards = scorecardsData?.scorecards || [];

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
          <p className="text-lg font-medium">Failed to load scorecards</p>
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Scorecard</h1>
        <button
          onClick={() => navigate('/manage/scorecard/new')}
          className="flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          + New scorecard
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-64 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white">
        <table className="min-w-full">
          <thead className="bg-[#F6F8F8]">
            <tr>
              <th className="rounded-l-xl px-6 py-3 text-left text-sm font-medium text-gray-900">
                Scorecard
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                Sections
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                Used in
              </th>
              <th className="rounded-r-xl px-6 py-3 text-right text-sm font-medium text-gray-900"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {scorecards.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      No scorecards found
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search'
                        : 'Create your first scorecard to get started'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              scorecards.map((scorecard) => (
                <tr key={scorecard.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-900">
                        {scorecard.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md text-sm text-gray-900">
                      {scorecard.sections?.length > 0
                        ? scorecard.sections?.map((s: any) => s.name).join(', ')
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {scorecard.scenarioCount} roleplay
                    {scorecard.scenarioCount > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown actions={getScorecardActions(scorecard)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {scorecardsData && (
          <Pagination
            currentPage={scorecardsData.pagination?.currentPage}
            totalPages={scorecardsData.pagination?.totalPages}
            totalItems={scorecardsData.pagination?.totalScorecards}
            itemsPerPage={rowsPerPage}
            hasNextPage={scorecardsData.pagination?.hasNextPage}
            hasPreviousPage={scorecardsData.pagination?.hasPreviousPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onSubmit={handleDeleteScorecard}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedScorecardId(null);
        }}
        isLoading={deleteMutation.isPending}
        title="Delete scorecard?"
        description="This will permanently remove the scorecard. This action cannot be undone."
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
