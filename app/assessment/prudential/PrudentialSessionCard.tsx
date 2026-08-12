import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  getDynamicSuffix,
  getDynamicSummary,
  getNextSteps,
  getNextStepsTitle,
} from '~/assessment/prudential/summary';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { ScormCompletionDialog } from '~/components/ScormCompletionDialog';
import { StandingsModal } from '~/components/StandingsModal';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { useTTS } from '~/hooks/useTTS';
import { formatDuration } from '~/util/api';
import {
  DownloadIcon,
  FileIcon,
  HeadphoneIcon,
} from '../../../public/icons/icons';
import { useLanguage } from '../../context/language';

type IconType = 'headphone' | 'download' | 'file';

const PrudentialSessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const navigate = useNavigate();
  const {
    apiClient,
    session,
    onViewTranscript,
    salesTechniquesData,
    overviewData,
    productKnowledgeData,
    technicalKnowledgeData,
    isColdCall,
    isStandingGenerating,
    isAdminView,
  } = useAssessmentContext();
  const sessionId = session?._id;

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // New session mutation
  const { mutate: startNewSession, isPending: isStartingNewSession } =
    useMutation({
      mutationFn: async ({
        personaId,
        callType,
        productId,
      }: {
        personaId: string;
        callType: string;
        productId: string;
      }) => {
        return apiClient()
          .url('/sessions')
          .post({ personaId, callType, productId })
          .json<any>();
      },
      onSuccess(response) {
        console.log('New session created:', response.sessionId);
        navigate(`/roleplay/${response.sessionId}`);
      },
      onError(error) {
        console.error('Failed to create new session:', error);
        toast.error(error.message || t('common.error'));
      },
    });

  const practiceInfo = useMemo(
    () => ({
      type: session?.module?.title ?? '',
      product: session?.product.name ?? '',
      client:
        (session?.persona.name ?? '') +
        ', ' +
        (session?.persona.occupation ?? ''),
      completedAt: session?.endedAt
        ? format(new Date(session.endedAt), 'dd MMM yyyy')
        : '',
      duration: session?.roleplay?.duration
        ? formatDuration(session.roleplay.duration)
        : '',
    }),
    [session],
  );

  const salesTechniquesScore =
    salesTechniquesData?.frameworkExecution?.overallScore;

  const standingCriteria = useMemo(
    () =>
      getStandingCriteriaData(
        salesTechniquesData,
        session,
        salesTechniquesScore as number,
        technicalKnowledgeData,
        isColdCall,
        t,
      ),
    [
      salesTechniquesData,
      session,
      salesTechniquesScore,
      technicalKnowledgeData,
      isColdCall,
      t,
    ],
  );

  const { completionStatus, dismissCompletion } = useScormCompletion({
    overallScore: salesTechniquesScore,
    sessionId,
  });

  const {
    playAudio,
    playStreamingAudio,
    stopAudio,
    isLoading: isTTSLoading,
  } = useTTS({
    setIsAISpeaking: setIsAudioPlaying,
    onPlaybackComplete: () => setIsAudioPlaying(false),
  });

  // PDF download mutation
  const { mutate: downloadPDF, isPending: isDownloadingPDF } = useMutation({
    mutationFn: async () => {
      return apiClient()
        .url(`/sessions/report`)
        .query({ sessionId })
        .get()
        .blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-report-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('PDF download completed successfully');
    },
    onError: (error) => {
      console.error('Failed to download PDF:', error);
      toast.error(t('assessment.failedToDownloadPDF'));
    },
  });

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const handleListenToFeedback = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      // Build comprehensive feedback text
      const feedbackSections = [];

      // Overview section - use dynamic summary logic
      const dynamicSummary = getDynamicSummary({
        overviewData: overviewData ?? null,
        session: session ?? null,
        salesTechniquesData: salesTechniquesData ?? null,
        isColdCall,
        t,
      });

      if (dynamicSummary) {
        const overviewText = t('assessment.audioFeedback.overview', {
          summary: dynamicSummary,
        });
        feedbackSections.push(overviewText);

        const nextSteps = getNextSteps({
          overviewData: overviewData ?? null,
          session: session ?? null,
          salesTechniquesData: salesTechniquesData ?? null,
          isColdCall,
          t,
        });

        if (nextSteps.length > 0) {
          const nextStepsTitle = getNextStepsTitle({
            overviewData: overviewData ?? null,
            session: session ?? null,
            salesTechniquesData: salesTechniquesData ?? null,
            isColdCall,
            t,
          });

          feedbackSections.push(nextStepsTitle);
          feedbackSections.push(nextSteps.join(', '));
        }

        // Add dynamic suffix if it exists
        const dynamicSuffix = getDynamicSuffix({
          overviewData: overviewData ?? null,
          session: session ?? null,
          salesTechniquesData: salesTechniquesData ?? null,
          isColdCall,
          t,
        });

        if (dynamicSuffix) {
          feedbackSections.push(dynamicSuffix);
        }
      }

      // Sales Techniques section
      if (salesTechniquesData) {
        // Client Verification feedback (only for cold calls)
        if (isColdCall && salesTechniquesData.clientVerification) {
          const clientVerif = salesTechniquesData.clientVerification;
          const isCompleted = clientVerif.completed;

          feedbackSections.push(
            `Client Verification: ${isCompleted ? 'Completed successfully' : 'Not completed'}.`,
          );

          if (
            clientVerif.completedItems &&
            clientVerif.completedItems.length > 0
          ) {
            feedbackSections.push(
              t('assessment.audioFeedback.strengths', {
                strengths: clientVerif.completedItems.join(', '),
              }),
            );
          }

          if (
            clientVerif.toImproveItems &&
            clientVerif.toImproveItems.length > 0
          ) {
            feedbackSections.push(
              t('assessment.audioFeedback.toImprove', {
                improvements: clientVerif.toImproveItems.join(', '),
              }),
            );
          }
        }

        // Framework Execution feedback
        if (salesTechniquesData.frameworkExecution) {
          const framework = salesTechniquesData.frameworkExecution;
          feedbackSections.push(
            t('assessment.audioFeedback.frameworkExecutionIntro', {
              score: framework.overallScore,
              max: 100,
            }),
          );

          if (framework.completedItems && framework.completedItems.length > 0) {
            feedbackSections.push(
              t('assessment.audioFeedback.strengths', {
                strengths: framework.completedItems.join(', '),
              }),
            );
          }

          if (framework.toImproveItems && framework.toImproveItems.length > 0) {
            feedbackSections.push(
              t('assessment.audioFeedback.toImprove', {
                improvements: framework.toImproveItems.join(', '),
              }),
            );
          }
        }

        // Objection Handling feedback
        if (salesTechniquesData.objectionHandling) {
          const objection = salesTechniquesData.objectionHandling;
          feedbackSections.push(
            t('assessment.audioFeedback.objectionHandlingIntro', {
              score: objection.overallScore,
              max: 100,
            }),
          );

          if (objection.completedItems && objection.completedItems.length > 0) {
            feedbackSections.push(
              t('assessment.audioFeedback.strengths', {
                strengths: objection.completedItems.join(', '),
              }),
            );
          }

          if (objection.toImproveItems && objection.toImproveItems.length > 0) {
            feedbackSections.push(
              t('assessment.audioFeedback.toImprove', {
                improvements: objection.toImproveItems.join(', '),
              }),
            );
          }
        }
      }

      // Technical Knowledge section (for Prudential - includes both product and operational knowledge)
      if (!isColdCall && technicalKnowledgeData) {
        feedbackSections.push(
          t('assessment.audioFeedback.technicalKnowledgeIntro'),
        );

        if (technicalKnowledgeData.productKnowledge) {
          const productKnowledge = technicalKnowledgeData.productKnowledge;
          feedbackSections.push(
            t('assessment.audioFeedback.productKnowledgeScore', {
              score: productKnowledge.overallScore,
              max: 100,
            }),
          );

          if (
            productKnowledge.completedItems &&
            productKnowledge.completedItems.length > 0
          ) {
            feedbackSections.push(
              t('assessment.audioFeedback.strengths', {
                strengths: productKnowledge.completedItems.join(', '),
              }),
            );
          }

          if (
            productKnowledge.toImproveItems &&
            productKnowledge.toImproveItems.length > 0
          ) {
            feedbackSections.push(
              t('assessment.audioFeedback.toImprove', {
                improvements: productKnowledge.toImproveItems.join(', '),
              }),
            );
          }
        }

        if (technicalKnowledgeData.operationalKnowledge) {
          const operationalKnowledge =
            technicalKnowledgeData.operationalKnowledge;
          feedbackSections.push(
            `Operational Knowledge: You scored ${operationalKnowledge.overallScore} out of 100.`,
          );

          if (
            operationalKnowledge.completedItems &&
            operationalKnowledge.completedItems.length > 0
          ) {
            feedbackSections.push(
              `Your operational strengths include: ${operationalKnowledge.completedItems.join(', ')}.`,
            );
          }

          if (
            operationalKnowledge.toImproveItems &&
            operationalKnowledge.toImproveItems.length > 0
          ) {
            feedbackSections.push(
              `Operational areas to improve: ${operationalKnowledge.toImproveItems.join(', ')}.`,
            );
          }
        }
      }

      if (feedbackSections.length > 0) {
        const separator = language === 'th' ? ', ' : '. ';
        const fullFeedbackText = feedbackSections.join(separator);
        // Use traditional playAudio for Thai language, streaming for others
        // if (language === 'th') {
        //   playAudio(fullFeedbackText, sessionId);
        // } else {
        playStreamingAudio(fullFeedbackText, sessionId);
        // }
      }
    }
  };

  const getAudioButtonText = () => {
    if (isTTSLoading) return t('common.loading');
    if (isAudioPlaying) return t('assessment.stopListening');
    return t('assessment.listenToFeedback');
  };

  const handlePracticeAgain = () => {
    if (!session) {
      toast.error(t('assessment.sessionDataNotAvailable'));
      return;
    }

    const personaId = session.persona?._id;
    const callType = session.callType;
    const productId = session.product?.friendlyId || session.product?._id;

    if (!personaId || !callType || !productId) {
      toast.error(t('assessment.unableToRestartPractice'));
      return;
    }

    startNewSession({ personaId, callType, productId });
  };

  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);

  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  const hasNewBadge = session?.standingProgression?.type === 'first-time';

  console.log({ session });

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-4 rounded-2xl bg-white p-4 lg:w-[300px]">
        {/* Standing Progress Section */}
        <section className="col-span-2 w-full space-y-4 pt-4 md:col-span-1 lg:col-span-2">
          <div className="flex items-start gap-4">
            {isStandingGenerating ? (
              <div className="size-22 shrink-0 animate-pulse rounded-full bg-gray-200" />
            ) : (
              <div className="relative shrink-0">
                {getBadgeIconByIndex(
                  (session?.standing?.tierLevel ?? 0) - 1,
                  'size-22',
                  t,
                )}
                {hasNewBadge && (
                  <div className="absolute -top-2 -right-2">
                    <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                      {t('assessment.standings.newBadge')}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">
                {t('assessment.standings.currentSession')}
              </p>
              {isStandingGenerating ? (
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {session?.standing?.tierName ||
                    t('assessment.standings.notAvailable', 'Not Available')}
                </p>
              )}
              {isStandingGenerating ? (
                <div className="mt-4 space-y-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              ) : standingCriteria?.find(
                  (c) =>
                    c.key === 'clientVerification' && c.status !== 'Completed',
                ) ? (
                <p className="mt-1 text-sm font-medium text-red-600">
                  {t('assessment.standings.standingUnavailable')}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {standingCriteria?.map((criterion) => (
                    <div key={criterion.key}>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-1 rounded-full bg-gray-200" />
                        <span className="text-sm text-gray-500">
                          {criterion.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 pl-3">
                        <div
                          className={`h-2 w-2 rounded-full ${criterion.color}`}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {criterion.status}
                        </span>
                      </div>
                    </div>
                  )) || (
                    // Fallback if no standing data is available
                    <div className="text-sm text-gray-500">
                      {t('assessment.standings.noDataAvailable')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Learn more */}
          <div className="mt-6 border-gray-200">
            <p className="text-sm text-gray-500">
              {t('assessment.standings.seeHowStandingsWork')}.{' '}
              <button
                className="font-medium text-blue-600 hover:underline"
                onClick={() => setIsStandingsModalOpen(true)}
              >
                {t('assessment.standings.learnMore')}
              </button>
            </p>
          </div>
        </section>

        <div className="col-span-2 h-px w-full bg-gray-200" />

        <section className="col-span-2 w-full space-y-2 pt-4 md:col-span-1 lg:col-span-2">
          <h4 className="text-[14px] font-bold text-[#161618]">
            {t('assessment.practiceInfo')}
          </h4>
          <PracticeInfoItem
            label={t('assessment.type')}
            value={practiceInfo.type}
          />
          <PracticeInfoItem
            label={t('assessment.product')}
            value={practiceInfo.product}
          />
          <PracticeInfoItem
            label={t('assessment.client')}
            value={practiceInfo.client}
          />
          <PracticeInfoItem
            label={t('assessment.completedAt')}
            value={practiceInfo.completedAt}
          />
          {practiceInfo.duration && (
            <PracticeInfoItem
              label={t('assessment.duration')}
              value={practiceInfo.duration}
            />
          )}
        </section>

        <footer className="col-span-2 flex w-full flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 lg:flex-col lg:space-y-3 lg:space-x-0">
          {!isAdminView && (
            <ActionButton onClick={handlePracticeAgain} primary>
              {t('assessment.practiceAgain')}
            </ActionButton>
          )}

          <ActionButton icon="file" onClick={onViewTranscript} primary={false}>
            {t('assessment.viewTranscript')}
          </ActionButton>

          <ActionButton
            onClick={handleListenToFeedback}
            icon="headphone"
            primary={false}
            disabled={isTTSLoading || !overviewData}
          >
            {getAudioButtonText()}
          </ActionButton>

          <ActionButton
            onClick={() => session?._id && downloadPDF()}
            icon="download"
            disabled={isDownloadingPDF}
          >
            {isDownloadingPDF
              ? t('assessment.generating')
              : t('assessment.downloadAsPdf')}
          </ActionButton>
        </footer>
      </article>
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        sessionId={session?._id}
        personaId={session?.persona?._id}
        moduleId={session?.module?._id}
        productId={session?.product?._id}
        context="session"
      />

      {/* SCORM Completion Dialog */}
      {completionStatus && (
        <ScormCompletionDialog
          isOpen={completionStatus.isCompleted}
          passed={completionStatus.passed}
          score={completionStatus.score}
          threshold={completionStatus.threshold}
          onClose={dismissCompletion}
          onPracticeAgain={handlePracticeAgain}
        />
      )}
    </>
  );
};

// Helper function to get the appropriate badge icon based on tier name
function getBadgeIconByIndex(index: number, className?: string, t?: any) {
  if (index === 0) {
    return (
      <img
        src="/icons/newbie-sales-badge.png"
        className={className}
        alt={t?.('assessment.badges.newbieSalesAlt') || 'Newbie sales badge'}
      />
    );
  } else if (index === 1) {
    return (
      <img
        src="/icons/intermediate-sales-badge.png"
        className={className}
        alt={
          t?.('assessment.badges.intermediateSalesAlt') ||
          'Intermediate sales badge'
        }
      />
    );
  } else if (index === 2) {
    return (
      <img
        src="/icons/expert-sales-badge.png"
        className={className}
        alt={t?.('assessment.badges.expertSalesAlt') || 'Expert sales badge'}
      />
    );
  } else {
    return (
      <img
        src="/icons/not-available-sales-badge.png"
        className={className}
        alt={t?.('assessment.badges.notAvailableAlt') || 'Not available badge'}
      />
    );
  }
}

function getStandingCriteriaData(
  salesTechniquesData: any,
  session: any,
  salesTechniquesScore: number,
  technicalKnowledgeData: any,
  isColdCall: boolean,
  t?: any,
) {
  if (!salesTechniquesData) {
    return null;
  }

  const criteria = [];

  const clientVerification = salesTechniquesData.clientVerification;
  if (clientVerification) {
    criteria.push({
      key: 'clientVerification',
      label:
        t?.('assessment.standings.clientVerification') || 'Client Verification',
      status: clientVerification.completed
        ? t?.('assessment.standings.completed') || 'Completed'
        : t?.('assessment.standings.notCompleted') || 'Not Completed',
      color: clientVerification.completed ? 'bg-green-600' : 'bg-red-600',
    });
  }

  const isProductPositioning = session?.callType === 'product-positioning';
  const frameworkLabel = isProductPositioning
    ? t?.('assessment.standings.threeFExecution') || '3F Execution'
    : t?.('assessment.standings.fourCExecution') || '4C Execution';

  let frameworkStatus =
    t?.('assessment.standings.notAvailable') || 'Not Available';
  let frameworkColor = 'bg-gray-400';

  if (salesTechniquesScore !== null && salesTechniquesScore !== undefined) {
    if (salesTechniquesScore >= 67) {
      frameworkStatus = t?.('assessment.standings.expert') || 'Expert';
      frameworkColor = 'bg-green-600';
    } else if (salesTechniquesScore >= 34) {
      frameworkStatus =
        t?.('assessment.standings.intermediate') || 'Intermediate';
      frameworkColor = 'bg-blue-600';
    } else if (salesTechniquesScore >= 0) {
      frameworkStatus = t?.('assessment.standings.beginner') || 'Beginner';
      frameworkColor = 'bg-orange-600';
    }

    if (salesTechniquesScore > 0) {
      frameworkStatus += ` (${salesTechniquesScore}%)`;
    }
  }

  criteria.push({
    key: 'frameworkExecution',
    label: frameworkLabel,
    status: frameworkStatus,
    color: frameworkColor,
  });

  const objectionHandling = salesTechniquesData.objectionHandling;
  if (objectionHandling) {
    const { overallScore = 0, objections = [] } = objectionHandling;

    // Calculate attemptCount and successfulCount from objections array
    const attemptCount = objections.length;
    let objectionStatus =
      t?.('assessment.standings.notAvailable') || 'Not Available';
    let objectionColor = 'bg-gray-400';

    if (overallScore >= 67) {
      objectionStatus = `${t?.('assessment.standings.expert') || 'Expert'} (${overallScore}%)`;
      objectionColor = 'bg-green-600';
    } else if (overallScore >= 34) {
      objectionStatus = `${t?.('assessment.standings.intermediate') || 'Intermediate'} (${overallScore}%)`;
      objectionColor = 'bg-blue-600';
    } else if (overallScore >= 0) {
      objectionStatus = `${t?.('assessment.standings.beginner') || 'Beginner'} (${overallScore}%)`;
      objectionColor = 'bg-orange-600';
    }

    criteria.push({
      key: 'objectionHandling',
      label:
        t?.('assessment.standings.objectionHandling') || 'Objection Handling',
      status: objectionStatus,
      color: objectionColor,
    });
  }

  // Add Product Knowledge and Operational Knowledge for prudential non-cold-call sessions
  if (technicalKnowledgeData && !isColdCall) {
    const { productKnowledge, operationalKnowledge } = technicalKnowledgeData;

    // Product Knowledge
    if (productKnowledge) {
      let productKnowledgeStatus =
        t?.('assessment.standings.notAvailable') || 'Not Available';
      let productKnowledgeColor = 'bg-gray-400';

      const score = productKnowledge.overallScore;
      if (score !== null && score !== undefined) {
        if (score >= 67) {
          productKnowledgeStatus = `${t?.('assessment.standings.expert') || 'Expert'} (${score}%)`;
          productKnowledgeColor = 'bg-green-600';
        } else if (score >= 34) {
          productKnowledgeStatus = `${t?.('assessment.standings.intermediate') || 'Intermediate'} (${score}%)`;
          productKnowledgeColor = 'bg-blue-600';
        } else if (score >= 0) {
          productKnowledgeStatus = `${t?.('assessment.standings.beginner') || 'Beginner'} (${score}%)`;
          productKnowledgeColor = 'bg-orange-600';
        }
      }

      criteria.push({
        key: 'productKnowledge',
        label: t?.('assessment.productKnowledge') || 'Product Knowledge',
        status: productKnowledgeStatus,
        color: productKnowledgeColor,
      });
    }

    // Operational Knowledge
    if (operationalKnowledge) {
      let operationalKnowledgeStatus =
        t?.('assessment.standings.notAvailable') || 'Not Available';
      let operationalKnowledgeColor = 'bg-gray-400';

      const score = operationalKnowledge.overallScore;
      if (score !== null && score !== undefined) {
        if (score >= 67) {
          operationalKnowledgeStatus = `${t?.('assessment.standings.expert') || 'Expert'} (${score}%)`;
          operationalKnowledgeColor = 'bg-green-600';
        } else if (score >= 34) {
          operationalKnowledgeStatus = `${t?.('assessment.standings.intermediate') || 'Intermediate'} (${score}%)`;
          operationalKnowledgeColor = 'bg-blue-600';
        } else if (score >= 0) {
          operationalKnowledgeStatus = `${t?.('assessment.standings.beginner') || 'Beginner'} (${score}%)`;
          operationalKnowledgeColor = 'bg-orange-600';
        }
      }

      criteria.push({
        key: 'operationalKnowledge',
        label:
          t?.('assessment.operationalKnowledge') || 'Operational Knowledge',
        status: operationalKnowledgeStatus,
        color: operationalKnowledgeColor,
      });
    }
  }

  return criteria;
}

const PracticeInfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex">
    <span className="w-24 text-[14px] font-normal text-[#58595A]">{label}</span>
    <span className="ml-3 flex-1 text-[14px] font-normal text-[#161618]">
      {value}
    </span>
  </div>
);

const ActionButton = ({
  onClick,
  primary = false,
  icon,
  children,
  disabled = false,
}: {
  onClick: () => void;
  primary?: boolean;
  icon?: IconType;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center rounded-full py-2 transition-colors ${
        primary
          ? 'bg-[var(--color-primary-500)] font-normal text-white hover:bg-[var(--color-primary-500)]/80'
          : 'border border-[#D9DDE0] text-[#161618] hover:bg-[#EFEFEF]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      {icon && (
        <span className="mr-2">
          {icon === 'headphone' ? (
            <HeadphoneIcon />
          ) : icon === 'download' ? (
            <DownloadIcon />
          ) : (
            <FileIcon />
          )}
        </span>
      )}
      {children}
    </button>
  );
};

export default PrudentialSessionCard;
