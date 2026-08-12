import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePostHog } from '~/context/posthog';
import { useSalesActionTracking } from '~/hooks/useSalesActionTracking';
import { ClientDetails } from './ClientDetails';
import { ClientPortfolio } from './ClientPortfolio';
import { CompetitiveIntelligence } from './CompetitiveIntelligence';
import { ProcessReference } from './ProcessReference';
import { ProductInformation } from './ProductInformation';
import SalesActionTracker from './SalesActionTracker';
import type {
  ClientPortfolio as ClientPortfolioData,
  Session,
} from '~/routes/app/roleplay/types';

const EXAMPLE_PANEL_DATA = {
  product: {
    friendlyId: 'pruvantage-assure-ii',
    name: 'PruVantage Assure II',
    keyFeatures: [
      'Choice of premium terms: 5, 10, 15, 20, or 25 years',
      'Whole life coverage for death; accidental disability coverage until age 70',
      'Sum Assured grows from 103% to 160% of total regular premiums paid',
      'Wealth Assure Value locks in highest daily account value (growth/flex accounts)',
      'Flexibility to invest in wide selection of PRULink funds',
    ],
    featureHighlight: {
      title: 'From S$1,800/year for 25-year premium term',
      description:
        'Minimum annual premium ranges from S$1,800 to S$10,000 depending on the selected premium term',
    },
  },
};

interface RightSectionProps {
  readonly session: Session & { assessmentType?: string };
}
export default function ClientAndProductInfoSection({
  session,
}: RightSectionProps) {
  const { t } = useTranslation();
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const posthog = usePostHog();

  // Feature flag for sales actions
  const salesActionsEnabled = posthog.isFeatureEnabled('sales-actions-enabled');

  const { actionProgress } = useSalesActionTracking({
    sessionId: session._id,
    enabled: salesActionsEnabled, // Only enable if feature flag is on
  });

  const hasSalesActions =
    salesActionsEnabled &&
    actionProgress &&
    actionProgress.allActions.length > 0;

  useEffect(() => {
    if (hasSalesActions && !openPanel) {
      setOpenPanel('salesActions');
    }
  }, [hasSalesActions, openPanel]);

  const togglePanel = (panelId: string) => {
    setOpenPanel((prev) => (prev === panelId ? null : panelId));
  };

  // Check if this is a cold calling session
  const isColdCall = session.module?.friendlyId === 'cold-call';
  const isFna = session.module?.friendlyId === 'fna';
  // Assessment types that don't need product info (recruitment-focused sessions)
  const isRecruitmentAssessment = [
    'mtl-recruitment',
    'mtl-prospect-practice',
    'axa-ph-recruitment',
    'prudential-objection-handling',
    'prudential-ph-appointment-setting',
  ].includes(session.assessmentType ?? '');
  const isObjectionHandling =
    session.module?.friendlyId === 'objection-handling' ||
    session.module?.friendlyId === 'axa-ph-general-objection-handling';
  const isAIAKo =
    session.module?.friendlyId === 'aia-ko-opening-objection-call' ||
    session.module?.friendlyId === 'aia-ko-product-pitch' ||
    session.module?.friendlyId === 'aia-ko-end-to-end-outbound-call';
  session.module?.friendlyId === 'objection-handling' ||
    session.module?.friendlyId === 'axa-ph-general-objection-handling';
  const isScenarioAllProduct =
    session.scenario?.product?.friendlyId === 'all-products-exploratory';
  const shouldRemoveCompetitiveIntelligence =
    session.scenario?.product &&
    !session.scenario?.product?.hasCompetitiveIntelligence
      ? true
      : false;

  // Field visibility logic based on module configuration
  const shouldShowField = useCallback(
    (fieldName: string): boolean => {
      const module = session.module;
      if (!module) return false;
      if (
        module.fields?.shown?.length > 0 &&
        module.fields?.hidden?.length === 0
      ) {
        return module.fields.shown.includes(fieldName);
      } else if (
        module.fields?.hidden?.length > 0 &&
        module.fields?.shown?.length === 0
      ) {
        return !module.fields.hidden.includes(fieldName);
      } else if (
        module.fields?.shown?.length > 0 &&
        module.fields?.hidden?.length > 0
      ) {
        return (
          module.fields.shown.includes(fieldName) &&
          !module.fields.hidden.includes(fieldName)
        );
      }
      return true; // Default to showing field if not specified
    },
    [session.module],
  );

  const allPanels = useMemo(() => {
    const panels = [];

    // Conditionally add Sales Actions panel only if feature flag is enabled
    if (hasSalesActions) {
      panels.push({
        id: 'salesActions',
        title: 'Sales Actions',
        content: (
          <SalesActionTracker
            sessionId={session._id}
            actionProgress={actionProgress}
            onActionCompleted={(action) => {
              console.log('Action completed in sidebar:', action);
            }}
            className="border-0 !p-0 shadow-none"
          />
        ),
      });
    }

    panels.push({
      id: 'clientDetails',
      title: t('roleplay.clientDetails'),
      content: (
        <ClientDetails
          persona={session.persona}
          productId={session.product?.friendlyId}
          assessmentType={session.assessmentType}
          shouldShowField={shouldShowField}
          shouldShowPersonalityField={shouldShowField}
        />
      ),
    });

    // Add Client Portfolio panel if portfolio data is available
    const clientPortfolio =
      session.assessmentType === 'bbl' &&
      session.callType === 'bbl-portfolio-review' &&
      session.persona.meta?.bblCurrentPortfolio
        ? ({
            currentPortfolio: session.persona.meta.bblCurrentPortfolio,
            adjustedPortfolios: session.persona.meta.bblAdjustedPortfolios,
          } as ClientPortfolioData)
        : undefined;
    if (clientPortfolio) {
      panels.push({
        id: 'clientPortfolio',
        title: t('roleplay.clientPortfolio'),
        content: <ClientPortfolio clientPortfolio={clientPortfolio} />,
      });
    }

    // Conditionally add panels based on assessment type
    if (session.assessmentType === 'bbl') {
      panels.push({
        id: 'processReference',
        title: t('roleplay.processReference'),
        content: (
          <ProcessReference processReference={session.processReference} />
        ),
      });
    } else if (session.assessmentType === 'hsbc') {
      panels.push({
        id: 'processReference',
        title: t('roleplay.processReference'),
        content: (
          <ProcessReference processReference={session.processReference} />
        ),
      });
    } else {
      // For non-BBL assessments, show the standard Product Information + Competitive Intelligence
      if (!isScenarioAllProduct) {
        panels.push({
          id: 'productInformation',
          title: t('roleplay.productInformation'),
          content: (
            <ProductInformation
              product={session?.product || EXAMPLE_PANEL_DATA.product}
            />
          ),
        });

        if (
          session.competitiveIntelligence?.competitors &&
          session.competitiveIntelligence.competitors.length > 0 &&
          !shouldRemoveCompetitiveIntelligence
        ) {
          panels.push({
            id: 'competitiveIntelligence',
            title: t('roleplay.competitiveIntelligence.title'),
            content: (
              <CompetitiveIntelligence
                competitors={session.competitiveIntelligence.competitors}
              />
            ),
          });
        }
      }
    }

    return panels;
  }, [
    hasSalesActions,
    session._id,
    session.persona,
    session.product?.friendlyId,
    session.product,
    session.competitiveIntelligence?.competitors,
    session.assessmentType,
    session.callType,
    session.scenario,
    session.processReference,
    actionProgress,
    shouldShowField,
    t,
  ]);

  // Filter out product info, competitive intelligence, and process reference for cold calling, FNA, recruitment assessments, and objection handling
  const panels =
    isColdCall ||
    isFna ||
    isRecruitmentAssessment ||
    isObjectionHandling ||
    isAIAKo
      ? allPanels.filter(
          (panel) =>
            panel.id === 'salesActions' ||
            panel.id === 'clientDetails' ||
            panel.id === 'clientPortfolio',
        )
      : allPanels;

  return (
    <div className="mb-20 w-full">
      <div className="mx-auto w-full max-w-lg rounded-xl border-b border-white/10 bg-white/5">
        {panels.map((panel) => (
          <div
            key={panel.id}
            className="border-b border-gray-200 last:border-b-0"
          >
            <button
              className="group flex w-full items-center justify-between px-4 py-4 text-left focus:outline-none"
              aria-expanded={openPanel === panel.id}
              onClick={() => togglePanel(panel.id)}
              type="button"
            >
              <span className="text-xs/relaxed font-semibold tracking-wider text-gray-500 uppercase group-hover:text-gray-600">
                {panel.title}
              </span>
              <ChevronDownIcon
                className={`size-5 text-gray-500 transition-transform ${
                  openPanel === panel.id ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openPanel === panel.id && (
              <div className="border-t border-gray-200 text-sm/5 text-gray-900/80">
                {panel.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
