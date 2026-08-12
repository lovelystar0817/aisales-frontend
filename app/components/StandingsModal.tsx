import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import xIcon from '~/assets/icons/x.svg';
import type {
  StandingWithDetails,
  StandingConfiguration,
} from '~/types/standings';
import { apiProtected } from '~/util/api';
import { StandingsCardsSection } from '~/components/StandingsCardsSection';
import { StandingsLadder } from '~/components/StandingsLadder';

interface StandingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  personaId?: string;
  moduleId?: string;
  productId?: string;
  /** When opened from the practice session recap we want the *session* context. */
  context?: 'session' | 'client';
}

export function StandingsModal({
  isOpen,
  onClose,
  sessionId,
  personaId,
  moduleId,
  productId,
  context = 'client',
}: StandingsModalProps) {
  const { t } = useTranslation();

  /* Fetch summary (current / latest / personal-best) */
  const { data: summaryData } = useQuery({
    queryKey: ['standings-summary', sessionId, personaId, moduleId, productId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (sessionId) params.sessionId = sessionId;
      if (personaId) params.personaId = personaId;
      if (moduleId) params.moduleId = moduleId;
      if (productId) params.productId = productId;

      return apiProtected().url('/standings/summary').query(params).get().json<{
        currentSessionStanding: StandingWithDetails | null;
        latestStanding: StandingWithDetails | null;
        personalBest: StandingWithDetails | null;
      }>();
    },
    enabled:
      isOpen && (!!sessionId || (!!personaId && !!moduleId && !!productId)),
    staleTime: 5 * 60 * 1000,
  });

  /* Fetch ladder configuration */
  const { data: configData } = useQuery({
    queryKey: ['standings-configuration', moduleId, productId],
    queryFn: async () => {
      if (!moduleId) return { configuration: null };
      try {
        return apiProtected()
          .url('/standings/configuration')
          .query({ moduleId, ...(productId && { productId }) })
          .get()
          .json<{ configuration: StandingConfiguration | null }>();
      } catch (err) {
        console.error('Failed to fetch standings configuration', err);
        return { configuration: null };
      }
    },
    enabled: isOpen && !!moduleId,
    staleTime: 5 * 60 * 1000,
  });

  const configuration = configData?.configuration ?? null;

  /* Decide which standing goes on the left card */
  const current = summaryData?.currentSessionStanding;
  const latest = summaryData?.latestStanding;
  const best = summaryData?.personalBest;

  let mainStanding: StandingWithDetails | null = null;
  let mainLabel = '';
  let showNoStanding = false;

  if (context === 'session') {
    if (sessionId && !current) {
      showNoStanding = true;
      mainLabel = t('practice.standings.currentSession');
    } else if (current) {
      mainStanding = current;
      mainLabel = t('practice.standings.currentSession');
    } else if (latest) {
      mainStanding = latest;
      mainLabel = t('practice.standings.lastResult');
    }
  } else {
    if (current) {
      mainStanding = current;
      mainLabel = t('practice.standings.currentSession');
    } else if (latest) {
      mainStanding = latest;
      mainLabel = t('practice.standings.lastResult');
    }
  }

  /* Render */
  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999]"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-0 md:min-h-0 md:p-4">
          <DialogPanel
            transition
            className="flex h-full w-full max-w-4xl flex-col bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0 md:h-auto md:max-h-[90vh] md:rounded-xl md:shadow-lg"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-4 rounded-2xl bg-white p-6">
              <DialogTitle
                as="h3"
                className="flex-1 text-xl/7 font-bold tracking-tight text-black"
              >
                {t('practice.standings.title', 'Standings')}
              </DialogTitle>

              <CloseButton className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                <img src={xIcon} alt={t('common.close')} className="h-4 w-4" />
              </CloseButton>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              <StandingsCardsSection
                mainStanding={mainStanding}
                mainLabel={mainLabel}
                personalBest={best}
                personalBestLabel={t(
                  'practice.standings.personalBest',
                  'Personal best',
                )}
                configuration={configuration}
                showNoStanding={showNoStanding}
              />

              <StandingsLadder configuration={configuration} />
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
