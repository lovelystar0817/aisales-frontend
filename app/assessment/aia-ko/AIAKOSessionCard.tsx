import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext'
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

const AIAKOSessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    overviewData,
    aiaKoIntroductionData,
    aiaKoObjectionHandlingData,
    aiaKoNeedsExplorationData,
    aiaKoNeedsAnalysisData,
    aiaKoProductPitchData,
    aiaKoProductPitchObjectionHandlingData,
    aiaKoE2EAssessmentData,
    onViewTranscript,
    isAdminView,
  } = useAssessmentContext();
  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const { apiClient } = useAssessmentContext();

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
    // Determine assessment type
    const isProductPitch = session?.assessmentType === 'aia-ko-product-pitch';
    const isE2E =
      session?.assessmentType === 'aia-ko-end-to-end-outbound-call';

    if (isE2E) {
      // E2E assessment: build scores from the sections
      if (!aiaKoE2EAssessmentData?.sections) {
        return [
          {
            score: aiaKoE2EAssessmentData?.overallScore,
            maxScore: aiaKoE2EAssessmentData?.maxScore || 100,
            label: t('assessment.overall'),
            weight: 0,
          },
        ];
      }

      const e2eSectionTitleKeys = [
        t('assessment.aiaKoE2E.introduction'),
        t('assessment.aiaKoE2E.needsAnalysis'),
        t('assessment.aiaKoE2E.productPitch'),
        t('assessment.aiaKoE2E.objectionHandling'),
        t('assessment.aiaKoE2E.closing'),
        t('assessment.aiaKoE2E.other'),
      ];
      return aiaKoE2EAssessmentData.sections.map((section, index) => ({
        score: section.score,
        maxScore: section.maxScore === 99 ? 100 : section.maxScore || 100,
        label: e2eSectionTitleKeys[index] ?? section.title,
        weight: section.weight / 100,
      }));
    }

    // S2 (Product Pitch): Needs Analysis 20%, Product Pitch 40%, Objection Handling 40%
    if (isProductPitch) {
      return [
        {
          score:
            aiaKoNeedsAnalysisData?.overallScore != null
              ? Math.round(aiaKoNeedsAnalysisData.overallScore * 10) / 10
              : aiaKoNeedsAnalysisData?.overallScore,
          maxScore: aiaKoNeedsAnalysisData?.maxScore || 100,
          label: t('assessment.needsAnalysis'),
          weight: 0.2,
        },
        {
          score:
            aiaKoProductPitchData?.overallScore != null
              ? Math.round(aiaKoProductPitchData.overallScore * 10) / 10
              : aiaKoProductPitchData?.overallScore,
          maxScore: aiaKoProductPitchData?.maxScore || 100,
          label: t('assessment.productPitch'),
          weight: 0.4,
        },
        {
          score:
            aiaKoProductPitchObjectionHandlingData?.overallScore != null
              ? Math.round(
                  aiaKoProductPitchObjectionHandlingData.overallScore * 10,
                ) / 10
              : aiaKoProductPitchObjectionHandlingData?.overallScore,
          maxScore: aiaKoProductPitchObjectionHandlingData?.maxScore || 100,
          label: t('assessment.objectionHandling'),
          weight: 0.4,
        },
      ];
    }

    // S1 (Opening & Objection Call): Intro 20%, Objection Handling 50%, Needs Exploration 30%
    return [
      {
        score:
          aiaKoIntroductionData?.overallScore != null
            ? Math.round(aiaKoIntroductionData.overallScore * 10) / 10
            : aiaKoIntroductionData?.overallScore,
        maxScore: aiaKoIntroductionData?.maxScore || 100,
        label: t('assessment.introduction'),
        weight: 0.2,
      },
      {
        score:
          aiaKoObjectionHandlingData?.overallScore != null
            ? Math.round(aiaKoObjectionHandlingData.overallScore * 10) / 10
            : aiaKoObjectionHandlingData?.overallScore,
        maxScore: aiaKoObjectionHandlingData?.maxScore || 100,
        label: t('assessment.objectionHandling'),
        weight: 0.5,
      },
      {
        score:
          aiaKoNeedsExplorationData?.overallScore != null
            ? Math.round(aiaKoNeedsExplorationData.overallScore * 10) / 10
            : aiaKoNeedsExplorationData?.overallScore,
        maxScore: aiaKoNeedsExplorationData?.maxScore || 100,
        label: t('assessment.needsHealthExploration'),
        weight: 0.3,
      },
    ];
  }, [
    t,
    session?.assessmentType,
    aiaKoIntroductionData,
    aiaKoObjectionHandlingData,
    aiaKoNeedsExplorationData,
    aiaKoNeedsAnalysisData,
    aiaKoProductPitchData,
    aiaKoProductPitchObjectionHandlingData,
    aiaKoE2EAssessmentData,
  ]);

  const { overallScore, percentage, status } = useMemo(() => {
    const validScores = totalScores.filter(
      ({ score }) => score != null && score !== undefined,
    );

    if (validScores.length === 0) {
      return { overallScore: undefined, percentage: 0, status: '' };
    }

    const totalWeight = validScores.reduce(
      (acc, { weight }) => acc + (weight || 1),
      0,
    );
    const weightedSum = validScores.reduce(
      (acc, { score, maxScore, weight }) =>
        acc + ((score || 0) / (maxScore || 100)) * (weight || 1),
      0,
    );

    const percentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    const roundedPercentage = Math.round(percentage * 10) / 10;
    const { rating } = getScoreRating(roundedPercentage);

    return {
      overallScore: roundedPercentage,
      percentage: roundedPercentage,
      status: t(rating),
    };
  }, [totalScores, t]);

  const isDataIncomplete =
    !totalScores[0] ||
    totalScores[0].score === null ||
    totalScores[0].score === undefined;

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
      const isProductPitch = session?.assessmentType === 'aia-ko-product-pitch';
      const isE2E =
        session?.assessmentType === 'aia-ko-end-to-end-outbound-call';

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

      const appendSectionFeedback = (
        data: any,
        introKey: string,
        defaultMax: number,
      ) => {
        if (!data) return;
        feedbackSections.push(
          t(introKey, {
            score: data.overallScore,
            max: data.maxScore || defaultMax,
          }),
        );
        if (data.sections && data.sections.length > 0) {
          const sectionStrengths = data.sections
            .filter((s: any) => s.strengths?.length > 0)
            .flatMap((s: any) => s.strengths);
          if (sectionStrengths.length > 0) {
            feedbackSections.push(
              t('assessment.strengths', 'Strengths') +
                ': ' +
                sectionStrengths.join('. '),
            );
          }
          const sectionToImprove = data.sections
            .filter((s: any) => s.toImprove?.length > 0)
            .flatMap((s: any) => s.toImprove);
          if (sectionToImprove.length > 0) {
            feedbackSections.push(
              t('assessment.toImprove', 'To Improve') +
                ': ' +
                sectionToImprove.join('. '),
            );
          }
        } else {
          if (data.strengths?.length > 0) {
            feedbackSections.push(
              t('assessment.strengths', 'Strengths') +
                ': ' +
                data.strengths.join('. '),
            );
          }
          if (data.toImprove?.length > 0) {
            feedbackSections.push(
              t('assessment.toImprove', 'To Improve') +
                ': ' +
                data.toImprove.join('. '),
            );
          }
        }
      };

      if (isE2E) {
        // E2E assessment feedback — iterate over sections and their criteria
        if (aiaKoE2EAssessmentData) {
          feedbackSections.push(
            `Overall score: ${aiaKoE2EAssessmentData.overallScore} out of ${aiaKoE2EAssessmentData.maxScore || 100}.`,
          );
          if (aiaKoE2EAssessmentData.description) {
            feedbackSections.push(aiaKoE2EAssessmentData.description);
          }
          for (const section of aiaKoE2EAssessmentData.sections || []) {
            feedbackSections.push(
              `${section.title}: ${section.score} out of ${section.maxScore}.`,
            );
            for (const criterion of section.criteria || []) {
              if (criterion.suggestion) {
                feedbackSections.push(
                  `${criterion.title}: ${criterion.suggestion}`,
                );
              }
            }
          }
        }
      } else if (isProductPitch) {
        // Product Pitch assessment feedback
        appendSectionFeedback(
          aiaKoNeedsAnalysisData,
          'assessment.audioFeedback.needsAnalysisIntro',
          100,
        );
        appendSectionFeedback(
          aiaKoProductPitchData,
          'assessment.audioFeedback.productPitchIntro',
          100,
        );
        appendSectionFeedback(
          aiaKoProductPitchObjectionHandlingData,
          'assessment.audioFeedback.objectionHandlingIntro',
          100,
        );
      } else {
        // Opening & Objection Call assessment feedback
        appendSectionFeedback(
          aiaKoIntroductionData,
          'assessment.audioFeedback.introductionIntro',
          100,
        );
        appendSectionFeedback(
          aiaKoObjectionHandlingData,
          'assessment.audioFeedback.objectionHandlingIntro',
          100,
        );
        appendSectionFeedback(
          aiaKoNeedsExplorationData,
          'assessment.audioFeedback.needsExplorationIntro',
          100,
        );
      }

      if (feedbackSections.length > 0) {
        const separator = language === 'th' ? ', ' : '. ';
        const fullFeedbackText = feedbackSections.join(separator);
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
      <article className="grid w-full grid-cols-2 items-start gap-4 space-y-6 rounded-2xl bg-white p-4 lg:w-[300px]">
        <header className="col-span-2 flex w-full items-start space-x-6 md:col-span-1 lg:col-span-2">
          {!isDataIncomplete ? (
            <div>
              {totalScores?.length > 2 ? (
                <div
                  className="relative"
                  aria-label={`Overall score: ${percentage}`}
                >
                  <Circle
                    value={percentage || 0}
                    color={getScoreRating(percentage || 0).color}
                    bgColor="var(--color-gray-100)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[20px] leading-[28px] font-[700]">
                      {Math.round(percentage)}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="relative"
                  aria-label={`Overall score: ${percentage}`}
                >
                  <Circle
                    value={
                      totalScores[0]?.score
                        ? (totalScores[0].score / totalScores[0].maxScore) * 100
                        : 0
                    }
                    color={
                      getScoreRating(
                        totalScores[0]?.score
                          ? (totalScores[0].score / totalScores[0].maxScore) *
                              100
                          : 0,
                      ).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!!totalScores[1]?.score && (
                      <Circle
                        size={68}
                        value={
                          (totalScores[1].score / totalScores[1].maxScore) * 100
                        }
                        color={
                          getScoreRating(
                            (totalScores[1].score / totalScores[1].maxScore) *
                              100,
                            true,
                          ).color
                        }
                        bgColor="var(--color-gray-100)"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[20px] leading-[28px] font-[700]">
                      {Math.round(percentage)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="h-20 w-20 animate-pulse rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute top-1/2 left-1/2 h-15 w-15 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            </div>
          )}

          <div className="flex-1 pl-4">
            <p className="text-[14px] leading-[20px] tracking-[-0.6%] text-[#58595A]">
              {t('assessment.overallScore')}
            </p>
            {!isDataIncomplete ? (
              <div>
                <h3 className="mb-2 text-[20px] font-[700]">{status}</h3>
                <ul className="space-y-2">
                  {totalScores.map((scoreData: any, index: number) => (
                    <ScoreIndicator
                      key={index}
                      score={scoreData.score || 0}
                      maxScore={scoreData.maxScore || 100}
                      label={scoreData.label || ''}
                      weightLabel={scoreData.weight ? `(${Math.round(scoreData.weight * 100)}%)` : undefined}
                      isSecondary={index > 0}
                      isDynamicColor={totalScores?.length < 3}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-2 flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
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
  maxScore,
  label,
  weightLabel,
  isSecondary = false,
  isDynamicColor = true,
}: {
  score: number;
  maxScore: number;
  label: string;
  weightLabel?: string;
  isSecondary?: boolean;
  isDynamicColor?: boolean;
}) => {
  const percentage = (score / maxScore) * 100;
  const { color } = getScoreRating(percentage);

  return (
    <li className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <span
          className="inline-block h-3 w-1 rounded-full"
          style={{ backgroundColor: isDynamicColor ? color : '#D9DDE0' }}
          aria-hidden="true"
        />
        <span className="text-[14px] font-normal text-[#161618]">{label} {weightLabel && <span className="text-[#58595A]">{weightLabel}</span>}</span>
      </div>
      <div className="flex items-center">
        {!isDynamicColor && (
          <div
            className="mr-2 ml-3 h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        <span className="text-[14px] font-normal text-[#161618]">
          {score}
          <span className="text-[#58595A]"> / {maxScore}</span>
        </span>
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

export default AIAKOSessionCard;
