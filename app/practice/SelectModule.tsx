import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import {
  DiscoveryIcon,
  DocGreenIcon,
  PalmIcon,
  ProposalIcon,
  SnowIcon,
} from '../../public/icons/icons';
import { useAuthStore } from '../store/auth';
import type { Module, ModulesResponse, Product } from '../types/module';
import { apiProtected } from '../util/api';
import PracticeCard from './PracticeCard';
import PracticeStepper from './PracticeStepper';
import ProductLink from './ProductLink';
import { FirstTimeModuleModal } from '../components/FirstTimeModuleModal';
import { cn } from '~/util/utils';

// Map of module icons - fallback for modules without specific icons
const ICON_MAP: Record<string, React.ReactNode> = {
  '❄️': <SnowIcon />,
  '🔍': <DiscoveryIcon />,
  '📊': <ProposalIcon />,
  '🌴': <PalmIcon />,
  '📄': <DocGreenIcon />,
  // '🔄': <RenewalIcon />,
  // Add more mappings as needed
};

export function SelectModule() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { name } = useAuthStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State for first-time modal
  const [firstTimeModal, setFirstTimeModal] = useState<{
    isOpen: boolean;
    module: Module | null;
    productData: {
      moduleId: string;
      productId: string;
      scenarioId: string | undefined;
    } | null;
  }>({
    isOpen: false,
    module: null,
    productData: null,
  });

  // Get modules whitelist from auth store (set during guest auth for SCORM integration)
  const { modulesWhitelist } = useAuthStore();

  // Fetch modules from API
  const {
    data: apiData,
    isLoading,
    error,
  } = useQuery({
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

  // Mutation to mark module as accessed
  const markModuleAccessedMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      return apiProtected()
        .url('/sessions/track-module-access')
        .post({ moduleId });
    },
    onSuccess: () => {
      // Invalidate and refetch modules to update isFirstTime status
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });

  const onSelectModule = useCallback(
    (data: {
      moduleId: string;
      productId: string;
      singleScenario?: boolean;
      scenarioId?: string;
    }) => {
      const { moduleId, productId, singleScenario, scenarioId } = data;

      // Find the module to check if it's first time
      const module = apiData?.modules?.find(
        (m: Module) => m.friendlyId === moduleId,
      );
      if (!module) {
        return;
      }

      const product = module.products?.find(
        (p: Product) => p.friendlyId === productId,
      );
      if (!product) {
        console.log('product not found', productId);

        return;
      }

      if (module.isFirstTime) {
        // Show first-time modal
        setFirstTimeModal({
          isOpen: true,
          module,
          productData: {
            ...data,
            moduleId: module._id,
            productId: product._id,
            scenarioId,
          },
        });
      } else {
        const params = new URLSearchParams({
          step: 'select-client',
          module: module._id,
          product: product._id,
          ...(scenarioId !== undefined ? { scenario: scenarioId } : {}),
        });
        if (singleScenario) {
          params.set('single-scenario', 'true');
        }
        // Preserve voice-config, provider, and modules if present
        const voiceConfig = searchParams.get('voice-config');
        const provider = searchParams.get('provider');
        if (voiceConfig) {
          params.set('voice-config', voiceConfig);
        }
        if (provider) {
          params.set('provider', provider);
        }
        navigate({ search: params.toString() });
      }
    },
    [navigate, apiData?.modules, searchParams],
  );

  const handleFirstTimeModalContinue = useCallback(() => {
    if (firstTimeModal.module && firstTimeModal.productData) {
      // Mark module as accessed
      markModuleAccessedMutation.mutate(firstTimeModal.module.friendlyId);

      // Navigate to client selection
      const { moduleId, productId, scenarioId } = firstTimeModal.productData;
      const params = new URLSearchParams({
        step: 'select-client',
        module: moduleId,
        product: productId,
        ...(scenarioId !== undefined ? { scenario: scenarioId } : {}),
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
    }
  }, [
    firstTimeModal,
    markModuleAccessedMutation,
    navigate,
    searchParams,
    modulesWhitelist,
  ]);

  const handleFirstTimeModalClose = useCallback(() => {
    setFirstTimeModal({
      isOpen: false,
      module: null,
      productData: null,
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">{t('practice.loadingModules')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">{t('practice.failedToLoadModules')}</p>
      </div>
    );
  }

  // Get modules directly as arrays from API
  const allModules = apiData?.modules || [];

  console.log({ allModules });

  return (
    <>
      <div className="flex flex-col justify-between md:flex-row md:items-center">
        <div className="mb-6 space-y-2">
          <h1 className="text-xl leading-7 font-bold text-gray-900 lg:leading-7">
            {t('practice.heyLetsStart', { name })}
          </h1>
          <p className="text-sm/relaxed text-gray-500">
            {t('practice.selectCallType')}
          </p>
        </div>
        <PracticeStepper
          currentStep={1}
          steps={[
            t('practice.steps.selectModule'),
            t('practice.steps.selectClient'),
          ]}
        />
      </div>
      <div
        className={cn(
          'grid grid-cols-1 gap-6 md:grid-cols-2',
          allModules.length > 2 ? 'lg:grid-cols-3' : '',
        )}
      >
        {allModules.map((module: Module) => {
          const shouldShowProducts = !module.singleScenario;

          return (
            <PracticeCard
              key={module._id}
              locked={module.locked}
              icon={ICON_MAP[module.icon] || module.icon}
              iconBgColor={module.iconBgColor || '#E8F1FD'}
              title={module.title}
              description={module.description}
              singleScenario={module.singleScenario}
              onClick={
                module.singleScenario && !module.locked
                  ? () =>
                      onSelectModule({
                        moduleId: module.friendlyId,
                        productId:
                          module.products?.[0]?.friendlyId || module.friendlyId,
                        singleScenario: module.singleScenario,
                        scenarioId: module.scenarioId,
                      })
                  : undefined
              }
              className={cn(allModules.length < 3 ? 'min-h-0' : '')}
            >
              {shouldShowProducts &&
                (module.products || []).map((product: Product) => (
                  <ProductLink
                    key={product._id}
                    label={product.name}
                    onClick={() =>
                      onSelectModule({
                        moduleId: module.friendlyId,
                        productId: product.friendlyId,
                        singleScenario: module.singleScenario,
                        scenarioId: product.scenarioId,
                      })
                    }
                  />
                ))}
            </PracticeCard>
          );
        })}
      </div>

      {/* First-time module modal */}
      {firstTimeModal.module && (
        <FirstTimeModuleModal
          isOpen={firstTimeModal.isOpen}
          onClose={handleFirstTimeModalClose}
          onContinue={handleFirstTimeModalContinue}
          module={firstTimeModal.module}
        />
      )}
    </>
  );
}
