import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import type {
  StandingWithDetails,
  StandingConfiguration,
} from '~/types/standings';
import { getStatusInfo } from '~/types/standings';
import { getBadgeIcon } from '~/util/standingsBadge';
import {
  getMSIGSectionScores,
  calculateMSIGOverallScore,
  hasFailedMandatory,
} from '~/util/msig';
import { MSIGScoreIndicator } from '~/components/MSIGScoreIndicator';
import {
  calculateManulifeOverallScore,
  getManulifeSectionScores,
} from '~/util/manulife';

interface StandingCardProps {
  /** The standing record to display. */
  standing: StandingWithDetails | null;
  /** Display label (e.g. "Current Session", "Personal best") */
  label: string;
  /** Standings configuration (tier / score based). */
  configuration?: StandingConfiguration | null;
  /** When true and `standing` is null – show the red “No standing awarded” message. */
  showNoStanding?: boolean;
  /** Size of the badge icon */
  badgeClassName?: string;
}

/**
 * A reusable card that renders a single standing (either current session,
 * personal best, last result, etc.).  Handles both regular and MSIG
 * assessments transparently.
 */
export const StandingCard: React.FC<StandingCardProps> = ({
  standing,
  label,
  configuration,
  showNoStanding = false,
  badgeClassName = 'h-16 w-16',
}) => {
  const { t, i18n } = useTranslation();
  const [isScoresExpanded, setIsScoresExpanded] = useState(false);

  // ----------------------------------------------------------------------------------
  // Empty state (no standing or failed mandatory criteria)
  // ----------------------------------------------------------------------------------
  if (!standing) {
    return showNoStanding ? (
      <div className="flex flex-1 items-start gap-4 p-6">
        {getBadgeIcon(1, configuration?.type || 'tier-based', badgeClassName)}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">
            {t('practice.standings.noStandingAwarded', 'No standing awarded')}
          </p>
          <p className="mt-2 text-sm text-red-600">
            {t(
              'practice.standings.missingMandatory',
              'You did not meet all mandatory criteria for a standing.',
            )}
          </p>
        </div>
      </div>
    ) : null;
  }

  const statusInfo = getStatusInfo(standing.assessmentDetails, t);
  const isMSIG =
    standing.assessmentDetails?.assessmentType === 'msig' ||
    standing.assessmentDetails?.assessmentType === 'msig-3f';
  const isManulife =
    standing.assessmentDetails?.assessmentType === 'manulife' ||
    standing.assessmentDetails?.assessmentType === 'manulife-goalready';

  // ----------------------------------------------------------------------------------
  // MSIG-specific calculations
  // ----------------------------------------------------------------------------------
  const msigSections = isMSIG ? standing.assessmentDetails?.msigSections : null;
  const msigSectionScores = msigSections
    ? getMSIGSectionScores(msigSections, t)
    : [];
  const msigOverallScore = msigSections
    ? calculateMSIGOverallScore(msigSections)
    : 0;
  const hasFailedMandatoryCriteria = msigSections
    ? hasFailedMandatory(msigSections)
    : false;

  // ----------------------------------------------------------------------------------
  // Manulife-specific calculations
  // ----------------------------------------------------------------------------------
  const manulifeSections = isManulife
    ? standing.assessmentDetails?.manulifeSections
    : null;
  const manulifeSectionScores = manulifeSections
    ? getManulifeSectionScores(manulifeSections, t)
    : [];
  const manulifeOverallScore = manulifeSections
    ? calculateManulifeOverallScore(manulifeSections)
    : 0;

  return (
    <div className="flex-1 p-6">
      <div className="flex items-start gap-4">
        {getBadgeIcon(
          configuration ? standing.tierLevel : 1,
          configuration?.type || 'tier-based',
          badgeClassName,
        )}
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{standing.tierName}</p>

          {isMSIG ? (
            /* ------------------------------------------------------------------
             * MSIG assessment details
             * ------------------------------------------------------------------ */
            <div className="mt-4 space-y-4">
              {hasFailedMandatoryCriteria && (
                <p className="text-sm text-[#E60D00]">
                  {t('assessment.mandatoryFailed')}
                </p>
              )}

              {!hasFailedMandatoryCriteria && (
                <div>
                  {/* Overall Score */}
                  <div className="mt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex rounded-full border border-gray-200 px-2 py-1">
                        <p className="text-sm text-gray-500">
                          {t('assessment.sessionScore', 'Session score')}:&nbsp;
                        </p>
                        <span className="ml-1 text-sm font-bold">
                          {msigOverallScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown toggle */}
                  <div className="mt-4">
                    <button
                      onClick={() => setIsScoresExpanded(!isScoresExpanded)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <h4 className="text-sm text-gray-500">
                        {t('common.viewBreakdown')}
                      </h4>
                      {isScoresExpanded ? (
                        <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    {isScoresExpanded && (
                      <div className="mt-2 space-y-2">
                        {msigSectionScores.map((section, idx) => (
                          <MSIGScoreIndicator
                            key={idx}
                            score={section.score}
                            label={section.label}
                            status={section.status}
                            hasFailedItem={section.hasFailedItem}
                            notApplicable={section.notApplicable}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : isManulife ? (
            /* ------------------------------------------------------------------
             * Manulife assessment details
             * ------------------------------------------------------------------ */
            <div className="mt-4 space-y-4">
              {/* Overall Score */}
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex rounded-full border border-gray-200 px-2 py-1">
                    <p className="text-sm text-gray-500">
                      {t('assessment.sessionScore', 'Session score')}:&nbsp;
                    </p>
                    <span className="ml-1 text-sm font-bold">
                      {manulifeOverallScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setIsScoresExpanded(!isScoresExpanded)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h4 className="text-sm text-gray-500">
                    {t('common.viewBreakdown', 'View breakdown')}
                  </h4>
                  {isScoresExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {isScoresExpanded && (
                  <div className="mt-2 space-y-2">
                    {manulifeSectionScores.map((section, idx) => (
                      <MSIGScoreIndicator
                        key={idx}
                        score={section.score}
                        label={section.label}
                        status={section.status}
                        hasFailedItem={section.hasFailedItem}
                        notApplicable={section.notApplicable}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ------------------------------------------------------------------
             * Regular assessment details (client verification, 3F/4C, etc.)
             * ------------------------------------------------------------------ */
            <div className="mt-4 space-y-4">
              {/* Client Verification */}
              {standing.assessmentDetails?.clientVerification && (
                <DetailRow
                  label={t(
                    'assessment.standings.clientVerification',
                    'Client Verification',
                  )}
                  statusInfo={statusInfo.clientVerification}
                />
              )}
              {/* Framework Execution */}
              {standing.assessmentDetails?.frameworkExecution && (
                <DetailRow
                  label={
                    standing.assessmentDetails?.frameworkExecution?.type ===
                    '3F'
                      ? t(
                          'assessment.standings.threeFExecution',
                          '3F Execution',
                        )
                      : t('assessment.standings.fourCExecution', '4C Execution')
                  }
                  statusInfo={statusInfo.frameworkExecution}
                />
              )}
              {/* Objection Handling */}
              {standing.assessmentDetails?.objectionHandling && (
                <DetailRow
                  label={t(
                    'assessment.standings.objectionHandling',
                    'Objection Handling',
                  )}
                  statusInfo={statusInfo.objectionHandling}
                />
              )}
              {/* Product Knowledge */}
              {standing.assessmentDetails?.productKnowledge && (
                <DetailRow
                  label={t('assessment.productKnowledge', 'Product Knowledge')}
                  statusInfo={statusInfo.productKnowledge}
                />
              )}
              {/* Operational Knowledge */}
              {standing.assessmentDetails?.operationalKnowledge && (
                <DetailRow
                  label={t(
                    'assessment.operationalKnowledge',
                    'Operational Knowledge',
                  )}
                  statusInfo={statusInfo.operationalKnowledge}
                />
              )}
            </div>
          )}

          {/* Achieved date */}
          {standing.createdAt && (
            <p className="mt-6 text-xs text-gray-500">
              {t('practice.standings.achieved', 'Achieved')}{' '}
              {new Date(standing.createdAt).toLocaleDateString(i18n.language, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------------
// Small helper sub-component for regular assessments
// ----------------------------------------------------------------------------------
interface DetailRowProps {
  label: string;
  statusInfo: { text: string; dotClass: string; textClass: string };
}
const DetailRow: React.FC<DetailRowProps> = ({ label, statusInfo }) => (
  <div>
    <div className="flex items-center gap-2">
      <div className="h-4 w-1 rounded-full bg-gray-200" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <div className="mt-1 flex items-center gap-2 pl-3">
      <div className={`h-2 w-2 rounded-full ${statusInfo.dotClass}`} />
      <span className={`text-sm font-medium ${statusInfo.textClass}`}>
        {statusInfo.text}
      </span>
    </div>
  </div>
);
