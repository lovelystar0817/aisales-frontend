// ScenarioDetail.tsx
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiManage, formatDate } from '~/util/api';
import toast from 'react-hot-toast';
import { Button } from '~/components/button';
import { Pagination } from '~/components/Pagination';
import { Loader2 } from 'lucide-react';
import { useTitleBarStore } from '~/store/title-bar';
import { useEffect } from 'react';
import { ConfirmationModal } from '~/components/ConfirmationModal';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface CompletedRoleplay {
  id: string;
  completedAt: string;
  user: {
    name: string;
    email: string;
  };
  level: string;
  rating: string;
  score: number;
}

const getRatingColor = (rating: string) => {
  const colors: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-800',
    Good: 'bg-blue-100 text-blue-800',
    Fair: 'bg-yellow-100 text-yellow-800',
    Poor: 'bg-red-100 text-red-800',
  };
  return colors[rating] || 'bg-gray-100 text-gray-800';
};

export default function ScenarioDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const titleBarStore = useTitleBarStore();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const params = useParams();
  const scenarioId = params.scenarioId;

  // Fetch scenario details
  const {
    data: scenarioData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scenario-detail', scenarioId, page, itemsPerPage],
    queryFn: async () => {
      const response = await apiManage()
        .url(`/manage/scenario/${scenarioId}`)
        .query({ page, limit: itemsPerPage })
        .get()
        .json<{
          success: boolean;
          scenario: any;
          completedRoleplays: CompletedRoleplay[];
          pagination: any;
        }>();

      if (!response.success) {
        throw new Error('Failed to fetch scenario details');
      }

      return response;
    },
    enabled: !!scenarioId,
  });

  const scenario = scenarioData?.scenario;
  const completedRoleplays = scenarioData?.completedRoleplays || [];
  const pagination = scenarioData?.pagination;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const response = await apiManage()
        .url(`/manage/scenario/scenarios/${scenarioId}/status`)
        .patch({ isActive })
        .json<{ success: boolean }>();

      if (!response.success) {
        throw new Error('Failed to update status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scenario-detail', scenarioId],
      });
      toast.success('Status successfully updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiManage()
        .url(`/manage/scenario/scenarios/${scenarioId}`)
        .delete()
        .json<{ success: boolean }>();

      if (!response.success) {
        throw new Error('Failed to delete roleplay');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Roleplay successfully deleted');
      setIsDeleteModalOpen(false);
      navigate('/manage/scenario');
    },
    onError: () => {
      toast.error('Failed to delete roleplay');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Setup title bar
  useEffect(() => {
    titleBarStore.setTitle('Roleplay detail');
    return () => titleBarStore.reset();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load scenario details</p>
          <Button
            variant="primary"
            onClick={() => navigate('/manage/scenario')}
            className="mt-4"
          >
            Back to Scenarios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link
          to="/manage/scenario"
          className="cursor-pointer text-blue-600 hover:underline"
        >
          Roleplay
        </Link>
        <span>/</span>
        <span className="text-gray-500">Roleplay detail</span>
      </div>
      {/* Header */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{scenario.title}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                scenario.isActive
                  ? 'bg-[#38A383] text-white'
                  : 'bg-[#7E7F81] text-white'
              }`}
            >
              {scenario.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="group relative">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={scenario.hasLinkedRoleplay}
                className={clsx(
                  'w-[120px] rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-red-500 hover:bg-gray-200',
                  scenario.hasLinkedRoleplay && 'cursor-not-allowed opacity-50',
                )}
              >
                Delete
              </button>

              {scenario.hasLinkedRoleplay && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Roleplays that are linked to a session cannot be deleted.
                </div>
              )}
            </div>
            <div className="group relative">
              <button
                onClick={() => navigate(`/manage/scenario/${scenarioId}/edit`)}
                disabled={completedRoleplays?.length > 0 ? true : false}
                className={clsx(
                  'bg-primary w-[120px] rounded-full px-5 py-2 text-sm text-white hover:bg-orange-700',
                  completedRoleplays?.length > 0 &&
                    'cursor-not-allowed opacity-50',
                )}
              >
                Edit
              </button>

              {completedRoleplays?.length > 0 && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Roleplays that have completed sessions cannot be edited.
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Last updated by {scenario.updatedBy?.email || 'email@gmail.com'} on{' '}
          {scenario.updatedAt && formatDate(scenario.updatedAt)}
        </p>
      </div>

      {/* Main Content */}
      <div className="mt-6 mb-6 rounded-xl bg-white">
        <div className="flex gap-6">
          {/* Left: Scenario Details */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <img
                src={scenario.persona.image || '/default-avatar.png'}
                alt={scenario.persona.name}
                className="h-20 w-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="m1-2 text-lg font-semibold">{scenario.title}</h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  {scenario.description}
                </p>
                <h3 className="mt-4 text-sm font-semibold">
                  Practice objectives
                </h3>
                <p className="mt-1 text-sm whitespace-pre-line text-gray-600">
                  {Array.isArray(scenario.objectives)
                    ? scenario.objectives
                        ?.map((item: string) =>
                          scenario?.objectives &&
                          scenario?.objectives?.length > 1
                            ? `• ${item}`
                            : item,
                        )
                        ?.join('\n ')
                    : scenario.objectives}
                </p>
                <h3 className="mt-4 text-sm font-semibold">
                  Primary objection
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {scenario.primaryObjection}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="w-64 space-y-4">
            {/* Scorecard */}
            <div>
              <div className="mb-1 text-sm font-semibold text-gray-900">
                Scorecard
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {scenario.scorecard.name}
                </span>
                <button
                  onClick={() =>
                    navigate(`/manage/scorecard/${scenario.scorecard.id}`)
                  }
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  View details
                </button>
              </div>
            </div>

            {/* Product */}
            {scenario.product && (
              <div className="border-t border-gray-200 pt-4">
                <div className="mb-1 text-sm font-semibold text-gray-900">
                  Product
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {scenario.product.isPlaceholderProduct
                      ? '-'
                      : scenario.product.name}
                  </span>
                  {!scenario.product.isPlaceholderProduct && (
                    <button
                      onClick={() =>
                        navigate(`/manage/products/${scenario.product.id}`)
                      }
                      className="text-sm text-gray-500 underline hover:text-gray-700"
                    >
                      View details
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Persona */}
            <div className="border-t border-gray-200 pt-4">
              <div className="mb-1 text-sm font-semibold text-gray-900">
                Persona
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {[
                    scenario.persona.name,
                    scenario.persona.age,
                    scenario.persona.occupation,
                  ]
                    .filter((item) => Boolean(item))
                    .join(', ')}
                </span>
                <button
                  onClick={() =>
                    navigate(`/manage/persona/${scenario.persona.id}`)
                  }
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  View details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Completed Roleplays Section */}
      <div>
        <div className="border-t border-gray-200 pt-6 pb-4">
          <h2 className="text-lg font-semibold">Completed roleplays</h2>
        </div>

        {completedRoleplays.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No completed roleplays yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F8F8]">
                  <tr>
                    <th className="rounded-l-xl px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Completed at
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">
                      Result / Score
                    </th>
                    <th className="rounded-r-xl px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {completedRoleplays.map((roleplay) => (
                    <tr key={roleplay.id}>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {new Date(roleplay.completedAt).toLocaleDateString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {roleplay.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {roleplay.user.email}
                        </div>
                      </td>
                      {roleplay.score ? (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {(() => {
                              if (roleplay.score! >= 80) return 'L4';
                              if (roleplay.score! >= 60) return 'L3';
                              if (roleplay.score! >= 40) return 'L2';
                              return 'L1';
                            })()}
                            :
                            <span
                              className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: (() => {
                                  if (roleplay.score! >= 80) return '#E7F8F3';
                                  if (roleplay.score! >= 60) return '#E8F1FD';
                                  if (roleplay.score! >= 40) return '#FFF4EB';
                                  return '#fee2e2';
                                })(),
                                color: (() => {
                                  if (roleplay.score! >= 80) return '#058A62';
                                  if (roleplay.score! >= 60) return '#1C7AEB';
                                  if (roleplay.score! >= 40) return '#B25300';
                                  return '#dc2626';
                                })(),
                              }}
                            >
                              {(() => {
                                if (roleplay.score! >= 80)
                                  return t(
                                    'assessment.ratings.excellent',
                                    'Excellent',
                                  );
                                if (roleplay.score! >= 60)
                                  return t('assessment.ratings.good', 'Good');
                                if (roleplay.score! >= 40)
                                  return t('assessment.ratings.fair', 'Fair');
                                return t('assessment.ratings.poor', 'Poor');
                              })()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Score: {roleplay.score}
                          </div>
                        </td>
                      ) : (
                        <td className="px-6 py-4">-</td>
                      )}
                      <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                        <Button
                          variant="custom"
                          onClick={() =>
                            navigate(
                              `/manage/sessions/${roleplay.id}/assessment`,
                            )
                          }
                          size="sm"
                          className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          View assessment
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                onPageChange={setPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setPage(1);
                }}
                itemLabel="Rows"
              />
            )}
          </>
        )}
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onSubmit={handleDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        isLoading={deleteMutation.isPending}
        title="Delete roleplay?"
        description="This will permanently remove the roleplay. This action cannot be undone."
      />
    </div>
  );
}
