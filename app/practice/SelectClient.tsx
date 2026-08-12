import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import {
  InformationCircleIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '~/components/button';
import { StandingsModal } from '~/components/StandingsModal';
import { apiProtected } from '~/util/api';
import type { Module, ModulesResponse, Product } from '../types/module';
import type { StandingsData } from '../types/standings';
import PracticeStepper from './PracticeStepper';
import { ArrowRight } from 'lucide-react';
import { cn } from '~/util/utils';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '~/context/language';
import { useAuthStore } from '~/store/auth';

interface ClientDetails {
  location: string;
  education: string;
  occupation: string;
  financialSituation: string;
  keyPriorities: string[];
  productKnowledge: string;
  workHistory?: string;
  liquidityNeeds?: string;
  companySizeAndSpend?: string;
  salesDescription?: string;
  salesGoal?: string;
  difficultyLevel?: string;
  // Alibaba-specific fields
  demographics?: string;
  companyProfile?: string;
  projectContext?: string;
  annualBudget?: string;
  competitorLandscape?: string;
}

interface PersonalityDetails {
  persona: string;
  communicationStyle: string[];
  decisionMaking: string[];
}

interface BblFinancialProfile {
  profileData?: {
    aum?: string; // e.g., "10-12M THB"
    demographicProfile?: string;
    behaviorProfile?: string;
    workHistory?: string;
    numberOfKids?: number;
    liquidityNeeds?: string;
    riskAppetite?: string;
    investmentFrequency?: string;
    keyLifestyleExpenditure?: string;
    discPersonality?: string;
  };
  educationGoal?: {
    kidAge: number;
    preferredLocation: string;
    educationLevel: string;
    schoolType: string;
    expectedLifestyleForKids: string;
    protectionPercentage: number;
    willingToTakeProductRiskForCheaperPremium: boolean;
    upfrontInvestment: number;
  };
  retirementGoal?: {
    retirementAge: number;
    payoutYears: number;
    retirementLifestyle: string;
    protectionPercentage: number;
    prefersRegularPayouts: boolean;
    prefersShorterPaymentPeriod: boolean;
    upfrontInvestment: number;
  };
  legacyGoal?: {
    numberOfBeneficiaries: number;
    beneficiaryLifestyle: string;
    protectionDuration: number;
    protectionPercentage: number;
    willingToTakeProductRiskForCheaperPremium: boolean;
    prefersSingleInstrument: boolean;
    upfrontInvestment: number;
  };
}

interface HsbcFinancialProfile {
  demographicProfile: string;
  annualIncome: string;
  hsbcTier: string;
  liquidityNeeds: string;
  keyLifestyleExpenditures: string;
}

interface GreatEasternFinancialProfile {
  liquidityNeeds?: string;
  lifestyleExpenditures?: string;
}

interface Client {
  _id: string;
  friendlyId: string;
  name: string;
  age: number | null;
  gender: 'male' | 'female';
  occupation: string;
  image: string;
  personality: string;
  description: string;
  details: ClientDetails;
  personalityDetails: PersonalityDetails;
  annualIncome: number | null;
  bblFinancialProfile?: BblFinancialProfile;
  hsbcFinancialProfile?: HsbcFinancialProfile;
  greatEasternFinancialProfile?: GreatEasternFinancialProfile;
  standings: StandingsData;
  scenarioId?: string;
  isCustom?: boolean;
  currency?: string;
}

// Helper function to get the appropriate badge icon based on tier index
function BadgeIcon({
  tierLevel,
  className,
}: {
  tierLevel: number;
  className?: string;
}) {
  if (tierLevel === 1) {
    return (
      <img
        src="/icons/newbie-sales-badge.png"
        className={className}
        alt="Newbie sales badge"
      />
    );
  } else if (tierLevel === 2) {
    return (
      <img
        src="/icons/intermediate-sales-badge.png"
        className={className}
        alt="Intermediate sales badge"
      />
    );
  } else if (tierLevel === 3) {
    return (
      <img
        src="/icons/expert-sales-badge.png"
        className={className}
        alt="Expert sales badge"
      />
    );
  } else {
    return (
      <img
        src="/icons/not-available-sales-badge.png"
        className={className}
        alt="Not available badge"
      />
    );
  }
}

export function SelectClient() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const { t } = useTranslation();

  // Debug: Track component lifecycle
  const renderCount = useRef(0);
  const componentMountTime = useRef(Date.now());

  renderCount.current += 1;

  useEffect(() => {
    console.log(
      `[SelectClient] Component mounted at ${new Date().toISOString()}`,
    );

    return () => {
      console.log('[SelectClient] Component unmounting', {
        totalRenders: renderCount.current,
        lifetimeMs: Date.now() - componentMountTime.current,
      });
    };
  }, []); // Empty dependency - only runs on mount/unmount

  // Debug: Log renders and query params
  useEffect(() => {
    console.log(`[SelectClient] Render #${renderCount.current}`, {
      module: searchParams.get('module'),
      product: searchParams.get('product'),
      step: searchParams.get('step'),
      singleScenario: searchParams.get('single-scenario'),
      selectedClient: selectedClient?.name || 'none',
      showDetails,
      url: window.location.href,
    });
  });

  // Helper function to get difficulty level styles
  const getDifficultyStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'easy':
        return { background: '#E7F8F3', color: '#058A62' };
      case 'medium':
        return { background: '#FFF4EB', color: '#B25300' };
      case 'hard':
        return { background: '#FFD9D6', color: '#E60D00' };
      default:
        return { background: '#F3F4F6', color: '#6B7280' };
    }
  };

  const moduleId = searchParams.get('module') || '';
  const productId = searchParams.get('product') || '';
  const scenarioId = searchParams.get('scenario') || '';
  const isSingleScenario = searchParams.get('single-scenario') === 'true';
  const { modulesWhitelist, company } = useAuthStore();
  const isManulife = company.name.toLowerCase().includes('manulife');
  const isBbl = selectedClient?.bblFinancialProfile?.profileData;
  const isHsbc = selectedClient?.hsbcFinancialProfile;
  const isRegular = !isBbl && !isHsbc;

  // Fetch modules to find the current module
  const { data: moduleData } = useQuery({
    queryKey: ['modules', modulesWhitelist || ''],
    queryFn: async (): Promise<ModulesResponse> => {
      try {
        let request = apiProtected().url('/sessions/home');

        if (modulesWhitelist) {
          request = request.query({ modules: modulesWhitelist });
        }

        const response = await request.get().json<ModulesResponse>();
        return response;
      } catch (error) {
        console.error('Failed to fetch modules:', error);
        return { modules: [] };
      }
    },
  });

  // Find current module and product directly from arrays
  const module: Module | undefined = moduleData?.modules?.find(
    (module: Module) => module._id === moduleId,
  );
  const product: Product | undefined = module?.products?.find(
    (product: Product) => product._id === productId,
  );

  const shouldShowField = useCallback(
    (fieldName: string): boolean => {
      if (!module) return false;
      if (module.fields.shown.length > 0 && module.fields.hidden.length === 0) {
        return module.fields.shown.includes(fieldName);
      } else if (
        module.fields.hidden.length > 0 &&
        module.fields.shown.length === 0
      ) {
        return !module.fields.hidden.includes(fieldName);
      } else if (
        module.fields.shown.length > 0 &&
        module.fields.hidden.length > 0
      ) {
        return (
          module.fields.shown.includes(fieldName) &&
          !module.fields.hidden.includes(fieldName)
        );
      }
      return true; // Default to showing field if not specified
    },
    [module],
  );

  const {
    data: clients,
    isLoading,
    error,
    dataUpdatedAt,
    isRefetching,
  } = useQuery({
    queryKey: ['clients', moduleId, productId, scenarioId],
    queryFn: async () => {
      console.log('[SelectClient Query] Fetching clients', {
        moduleId,
        productId,
        scenarioId,
      });
      try {
        const response = await apiProtected()
          .url('/sessions/personas')
          .query({
            moduleId,
            productId,
            scenarioId,
          })
          .get()
          .json<Client[]>();

        // Sort personas by difficulty level: easy -> medium -> hard
        const sortOrder = { easy: 1, medium: 2, hard: 3 };
        const sortedResponse = response.sort((a, b) => {
          const aLevel = a.details.difficultyLevel?.toLowerCase() || 'medium';
          const bLevel = b.details.difficultyLevel?.toLowerCase() || 'medium';
          return (
            (sortOrder[aLevel as keyof typeof sortOrder] || 2) -
            (sortOrder[bLevel as keyof typeof sortOrder] || 2)
          );
        });
        console.log('[SelectClient Query] Success:', {
          count: sortedResponse.length,
          moduleId,
          productId,
        });
        return sortedResponse;
      } catch (error) {
        console.error('[SelectClient Query] Failed:', error);
        return [];
      }
    },
    // Prevent unnecessary refetches
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // Log query state changes
  useEffect(() => {
    console.log('[SelectClient Query State]', {
      isLoading,
      isRefetching,
      hasData: !!clients,
      dataUpdatedAt: dataUpdatedAt
        ? new Date(dataUpdatedAt).toISOString()
        : 'never',
      clientCount: clients?.length || 0,
    });
  }, [isLoading, isRefetching, clients, dataUpdatedAt]);

  // Auto-select client if there's only one
  useEffect(() => {
    if (clients && clients.length === 1 && !selectedClient) {
      const singleClient = clients[0];
      setSelectedClient(singleClient);
      setShowDetails(true);
      console.log(
        '[SelectClient] Auto-selected single client:',
        singleClient.name,
      );
    }
  }, [clients, selectedClient]);

  const onReturnToModules = useCallback(() => {
    const params = new URLSearchParams({
      step: 'select-module',
    });
    // Preserve voice-config, provider, and modules if present
    const voiceConfig = searchParams.get('voice-config');
    const provider = searchParams.get('provider');
    if (voiceConfig) {
      params.set('voice-config', voiceConfig);
    }
    if (provider) {
      params.set('provider', provider);
    }
    navigate({
      search: params.toString(),
    });
    console.log('onReturnToModules');
  }, [navigate, searchParams]);

  const handleClientSelect = useCallback((client: Client) => {
    setSelectedClient(client);
    setShowDetails(true);
    console.log('handleClientSelect:', client);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowDetails(false);
    console.log('handleBackToList');
  }, []);

  const hasStandings =
    selectedClient?.standings.type === 'prudential' ||
    selectedClient?.standings.type === 'msig';

  const { mutate: startSession } = useMutation({
    mutationFn: async ({
      personaId,
      moduleId,
      productId,
      scenarioId,
    }: {
      personaId: string;
      moduleId: string;
      productId: string;
      scenarioId?: string;
    }) => {
      return apiProtected()
        .url('/sessions')
        .post({ personaId, moduleId, productId, scenarioId })
        .json<any>();
    },
    onSuccess(response) {
      posthog.capture('practice_started', {
        sessionId: response.sessionId,
      });

      // Navigate using the session id (which now has the roleplay populated)
      // Include voice-config and provider query parameters if present
      const voiceConfig = searchParams.get('voice-config');
      const provider = searchParams.get('provider');
      const queryParams = new URLSearchParams();
      if (voiceConfig) {
        queryParams.set('voice-config', voiceConfig);
      }
      if (provider) {
        queryParams.set('provider', provider);
      }
      const queryString = queryParams.toString();
      const url = queryString
        ? `/roleplay/${response.sessionId}?${queryString}`
        : `/roleplay/${response.sessionId}`;
      navigate(url);
    },
    onError(error) {
      toast.error(error.message || t('common.error'));
    },
  });

  const onStartCall = useCallback(
    (
      personaId: string,
      moduleId: string,
      productId: string,
      scenarioId?: string,
    ) => {
      console.log(
        'onStartCall ::: personaId',
        personaId,
        ', productId',
        productId,
        ', moduleId',
        moduleId,
        ', scenarioId',
        scenarioId,
      );

      if (!personaId || !productId || !moduleId) {
        toast.error(t('practice.selectAllOptions'));
        return;
      }

      startSession({ personaId, moduleId, productId, scenarioId });
    },
    [startSession, t],
  );

  return isLoading ? (
    <p>{t('common.loading')}</p>
  ) : (
    <div className="relative flex h-full flex-col gap-2">
      <button
        className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-gray-500"
        onClick={onReturnToModules}
      >
        <span className="text-xl">←</span>
        <span>{t('practice.returnToModules')}</span>
      </button>
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div className="mb-6 space-y-2">
          <h2 className="text-[20px] font-bold text-gray-900">
            {module?.title || moduleId}
            {!isSingleScenario && ` – ${product?.name}`}
          </h2>
          <p className="mt-1 text-gray-500">
            {t('practice.selectClientToStart')}
          </p>
        </div>
        <PracticeStepper
          currentStep={2}
          steps={[
            t('practice.steps.selectModule'),
            t('practice.steps.selectClient'),
          ]}
        />
      </div>

      <div className="flex flex-col gap-6 rounded-xl border border-[#EAEDEF] bg-white p-4 lg:h-[calc(100vh-200px)] lg:flex-row">
        {/* Client List */}
        <div
          className={clsx(
            'flex w-full flex-col divide-y divide-gray-300 overflow-y-auto border-b border-gray-100 pb-4 lg:max-h-full lg:w-1/3 lg:border-r lg:border-b-0 lg:pr-4 lg:pb-0',
            showDetails && 'hidden lg:flex', // Hide on mobile when showing details, always show on desktop
          )}
        >
          {/* Repeat for each client */}
          {clients?.map((client, clientIdx) => (
            <div
              key={client._id}
              className={cn(
                clientIdx === 0 && 'pb-2',
                clientIdx > 0 && 'py-2',
                clientIdx === clients?.length - 1 && 'pt-2',
              )}
            >
              <button
                className={cn(
                  'flex w-full items-start justify-start gap-3 px-3 py-2 text-left select-none hover:rounded-lg hover:bg-gray-100',
                  selectedClient?._id === client._id && 'rounded-lg bg-gray-50',
                  'cursor-pointer',
                )}
                onClick={() => handleClientSelect(client)}
              >
                <img
                  src={client.image}
                  alt={t('practice.clientDetails.clientPhoto')}
                  className="size-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="text-base/relaxed font-bold text-gray-900">
                    {client.name}
                  </div>
                  <div className="text-sm leading-5 text-gray-500">
                    {client.age !== null
                      ? `${t('practice.clientDetails.age')} ${client.age}, ${client.occupation}`
                      : `${client.occupation}`}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {client.details.difficultyLevel && (
                      <span
                        className="inline-block rounded-full px-2 py-1 text-xs font-medium"
                        style={getDifficultyStyles(
                          client.details.difficultyLevel,
                        )}
                      >
                        {t(
                          `roleplay.difficulty.${client.details.difficultyLevel.toLowerCase()}`,
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Client Details */}
        {!selectedClient && !showDetails && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center text-gray-500">
              {t('practice.selectClientToStart')}
            </div>
          </div>
        )}
        {selectedClient && (
          <div
            className={clsx(
              'relative flex flex-1 flex-col overflow-y-auto',
              !showDetails && 'hidden lg:flex', // Hide on mobile when not showing details, always show on desktop
            )}
          >
            {/* Back button for mobile */}
            <button
              className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-500 lg:hidden"
              onClick={handleBackToList}
            >
              <span className="text-xl">←</span>
              <span>{t('practice.backToList')}</span>
            </button>
            {/* Personal Best Banner */}
            {selectedClient.standings.type !== 'none' && !isManulife && (
              <div className="mx-auto mb-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white p-2 text-xs">
                {!selectedClient.standings.personalBest && (
                  <InformationCircleIcon className="size-4 flex-shrink-0 text-gray-400" />
                )}
                {selectedClient.standings.personalBest && (
                  <BadgeIcon
                    tierLevel={selectedClient.standings.personalBest.tierLevel}
                    className="size-5"
                  />
                )}
                <div className="flex items-center gap-1 text-gray-700">
                  {selectedClient.standings.personalBest ? (
                    <span>
                      {t('practice.personalBestMessage')}{' '}
                      <b>{selectedClient.standings.personalBest.tierName}</b>.{' '}
                      {t('practice.checkWhatsNext')}
                    </span>
                  ) : (
                    t('practice.noPersonalBestMessage')
                  )}{' '}
                  <button
                    onClick={() => setIsStandingsModalOpen(true)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            <StandingsModal
              isOpen={isStandingsModalOpen}
              onClose={() => setIsStandingsModalOpen(false)}
              personaId={selectedClient?._id}
              moduleId={moduleId}
              productId={productId}
            />

            <div className="mb-2 flex items-start gap-4 md:gap-6">
              <img
                src={selectedClient.image}
                alt={t('practice.clientDetails.clientPhoto')}
                className="size-12 rounded-full object-cover md:size-24"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg/relaxed font-semibold text-gray-900">
                    {selectedClient.name}
                  </span>
                  {selectedClient.details.difficultyLevel && (
                    <span
                      className="inline-block rounded-full px-2 py-1 text-xs font-medium"
                      style={getDifficultyStyles(
                        selectedClient.details.difficultyLevel,
                      )}
                    >
                      {t(
                        `roleplay.difficulty.${selectedClient.details.difficultyLevel.toLowerCase()}`,
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-0 hidden text-sm/relaxed text-gray-500 md:block">
                  {selectedClient.details.salesDescription +
                    ' ' +
                    (!selectedClient.scenarioId
                      ? (selectedClient.details.salesGoal ?? '')
                      : '')}
                </div>
              </div>
            </div>

            <div className="mt-2 md:hidden">
              <div className="text-sm/relaxed text-gray-500">
                {selectedClient.details.salesDescription +
                  ' ' +
                  (!selectedClient.isCustom
                    ? (selectedClient.details.salesGoal ?? '')
                    : '')}
              </div>
            </div>

            {/* Tabs */}
            <TabGroup className="flex flex-1 flex-col">
              <TabList className="mt-4 mb-2 flex shrink-0 gap-8 border-b border-gray-200">
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'cursor-pointer py-2 font-medium outline-none',
                      selected
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-500',
                    )
                  }
                >
                  {t('practice.profileTabLabel')}
                </Tab>
                <Tab
                  className={({ selected }) =>
                    clsx(
                      'cursor-pointer py-2 font-medium outline-none',
                      selected
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-500',
                    )
                  }
                >
                  {t('practice.personalityTabLabel')}
                </Tab>
              </TabList>
              <TabPanels className="flex-1">
                <TabPanel>
                  {/* BBL Profile or Standard Profile based on data availability */}
                  {isBbl && selectedClient.bblFinancialProfile?.profileData && (
                    /* BBL-specific Profile Layout */
                    <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .demographicProfile) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.demographic')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .demographicProfile || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        (shouldShowField('occupation') &&
                          (selectedClient.details.occupation ??
                            selectedClient.occupation))) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.occupation')}
                          </p>

                          <p className="text-gray-500">
                            {shouldShowField('occupation')
                              ? (selectedClient.details.occupation ??
                                selectedClient.occupation)
                              : t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData.aum) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.aum')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .aum || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .numberOfKids !== undefined) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.numberOfKids')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .numberOfKids ?? t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .behaviorProfile) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.behavior')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .behaviorProfile || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .workHistory) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.workHistory')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .workHistory || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        (shouldShowField('financialSituation') &&
                          selectedClient.details.financialSituation)) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.financialSituation')}
                          </p>
                          <p className="whitespace-pre-line text-gray-500">
                            {shouldShowField('financialSituation')
                              ? selectedClient.details.financialSituation
                              : t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .liquidityNeeds) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.liquidityNeeds')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .liquidityNeeds || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .riskAppetite) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.riskAppetite')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .riskAppetite || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .investmentFrequency) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.investmentFrequency')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .investmentFrequency || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.bblFinancialProfile.profileData
                          .keyLifestyleExpenditure) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.keyLifestyleExpenditure')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .keyLifestyleExpenditure || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        (shouldShowField('keyPriorities') &&
                          selectedClient.details.keyPriorities)) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.personalPriorities')}
                          </p>
                          <p className="text-gray-500">
                            {shouldShowField('keyPriorities')
                              ? selectedClient.details.keyPriorities?.join(', ')
                              : t('common.unknown')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isHsbc && selectedClient.hsbcFinancialProfile && (
                    /* HSBC Profile Layout */
                    <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
                      {(!selectedClient.isCustom ||
                        selectedClient.hsbcFinancialProfile
                          .demographicProfile) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.demographic')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.hsbcFinancialProfile
                              .demographicProfile || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        (selectedClient.details.occupation ??
                          selectedClient.occupation)) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.occupation')}
                          </p>
                          <p className="text-gray-500">
                            {(selectedClient.details.occupation ??
                              selectedClient.occupation) ||
                              t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.hsbcFinancialProfile.annualIncome) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.annualIncome')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.hsbcFinancialProfile.annualIncome ||
                              t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.hsbcFinancialProfile.hsbcTier) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.hsbcTier')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.hsbcFinancialProfile.hsbcTier ||
                              t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.details.location) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.location')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.details.location ||
                              t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.details.financialSituation) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.financialSituation')}
                          </p>
                          <p className="whitespace-pre-line text-gray-500">
                            {selectedClient.details.financialSituation ? (
                              <ReactMarkdown
                                components={{
                                  ul: ({ children }) => (
                                    <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-sm text-gray-700">
                                      {children}
                                    </li>
                                  ),
                                }}
                              >
                                {selectedClient.details.financialSituation}
                              </ReactMarkdown>
                            ) : (
                              t('common.unknown')
                            )}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.hsbcFinancialProfile.liquidityNeeds) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.liquidityNeeds')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.hsbcFinancialProfile
                              .liquidityNeeds || t('common.unknown')}
                          </p>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.hsbcFinancialProfile
                          .keyLifestyleExpenditures) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.keyLifestyleExpenditure')}
                          </p>
                          <ReactMarkdown
                            components={{
                              ul: ({ children }) => (
                                <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-gray-700">
                                  {children}
                                </li>
                              ),
                            }}
                          >
                            {selectedClient.hsbcFinancialProfile
                              .keyLifestyleExpenditures || t('common.unknown')}
                          </ReactMarkdown>
                        </div>
                      )}
                      {(!selectedClient.isCustom ||
                        selectedClient.details.keyPriorities) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.keyPriorities')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.details.keyPriorities
                              ? selectedClient.details.keyPriorities.map(
                                  (priority, pIndex) => (
                                    <p key={pIndex}>
                                      <ReactMarkdown
                                        components={{
                                          ul: ({ children }) => (
                                            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                              {children}
                                            </ul>
                                          ),
                                          ol: ({ children }) => (
                                            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                                              {children}
                                            </ol>
                                          ),
                                          li: ({ children }) => (
                                            <li className="text-sm text-gray-700">
                                              {children}
                                            </li>
                                          ),
                                        }}
                                      >
                                        {priority}
                                      </ReactMarkdown>
                                    </p>
                                  ),
                                )
                              : t('common.unknown')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isRegular && (
                    /* Standard Profile Layout for non-BBL personas */
                    <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
                      {shouldShowField('gender') && selectedClient.gender && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.gender')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.gender === 'male'
                              ? t('manage.persona.male')
                              : t('manage.persona.female')}
                          </p>
                        </div>
                      )}
                      {shouldShowField('age') && selectedClient.age && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.age')}
                          </p>
                          <p className="text-gray-500">{selectedClient.age}</p>
                        </div>
                      )}
                      {shouldShowField('demographics') &&
                        selectedClient.details.demographics && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              Demographics
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.demographics}
                            </p>
                          </div>
                        )}
                      {shouldShowField('occupation') &&
                        (selectedClient.details.occupation ??
                          selectedClient.occupation) && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.occupation')}
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.occupation ??
                                selectedClient.occupation}
                            </p>
                          </div>
                        )}
                      {shouldShowField('location') &&
                        selectedClient.details.location && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.location')}
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.location}
                            </p>
                          </div>
                        )}
                      {shouldShowField('companyProfile') &&
                        selectedClient.details.companyProfile && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              Company Profile
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.companyProfile}
                            </p>
                          </div>
                        )}
                      {shouldShowField('projectContext') &&
                        selectedClient.details.projectContext && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              Project Context
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.projectContext}
                            </p>
                          </div>
                        )}
                      {shouldShowField('annualBudget') &&
                        selectedClient.details.annualBudget && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              Annual IT Budget
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.annualBudget}
                            </p>
                          </div>
                        )}
                      {shouldShowField('competitorLandscape') &&
                        selectedClient.details.competitorLandscape && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              Competitor Landscape
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.competitorLandscape}
                            </p>
                          </div>
                        )}
                      {shouldShowField('education') &&
                        selectedClient.details.education && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.education')}
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.education}
                            </p>
                          </div>
                        )}
                      {shouldShowField('financialSituation') &&
                        selectedClient.details.financialSituation && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {productId === 'grab-for-business'
                                ? t('practice.clientDetails.companySize')
                                : t(
                                    'practice.clientDetails.financialSituation',
                                  )}
                            </p>
                            <p className="whitespace-pre-line text-gray-500">
                              {productId === 'grab-for-business' ||
                              selectedClient.isCustom ||
                              !selectedClient.annualIncome
                                ? selectedClient.details.financialSituation
                                : t(
                                    selectedClient.friendlyId.includes('prudential-ph') ? 'practice.clientDetails.monthlyIncomeFormat' : 'practice.clientDetails.annualIncomeFormat',
                                    {
                                      currency: selectedClient.currency ?? '$',
                                      amount:
                                        language === 'ko'
                                          ? Math.floor(
                                              selectedClient.annualIncome /
                                                10000,
                                            )
                                          : selectedClient.friendlyId.includes('prudential-ph')
                                            ? selectedClient.annualIncome.toLocaleString()
                                            : selectedClient.annualIncome,
                                      situation:
                                        selectedClient.details
                                          .financialSituation,
                                    },
                                  )}
                            </p>
                          </div>
                        )}
                      {shouldShowField('keyPriorities') &&
                        selectedClient.details.keyPriorities &&
                        selectedClient.details.keyPriorities.length > 0 && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.keyPriorities')}
                            </p>
                            <ul className="ml-5 list-disc text-gray-500">
                              {selectedClient.details.keyPriorities.map(
                                (priority, index) => (
                                  <li key={index}>{priority}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      {shouldShowField('productKnowledge') &&
                        selectedClient.details.productKnowledge && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.productKnowledge')}
                            </p>
                            <p className="text-gray-500">
                              {selectedClient.details.productKnowledge}
                            </p>
                          </div>
                        )}
                      {shouldShowField('workHistory') &&
                        selectedClient.details.workHistory && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.workHistory')}
                            </p>
                            <p className="text-gray-500">
                              {shouldShowField('workHistory')
                                ? selectedClient.details.workHistory
                                : t('common.unknown')}
                            </p>
                          </div>
                        )}
                      {shouldShowField('liquidityNeeds') &&
                        selectedClient.details.liquidityNeeds && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.liquidityNeeds')}
                            </p>
                            <p className="text-gray-500">
                              {shouldShowField('liquidityNeeds')
                                ? selectedClient.details.liquidityNeeds
                                : t('common.unknown')}
                            </p>
                          </div>
                        )}
                      {shouldShowField('companySizeAndSpend') &&
                        selectedClient.details.companySizeAndSpend && (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">
                              {t('practice.clientDetails.companySizeAndSpend')}
                            </p>
                            <p className="text-gray-500">
                              {shouldShowField('companySizeAndSpend')
                                ? selectedClient.details.companySizeAndSpend
                                : t('common.unknown')}
                            </p>
                          </div>
                        )}
                      {/* Great Eastern specific fields */}
                      {selectedClient.greatEasternFinancialProfile
                        ?.liquidityNeeds && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.liquidityNeeds')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.greatEasternFinancialProfile
                              .liquidityNeeds}
                          </p>
                        </div>
                      )}
                      {selectedClient.greatEasternFinancialProfile
                        ?.lifestyleExpenditures && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.lifestyleExpenditures')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.greatEasternFinancialProfile
                              .lifestyleExpenditures}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabPanel>
                <TabPanel>
                  {/* Personality Tab Content */}
                  <div className="mt-3 mb-8 flex flex-col gap-6 text-sm">
                    {shouldShowField('persona') && (
                      <>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('practice.clientDetails.personality')}
                          </p>
                          <ReactMarkdown
                            components={{
                              ul: ({ children }) => (
                                <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-sm text-gray-700">
                                  {children}
                                </li>
                              ),
                            }}
                          >
                            {selectedClient.personalityDetails?.persona.replace(
                              /^.*? - /,
                              '',
                            )}
                          </ReactMarkdown>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {t('practice.clientDetails.communicationsStyle')}
                        </p>
                        {shouldShowField('communicationStyle') ? (
                          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                            {selectedClient.personalityDetails?.communicationStyle.map(
                              (item, idx) => (
                                <li className="text-sm text-gray-700" key={idx}>
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-gray-500">{t('common.unknown')}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {t('practice.clientDetails.decisionMaking')}
                        </p>
                        {shouldShowField('decisionMaking') ? (
                          <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                            {selectedClient.personalityDetails?.decisionMaking.map(
                              (item, idx) => (
                                <li className="text-sm text-gray-700" key={idx}>
                                  {item}
                                </li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p className="text-gray-500">{t('common.unknown')}</p>
                        )}
                      </div>
                      {selectedClient.bblFinancialProfile?.profileData
                        ?.discPersonality && (
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">
                            {t('roleplay.fields.discPersonality')}
                          </p>
                          <p className="text-gray-500">
                            {selectedClient.bblFinancialProfile.profileData
                              .discPersonality || t('common.unknown')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </TabGroup>
            <div className="sticky bottom-0 flex items-center gap-3 bg-white pt-4 pb-2">
              {hasStandings && (
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex w-full items-center justify-center rounded-full"
                  onClick={() => setIsStandingsModalOpen(true)}
                >
                  {t('practice.viewCallCriteria')}
                </Button>
              )}
              <Button
                icon={<MicrophoneIcon />}
                size="lg"
                className="flex w-full items-center justify-center rounded-full"
                onClick={() => {
                  onStartCall(
                    selectedClient._id,
                    moduleId,
                    productId,
                    selectedClient?.scenarioId,
                  );
                }}
              >
                {t('practice.continueToPractice')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
