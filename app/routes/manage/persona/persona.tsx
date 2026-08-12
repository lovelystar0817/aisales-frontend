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
import { useURLSearchParams } from '~/util/search-params';
import { useNavigate } from 'react-router';
import { ActionDropdown } from '../settings/components/ActionDropdown';
import { apiManage } from '~/util/api';
import { Pagination } from '~/components/Pagination';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '~/components/ConfirmationModal';

interface PersonaDetails {
  location: string;
  education: string;
  occupation: string;
  financialSituation: string;
  keyPriorities: string[];
  productKnowledge: string;
  mainObjection: string;
}

interface PersonalityDetails {
  persona: string;
  communicationStyle: string[];
  decisionMaking: string[];
}

interface Persona {
  id: string;
  friendlyId: string;
  name: string;
  age: number;
  occupation: string;
  image: string;
  description: string;
  details: PersonaDetails;
  personalityDetails: PersonalityDetails;
  annualIncome: number;
  voiceId: string;
  gender: 'male' | 'female';
  company: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  hasCompletedRoleplay?: boolean;
  hasLinkedScenario?: boolean;
  scenarioCount?: number;
}

interface PersonasResponse {
  success: boolean;
  personas: Persona[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPersonas: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

async function deletePersona(id: string): Promise<void> {
  const response = await apiManage()
    .url(`/manage/persona/${id}`)
    .delete()
    .json<Promise<{ success: boolean }>>();

  if (!response.success) {
    throw new Error('Failed to delete persona');
  }
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Personas' }];
}

export default withAuthenticationRequired(function PersonaManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null,
  );

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: personasData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['persona', currentPage, rowsPerPage, debouncedSearch],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url('/manage/persona/list')
          .query({
            page: currentPage,
            limit: rowsPerPage,
            ...(debouncedSearch && { search: debouncedSearch }),
          })
          .get()
          .json<Promise<PersonasResponse>>();

        return response;
      } catch (error: unknown) {
        console.error('[SelectClient Query] Failed:', error);
        throw error;
      }
    },
    retryDelay: 5000,
    retry: 5,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] });
      toast.success(t('manage.persona.success.personaDeleted'));
      setIsDeleteModalOpen(false);
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

  const handleDeletePersona = async () => {
    if (!selectedPersonaId) return;
    try {
      await deleteMutation.mutateAsync(selectedPersonaId);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast.error(t('manage.persona.errors.deleteFailed'));
    }
  };

  const getPersonaActions = (persona: Persona) => [
    {
      label: t('common.view'),
      onClick: () => navigate(`/manage/persona/${persona.id}`),
    },
    {
      label: t('common.edit'),
      onClick: () => navigate(`/manage/persona/${persona.id}/edit`),
      disabled: persona.hasCompletedRoleplay,
      tooltip: persona.hasCompletedRoleplay
        ? 'Personas that are used in a completed roleplay cannot be edited.'
        : '',
    },
    {
      label: t('common.duplicate'),
      onClick: () => navigate(`/manage/persona/new?duplicate=${persona.id}`),
    },
    {
      label: t('common.delete'),
      onClick: () => {
        setIsDeleteModalOpen(true);
        setSelectedPersonaId(persona.id);
      },
      className: 'text-red-600',
      disabled: persona.hasLinkedScenario,
      tooltip: persona.hasLinkedScenario
        ? 'Personas that are linked to a roleplay cannot be deleted.'
        : '',
    },
  ];

  const personas = personasData?.personas || [];

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
            {t('manage.persona.errors.loadFailed')}
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('manage.persona.title')}
        </h1>
        <button
          onClick={() => navigate('/manage/persona/new')}
          className="flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          {t('manage.persona.buttons.newPersona')}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder={t('manage.persona.search.placeholder')}
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
                {t('manage.persona.table.persona')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.persona.table.summary')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.persona.table.usedIn')}
              </th>
              <th className="rounded-r-xl px-6 py-3 text-right text-sm font-medium text-gray-900"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {personas?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {t('manage.persona.emptyState.title')}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {searchTerm
                        ? t('manage.persona.emptyState.searchHint')
                        : t('manage.persona.emptyState.createHint')}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              personas.map((persona) => (
                <tr key={persona.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={persona.image || '/default-avatar.png'}
                        alt={persona.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {persona.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {[
                            persona.gender === 'male'
                              ? t('manage.persona.male')
                              : t('manage.persona.female'),
                            persona.age,
                            persona.occupation,
                          ]
                            .filter((item: any) => Boolean(item))
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md text-sm text-gray-900">
                      {persona.description?.length > 150
                        ? `${persona.description.substring(0, 150)}...`
                        : persona.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {`${persona.scenarioCount} ${persona.scenarioCount && persona.scenarioCount > 1 ? 'roleplays' : 'roleplay'}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown actions={getPersonaActions(persona)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedPersonaId(null);
          }}
          title="Delete persona?"
          description="This will permanently remove the persona. This action cannot be undone."
          onSubmit={handleDeletePersona}
        />

        {/* Pagination */}
        {personasData && (
          <Pagination
            currentPage={personasData.pagination.currentPage}
            totalPages={personasData.pagination.totalPages}
            totalItems={personasData.pagination.totalPersonas}
            itemsPerPage={rowsPerPage}
            hasNextPage={personasData.pagination.hasNextPage}
            hasPreviousPage={personasData.pagination.hasPreviousPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleRowsPerPageChange}
            itemLabel={t('manage.persona.pagination.rows')}
          />
        )}
      </div>
    </div>
  );
}, withManageAuthenticationRequiredOptions);
