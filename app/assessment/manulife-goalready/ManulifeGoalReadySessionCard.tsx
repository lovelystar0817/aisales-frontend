import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import IntermediateSalesBadgePng from '../../../public/icons/intermediate-sales-badge.png';
import ExpertSalesBadgePng from '../../../public/icons/expert-sales-badge.png';
import NotAvailableBadgePng from '../../../public/icons/not-available-sales-badge.png';
import { HeadphoneIcon, FileIcon } from '../../../public/icons/icons';
import { useTTS } from '~/hooks/useTTS';
import { apiProtected, formatDuration } from '~/util/api';
import { StandingsModal } from '~/components/StandingsModal';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon } from 'lucide-react';
import { useAssessmentContext } from '../shared/AssessmentContext';
import {
  MANULIFE_GOALREADY_SECTION_ORDER,
  calculateGoalReadyTotalScore,
  calculateGoalReadyMaxScore,
  getGoalReadyTierFromScore,
  isGoalReadyAssessmentComplete,
  getScoreColor,
} from '~/util/manulife-goalready';
import type { ManulifeGoalReadyAssessmentData } from '~/assessment/types';
import { CircularProgressChart } from './CircularProgressChart';

type IconType = 'headphone' | 'file' | 'download';

// Helper function to get the appropriate badge icon based on tier name
export function getBadgeIcon(tierName?: string | null, className?: string) {
  if (!tierName) {
    return (
      <img
        src={NotAvailableBadgePng}
        className={className}
        alt="Not available badge"
      />
    );
  }

  const lowerTierName = tierName.toLowerCase();

  if (lowerTierName.includes('failed')) {
    return (
      <img
        src={NotAvailableBadgePng}
        className={className}
        alt="Not available badge"
      />
    );
  } else if (lowerTierName.includes('pass')) {
    return (
      <img
        src={IntermediateSalesBadgePng}
        className={className}
        alt="Competent advisor badge"
      />
    );
  } else if (lowerTierName.includes('champion')) {
    return (
      <img
        src={ExpertSalesBadgePng}
        className={className}
        alt="Expert advisor badge"
      />
    );
  } else {
    return (
      <img
        src={NotAvailableBadgePng}
        className={className}
        alt="Not available badge"
      />
    );
  }
}

const PracticeInfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex gap-[16px] items-center">
    <span className="w-[86px] text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
      {label}
    </span>
    <span className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#161618]">
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
      className={`flex h-[40px] w-full items-center justify-center gap-[8px] rounded-[9999px] px-[24px] text-[14px] font-normal leading-[20px] tracking-[-0.084px] transition-colors ${
        primary
          ? 'bg-[#FF4B0A] text-white hover:bg-[#FF4B0A]/90'
          : 'border border-[#D9DDE0] bg-white text-[#161618] hover:bg-[#F6F8F8]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      {icon && (
        <div className="size-[16px] shrink-0">
          {icon === 'headphone' ? (
            <HeadphoneIcon className="size-4" />
          ) : icon === 'download' ? (
            <DownloadIcon className="size-4" />
          ) : (
            <FileIcon className="size-4" />
          )}
        </div>
      )}
      {children}
    </button>
  );
};

export function ManulifeGoalReadySessionCard({
  goalReadyData,
}: {
  goalReadyData: ManulifeGoalReadyAssessmentData | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    session,
    onViewTranscript,
    apiClient,
    isAdminView,
  } = useAssessmentContext();
  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [isScoresExpanded, setIsScoresExpanded] = useState(true);

  // Calculate overall score
  const overallScore = useMemo(() => {
    return calculateGoalReadyTotalScore(goalReadyData);
  }, [goalReadyData]);

  const maxScore = calculateGoalReadyMaxScore();

  // Check if data is complete
  const isDataComplete = useMemo(() => {
    return isGoalReadyAssessmentComplete(goalReadyData);
  }, [goalReadyData]);

  // Calculate tier
  const tierName = useMemo(() => {
    if (!isDataComplete) {
      return t('assessment.standings.notAvailable', 'Not available');
    }
    return getGoalReadyTierFromScore(overallScore);
  }, [overallScore, isDataComplete, t]);

  // Section scores for display
  const sectionScores = useMemo(() => {
    if (!goalReadyData) return [];

    return MANULIFE_GOALREADY_SECTION_ORDER.map((sectionDef) => {
      const sectionData = goalReadyData[sectionDef.key];
      return {
        label: sectionDef.title,
        score: sectionData?.score || 0,
        maxScore: sectionDef.maxScore,
      };
    });
  }, [goalReadyData]);

  // New session mutation
  const { mutate: startNewSession, isPending: isStartingNewSession } =
    useMutation({
      mutationFn: async ({
        personaId,
        moduleId,
        productId,
      }: {
        personaId: string;
        moduleId: string;
        productId: string;
      }) => {
        return apiProtected()
          .url('/sessions')
          .post({ personaId, moduleId, productId })
          .json<any>();
      },
      onSuccess(response) {
        console.log('New session created:', response.sessionId);
        navigate(`/roleplay/${response.sessionId}`);
      },
      onError(error) {
        console.error('Failed to create new session:', error);
        toast.error(t('assessment.errors.failedToStartNewSession'));
      },
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
    onSuccess(blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assessment-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('assessment.pdfDownloadSuccess'));
    },
    onError(error) {
      console.error('Failed to download PDF:', error);
      toast.error(t('assessment.errors.failedToDownloadPDF'));
    },
  });

  // SCORM completion handling
  useScormCompletion({
    overallScore,
    sessionId,
  });

  // Feedback TTS
  const {
    playStreamingAudio,
    stopAudio,
    isLoading: isTTSLoading,
  } = useTTS({
    setIsAISpeaking: setIsAudioPlaying,
    onPlaybackComplete: () => setIsAudioPlaying(false),
  });

  const handlePracticeAgain = () => {
    if (session?.persona?._id && session?.module?._id && session?.product?._id) {
      startNewSession({
        personaId: session.persona._id,
        moduleId: session.module._id,
        productId: session.product._id,
      });
    }
  };

  const handleListenToFeedback = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      const feedbackSections: string[] = [];

      // Overall feedback
      if (goalReadyData?.overallFeedback) {
        feedbackSections.push(
          t('assessment.audioFeedback.goalReadyOverallFeedback', {
            feedback: goalReadyData.overallFeedback,
          }),
        );
      }

      // Suggested next steps
      if (goalReadyData?.nextSteps && goalReadyData.nextSteps.length > 0) {
        feedbackSections.push(
          t('assessment.audioFeedback.goalReadyNextSteps', {
            steps: goalReadyData.nextSteps.join(', '),
          }),
        );
      }

      // Sales & Negotiation Skills
      const salesSection = goalReadyData?.salesAndNegotiationSkills;
      if (salesSection) {
        salesSection.subsections?.forEach((sub) => {
          feedbackSections.push(
            t('assessment.audioFeedback.goalReadySubsection', {
              title: sub.title,
              score: sub.score,
              max: sub.maxScore,
              why: sub.why || '',
              suggestion: sub.suggestion || '',
            }),
          );
        });
      }

      // Soft Skills
      const softSection = goalReadyData?.softSkills;
      if (softSection) {
        feedbackSections.push(
          t('assessment.audioFeedback.goalReadySectionGroupIntro', {
            title: softSection.title,
            score: softSection.score,
            max: softSection.maxScore,
          }),
        );
        softSection.subsections?.forEach((sub) => {
          feedbackSections.push(
            t('assessment.audioFeedback.goalReadySubsection', {
              title: sub.title,
              score: sub.score,
              max: sub.maxScore,
              why: sub.why || '',
              suggestion: sub.suggestion || '',
            }),
          );
        });
      }

      // Product Knowledge
      const productSection = goalReadyData?.productKnowledge;
      if (productSection) {
        productSection.subsections?.forEach((sub) => {
          feedbackSections.push(
            t('assessment.audioFeedback.goalReadySubsection', {
              title: sub.title,
              score: sub.score,
              max: sub.maxScore,
              why: sub.why || '',
              suggestion: sub.suggestion || '',
            }),
          );

          // Strengths
          if (sub.strengths && sub.strengths.length > 0) {
            feedbackSections.push(
              t('assessment.audioFeedback.goalReadyProductPitchStrengths', {
                strengths: sub.strengths.join(', '),
              }),
            );
          }

          // Warnings (text only, no correction)
          sub.toImprove
            ?.filter((s) => s.status === 'warning')
            .forEach((warning) => {
              feedbackSections.push(
                t('assessment.audioFeedback.goalReadyProductPitchWarning', {
                  text: warning.text,
                }),
              );
            });

          // Incorrect (with correction)
          sub.toImprove
            ?.filter((s) => s.status === 'error')
            .forEach((incorrect) => {
              feedbackSections.push(
                t('assessment.audioFeedback.goalReadyProductPitchIncorrect', {
                  text: incorrect.text,
                  correction: incorrect.correction,
                }),
              );
            });
        });
      }

      if (feedbackSections.length > 0) {
        playStreamingAudio(feedbackSections.join('. '));
      }
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="sticky top-4 flex w-full flex-col gap-[24px] rounded-[12px] bg-white p-[16px] shadow-sm lg:w-[302px]">
        {/* Overall Result with Circular Chart */}
        <div className="flex items-start gap-[20px]">
          {/* Circular Progress Chart */}
          <div className="shrink-0">
            <CircularProgressChart score={overallScore} maxScore={maxScore} />
          </div>

          {/* Overall Result Text */}
          <div className="flex flex-1 flex-col gap-[12px]">
            <div className="flex flex-col">
              <span className="text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                Overall result
              </span>
              <span className="text-[20px] font-bold leading-[28px] tracking-[-0.3px] text-[#161618]">
                {tierName}
              </span>
            </div>

            {/* Section Scores Breakdown */}
            {isScoresExpanded && (
              <div className="flex flex-col gap-[8px]">
                {sectionScores.map((section, idx) => (
                  <div key={idx} className="flex flex-col gap-[2px]">
                    <div className="flex items-center gap-[8px]">
                      <div className="h-[20px] w-0 border-l-[2px] border-[#D9DDE0]" />
                      <span className="flex-1 text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-[8px] pl-[8px]">
                      <div
                        className="size-[8px] shrink-0 rounded-full"
                        style={{ backgroundColor: getScoreColor(section.score, section.maxScore) }}
                      />
                      <span className="text-[14px] font-normal leading-[20px] tracking-[-0.084px]">
                        <span className="text-[#161618]">{section.score}</span>
                        <span className="text-[#7e7f81]"> / {section.maxScore}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Toggle Breakdown */}
            <button
              type="button"
              onClick={() => setIsScoresExpanded(!isScoresExpanded)}
              className="flex items-center gap-[4px]"
            >
              <span className="text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                {isScoresExpanded ? 'Hide breakdown' : 'Show breakdown'}
              </span>
              <div className="size-[20px]">
                {isScoresExpanded ? (
                  <ChevronUpIcon className="size-5 text-[#58595A]" />
                ) : (
                  <ChevronDownIcon className="size-5 text-[#58595A]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Practice Info */}
        <div className="flex flex-col gap-[8px]">
          <h3 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
            Practice info
          </h3>
          <div className="flex flex-col gap-[8px]">
            <PracticeInfoItem
              label={t('assessment.scenario')}
              value={t('assessment.productPitch')}
            />
            <PracticeInfoItem
              label={t('assessment.product')}
              value="Goal Ready"
            />
            <PracticeInfoItem
              label={t('assessment.client')}
              value={session.persona?.name || '-'}
            />
            <PracticeInfoItem
              label={t('assessment.completed')}
              value={
                session.endedAt
                  ? format(new Date(session.endedAt), 'd MMM yyyy')
                  : '-'
              }
            />
            <PracticeInfoItem
              label={t('assessment.duration')}
              value={session.roleplay?.duration ? formatDuration(session.roleplay.duration) : '-'}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-[12px]">
          {!isAdminView && (
            <ActionButton
              onClick={handlePracticeAgain}
              primary
              disabled={isStartingNewSession}
            >
              {isStartingNewSession
                ? t('assessment.startingSession')
                : t('assessment.practiceAgain')}
            </ActionButton>
          )}

          <ActionButton onClick={onViewTranscript} icon="file">
            {t('assessment.viewTranscript')}
          </ActionButton>
          <ActionButton
            onClick={handleListenToFeedback}
            icon="headphone"
            disabled={isTTSLoading || !goalReadyData?.overallFeedback}
          >
            {isTTSLoading
              ? t('common.loading')
              : isAudioPlaying
                ? t('assessment.stopListening')
                : t('assessment.listenToFeedback')}
          </ActionButton>
          <ActionButton
            onClick={() => downloadPDF()}
            icon="download"
            disabled={isDownloadingPDF}
          >
            {isDownloadingPDF
              ? t('assessment.downloading')
              : t('assessment.downloadAsPdf')}
          </ActionButton>
        </div>
      </div>

      {/* Standings Modal */}
      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
      />
    </>
  );
}
