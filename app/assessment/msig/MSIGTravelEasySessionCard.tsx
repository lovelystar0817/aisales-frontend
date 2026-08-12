import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { ScormCompletionDialog } from '~/components/ScormCompletionDialog';
import { StandingsModal } from '~/components/StandingsModal';
import { useLanguage } from '~/context/language';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { useTTS } from '~/hooks/useTTS';
import { formatDuration } from '~/util/api';
import { getScoreRating } from '~/util/scoreRating';
import {
  DownloadIcon,
  FileIcon,
  HeadphoneIcon,
} from '../../../public/icons/icons';

type IconType = 'headphone' | 'download' | 'file';

// Helper function to get the appropriate badge icon based on tier name
function getBadgeIcon(tierLevel: number, className?: string) {
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
        src="/icons/emerging-sales-badge.png"
        className={className}
        alt="Emerging sales badge"
      />
    );
  } else if (tierLevel === 3) {
    return (
      <img
        src="/icons/intermediate-sales-badge.png"
        className={className}
        alt="Intermediate sales badge"
      />
    );
  } else if (tierLevel === 4) {
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

// Helper function to get tier name based on overall score for MSIG TravelEasy
// Thresholds: Sales Novice (<85), Emerging Seller (85-89), Skilled Advisor (90-94), Strategic Consultant (95-100)
function getMSIGTravelEasyTierNameFromScore(score: number, t: any): string {
  if (score >= 95)
    return t('standings.strategicConsultant', 'Strategic Consultant');
  if (score >= 90) return t('standings.skilledAdvisor', 'Skilled Advisor');
  if (score >= 85) return t('standings.emergingSeller', 'Emerging Seller');
  if (score >= 0) return t('standings.salesNovice', 'Sales Novice');
  return 'Not available';
}

function getMSIGTravelEasyTierLevelFromScore(score: number): number {
  if (score >= 95) return 4;
  if (score >= 90) return 3;
  if (score >= 85) return 2;
  if (score >= 0) return 1;
  return 0;
}

const MSIGTravelEasySessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    overviewData,
    msigTravelEasySoftSkillsData,
    msigTravelEasyKnowledgeSkillsData,
    msigTravelEasyProductKnowledgeData,
    onViewTranscript,
    isAdminView,
  } = useAssessmentContext();
  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [isScoresExpanded, setIsScoresExpanded] = useState(true);
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

  const totalScores = useMemo(
    () => [
      {
        score: msigTravelEasySoftSkillsData?.overallScore,
        maxScore: msigTravelEasySoftSkillsData?.maxScore || 100,
        label: t('assessment.softSkills'),
      },
      {
        score: msigTravelEasyKnowledgeSkillsData?.overallScore,
        maxScore: msigTravelEasyKnowledgeSkillsData?.maxScore || 100,
        label: t('assessment.knowledgeSkills'),
      },
      {
        score: msigTravelEasyProductKnowledgeData?.overallScore,
        maxScore: msigTravelEasyProductKnowledgeData?.maxScore || 100,
        label: t('assessment.productKnowledge'),
      },
    ],
    [
      t,
      msigTravelEasySoftSkillsData,
      msigTravelEasyKnowledgeSkillsData,
      msigTravelEasyProductKnowledgeData,
    ],
  );

  const { overallScore, percentage } = useMemo(() => {
    const validScores = totalScores.filter(
      ({ score }) => score != null && score !== undefined,
    );

    if (validScores.length === 0) {
      return { overallScore: undefined, percentage: 0 };
    }

    const totalScore = validScores.reduce(
      (acc, { score }) => acc + (score || 0),
      0,
    );
    const totalMax = validScores.reduce(
      (acc, { maxScore }) => acc + (maxScore || 0),
      0,
    );

    // Calculate percentage for rating and tier determination
    const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

    return {
      overallScore: totalScore,
      percentage: Math.round(percentage),
    };
  }, [totalScores]);

  const isDataIncomplete =
    !totalScores[0] ||
    totalScores[0].score === null ||
    totalScores[0].score === undefined;

  // Calculate tier for MSIG TravelEasy based on percentage score
  const msigTierName = useMemo(() => {
    if (percentage !== undefined && percentage !== null) {
      if (isDataIncomplete) {
        return t('assessment.standings.notAvailable', 'Not available');
      }
      return getMSIGTravelEasyTierNameFromScore(percentage, t);
    }
    return null;
  }, [percentage, isDataIncomplete, t]);

  const msigTierLevel = useMemo(() => {
    if (percentage !== undefined && percentage !== null && !isDataIncomplete) {
      return getMSIGTravelEasyTierLevelFromScore(percentage);
    }
    return 0;
  }, [percentage, isDataIncomplete]);

  // Section scores for breakdown display
  const sectionScores = useMemo(() => {
    return totalScores.map((scoreData) => ({
      score: scoreData.score ?? 0,
      label: scoreData.label,
      status:
        scoreData.score !== null && scoreData.score !== undefined
          ? `${scoreData.score}/${scoreData.maxScore}`
          : 'Pending',
      hasFailedItem:
        scoreData.score !== null &&
        scoreData.score !== undefined &&
        scoreData.score < (scoreData.maxScore || 100) * 0.5,
      notApplicable: scoreData.score === null || scoreData.score === undefined,
      maxScore: scoreData.maxScore,
    }));
  }, [totalScores]);

  // SCORM completion handling
  const { completionStatus, dismissCompletion } = useScormCompletion({
    overallScore,
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

      // Overview section
      if (overviewData?.summary) {
        const overviewText = t('assessment.audioFeedback.overview', {
          summary: overviewData.summary,
        });
        feedbackSections.push(overviewText);

        if (overviewData.suggestedNextSteps?.length > 0) {
          const nextStepsText = t('assessment.audioFeedback.nextSteps', {
            steps: overviewData.suggestedNextSteps.join(', '),
          });
          feedbackSections.push(nextStepsText);
        }
      }

      // MSIG Soft Skills section
      if (msigTravelEasySoftSkillsData) {
        feedbackSections.push(
          t('assessment.audioFeedback.softSkillsIntro', {
            score: msigTravelEasySoftSkillsData.overallScore,
            max: msigTravelEasySoftSkillsData.maxScore || 100,
          }),
        );

        if (msigTravelEasySoftSkillsData.description) {
          feedbackSections.push(msigTravelEasySoftSkillsData.description);
        }

        // Include individual section feedback
        if (
          msigTravelEasySoftSkillsData.sections &&
          msigTravelEasySoftSkillsData.sections.length > 0
        ) {
          msigTravelEasySoftSkillsData.sections.forEach((section: any) => {
            let sectionText = t('assessment.audioFeedback.softSkillsSection', {
              title: section.title,
              score: section.score,
              max: section.maxScore || 25,
            });

            if (section.strengths?.length > 0) {
              sectionText +=
                ' ' +
                t('assessment.audioFeedback.strengths', {
                  strengths: section.strengths.join(', '),
                });
            }

            if (section.toImprove?.length > 0) {
              const improvements = section.toImprove
                .map((item: any) => item.text || item)
                .join(', ');
              sectionText +=
                ' ' +
                t('assessment.audioFeedback.toImprove', {
                  improvements: improvements,
                });
            }

            feedbackSections.push(sectionText);
          });
        }
      }

      // MSIG Knowledge Skills section
      if (msigTravelEasyKnowledgeSkillsData) {
        feedbackSections.push(
          t('assessment.audioFeedback.knowledgeSkillsIntro', {
            score: msigTravelEasyKnowledgeSkillsData.overallScore,
            max: msigTravelEasyKnowledgeSkillsData.maxScore || 100,
          }),
        );

        if (msigTravelEasyKnowledgeSkillsData.description) {
          feedbackSections.push(msigTravelEasyKnowledgeSkillsData.description);
        }

        // Include individual section feedback
        if (
          msigTravelEasyKnowledgeSkillsData.sections &&
          msigTravelEasyKnowledgeSkillsData.sections.length > 0
        ) {
          msigTravelEasyKnowledgeSkillsData.sections.forEach((section: any) => {
            let sectionText = t(
              'assessment.audioFeedback.knowledgeSkillsSection',
              {
                title: section.title,
                score: section.score,
                max: section.maxScore || 25,
              },
            );

            if (section.why) {
              sectionText += ' ' + t('assessment.why') + ': ' + section.why;
            }

            if (section.suggestion) {
              sectionText +=
                ' ' + t('assessment.suggestion') + ': ' + section.suggestion;
            }

            feedbackSections.push(sectionText);
          });
        }
      }

      // MSIG Product Knowledge section
      if (msigTravelEasyProductKnowledgeData) {
        feedbackSections.push(
          t('assessment.audioFeedback.productKnowledgeIntro', {
            score: msigTravelEasyProductKnowledgeData.overallScore,
            max: msigTravelEasyProductKnowledgeData.maxScore || 100,
          }),
        );

        if (msigTravelEasyProductKnowledgeData.description) {
          feedbackSections.push(msigTravelEasyProductKnowledgeData.description);
        }

        // Include individual section feedback
        if (
          msigTravelEasyProductKnowledgeData.sections &&
          msigTravelEasyProductKnowledgeData.sections.length > 0
        ) {
          msigTravelEasyProductKnowledgeData.sections.forEach(
            (section: any) => {
              let sectionText = t(
                'assessment.audioFeedback.productKnowledgeSection',
                {
                  title: section.title,
                  score: section.score,
                  max: section.maxScore || 100,
                },
              );

              if (section.why) {
                sectionText += ' ' + t('assessment.why') + ': ' + section.why;
              }

              if (section.suggestion) {
                sectionText +=
                  ' ' + t('assessment.suggestion') + ': ' + section.suggestion;
              }

              feedbackSections.push(sectionText);
            },
          );
        }
      }

      if (feedbackSections.length > 0) {
        const separator = language === 'th' ? ', ' : '. ';
        const fullFeedbackText = feedbackSections.join(separator);
        // Use traditional playAudio for Thai language, streaming for others
        if (language === 'th') {
          playAudio(fullFeedbackText);
        } else {
          playStreamingAudio(fullFeedbackText);
        }
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

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-6 rounded-2xl bg-white p-4 lg:w-[300px]">
        {/* MSIG Standing Progress Section */}
        <section className="col-span-2 w-full space-y-4 pt-4 md:col-span-1 lg:col-span-2">
          <div className="flex items-start gap-4">
            {getBadgeIcon(msigTierLevel, 'h-16 w-16')}
            <div>
              <p className="text-sm text-gray-500">
                {t('assessment.standings.currentSession')}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {msigTierName ||
                  t('assessment.standings.notAvailable', 'Not Available')}
              </p>
              <div>
                {/* MSIG Overall Score under standing */}
                <div className="mt-2">
                  <div className="flex items-center gap-3">
                    {!isDataIncomplete ? (
                      <>
                        <div className="flex rounded-full border border-gray-200 px-2 py-1">
                          <p className="text-sm text-gray-500">
                            {t('assessment.sessionScore', 'Session score')}:
                          </p>
                          <span className="ml-1 text-sm font-bold">
                            {overallScore}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1">
                        <div className="h-3 w-16 rounded bg-gray-200"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 w-full space-y-2 pt-4 md:col-span-1 lg:col-span-2">
                  <button
                    onClick={() => setIsScoresExpanded(!isScoresExpanded)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h4 className="mb-[2px] text-sm text-gray-500">
                      {t('common.viewBreakdown')}
                    </h4>
                    {isScoresExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  {isScoresExpanded && (
                    <div className="space-y-2">
                      <ul className="space-y-2">
                        {sectionScores.map((sectionScore, index) => (
                          <ScoreIndicatorItem
                            key={index}
                            score={
                              (sectionScore.score / sectionScore.maxScore) * 100
                            }
                            label={sectionScore.label}
                            status={sectionScore.status}
                            hasFailedItem={sectionScore.hasFailedItem}
                            notApplicable={sectionScore.notApplicable}
                          />
                        ))}
                      </ul>
                      {sectionScores.length === 0 && (
                        <p className="text-[12px] text-gray-500">
                          Section scores will appear as assessment generates...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Learn more */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              {t('assessment.standings.seeHowStandingsWork')}{' '}
              <button
                className="font-medium text-blue-600 hover:underline"
                onClick={() => setIsStandingsModalOpen(true)}
              >
                {t('common.learnMore')}
              </button>
            </p>
          </div>
        </section>
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

      {/* Standings Modal */}
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        sessionId={session?._id}
        personaId={session?.persona?._id}
        moduleId={session?.module?._id}
        productId={session?.product?._id}
        context="session"
      />
    </>
  );
};

const ScoreIndicatorItem = ({
  score,
  label,
  status,
  hasFailedItem,
  notApplicable,
}: {
  score: number;
  label: string;
  status?: string;
  hasFailedItem?: boolean;
  notApplicable?: boolean;
}) => {
  const { color } = getScoreRating(score, false);

  // Use gray color for not applicable sections
  const indicatorColor = notApplicable
    ? '#9CA3AF'
    : hasFailedItem
      ? '#E60D00'
      : color;
  const textColor = notApplicable ? 'text-gray-400' : 'text-[#161618]';

  return (
    <li className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <span
          className="inline-block h-3 w-1 rounded-full bg-gray-200"
          aria-hidden="true"
        />
        <span className={`text-[14px] font-normal ${textColor}`}>{label}</span>
      </div>
      <div className={`text-[14px] font-normal ${textColor}`}>
        <div className="flex items-center gap-2">
          <div
            className="ml-3 size-2 rounded-full"
            style={{ backgroundColor: indicatorColor }}
          />
          {notApplicable ? '-' : status}
        </div>
      </div>
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

export default MSIGTravelEasySessionCard;
