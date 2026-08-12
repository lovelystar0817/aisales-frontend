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
import { useLanguage } from '~/context/language';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { ScormCompletionDialog } from '~/components/ScormCompletionDialog';
import { formatDuration } from '~/util/api';

type IconType = 'headphone' | 'download' | 'file';

const SessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    overviewData,
    salesTechniquesData,
    productKnowledgeData,
    isColdCall,
    onViewTranscript,
    isAdminView,
    isSalesTechniquesGenerating,
    isProductKnowledgeGenerating,
    salesTechniquesResponseGenerating,
    productKnowledgeResponseGenerating,
    scormCompletionReady,
  } = useAssessmentContext();

  // Check if this is an Alibaba Cloud telesales session
  const isAlibabaTelesales =
    session?.roleplay?.framework === 'ALIBABA_TELESALES';
  const isGreatEastern = session?.assessmentType === 'great-eastern';
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
    // For Great Eastern, use dynamic sections from salesTechniquesData
    if (isGreatEastern && salesTechniquesData?.sections?.length) {
      return salesTechniquesData.sections.map((section) => ({
        score: section.score,
        maxScore: section.maxScore,
        label: section.title,
      }));
    }

    const scores: { score: number | undefined; label: string; maxScore?: number }[] = [
      {
        score: salesTechniquesData?.overallScore,
        label: t('assessment.salesTechnique'),
        maxScore: 100,
      },
    ];

    // Don't include product knowledge for cold calls or Alibaba telesales
    if (!isColdCall && !isAlibabaTelesales) {
      scores.push({
        score: productKnowledgeData?.overallScore,
        label: t('assessment.productKnowledge'),
        maxScore: 100,
      });
    }

    return scores;
  }, [t, salesTechniquesData, productKnowledgeData, isColdCall, isAlibabaTelesales, isGreatEastern]);

  const { overallScore, status } = useMemo(() => {
    // For Great Eastern, use the overall score from salesTechniquesData directly
    if (isGreatEastern && salesTechniquesData?.overallScore != null) {
      const score = salesTechniquesData.overallScore;
      const { rating } = getScoreRating(score);
      return { overallScore: Math.round(score), status: t(rating) };
    }

    const validScores = totalScores.filter(
      ({ score }) => score != null && score !== undefined,
    );

    if (validScores.length === 0) {
      return { overallScore: undefined };
    }

    const score =
      validScores.reduce((acc, { score }) => acc + (score || 0), 0) /
      validScores.length;
    const { rating } = getScoreRating(score);

    return { overallScore: Math.round(score), status: t(rating) };
  }, [totalScores, t, isGreatEastern, salesTechniquesData]);

  // SCORM completion: use backend's scormCompletionReady flag and overallScore
  // (both set atomically when ALL assessment jobs are done)
  const isScormReady = scormCompletionReady === true;
  const scormOverallScore = session?.roleplay?.overallScore;
  const { completionStatus, dismissCompletion } = useScormCompletion({
    overallScore: isScormReady && scormOverallScore != null ? scormOverallScore : overallScore,
    sessionId,
    isReady: isScormReady,
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

      // Sales Techniques section
      if (salesTechniquesData) {
        feedbackSections.push(
          t('assessment.audioFeedback.salesTechniqueIntro', {
            score: salesTechniquesData.overallScore,
            max: salesTechniquesData.maxScore || 100,
          }),
        );

        if (salesTechniquesData.description) {
          feedbackSections.push(salesTechniquesData.description);
        }

        // Include individual section feedback
        if (
          salesTechniquesData.sections &&
          salesTechniquesData.sections.length > 0
        ) {
          salesTechniquesData.sections.forEach((section: any) => {
            feedbackSections.push(
              t('assessment.audioFeedback.salesTechniqueSection', {
                title: section.title,
                score: section.score,
                max: section.maxScore || 20,
                why: section.why || '',
                suggestion: section.suggestion || '',
              }),
            );
          });
        }
      }

      // Product Knowledge section (only for non-cold calls and non-Alibaba)
      if (!isColdCall && !isAlibabaTelesales && productKnowledgeData) {
        feedbackSections.push(
          t('assessment.audioFeedback.productKnowledgeIntro', {
            score: productKnowledgeData.overallScore,
            max: productKnowledgeData.maxScore || 100,
          }),
        );

        if (productKnowledgeData.description) {
          feedbackSections.push(productKnowledgeData.description);
        }

        // Include individual section feedback
        if (
          productKnowledgeData.sections &&
          productKnowledgeData.sections.length > 0
        ) {
          productKnowledgeData.sections.forEach((section: any) => {
            let sectionText = t('assessment.audioFeedback.productKnowledgeSection', {
              title: section.title,
              score: section.score,
              max: section.maxScore || 50,
            });

            if (section.strengths?.length > 0) {
              sectionText += ' ' + t('assessment.audioFeedback.strengths', {
                strengths: section.strengths.join(', '),
              });
            }

            if (section.toImprove?.length > 0) {
              const improvements = section.toImprove
                .map((item: any) => item.text || item)
                .join(', ');
              sectionText += ' ' + t('assessment.audioFeedback.toImprove', {
                improvements: improvements,
              });
            }

            feedbackSections.push(sectionText);
          });
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

  const isDataIncomplete =
    !totalScores[0] ||
    totalScores[0].score === null ||
    totalScores[0].score === undefined;

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-4 space-y-6 rounded-2xl bg-white p-4 lg:w-[300px]">
        <header className="col-span-2 flex w-full items-start space-x-6 md:col-span-1 lg:col-span-2">
          {!isDataIncomplete ? (
            <div
              className="relative"
              aria-label={`Overall score: ${overallScore}`}
            >
              {/* For Great Eastern with 3 sections, show 3 nested circles */}
              {isGreatEastern && totalScores.length >= 3 ? (
                <>
                  {(() => {
                    // Normalize scores to 100-based for circle display
                    const normalizeScore = (score: number, maxScore?: number) =>
                      maxScore && maxScore !== 100
                        ? Math.round((score / maxScore) * 100)
                        : score;
                    const score0 = normalizeScore(totalScores[0]?.score || 0, totalScores[0]?.maxScore);
                    const score1 = normalizeScore(totalScores[1]?.score || 0, totalScores[1]?.maxScore);
                    const score2 = normalizeScore(totalScores[2]?.score || 0, totalScores[2]?.maxScore);
                    return (
                      <>
                        <Circle
                          size={90}
                          strokeWidth={4}
                          value={score0}
                          color={getScoreRating(score0).color}
                          bgColor="var(--color-gray-100)"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Circle
                            size={72}
                            strokeWidth={4}
                            value={score1}
                            color={getScoreRating(score1, true).color}
                            bgColor="var(--color-gray-100)"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Circle
                            size={54}
                            strokeWidth={4}
                            value={score2}
                            color={getScoreRating(score2, true).color}
                            bgColor="var(--color-gray-100)"
                          />
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <Circle
                    value={totalScores[0]?.score || 0}
                    color={getScoreRating(totalScores[0]?.score || 0).color}
                    bgColor="var(--color-gray-100)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!!totalScores[1]?.score && (
                      <Circle
                        size={68}
                        value={totalScores[1]?.score || 0}
                        color={
                          getScoreRating(totalScores[1]?.score || 0, true).color
                        }
                        bgColor="var(--color-gray-100)"
                      />
                    )}
                  </div>
                </>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[20px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
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
                  {/* For Great Eastern, display all sections dynamically */}
                  {isGreatEastern && totalScores.length >= 3 ? (
                    totalScores.map((scoreItem, index) => (
                      <ScoreIndicator
                        key={index}
                        score={scoreItem.score || 0}
                        label={scoreItem.label || ''}
                        maxScore={scoreItem.maxScore}
                        isSecondary={index > 0}
                      />
                    ))
                  ) : (
                    <>
                      <ScoreIndicator
                        score={totalScores[0]?.score || 0}
                        label={totalScores[0]?.label || ''}
                      />
                      {!isColdCall && !!totalScores[1]?.score && (
                        <ScoreIndicator
                          score={totalScores[1]?.score || 0}
                          label={totalScores[1]?.label || ''}
                          isSecondary
                        />
                      )}
                    </>
                  )}
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
  maxScore = 100,
  isSecondary = false,
}: {
  score: number;
  label: string;
  maxScore?: number;
  isSecondary?: boolean;
}) => {
  // For Great Eastern sections, normalize score to 100-based for color rating
  const normalizedScore = maxScore && maxScore !== 100
    ? Math.round((score / maxScore) * 100)
    : score;
  const { color } = getScoreRating(normalizedScore, isSecondary);

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
        {score}
        <span className="text-[#58595A]"> / {maxScore}</span>
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

export default SessionCard;
