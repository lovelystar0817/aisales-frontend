import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
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

type IconType = 'headphone' | 'download' | 'file';

const PrudentialObjectionHandlingSessionCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    session,
    overviewData,
    prudentialObjectionHandlingData,
    onViewTranscript,
    isAdminView,
    apiClient,
  } = useAssessmentContext();

  const sessionId = session?._id;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

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

  const salesTechniqueScore =
    prudentialObjectionHandlingData?.salesTechnique?.overallScore;
  const objectionHandlingScore =
    prudentialObjectionHandlingData?.objectionHandling?.overallScore;

  const { overallScore, tierLevel, tierName } = useMemo(() => {
    if (
      salesTechniqueScore == null ||
      salesTechniqueScore === undefined ||
      objectionHandlingScore == null ||
      objectionHandlingScore === undefined
    ) {
      return { overallScore: undefined, tierLevel: 0, tierName: undefined };
    }

    const score = Math.round((salesTechniqueScore + objectionHandlingScore) / 2);

    // Calculate tier based on prudential-objection-handling standing configuration
    // Level 1: Sales Novice (default)
    // Level 2: Skilled Advisor (both scores >= 50)
    // Level 3: Strategic Consultant (both scores >= 75)
    let level = 1;
    let name = t('assessment.standings.salesNovice', 'Sales Novice');

    if (salesTechniqueScore >= 75 && objectionHandlingScore >= 75) {
      level = 3;
      name = t('assessment.standings.strategicConsultant', 'Strategic Consultant');
    } else if (salesTechniqueScore >= 50 && objectionHandlingScore >= 50) {
      level = 2;
      name = t('assessment.standings.skilledAdvisor', 'Skilled Advisor');
    }

    return { overallScore: score, tierLevel: level, tierName: name };
  }, [salesTechniqueScore, objectionHandlingScore, t]);

  const standingCriteria = useMemo(() => {
    const criteria = [];

    // Sales Technique (3F)
    let salesTechStatus =
      t('assessment.standings.notAvailable', 'Not Available');
    let salesTechColor = 'bg-gray-400';

    if (salesTechniqueScore != null && salesTechniqueScore !== undefined) {
      if (salesTechniqueScore >= 75) {
        salesTechStatus = `${t('assessment.standings.expert', 'Expert')} (${salesTechniqueScore}%)`;
        salesTechColor = 'bg-green-600';
      } else if (salesTechniqueScore >= 50) {
        salesTechStatus = `${t('assessment.standings.intermediate', 'Intermediate')} (${salesTechniqueScore}%)`;
        salesTechColor = 'bg-blue-600';
      } else if (salesTechniqueScore >= 0) {
        salesTechStatus = `${t('assessment.standings.beginner', 'Beginner')} (${salesTechniqueScore}%)`;
        salesTechColor = 'bg-orange-600';
      }
    }

    criteria.push({
      key: 'salesTechnique',
      label: t('assessment.salesTechnique'),
      status: salesTechStatus,
      color: salesTechColor,
    });

    // Objection Handling
    let objectionStatus =
      t('assessment.standings.notAvailable', 'Not Available');
    let objectionColor = 'bg-gray-400';

    if (objectionHandlingScore != null && objectionHandlingScore !== undefined) {
      if (objectionHandlingScore >= 75) {
        objectionStatus = `${t('assessment.standings.expert', 'Expert')} (${objectionHandlingScore}%)`;
        objectionColor = 'bg-green-600';
      } else if (objectionHandlingScore >= 50) {
        objectionStatus = `${t('assessment.standings.intermediate', 'Intermediate')} (${objectionHandlingScore}%)`;
        objectionColor = 'bg-blue-600';
      } else if (objectionHandlingScore >= 0) {
        objectionStatus = `${t('assessment.standings.beginner', 'Beginner')} (${objectionHandlingScore}%)`;
        objectionColor = 'bg-orange-600';
      }
    }

    criteria.push({
      key: 'objectionHandling',
      label: t('assessment.objectionHandling'),
      status: objectionStatus,
      color: objectionColor,
    });

    return criteria;
  }, [salesTechniqueScore, objectionHandlingScore, t]);

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
      if (overviewData?.summary) {
        playStreamingAudio(overviewData.summary);
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

  const isDataIncomplete =
    salesTechniqueScore == null ||
    salesTechniqueScore === undefined ||
    objectionHandlingScore == null ||
    objectionHandlingScore === undefined;

  return (
    <>
      <article className="grid w-full grid-cols-2 items-start gap-4 rounded-2xl bg-white p-4 lg:w-[300px]">
        {/* Standing Progress Section */}
        <section className="col-span-2 w-full space-y-4 pt-4 md:col-span-1 lg:col-span-2">
          <div className="flex items-start gap-4">
            {isDataIncomplete ? (
              <div className="size-22 shrink-0 animate-pulse rounded-full bg-gray-200" />
            ) : (
              <div className="relative shrink-0">
                {getBadgeIconByIndex(tierLevel - 1, 'size-22', t)}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">
                {t('assessment.standings.currentSession')}
              </p>
              {isDataIncomplete ? (
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {tierName ||
                    t('assessment.standings.notAvailable', 'Not Available')}
                </p>
              )}
              {isDataIncomplete ? (
                <div className="mt-4 space-y-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {standingCriteria.map((criterion) => (
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
                  ))}
                </div>
              )}
            </div>
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

// Helper function to get the appropriate badge icon based on tier level
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

export default PrudentialObjectionHandlingSessionCard;
