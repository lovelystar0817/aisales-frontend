import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getScoreRating } from '../../util/scoreRating';
import { HeadphoneIcon, FileIcon } from '../../../public/icons/icons';
import { useTTS } from '../../hooks/useTTS';
import { apiProtected, formatDuration } from '~/util/api';
import { StandingsModal } from '~/components/StandingsModal';
import { useScormCompletion } from '~/hooks/useScormCompletion';
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon } from 'lucide-react';
import { useAssessmentContext } from '../shared/AssessmentContext';

type IconType = 'headphone' | 'file' | 'download';

// Helper function to get the appropriate badge icon based on tier name
function getBadgeIcon(tierLevel: number, className?: string) {
  if (tierLevel === 1) {
    return <img src="/icons/newbie-sales-badge.png" className={className} alt="Newbie sales badge" />;
  } else if (tierLevel === 2) {
    return <img src="/icons/emerging-sales-badge.png" className={className} alt="Emerging sales badge" />;
  } else if (tierLevel === 3) {
    return <img src="/icons/intermediate-sales-badge.png" className={className} alt="Intermediate sales badge" />;
  } else if (tierLevel === 4) {
    return <img src="/icons/expert-sales-badge.png" className={className} alt="Expert sales badge" />;
  } else {
    return <img src="/icons/not-available-sales-badge.png" className={className} alt="Not available badge" />;
  }
}

// Helper function to get tier name based on overall score for MSIG Product Positioning
function getMSIGProductPositioningTierNameFromScore(score: number, t: any): string {
  if (score >= 80) return t('standings.strategicConsultant', 'Strategic Consultant');
  if (score >= 60) return t('standings.skilledAdvisor', 'Skilled Advisor');
  if (score >= 40) return t('standings.emergingSeller', 'Emerging Seller');
  if (score >= 0) return t('standings.salesNovice', 'Sales Novice');
  return 'Not available';
}

function getMSIGProductPositioningTierLevelFromScore(score: number, t: any): number {
  if (score >= 80) return 4
  if (score >= 60) return 3
  if (score >= 40) return 2
  if (score >= 0) return 1
  return 0;
}

const ScoreIndicator = ({
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
  const indicatorColor = notApplicable ? '#9CA3AF' : hasFailedItem ? '#E60D00' : color;
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
          <div className="rounded-full size-2 ml-3" style={{ backgroundColor: indicatorColor }} />
          {notApplicable ? '-' : status ? status : score}
          {!notApplicable && !status && <div className="text-[#58595A]"> / 100</div>}
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
            <HeadphoneIcon className='size-4' />
          ) : icon === 'download' ? (
            <DownloadIcon className='size-4' />
          ) : (
            <FileIcon className='size-4' />
          )}
        </span>
      )}
      {children}
    </button>
  );
};

const MSIGProductPositioningSessionCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    session, 
    overviewData, 
    salesTechniquesData, 
    productKnowledgeData,
    onViewTranscript, 
    isAdminView,
    apiClient 
  } = useAssessmentContext();
  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [isScoresExpanded, setIsScoresExpanded] = useState(true);

  // Calculate combined score from sales techniques and product knowledge
  const calculatedOverallScore = useMemo(() => {
    const salesTechScore = salesTechniquesData?.overallScore ?? 0;
    const productKnowledgeScore = productKnowledgeData?.overallScore ?? 0;
    
    // For MSIG Product Positioning, we need both scores
    // Assuming equal weight for sales technique and product knowledge
    if (salesTechScore > 0 && productKnowledgeScore > 0) {
      return Math.round((salesTechScore + productKnowledgeScore) / 2);
    } else if (salesTechScore > 0) {
      return salesTechScore;
    } else if (productKnowledgeScore > 0) {
      return productKnowledgeScore;
    }
    return 0;
  }, [salesTechniquesData?.overallScore, productKnowledgeData?.overallScore]);

  // Get section scores for display
  const sectionScores = useMemo(() => {
    const scores = [];
    
    if (salesTechniquesData?.overallScore !== undefined) {
      scores.push({
        score: salesTechniquesData.overallScore,
        label: t('assessment.salesTechnique', 'Sales Technique'),
        status: `${salesTechniquesData.overallScore}/100`,
        hasFailedItem: salesTechniquesData.overallScore < 50,
        weight: 50,
      });
    }

    if (productKnowledgeData?.overallScore !== undefined) {
      scores.push({
        score: productKnowledgeData.overallScore,
        label: t('assessment.productKnowledge', 'Product Knowledge'),
        status: `${productKnowledgeData.overallScore}/100`,
        hasFailedItem: productKnowledgeData.overallScore < 50,
        weight: 50,
      });
    }

    return scores;
  }, [salesTechniquesData, productKnowledgeData, t]);

  const isDataIncomplete = useMemo(() => {
    return !salesTechniquesData?.overallScore || !productKnowledgeData?.overallScore;
  }, [salesTechniquesData, productKnowledgeData]);

  // Calculate tier for MSIG Product Positioning based on calculated overall score
  const msigTierName = useMemo(() => {
    if (calculatedOverallScore !== undefined && calculatedOverallScore !== null) {
      if (isDataIncomplete) {
        return t('assessment.standings.notAvailable', 'Not available');
      }
      return getMSIGProductPositioningTierNameFromScore(calculatedOverallScore, t);
    }
    return null;
  }, [calculatedOverallScore, isDataIncomplete, t]);

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
        return apiProtected()
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

  // Use calculated overall score
  const { overallScore } = useMemo(() => {
    const score = calculatedOverallScore ?? 0;
    const { rating } = getScoreRating(score);
    return { overallScore: Math.round(score), status: t(rating) };
  }, [calculatedOverallScore, t]);

  // SCORM completion handling
  useScormCompletion({
    overallScore,
    sessionId,
  });

  const {
    playAudio,
    stopAudio,
    isLoading: isTTSLoading,
  } = useTTS({
    setIsAISpeaking: setIsAudioPlaying,
    onPlaybackComplete: () => setIsAudioPlaying(false),
  });

  // When the component unmounts, stop the audio if it's playing
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const handleListenToFeedback = () => {
    if (isAudioPlaying) {
      stopAudio();
    } else {
      const feedbackText = `Here's your overview: ${overviewData?.summary}. For next steps, you should ${overviewData?.suggestedNextSteps?.join(', ')}.`;
      playAudio(feedbackText);
    }
  };

  const toggleExpanded = () => {
    setIsScoresExpanded(!isScoresExpanded);
  };

  const getAudioButtonText = () => {
    if (isTTSLoading) return 'Loading...';
    if (isAudioPlaying) return 'Stop';
    return 'Listen to Feedback';
  };

  const handlePracticeAgain = () => {
    if (!session) {
      toast.error('Session data not available');
      return;
    }

    const personaId = session.persona?._id;
    const callType = session.callType;
    const productId = session.product?.friendlyId || session.product?._id;

    if (!personaId || !callType || !productId) {
      console.error('Missing session parameters:', {
        personaId,
        callType,
        productId,
      });
      toast.error('Unable to restart practice - missing session data');
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
      <article className="grid w-full grid-cols-2 items-start gap-y-6 gap-x-4 rounded-2xl bg-white p-4 lg:w-[300px]">
        {/* MSIG Standing Progress Section */}
        <section className="col-span-2 w-full space-y-4 pt-4 md:col-span-1 lg:col-span-2">
          <div className="flex items-start gap-4">
            {getBadgeIcon(getMSIGProductPositioningTierLevelFromScore(calculatedOverallScore, t), 'h-16 w-16')}
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
                    onClick={toggleExpanded}
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
                          <ScoreIndicator
                            key={index}
                            score={sectionScore.score}
                            label={sectionScore.label}
                            status={sectionScore.status}
                            hasFailedItem={sectionScore.hasFailedItem}
                          />
                        ))}
                      </ul>
                      {sectionScores.length === 0 && (
                        <p className="text-[12px] text-gray-500">
                          Section scores will appear as assessment
                          generates...
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
                {t('assessment.standings.learnMore', 'Learn more')}
              </button>
            </p>
          </div>
        </section>

        {/* Practice Info Section */}
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

        {/* Action Buttons */}
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
              : t('assessment.downloadReport')}
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
    </>
  );
};

export default MSIGProductPositioningSessionCard;

