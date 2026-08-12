import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext'
import type { PrudentialPHAppointmentSettingSection } from '~/assessment/types'
import { Circle } from '~/components/Circle'
import { ScormCompletionDialog } from '~/components/ScormCompletionDialog'
import { useLanguage } from '~/context/language'
import { useScormCompletion } from '~/hooks/useScormCompletion'
import { useTTS } from '~/hooks/useTTS'
import { formatDuration } from '~/util/api'
import { getScoreRating } from '~/util/scoreRating'
import {
  DownloadIcon,
  FileIcon,
  HeadphoneIcon,
} from '../../../public/icons/icons'

type IconType = 'headphone' | 'download' | 'file';

const PrudentialPHAppointmentSettingSessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    prudentialPHAppointmentSettingData,
    onViewTranscript,
    isAdminView,
    apiClient,
  } = useAssessmentContext();

  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

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
      product: session?.product?.name ?? '',
      client:
        (session?.persona?.name ?? '') +
        ', ' +
        (session?.persona?.occupation ?? ''),
      completedAt: session?.endedAt
        ? format(new Date(session.endedAt), 'dd MMM yyyy')
        : '',
      duration: session?.roleplay?.duration
        ? formatDuration(session.roleplay.duration)
        : '',
    }),
    [session],
  );

  const overallScore = prudentialPHAppointmentSettingData?.overallScore;
  const maxScore = useMemo(() => {
    if (!prudentialPHAppointmentSettingData?.sections) return 100;
    return prudentialPHAppointmentSettingData.sections
      .filter((s: PrudentialPHAppointmentSettingSection) => !s.isMandatory)
      .reduce(
        (sum: number, s: PrudentialPHAppointmentSettingSection) =>
          sum + s.maxScore,
        0,
      );
  }, [prudentialPHAppointmentSettingData]);

  const overallCriteria = useMemo(() => {
    if (!prudentialPHAppointmentSettingData?.overallScore) return null;
    let statusLabel = t('assessment.standings.beginner', 'Beginner');
    let color = 'bg-orange-600';
    if (prudentialPHAppointmentSettingData.overallScore >= 67) {
      statusLabel = t('assessment.standings.expert', 'Expert');
      color = 'bg-green-600';
    } else if (prudentialPHAppointmentSettingData.overallScore >= 34) {
      statusLabel = t('assessment.standings.intermediate', 'Intermediate');
      color = 'bg-blue-600';
    }
    return {
      status: statusLabel,
      color,
    }
  }, [prudentialPHAppointmentSettingData]);

  const sectionCriteria = useMemo(() => {
    if (!prudentialPHAppointmentSettingData?.sections) return [];
    return prudentialPHAppointmentSettingData.sections.map(
      (section: PrudentialPHAppointmentSettingSection) => {
        if (section.isMandatory) {
          return {
            key: section.title,
            label: section.title,
            status: section.passed
              ? t('assessment.standings.completed')
              : t('assessment.standings.notCompleted'),
            color: section.passed ? 'bg-green-600' : 'bg-red-600',
            score: 0,
            maxScore: 0,
          };
        }
        const percentage =
          section.maxScore > 0
            ? Math.round((section.score / section.maxScore) * 100)
            : 0;
        let statusLabel = t('assessment.standings.beginner', 'Beginner');
        let color = 'bg-orange-600';
        if (percentage >= 67) {
          statusLabel = t('assessment.standings.expert', 'Expert');
          color = 'bg-green-600';
        } else if (percentage >= 34) {
          statusLabel = t('assessment.standings.intermediate', 'Intermediate');
          color = 'bg-blue-600';
        }
        return {
          key: section.title,
          label: section.title,
          status: `${statusLabel} (${percentage}%)`,
          score: section.score,
          maxScore: section.maxScore,
          color,
        };
      },
    );
  }, [prudentialPHAppointmentSettingData, t]);

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
      const feedbackSections: string[] = [];

      // Overall feedback
      if (prudentialPHAppointmentSettingData?.overallFeedback) {
        feedbackSections.push(prudentialPHAppointmentSettingData.overallFeedback);
      }

      // Next steps
      if (
        prudentialPHAppointmentSettingData?.nextSteps &&
        prudentialPHAppointmentSettingData.nextSteps.length > 0
      ) {
        feedbackSections.push(
          t('assessment.nextSteps', 'Next Steps') + ': ' +
            prudentialPHAppointmentSettingData.nextSteps.join(', '),
        );
      }

      // Section-by-section feedback
      if (prudentialPHAppointmentSettingData?.sections) {
        for (const section of prudentialPHAppointmentSettingData.sections) {
          if (section.isMandatory) {
            feedbackSections.push(
              `${section.title}: ${section.passed ? t('assessment.standings.completed') : t('assessment.standings.notCompleted')}.`,
            );
          }

          if (section.why && section.suggestion) {
            feedbackSections.push(t('assessment.audioFeedback.advisoryTechniqueSection', {
              title: section.title,
              score: section.score * 2,
              max: (section.maxScore || 50) * 2,
              why: section.why || '',
              suggestion: section.suggestion || '',
            }));
          } else {
            if (!section.isMandatory) {
              feedbackSections.push(
                t(section.title === 'Client Verification' ? 'assessment.audioFeedback.clientVerificationIntro' : 'assessment.audioFeedback.objectionHandlingIntro', {
                  score: section.score * 2,
                  max: (section.maxScore || 50) * 2,
                }),
              );
            }
            if (section.feedback) {
              feedbackSections.push(section.feedback);
            }
            if (section.strengths && section.strengths.length > 0) {
              feedbackSections.push(
                t('assessment.audioFeedback.strengths', {
                  strengths: section.strengths.join(', '),
                }),
              );
            }

            if (section.improvements && section.improvements.length > 0) {
              feedbackSections.push(
                t('assessment.audioFeedback.toImprove', {
                  improvements: section.improvements.join(', '),
                }),
              );
            }
          }

        }
      }

      if (feedbackSections.length > 0) {
        const separator = language === 'th' ? ', ' : '. ';
        const fullFeedbackText = feedbackSections.join(separator);
        playStreamingAudio(fullFeedbackText, sessionId);
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

  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  const isDataIncomplete = overallScore == null || overallScore === undefined;

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-4 rounded-2xl bg-white p-4 lg:w-[300px]">
        <section className="col-span-2 w-full space-y-4 pt-4 md:col-span-1 lg:col-span-2">
          <div className="text-center">
            {isDataIncomplete ? (
              <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-200" />
            ) : (
              <div className="flex items-start gap-5">
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
                {isDataIncomplete ? (
                  <div className="mt-4 space-y-4 w-full flex-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  </div>
                ) : (
                  <div className="space-y-3 w-full flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {t('assessment.overallResult')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">
                          {t(getScoreRating(overallScore || 0).rating)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="grid transition-all duration-300 ease-in-out"
                      style={{
                        gridTemplateRows: showBreakdown ? '1fr' : '0fr',
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-2">
                          {sectionCriteria.map(
                            (criterion: {
                              key: string;
                              label: string;
                              status: string;
                              color: string;
                              score: number;
                              maxScore: number;
                            }) => (
                              <div key={criterion.key}>
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-1 rounded-full bg-gray-200" />
                                  <span className="text-sm">
                                    {criterion.label}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 pl-3">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: getScoreRating(criterion.score * 2).color }}
                                  />
                                  <span className="text-sm font-medium">
                                    {criterion.score * 2}{' '}
                                    <span className="font-normal text-[#7E7F81]">
                                      / {criterion.maxScore * 2}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBreakdown((v) => !v)}
                      className="flex cursor-pointer items-center gap-1 text-sm text-[#161618] hover:opacity-70"
                    >
                      {showBreakdown
                        ? t('assessment.hideBreakdown', 'Hide breakdown')
                        : t('assessment.showBreakdown', 'Show breakdown')}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-4 w-4 transition-transform duration-300 ${
                          showBreakdown ? 'rotate-180' : ''
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
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
            disabled={isTTSLoading || !prudentialPHAppointmentSettingData}
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

export default PrudentialPHAppointmentSettingSessionCard;
