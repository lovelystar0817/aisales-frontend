import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Circle } from '~/components/Circle';
import { getScoreRating } from '~/util/scoreRating';
import {
  HeadphoneIcon,
  DownloadIcon,
  FileIcon,
} from '../../../public/icons/icons';
import { useTTS } from '~/hooks/useTTS';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { ScormCompletionDialog } from '~/components/ScormCompletionDialog';
import { formatDuration } from '~/util/api';
import { useLanguage } from '~/context/language';

type IconType = 'headphone' | 'download' | 'file';

const HSBCSessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    overviewData,
    productKnowledgeData,
    hsbcRelationshipManagementData,
    hsbcProcessAdherenceData,
    hsbcRepresentationData,
    hsbcCommunicationAndPresenceData,
    hsbcAdvisoryTechniqueData,
    onViewTranscript,
    isAdminView,
  } = useAssessmentContext();
  
  const isPortfolioReview = session?.product?.friendlyId === 'hsbc-portfolio-review';
  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const { apiClient } = useAssessmentContext();

  // New session mutation
  const { mutate: startNewSession } = useMutation({
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
      navigate(`/roleplay/${response.sessionId}`);
    },
    onError(error) {
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

  const totalScores = useMemo(() => {
    const scores = [
      {
        score: hsbcRelationshipManagementData?.overallScore || hsbcAdvisoryTechniqueData?.overallScore,
        label: t('assessment.relationshipManagement'),
      },
      {
        score: hsbcProcessAdherenceData?.overallScore,
        label: t('assessment.processAdherence'),
      },
      {
        score: hsbcRepresentationData?.overallScore,
        label: t('assessment.hsbcRepresentation'),
      },
      {
        score: hsbcCommunicationAndPresenceData?.overallScore,
        label: t('assessment.communicationAndPresence'),
      },
    ];

    return scores;
  }, [
    t,
    hsbcRelationshipManagementData,
    hsbcAdvisoryTechniqueData,
    hsbcProcessAdherenceData,
    hsbcRepresentationData,
    hsbcCommunicationAndPresenceData,
  ]);

  const { overallScore, status } = useMemo(() => {
    const validScores = totalScores.filter(
      ({ score }) => score != null && score !== undefined,
    );

    if (validScores.length === 0) {
      return { overallScore: undefined, status: undefined };
    }

    const score =
      validScores.reduce((acc, { score }) => acc + (score || 0), 0) /
      validScores.length;
    const { rating } = getScoreRating(score);

    return { overallScore: Math.round(score), status: t(rating) };
  }, [totalScores, t]);

  // SCORM completion handling
  const { completionStatus, dismissCompletion } = useScormCompletion({
    overallScore,
    sessionId,
  });

  const {
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
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-report-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
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

  // Helper function to build section feedback with strengths and improvements
  const buildSectionFeedback = (
    section: any,
    baseKey: string,
    defaultMaxScore: number,
  ): string => {
    const base = t(baseKey, {
      title: section.title,
      score: section.score,
      max: section.maxScore || defaultMaxScore,
    });

    const parts: string[] = [base];

    if (section.strengths?.length > 0) {
      parts.push(
        t('assessment.audioFeedback.strengths', {
          strengths: section.strengths.join(', '),
        }),
      );
    }

    if (section.toImprove?.length > 0) {
      const improvements = section.toImprove
        .map((item: any) => item.text || item)
        .join(', ');
      parts.push(
        t('assessment.audioFeedback.toImprove', { improvements }),
      );
    }

    return parts.join(' ');
  };

  // Helper function to build sections with strengths and improvements
  const buildSectionsWithStrengths = (
    sections: any[],
    baseKey: string,
    defaultMaxScore: number,
  ): string[] => {
    return sections.map((section) =>
      buildSectionFeedback(section, baseKey, defaultMaxScore),
    );
  };

  // Helper function to add overview feedback
  const addOverviewFeedback = (sections: string[]) => {
    if (!overviewData?.summary) return;

    sections.push(
      t('assessment.audioFeedback.overview', {
        summary: overviewData.summary,
      }),
    );

    if (overviewData.suggestedNextSteps?.length > 0) {
      sections.push(
        t('assessment.audioFeedback.nextSteps', {
          steps: overviewData.suggestedNextSteps.join(', '),
        }),
      );
    }
  };

  // Helper function to add relationship management feedback
  const addRelationshipFeedback = (sections: string[]) => {
    const relationshipData = hsbcRelationshipManagementData || hsbcAdvisoryTechniqueData;
    if (!relationshipData) return;

    sections.push(
      t('assessment.audioFeedback.relationshipManagementIntro', {
        score: relationshipData.overallScore,
        max: relationshipData.maxScore || 100,
      }),
    );

    if (relationshipData.description) {
      sections.push(relationshipData.description);
    }

    if (relationshipData.sections?.length > 0) {
      relationshipData.sections.forEach((section) => {
        sections.push(
          t('assessment.audioFeedback.advisoryTechniqueSection', {
            title: section.title,
            score: section.score,
            max: section.maxScore || 20,
            why: section.why || '',
            suggestion: section.suggestion || '',
          }),
        );
      });
    }
  };

  // Helper function to add process adherence feedback
  const addProcessAdherenceFeedback = (sections: string[]) => {
    if (!hsbcProcessAdherenceData) return;

    sections.push(
      t('assessment.audioFeedback.processAdherenceIntro', {
        score: hsbcProcessAdherenceData.overallScore,
        max: hsbcProcessAdherenceData.maxScore || 100,
      }),
    );

    if (hsbcProcessAdherenceData.description) {
      sections.push(hsbcProcessAdherenceData.description);
    }

    if (hsbcProcessAdherenceData.sections?.length > 0) {
      sections.push(
        ...buildSectionsWithStrengths(
          hsbcProcessAdherenceData.sections as any[],
          'assessment.audioFeedback.processAdherenceSectionBase',
          25,
        ),
      );
    }
  };

  // Helper function to add representation feedback
  const addRepresentationFeedback = (sections: string[]) => {
    if (!hsbcRepresentationData) return;

    sections.push(
      t('assessment.audioFeedback.hsbcRepresentationIntro', {
        score: hsbcRepresentationData.overallScore,
        max: hsbcRepresentationData.maxScore || 100,
      }),
    );

    if (hsbcRepresentationData.description) {
      sections.push(hsbcRepresentationData.description);
    }

    if (hsbcRepresentationData.why) {
      sections.push(
        t('assessment.audioFeedback.representationWhy', {
          why: hsbcRepresentationData.why,
        }),
      );
    }

    if (hsbcRepresentationData.suggestion) {
      sections.push(
        t('assessment.audioFeedback.representationSuggestion', {
          suggestion: hsbcRepresentationData.suggestion,
        }),
      );
    }
  };

  // Helper function to add communication and presence feedback
  const addCommunicationFeedback = (sections: string[]) => {
    if (!hsbcCommunicationAndPresenceData) return;

    sections.push(
      t('assessment.audioFeedback.communicationAndPresenceIntro', {
        score: hsbcCommunicationAndPresenceData.overallScore,
        max: hsbcCommunicationAndPresenceData.maxScore || 100,
      }),
    );

    if (hsbcCommunicationAndPresenceData.description) {
      sections.push(hsbcCommunicationAndPresenceData.description);
    }

    if (hsbcCommunicationAndPresenceData.sections?.length > 0) {
      sections.push(
        ...buildSectionsWithStrengths(
          hsbcCommunicationAndPresenceData.sections as any[],
          'assessment.audioFeedback.communicationAndPresenceSectionBase',
          50,
        ),
      );
    }
  };

  // Helper function to add product knowledge feedback
  const addProductKnowledgeFeedback = (sections: string[]) => {
    if (!isPortfolioReview || !productKnowledgeData) return;

    sections.push(
      t('assessment.audioFeedback.productKnowledgeIntro', {
        score: productKnowledgeData.overallScore,
        max: productKnowledgeData.maxScore || 100,
      }),
    );

    if (productKnowledgeData.description) {
      sections.push(productKnowledgeData.description);
    }

    if (productKnowledgeData.sections && productKnowledgeData.sections.length > 0) {
      sections.push(
        ...buildSectionsWithStrengths(
          productKnowledgeData.sections as any[],
          'assessment.audioFeedback.productKnowledgeSectionBase',
          50,
        ),
      );
    }
  };

  const handleListenToFeedback = () => {
    if (isAudioPlaying) {
      stopAudio();
      return;
    }

    const feedbackSections: string[] = [];

    addOverviewFeedback(feedbackSections);
    addRelationshipFeedback(feedbackSections);
    addProcessAdherenceFeedback(feedbackSections);
    addRepresentationFeedback(feedbackSections);
    addCommunicationFeedback(feedbackSections);
    addProductKnowledgeFeedback(feedbackSections);

    if (feedbackSections.length > 0) {
      const separator = language === 'th' ? ', ' : '. ';
      const fullFeedbackText = feedbackSections.join(separator);
      playStreamingAudio(fullFeedbackText);
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

    startNewSession({
      personaId,
      callType,
      productId,
    });
  };

  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  const isDataIncomplete = !totalScores[0]?.score;

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-4 space-y-6 rounded-2xl bg-white p-4 lg:w-[300px]">
        <header className="col-span-2 flex w-full items-start space-x-6 md:col-span-1 lg:col-span-2">
          {isDataIncomplete ? (
            <div className="relative">
              <div className="h-20 w-20 animate-pulse rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute top-1/2 left-1/2 h-15 w-15 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            </div>
          ) : (
            <div
              className="relative"
              aria-label={`Overall score: ${overallScore}`}
            >
              <Circle
                value={overallScore || 0}
                color={getScoreRating(overallScore || 0).color}
                bgColor="var(--color-gray-100)"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[20px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1 pl-4">
            <p className="text-[14px] leading-[20px] tracking-[-0.6%] text-[#58595A]">
              {t('assessment.overallScore')}
            </p>
            {isDataIncomplete ? (
              <div className="mt-2 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ) : (
              <div>
                <h3 className="mb-2 text-[20px] font-[700]">{status}</h3>
                <ul className="space-y-2">
                  {totalScores.map((scoreItem, index) => (
                    scoreItem.score != null && scoreItem.score !== undefined && (
                      <ScoreIndicator
                        key={scoreItem.label}
                        score={scoreItem.score}
                        label={scoreItem.label}
                      />
                    )
                  ))}
                </ul>
              </div>
            )}
          </div>
        </header>
        <section className="col-span-2 w-full space-y-2 pt-4 md:col-span-1 lg:col-span-2">
          <h4 className="text-[14px] font-bold text-[#161618]">
            {t('assessment.practiceInfo')}
          </h4>
          <PracticeInfoItem
            label={t('assessment.type')}
            value={practiceInfo.type}
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
            {t('assessment.viewTranscript', 'View transcript')}
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

const ScoreIndicator = ({
  score,
  label,
  isSecondary = false,
}: {
  score: number;
  label: string;
  isSecondary?: boolean;
}) => {
  const { color } = getScoreRating(score, isSecondary);

  return (
    <li className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <span
          className="inline-block h-3 w-1 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-[14px] font-normal text-[#161618]">{label}</span>
      </div>
      <span className="text-[14px] font-normal text-[#161618]">
        {score} {/* Display exact score value */}
        <span className="text-[#58595A]"> / 100</span>
      </span>
    </li>
  );
};

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
          {icon === 'headphone' && (
            <HeadphoneIcon />
          )}
          {icon === 'download' && (
            <DownloadIcon />
          )}
          {icon === 'file' && (
            <FileIcon />
          )}
        </span>
      )}
      {children}
    </button>
  );
};

export default HSBCSessionCard;