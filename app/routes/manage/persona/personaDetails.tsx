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

interface PersonaDetails {
  location: string;
  education: string;
  occupation: string;
  financialSituation: string;
  keyPriorities: string[];
  companySizeAndSpend: string;
  workHistory: string;
  productKnowledge: string;
  mainObjection: string;
}

interface PersonalityDetails {
  persona: string;
  communicationStyle: string[];
  decisionMaking: string[];
}

interface VoiceInfo {
  _id: string;
  name: string;
  language: string;
  accent?: string;
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
  hasCompletedRoleplay: boolean;
  hasLinkedScenario: boolean;
  voice: VoiceInfo;
  localizations?: Record<
    string,
    {
      voice?: VoiceInfo;
    }
  >;
  createdBy?: {
    name: string;
    email: string;
  };
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

interface PersonaResponse {
  success: boolean;
  persona: Persona;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Persona Details' }];
}

type TabType = 'overview' | 'used-in';

export default withAuthenticationRequired(function PersonaDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageRowsPerPage, setUsageRowsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch persona
  const {
    data: personaData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['persona', id],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/persona/${id}`)
          .get()
          .json<PersonaResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Persona Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id,
    retryDelay: 5000,
    retry: 3,
  });

  // Fetch usage (scenarios) with pagination
  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: ['persona-usage', id, usageCurrentPage, usageRowsPerPage],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/persona/${id}/usage`)
          .query({ page: usageCurrentPage, limit: usageRowsPerPage })
          .get()
          .json<UsageResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Persona Usage Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id && activeTab === 'used-in',
    retryDelay: 5000,
    retry: 3,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (personaId: string) => {
      try {
        await apiManage().url(`/manage/persona/${personaId}`).delete().json();
      } catch (error: unknown) {
        console.error('[Delete Persona] Failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona successfully deleted.');
      navigate('/manage/persona');
    },
  });

  const persona = personaData?.persona;
  const scenarios = usageData?.scenarios || [];
  const pagination = usageData?.pagination;

  const handleDelete = async () => {
    if (!persona) return;
    try {
      await deleteMutation.mutateAsync(persona.id);
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('Failed to delete persona');
    }
  };

  const handlePageChange = (newPage: number) => {
    setUsageCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setUsageRowsPerPage(newRowsPerPage);
    setUsageCurrentPage(1); // Reset to first page when changing rows per page
  };

  const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    id: 'Bahasa Indonesia',
    ms: 'Bahasa Melayu',
    th: 'Thai',
    tl: 'Tagalog',
    vi: 'Vietnamese',
  };

  const getLanguageName = (langCode: string) => {
    return LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
  };

  // Format accent display
  const formatAccent = (accent?: string) => {
    if (!accent) return null;

    const accentMap: Record<string, string> = {
      american: 'American English',
      british: 'British English',
      singaporean: 'Singaporean English',
    };

    return accentMap[accent.toLowerCase()] || accent;
  };

  // Get English voice accent
  const getEnglishVoiceAccent = () => {
    // Check localizations for English voice
    if (persona?.localizations?.en?.voice) {
      return formatAccent(persona.localizations.en.voice.accent);
    }

    // Fall back to root voice if it's English
    if (persona?.voice && persona.voice.language === 'en') {
      return formatAccent(persona.voice.accent);
    }

    return null;
  };

  // Collect all voices from localizations
  const getVoicesList = () => {
    const voices: Array<{ language: string; voiceName: string }> = [];

    if (persona?.localizations) {
      for (const [lang, localization] of Object.entries(
        persona.localizations,
      )) {
        if (localization.voice?.name) {
          voices.push({
            language: getLanguageName(lang),
            voiceName: localization.voice.name,
          });
        }
      }
    }

    // If no localizations, fall back to root voice
    if (voices.length === 0 && persona?.voice?.name) {
      voices.push({
        language: getLanguageName(persona.voice.language || 'en'),
        voiceName: persona.voice.name,
      });
    }

    return voices;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Failed to load persona</p>
          <button
            onClick={() => navigate('/manage/persona')}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Back to Personas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link
          to="/manage/persona"
          className="cursor-pointer text-blue-600 hover:underline"
        >
          Persona
        </Link>
        <span>/</span>
        <span className="text-gray-900">Persona detail</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{persona.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Last updated by {persona.updatedBy?.email ?? 'email@gmail.com'} on{' '}
            {persona.updatedAt && formatDate(persona.updatedAt)}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-3">
            <div className="group relative">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={persona.hasLinkedScenario}
                className={cn(
                  'w-[120px] rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-red-500 hover:bg-gray-200',
                  persona.hasLinkedScenario && 'cursor-not-allowed opacity-50',
                )}
              >
                Delete
              </button>

              {persona.hasLinkedScenario && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Personas that are linked to a roleplay cannot be deleted.
                </div>
              )}
            </div>
            <button
              onClick={() =>
                navigate(`/manage/persona/new?duplicate=${persona.id}`)
              }
              className="w-[120px] rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-gray-900 hover:bg-gray-200"
            >
              Duplicate
            </button>
            <div className="group relative">
              <button
                onClick={() => navigate(`/manage/persona/${persona.id}/edit`)}
                disabled={persona.hasCompletedRoleplay}
                className={cn(
                  'bg-primary w-[120px] rounded-full px-5 py-2 text-sm text-white hover:bg-orange-700',
                  persona.hasCompletedRoleplay &&
                    'cursor-not-allowed opacity-50',
                )}
              >
                Edit
              </button>

              {persona.hasCompletedRoleplay && (
                <div className="pointer-events-none invisible absolute top-full right-10 z-50 mt-1 ml-2 w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  Personas that are used in a completed roleplay cannot be
                  edited.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200">
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
      <div>
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-[#F6F8F8] p-4 lg:grid-cols-3">
            {/* Left Column - Basic Info */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-lg bg-white p-6">
                <div className="flex justify-center">
                  <img
                    src={persona.image || '/default-avatar.png'}
                    alt={persona.name}
                    className="h-32 w-32 rounded-full object-cover"
                  />
                </div>
                <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                  {persona.name}
                </h3>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Gender
                    </div>
                    <div className="mt-1 text-sm text-gray-900">
                      {persona.gender === 'male'
                        ? t('manage.persona.male')
                        : t('manage.persona.female')}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Age</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {persona.age ? persona.age : '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Occupation
                    </div>
                    <div className="mt-1 text-sm text-gray-900">
                      {persona.occupation}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      English voice accent
                    </div>
                    <div className="mt-1 text-sm text-gray-900">
                      {getEnglishVoiceAccent() || '-'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      Voice per Language
                    </div>
                    <div className="mt-2 space-y-2">
                      {getVoicesList().map((voice, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {voice.language}
                          </span>
                          <span className="text-gray-900">
                            {voice.voiceName}
                          </span>
                        </div>
                      ))}
                      {getVoicesList().length === 0 && (
                        <span className="text-sm text-gray-500">
                          No voices configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Info */}
            <div className="space-y-4 lg:col-span-2">
              {/* Personality */}
              <div className="rounded-lg bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personality
                </h3>
                <p className="mt-4 text-sm text-gray-700">
                  {persona.personalityDetails.persona}
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Decision making style
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {persona.personalityDetails.decisionMaking.map(
                        (item, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Communication style
                    </h4>
                    <ul className="mt-2 space-y-1">
                      {persona.personalityDetails.communicationStyle.map(
                        (item, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Supporting Information */}
              <div className="rounded-lg bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Supporting Information
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {persona.details.location && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Location
                      </h4>
                      <p className="mt-2 text-sm text-gray-700">
                        {persona.details.location}
                      </p>
                    </div>
                  )}

                  {persona.details.education && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Education
                      </h4>
                      <p className="mt-2 text-sm text-gray-700">
                        {persona.details.education}
                      </p>
                    </div>
                  )}

                  {persona.details.workHistory && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Work history
                      </h4>
                      <p className="mt-2 text-sm text-gray-700">
                        {persona.details.workHistory}
                      </p>
                    </div>
                  )}
                  {persona.details.financialSituation && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Financial situation
                      </h4>
                      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-gray-700">
                        {persona.details.financialSituation}
                      </p>
                    </div>
                  )}

                  {persona.details.keyPriorities && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Key priorities
                      </h4>
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {persona.details.keyPriorities.map(
                          (priority, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {priority}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {persona.details.companySizeAndSpend && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Company size & spend
                      </h4>
                      <p className="mt-2 text-sm text-gray-700">
                        {persona.details.companySizeAndSpend}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Used In Tab */
          <div className="rounded-lg bg-white">
            {isUsageLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <>
                <table className="min-w-full">
                  <thead className="bg-[#F6F8F8]">
                    <tr>
                      <th className="rounded-l-xl px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Scenario
                      </th>
                      <th className="rounded-r-xl px-6 py-3 text-left text-sm font-medium text-gray-900">
                        Product
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {scenarios.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-10 text-center">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                              No roleplays yet
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Roleplays using this persona will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      scenarios.map((scenario) => (
                        <tr key={scenario.id}>
                          <td className="px-6 py-4">
                            <Link
                              to={`/manage/scenario/${scenario.id}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {scenario.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {scenario.productName || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination for Used In */}
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
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onSubmit={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        isLoading={deleteMutation.isPending}
        title="Delete persona?"
        description="This will permanently remove the persona. This action cannot be undone."
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
