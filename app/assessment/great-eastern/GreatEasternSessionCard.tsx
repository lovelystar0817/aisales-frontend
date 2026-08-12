import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import { formatDuration } from '~/util/api';
import type { GreatEasternSection } from '~/assessment/types';

type IconType = 'headphone' | 'download' | 'file';

const GreatEasternSessionCard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    session,
    greatEasternAssessmentData,
    productKnowledgeData,
    isProductKnowledgeGenerating,
    onViewTranscript,
    isAdminView,
    apiClient,
  } = useAssessmentContext();

  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Check if this is the product pitch module (Stage 2)
  const isProductPitch = session?.callType === 'great-eastern-product-pitch';
  const showProductKnowledge = isProductPitch && productKnowledgeData;

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
      product: session?.product?.name ?? '-',
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

  const overallScore = useMemo(() => {
    // If product knowledge is shown, always recalculate to include it
    // Otherwise use the backend-provided score if available
    if (
      !showProductKnowledge &&
      greatEasternAssessmentData?.overallScore != null
    ) {
      return Math.round(greatEasternAssessmentData.overallScore);
    }

    if (!greatEasternAssessmentData?.sections?.length) return undefined;

    const allScores = [];

    // Add Great Eastern section scores
    const geSectionScores = greatEasternAssessmentData.sections.map(
      (section: GreatEasternSection) =>
        Math.round((section.score / section.maxScore) * 100),
    );
    allScores.push(...geSectionScores);

    // Add Product Knowledge score for product pitch sessions
    if (showProductKnowledge && productKnowledgeData) {
      const pkPercentage = Math.round(
        (productKnowledgeData.overallScore /
          (productKnowledgeData.maxScore ?? 100)) *
          100,
      );
      allScores.push(pkPercentage);
    }

    return Math.round(
      allScores.reduce((sum: number, s: number) => sum + s, 0) /
        allScores.length,
    );
  }, [greatEasternAssessmentData, showProductKnowledge, productKnowledgeData]);

  const status = useMemo(() => {
    if (overallScore == null) return undefined;
    const { rating } = getScoreRating(overallScore);
    return t(rating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallScore]);

  const sectionScores = useMemo(() => {
    const scores = [];

    // Add Great Eastern assessment sections
    if (greatEasternAssessmentData?.sections) {
      scores.push(
        ...greatEasternAssessmentData.sections.map(
          (section: GreatEasternSection) => {
            const percentage = Math.round(
              (section.score / section.maxScore) * 100,
            );
            const { color } = getScoreRating(percentage);
            return {
              title: section.title,
              score: percentage,
              maxScore: 100,
              color,
            };
          },
        ),
      );
    }

    // Add Product Knowledge score for product pitch sessions
    if (showProductKnowledge && productKnowledgeData) {
      const pkPercentage = Math.round(
        (productKnowledgeData.overallScore /
          (productKnowledgeData.maxScore ?? 100)) *
          100,
      );
      const { color } = getScoreRating(pkPercentage);
      scores.push({
        title: t('assessment.productKnowledge'),
        score: pkPercentage,
        maxScore: 100,
        color,
      });
    }

    return scores;
  }, [
    greatEasternAssessmentData,
    showProductKnowledge,
    productKnowledgeData,
    t,
  ]);

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
    } else if (greatEasternAssessmentData) {
      const feedbackParts: string[] = [];

      if (overallScore !== undefined) {
        feedbackParts.push(`Your overall score is ${overallScore} out of 100.`);
      }

      if (greatEasternAssessmentData.overallFeedback) {
        feedbackParts.push(greatEasternAssessmentData.overallFeedback);
      }

      greatEasternAssessmentData.sections?.forEach(
        (section: GreatEasternSection) => {
          const scoreOutOf100 = Math.round(
            (section.score / section.maxScore) * 100,
          );
          feedbackParts.push(
            `${section.title}. You scored ${scoreOutOf100} out of 100.`,
          );

          if (section.feedback) {
            feedbackParts.push(section.feedback);
          }

          if (section.strengths?.length > 0) {
            feedbackParts.push('Strengths:');
            section.strengths.forEach((s: string) => feedbackParts.push(s));
          }

          if (section.improvements?.length > 0) {
            feedbackParts.push('Areas to improve:');
            section.improvements.forEach((imp: string) =>
              feedbackParts.push(imp),
            );
          }
        },
      );

      // Add product knowledge feedback for product pitch sessions
      if (showProductKnowledge && productKnowledgeData) {
        const pkPercentage = Math.round(
          (productKnowledgeData.overallScore /
            (productKnowledgeData.maxScore ?? 100)) *
            100,
        );
        feedbackParts.push(
          `Product Knowledge. You scored ${pkPercentage} out of 100.`,
        );

        if (productKnowledgeData.description) {
          feedbackParts.push(productKnowledgeData.description);
        }

        productKnowledgeData.sections?.forEach((section) => {
          feedbackParts.push(`${section.title}.`);

          if (section.strengths?.length > 0) {
            feedbackParts.push('Strengths:');
            section.strengths.forEach((s) => feedbackParts.push(s));
          }

          if (section.toImprove?.length > 0) {
            feedbackParts.push('Areas to improve:');
            section.toImprove.forEach((item) => {
              feedbackParts.push(item.text);
              if (item.correction) {
                feedbackParts.push(item.correction);
              }
            });
          }
        });
      }

      if (greatEasternAssessmentData.nextSteps?.length > 0) {
        feedbackParts.push('Recommended next steps:');
        greatEasternAssessmentData.nextSteps.forEach((step: string) =>
          feedbackParts.push(step),
        );
      }

      if (feedbackParts.length > 0) {
        const fullFeedbackText = feedbackParts.join(' ');
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

    startNewSession({ personaId, callType, productId });
  };

  if (!session) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  // Consider data incomplete if:
  // 1. Overall score is not calculated yet, OR
  // 2. For product pitch, product knowledge is still being generated
  const isDataIncomplete =
    overallScore == null ||
    overallScore === undefined ||
    (isProductPitch && isProductKnowledgeGenerating);

  return (
    <article className="grid w-full grid-cols-2 items-start gap-4 space-y-6 rounded-2xl bg-white p-4 lg:w-[300px]">
      <header className="col-span-2 flex w-full items-start space-x-6 md:col-span-1 lg:col-span-2">
        {!isDataIncomplete ? (
          <div
            className="relative"
            aria-label={`Overall score: ${overallScore}`}
          >
            <Circle
              size={90}
              strokeWidth={6}
              value={overallScore}
              color={getScoreRating(overallScore).color}
              bgColor="var(--color-gray-100)"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[20px] leading-[28px] font-bold">
                {overallScore}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="h-[90px] w-[90px] animate-pulse rounded-full border-4 border-gray-200" />
          </div>
        )}

        <div className="flex-1">
          <p className="text-[14px] leading-[20px] text-[#58595A]">
            {t('assessment.overallResult', 'Overall result')}
          </p>
          {!isDataIncomplete ? (
            <div>
              <h3 className="mb-2 text-[20px] font-bold">{status}</h3>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  showBreakdown
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <ul className="space-y-3 overflow-hidden">
                  {sectionScores.map((item, index) => (
                    <li key={index} className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-1 rounded-full"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <span className="text-[14px] text-[#161618]">
                          {item.title}
                        </span>
                      </div>
                      <div className="ml-3 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#1C7AEB]" />
                        <span className="text-[14px] text-[#161618]">
                          {item.score}
                        </span>
                        <span className="text-[14px] text-[#58595A]">
                          / {item.maxScore}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="mt-3 flex cursor-pointer items-center gap-1 text-[13px] text-[#58595A] hover:text-[#161618]"
              >
                {showBreakdown
                  ? t('assessment.hideBreakdown', 'Hide breakdown')
                  : t('assessment.showBreakdown', 'Show breakdown')}
                {showBreakdown ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="mt-2 flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-200" />
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
          {t('assessment.viewTranscript')}
        </ActionButton>

        <ActionButton
          onClick={handleListenToFeedback}
          icon="headphone"
          primary={false}
          disabled={isTTSLoading || !greatEasternAssessmentData}
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
      {value || '-'}
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

export default GreatEasternSessionCard;
