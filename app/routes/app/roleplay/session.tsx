import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { WretchError } from 'wretch/resolver';
import starIcon from '~/assets/icons/star-icon.svg';
import { Button } from '~/components/button';
import { InfoModal } from '~/components/InfoModal';
import { SessionFeedbackLoading } from '~/components/SessionFeedbackLoading';
import { useLanguage } from '~/context/language';
import { usePostHog } from '~/context/posthog';
import { useConversation, type TranscriptEntry } from '~/hooks/useConversation';
import { useResponseTimeTracking } from '~/hooks/useResponseTimeTracking';
import { useSalesActionTracking } from '~/hooks/useSalesActionTracking';
import { useSessionPhase } from '~/hooks/useSessionPhase';
import CenterSection from '~/roleplay/CenterSection';
import { EndSessionDialog } from '~/roleplay/EndSessionDialog';
import { InsightModal } from '~/roleplay/InsightModal';
import { RealtimeFeedbackControls } from '~/roleplay/RealtimeFeedbackControls';
import RoleplayDetailsSection from '~/roleplay/RoleplayDetailsSection';
import { Transcript } from '~/roleplay/Transcript';
import { TranscriptImportModal } from '~/roleplay/TranscriptImportModal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '~/store/auth';
import { useTitleBarStore } from '~/store/title-bar';
import { apiProtected } from '~/util/api';
import { isInternalUser } from '~/util/internal-user';
import {
  withAuthenticationRequiredOptions,
  withGuestAwareAuth,
} from '~/util/auth0';
import { DEFAULT_PROVIDER, SessionPhase } from '~/util/constants';
import type { Session } from './types';
import { PracticeOverview } from '~/roleplay/PracticeOverview';
import ClientAndProductInfoSection from '~/roleplay/ClientAndProductInfoSection';
import { FinishedSessionView } from '~/roleplay/FinishedSessionView';

export function meta() {
  return [{ title: 'Hupo Sales AI | Roleplay' }];
}

// Main component
export default withGuestAwareAuth(function RoleplayClientId() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionPhaseRef, setPhase } = useSessionPhase();
  const titleBarStore = useTitleBarStore();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { language } = useLanguage(); // Get actual user language
  const userEmail = useAuthStore((state) => state.email);

  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [isPracticePreviewModalOpen, setIsPracticePreviewModalOpen] =
    useState(false);
  const [isTranscriptImportModalOpen, setIsTranscriptImportModalOpen] =
    useState(false);
  const [transcriptWithFeedback, setTranscriptWithFeedback] = useState<
    TranscriptEntry[]
  >([]);
  const [realtimeCoachingEnabled, setRealtimeCoachingEnabled] = useState(true);
  const [visibleFeedback, setVisibleFeedback] = useState<any>(null);

  const startTimeRef = useRef<number>(0);
  const practiceStartedRef = useRef(false);
  const feedbackGenerationRef = useRef(new Set());
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionTimeWarning, setSessionTimeWarning] = useState(false);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionHardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningDismissRef = useRef<NodeJS.Timeout | null>(null);
  const handleEndPracticeRef = useRef<() => void>(() => {});

  const endOfMessages = useRef<HTMLDivElement>(null);
  const [isAIResponding, setIsAIResponding] = useState(false);

  const canImportTranscript =
    searchParams.get('import') === 'true' && isInternalUser(userEmail);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId, 'roleplay'],
    queryFn: async () => {
      try {
        const response = await apiProtected()
          .url(`/sessions/${sessionId}/roleplay`)
          .query({ medium: 'voice' })
          .get()
          .json<{ session: Session; status: string }>();

        return response.session;
      } catch (error) {
        console.error('Failed to fetch session roleplay data:', error);
        return null;
      }
    },
  });

  // Check for provider override in URL parameters
  const providerParam = searchParams.get('provider') as
    | '11labs'
    | 'livekit'
    | null;

  // Determine provider: use URL parameter if provided, otherwise use language-based logic
  const livekitEnabled =
    posthog.isFeatureEnabled('livekit-voice') ||
    language === 'ceb' ||
    language === 'tl' ||
    language === 'th' ||
    language === 'yue';

  const salesActionsEnabled = posthog.isFeatureEnabled('sales-actions-enabled');
  let provider =
    providerParam || (livekitEnabled ? 'livekit' : DEFAULT_PROVIDER);

  // AIA Korea → use LiveKit only when a livekit config is selected, otherwise 11labs direct
  const isAiaKoSession =
    session?.assessmentType === 'aia-ko-opening-objection-call' ||
    session?.assessmentType === 'aia-ko-product-pitch';
  const configParam = searchParams.get('config');
  if (isAiaKoSession && configParam?.startsWith('aiako-')) {
    provider = 'livekit';
  }

  // KT-AXA TH → use ElevenLabs Conversational AI instead of LiveKit
  const isKtAxa =
    session?.assessmentType === 'kt-axa-recruitment' ||
    session?.assessmentType === 'kt-axa-fna' ||
    session?.assessmentType === 'kt-axa-wealthplus';
  if (isKtAxa) {
    provider = '11labs';
  }

  // Lalamove → always use 11labs direct (same as KT-AXA)
  const isLalamoveSession =
    session?.callType?.startsWith('lalamove-driver-registration');
  if (isLalamoveSession && !providerParam) {
    provider = '11labs';
  }

  console.log('🗣️ Current user language:', language); // Debug log
  console.log('🎯 Provider selected:', provider, {
    providerParam,
    livekitEnabled,
    isAiaKoSession,
  });

  // Sales Action Tracking Integration
  const {
    actionProgress,
    suggestedActions,
    isLoading: isActionTrackingLoading,
    error: actionTrackingError,
    processUserMessage,
  } = useSalesActionTracking({
    sessionId: sessionId!,
    enabled: salesActionsEnabled && !!sessionId && !!session,
    onActionCompleted: (action) => {},
  });

  // Debug logging for sales action tracking
  console.log('🎯 Sales Action Tracking Debug:', {
    actionProgress,
    isActionTrackingLoading,
    actionTrackingError,
    suggestedActions,
    sessionId,
    salesActionsEnabled,
    enabled: salesActionsEnabled && !!sessionId && !!session,
  });

  const { mutate: generateFeedback, isPending: feedbackIsLoading } =
    useMutation({
      mutationFn: async ({
        transcript,
        message,
      }: {
        transcript: TranscriptEntry[];
        message: TranscriptEntry;
      }) => {
        const formattedTranscript = transcript.map((msg) => ({
          role: msg.source,
          content: msg.message,
          sent: msg.timestamp.toISOString(),
          feedback: msg.feedback,
          tempId: msg.tempId,
        }));

        const formattedMessage = {
          role: message.source,
          content: message.message,
          sent: message.timestamp.toISOString(),
          feedback: message.feedback,
          tempId: message.tempId,
        };

        return apiProtected()
          .url(`/sessions/${sessionId}/get-message-feedback`)
          .post({
            transcript: formattedTranscript,
            message: formattedMessage,
          })
          .json<{
            success: boolean;
            feedback: { type: string; content: string } | undefined;
            tempId: string | null;
          }>();
      },
      onSuccess: (data) => {
        console.log('Feedback generated:', data.feedback);

        if (data.feedback && data.tempId) {
          // Update transcript with feedback
          setTranscriptWithFeedback((prev) => {
            const messageIndex = prev.findIndex(
              (msg) => msg.tempId === data.tempId,
            );

            if (messageIndex !== -1) {
              const updated = [...prev];
              updated[messageIndex] = {
                ...updated[messageIndex],
                feedback: data.feedback,
              };
              return updated;
            }
            return prev;
          });

          // Show feedback popup
          showFeedbackPopup(data.feedback);
        }
      },
      onError: (error) => {
        console.error('Failed to generate feedback:', error);
      },
    });

  const { mutate: endSession, isPending: endSessionIsProcessing } = useMutation(
    {
      mutationFn: async ({
        transcript,
        duration,
        conversation,
      }: {
        transcript: {
          role: string;
          content: string;
          sent: string;
          responseTimeSec?: number;
        }[];
        duration: number;
        conversation?: string | null;
      }) => {
        return apiProtected()
          .url(`/sessions/${sessionId}/end`)
          .post({ transcript, duration, conversation })
          .json<{ isBrief?: boolean; isDeleted?: boolean }>();
      },
      onSuccess: (data) => {
        posthog.capture('session_ended', {
          isRoleplay: true,
          sessionId: sessionId,
          tooBrief: data.isBrief,
          noInteraction: data.isDeleted,
          ...(responseTimes.length > 0 && {
            avgResponseTimeSec: averageResponseTimeSec,
            responseTimeTurns: responseTimes.length,
          }),
        });

        if (data.isBrief) {
          setInsightsModalOpen(true);
        } else {
          // Navigate using the session id (which now has the roleplay populated)
          navigate(`/roleplay/${sessionId}/assessment`);
        }
      },
      onError: (error) => {
        console.error('Failed to end roleplay:', error);
        if (error instanceof WretchError) {
          const status = error.response.status;
          if (status === 404) {
            toast.error(t('sessions.sessionNotFound'));
            navigate('/', { replace: true });
            return;
          }
        }
        toast.error(t('sessions.endRoleplayError'));
        posthog.capture('session_end_error', {
          isRoleplay: true,
          sessionId: sessionId,
          error,
        });
      },
    },
  );

  const { mutate: reportRoleplayStarted } = useMutation({
    mutationFn: async () => {
      return apiProtected()
        .url(`/sessions/${sessionId}/report-roleplay-started`)
        .post()
        .json<{ sessionId: string }>();
    },
    onSuccess: (data) => {
      console.log('Successfully reported to slack:', data);
    },
  });

  useEffect(() => {
    if (
      session?.product &&
      !session?.product?.titleBarHidden &&
      !session?.callType.startsWith('bbl-') &&
      !session?.callType.startsWith('hsbc-')
    ) {
      titleBarStore.setProduct(session?.product?.name);
    }
    titleBarStore.setCallType(
      session?.module?.title ?? t('sessions.discovery'),
    );

    if (session?.endedAt) {
      titleBarStore.setTitle(t('sessions.sessionCompleted'));
    } else {
      titleBarStore.setTitle(t('sessions.roleplayPractice'));

      // Set action based on whether practice has started
      if (
        practiceStartedRef.current ||
        sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION
      ) {
        titleBarStore.setAction(
          <Button
            variant="primary"
            className="!hover:bg-[#C50B00] !bg-[#E60D00] px-4 py-2 text-sm font-medium text-white md:ml-0 md:rounded-full md:px-5 md:py-2"
            onClick={() => setIsEndSessionDialogOpen(true)}
          >
            {t('sessions.endSession')}
          </Button>,
        );
      } else {
        titleBarStore.setAction(
          <Button
            variant="primary"
            className="!hover:bg-gray-50 !border !border-gray-300 !bg-white px-4 py-2 text-sm font-medium !text-gray-900 md:ml-0 md:rounded-full md:px-5 md:py-2"
            onClick={() => navigate('/')}
          >
            {t('sessions.returnHome')}
          </Button>,
        );
      }
    }

    return () => {
      titleBarStore.reset();
    };
  }, [
    titleBarStore.reset,
    titleBarStore.setCallType,
    titleBarStore.setProduct,
    titleBarStore.setAction,
    titleBarStore.setTitle,
    session,
    t,
    practiceStartedRef.current,
    sessionPhaseRef.current,
    navigate,
  ]);

  // Hook for conversation management
  const {
    connectConversation,
    disconnectConversation,
    transcript,
    conversation,
  } = useConversation(provider, {
    session: session as any,
    language,
    startTimeRef,
    setIsAISpeaking,
    setError,
  });

  // Response time tracking via VAD (AIA Korea only)
  const isAiaKo =
    session?.assessmentType === 'aia-ko-opening-objection-call' ||
    session?.assessmentType === 'aia-ko-product-pitch';
  const { responseTimes, averageResponseTimeSec } = useResponseTimeTracking({
    isAISpeaking,
    transcript,
    sessionPhase: sessionPhaseRef.current,
    enabled: !!isAiaKo,
  });

  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up resources on unmount');
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      disconnectConversation();
    };
  }, []);

  useEffect(() => {
    if (transcript.length === 0) {
      setTranscriptWithFeedback([]);
      feedbackGenerationRef.current.clear(); // Clear tracking
      return;
    }

    setTranscriptWithFeedback((prev) => {
      // For non-LiveKit (Elevenlabs) providers, use simple logic (original behavior)
      if (provider !== 'livekit') {
        if (prev.length > transcript.length) {
          return prev;
        }

        // Handle dedup reorder (same length but different order)
        if (prev.length === transcript.length) {
          const orderChanged = prev.some(
            (msg, i) =>
              msg.message !== transcript[i]?.message ||
              msg.source !== transcript[i]?.source,
          );
          if (!orderChanged) return prev;
          // Rebuild with new order, preserving feedback
          return transcript.map((msg, index) => {
            const existing = prev.find(
              (p) => p.message === msg.message && p.source === msg.source,
            );
            return {
              ...msg,
              tempId: existing?.tempId || `msg_${Date.now()}_${index}`,
              feedback: existing?.feedback,
            };
          });
        }

        const newMessages = transcript.slice(prev.length);
        const newMessagesWithIds = newMessages.map((msg, index) => ({
          ...msg,
          tempId: msg.tempId || `msg_${Date.now()}_${prev.length}_${index}`,
        }));
        const updatedTranscript = [...prev, ...newMessagesWithIds];

        const lastMessage = updatedTranscript[updatedTranscript.length - 1];

        // Generate feedback for new user messages
        if (
          lastMessage &&
          lastMessage.source === 'user' &&
          !feedbackIsLoading &&
          realtimeCoachingEnabled &&
          sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION &&
          !feedbackGenerationRef.current.has(lastMessage.tempId)
        ) {
          feedbackGenerationRef.current.add(lastMessage.tempId);
          generateFeedback({
            transcript: updatedTranscript,
            message: lastMessage,
          });

          // Add sales action tracking for ElevenLabs path (matching LiveKit path)
          if (lastMessage.message?.trim()) {
            processUserMessage(lastMessage.message, lastMessage.tempId);
          }
        }

        return updatedTranscript;
      }

      // LiveKit-specific logic: handle both new messages and content updates
      let updatedTranscript: TranscriptEntry[];

      if (transcript.length > prev.length) {
        // New messages added - use stable message-based IDs
        const newMessages = transcript.slice(prev.length);
        const newMessagesWithIds = newMessages.map((msg, index) => {
          // Create stable ID based on message content and position
          const messageHash = btoa(
            encodeURIComponent(
              msg.message + msg.source + (prev.length + index),
            ),
          ).replace(/[/+=]/g, '');
          return {
            ...msg,
            tempId: msg.tempId || `msg_${messageHash}_${prev.length + index}`,
          };
        });
        updatedTranscript = [...prev, ...newMessagesWithIds];
      } else {
        // Same number of messages, update content (for streaming)
        updatedTranscript = transcript.map((msg, index) => {
          const existingMessage = prev[index];
          return {
            ...msg,
            tempId: existingMessage?.tempId || `msg_${Date.now()}_${index}`,
            feedback: existingMessage?.feedback, // Preserve existing feedback
          };
        });
      }

      // Generate feedback for LiveKit user messages with debouncing
      const lastMessage = updatedTranscript[updatedTranscript.length - 1];
      if (
        lastMessage &&
        lastMessage.source === 'user' &&
        !feedbackIsLoading &&
        realtimeCoachingEnabled &&
        sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION
      ) {
        // LiveKit: Use debounced feedback (wait for complete messages)
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }

        feedbackTimeoutRef.current = setTimeout(() => {
          const messageId = `feedback_${lastMessage.message}`;
          if (!feedbackGenerationRef.current.has(messageId)) {
            feedbackGenerationRef.current.add(messageId);
            generateFeedback({
              transcript: updatedTranscript,
              message: lastMessage,
            });
          }
        }, 2000);

        if (lastMessage.message?.trim()) {
          processUserMessage(lastMessage.message, lastMessage.tempId);
        }
      }

      return updatedTranscript;
    });
  }, [
    transcript,
    realtimeCoachingEnabled,
    sessionPhaseRef.current,
    processUserMessage,
  ]);

  const handleToggleRealtimeCoaching = useCallback((enabled: boolean) => {
    setRealtimeCoachingEnabled(enabled);
    console.log('Real-time coaching toggled:', enabled);
  }, []);

  // Transition from CONNECTING → MAIN_CONVERSATION when the AI agent first speaks
  useEffect(() => {
    if (isAISpeaking && sessionPhaseRef.current === SessionPhase.CONNECTING) {
      console.log(
        '--- SETTING PHASE TO MAIN_CONVERSATION (agent started speaking) ---',
      );
      setPhase(SessionPhase.MAIN_CONVERSATION);
    }
  }, [isAISpeaking]);

  // Function to start the practice session
  const handleStartPractice = async () => {
    console.log('🔄 Transitioning to main conversation');

    try {
      // Update phase to connecting
      console.log('--- SETTING PHASE TO CONNECTING ---');
      setPhase(SessionPhase.CONNECTING);

      // Ensure UI updates before continuing
      await new Promise((resolve) => setTimeout(resolve, 50));

      practiceStartedRef.current = true;

      // Update title bar action immediately when practice starts
      titleBarStore.setAction(
        <Button
          variant="primary"
          className="!hover:bg-[#C50B00] !bg-[#E60D00] px-4 py-2 text-sm font-medium text-white md:ml-0 md:rounded-full md:px-2.5 md:py-1.5"
          onClick={() => setIsEndSessionDialogOpen(true)}
        >
          {t('sessions.endSession')}
        </Button>,
        () => {},
      );

      // Voice configuration is now handled by the useConversation hook
      // which uses the persona's voiceIds configuration automatically
      console.log(
        'Voice selection will be handled by the conversation hook using persona voice configuration',
      );

      // Connect to conversation service
      await connectConversation();

      // Initialize the start time for session duration tracking
      startTimeRef.current = Date.now();

      // AIA Korea session time limits
      if (isAiaKoSession) {
        const isS1 =
          session?.assessmentType === 'aia-ko-opening-objection-call';
        const hardLimitMs = isS1 ? 5 * 60 * 1000 : 10 * 60 * 1000;
        const warningMs = hardLimitMs - 60 * 1000;

        sessionTimerRef.current = setTimeout(() => {
          setSessionTimeWarning(true);
          warningDismissRef.current = setTimeout(() => {
            setSessionTimeWarning(false);
          }, 10000);
        }, warningMs);

        sessionHardTimerRef.current = setTimeout(() => {
          handleEndPracticeRef.current();
        }, hardLimitMs);
      }

      // 11labs direct has no cold start — transition immediately
      // LiveKit waits for the agent to actually speak (see useEffect below)
      if (provider !== 'livekit') {
        console.log('--- SETTING PHASE TO MAIN_CONVERSATION ---');
        setPhase(SessionPhase.MAIN_CONVERSATION);
      }

      reportRoleplayStarted();
    } catch (error) {
      console.error('Error starting practice:', error);
      setPhase(SessionPhase.PRE_START);
      toast.error(t('sessions.startPracticeError'));
    }
  };

  // Function to end the practice session
  const handleEndPractice = useCallback(async () => {
    try {
      // Clear session time limit timers
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      if (sessionHardTimerRef.current) {
        clearTimeout(sessionHardTimerRef.current);
        sessionHardTimerRef.current = null;
      }
      setSessionTimeWarning(false);
      if (warningDismissRef.current) {
        clearTimeout(warningDismissRef.current);
        warningDismissRef.current = null;
      }

      console.log('--- SETTING PHASE TO ENDING ---');
      setPhase(SessionPhase.ENDING);

      // Use transcript with feedback for ending session
      // Attach measured response times to user messages
      let userTurnIndex = 0;
      const formattedTranscript = transcriptWithFeedback.map(
        (msg: TranscriptEntry) => {
          const entry: {
            role: string;
            content: string;
            sent: string;
            feedback?: { type: string; content: string };
            responseTimeSec?: number;
          } = {
            role: msg.source,
            content: msg.message,
            sent: msg.timestamp.toISOString(),
            feedback: msg.feedback,
          };

          if (msg.source === 'user') {
            const rt = responseTimes.find((r) => r.turnIndex === userTurnIndex);
            if (rt) {
              entry.responseTimeSec = rt.responseTimeSec;
            }
            userTurnIndex++;
          }

          return entry;
        },
      );
      // Stop AI speaking animation
      setIsAISpeaking(false);

      // Disconnect from conversation service
      await disconnectConversation();

      // End the session via API
      await endSession({
        transcript: formattedTranscript,
        duration: (Date.now() - startTimeRef.current) / 1000,
        conversation,
      });
    } catch (error) {
      console.error('Error ending practice:', error);
      toast.error(t('sessions.endPracticeError'));
    }
  }, [
    transcriptWithFeedback,
    endSession,
    disconnectConversation,
    setPhase,
    startTimeRef,
    conversation,
    responseTimes,
  ]);

  // Keep ref in sync so timer closures always call the latest version
  handleEndPracticeRef.current = handleEndPractice;

  const showFeedbackPopup = (feedback: { type: string; content: string }) => {
    setVisibleFeedback(feedback);

    // Hide after 5 seconds
    setTimeout(() => {
      setVisibleFeedback(null);
    }, 5000);
  };

  const onCloseEndSessionDialog = useCallback(() => {
    setIsEndSessionDialogOpen(false);
  }, []);

  const handleTranscriptImport = useCallback(
    (importedTranscript: { role: string; content: string; sent: string }[]) => {
      posthog.capture('transcript_imported', {
        sessionId: sessionId,
        messageCount: importedTranscript.length,
      });

      endSession({
        transcript: importedTranscript,
        duration: importedTranscript.length * 5,
        conversation: null,
      });

      setIsTranscriptImportModalOpen(false);
    },
    [endSession, posthog, sessionId],
  );

  // Render error message if there's an error
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">
            {t('sessions.error')}
          </h2>
          <p>{error}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            {t('sessions.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while session is loading
  if (isLoading || !session) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="gradient-spinner size-8 rounded-full"></div>
          <p className="text-base text-gray-700">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Check if session is finished
  if (session?.endedAt) {
    return <FinishedSessionView session={session} />;
  }

  const displayTranscript =
    realtimeCoachingEnabled && practiceStartedRef.current;

  // Matches the Practice Overview button dimensions exactly (top-3 right-4 left-4 px-4 py-3 rounded-xl)
  const sessionTimeWarningBanner = (
    <div
      className={clsx(
        'absolute top-3 right-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 transition-all duration-500 ease-out',
        sessionTimeWarning
          ? 'translate-y-0 opacity-100'
          : '-translate-y-4 pointer-events-none opacity-0',
      )}
    >
      <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-orange-900">
          {t('sessions.sessionTimeWarning', {
            minutes:
              session?.assessmentType === 'aia-ko-opening-objection-call'
                ? 5
                : 10,
          })}
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full w-full bg-gradient-to-b from-gray-50 to-white lg:bg-white">
      {endSessionIsProcessing && <SessionFeedbackLoading />}

      <EndSessionDialog
        isOpen={isEndSessionDialogOpen}
        onClose={onCloseEndSessionDialog}
        onConfirm={() => {
          onCloseEndSessionDialog();
          handleEndPractice();
        }}
      />

      <InsightModal
        isOpen={insightsModalOpen}
        onClose={() => setInsightsModalOpen(false)}
        sessionId={sessionId}
        shouldReturnHome={true}
      />

      {canImportTranscript && (
        <TranscriptImportModal
          isOpen={isTranscriptImportModalOpen}
          onClose={() => setIsTranscriptImportModalOpen(false)}
          onImport={handleTranscriptImport}
          session={session}
          isLoading={endSessionIsProcessing}
        />
      )}

      {/* Desktop Layout - Original Three Panel Design */}
      <div className="hidden h-full w-full bg-[#F6F8F8] lg:flex">
        {/* Left Panel - Scenario Information */}
        <aside className="flex h-full w-1/4 flex-col overflow-y-auto border-r border-[#EAEDEF] bg-white p-6">
          <RoleplayDetailsSection session={session} />
        </aside>

        {/* Center - AI Avatar and Interaction */}
        <main className="relative flex w-2/4 flex-col">
          <div
            className={clsx(
              'relative z-20 flex items-center justify-center',
              displayTranscript ? 'h-[60%]' : 'flex-1',
            )}
          >
            <CenterSection
              handleStartPractice={handleStartPractice}
              isAISpeaking={isAISpeaking}
              sessionPhaseRef={sessionPhaseRef}
              persona={session?.persona}
              displayTranscript={displayTranscript}
              product={session?.product?.name}
              callType={session?.module?.title ?? t('sessions.discovery')}
              moduleId={session?.module?.friendlyId}
              assessmentType={session?.assessmentType}
              onImportTranscript={
                canImportTranscript
                  ? () => setIsTranscriptImportModalOpen(true)
                  : undefined
              }
            />
          </div>

          {displayTranscript && (
            <div className="relative -mt-20 h-[50%]">
              <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-20 bg-gradient-to-b from-[#F6F8F8] via-[#F6F8F8]/70 to-transparent" />

              <Transcript
                messages={transcriptWithFeedback}
                characterName={session?.persona?.name}
                isAIResponding={isAIResponding}
                endOfMessagesRef={endOfMessages}
                className="relative z-0"
              />
            </div>
          )}

          <div className="flex justify-center">
            <RealtimeFeedbackControls
              sessionPhaseRef={sessionPhaseRef}
              startTimeRef={startTimeRef}
              realtimeCoachingEnabled={realtimeCoachingEnabled}
              onToggleRealtimeCoaching={handleToggleRealtimeCoaching}
            />
          </div>
        </main>

        {/* Right Panel - Feedback and Stats */}
        {session && (
          <aside className="flex h-full w-1/4 flex-col overflow-y-auto border-l border-[#EAEDEF] bg-white">
            <ClientAndProductInfoSection session={session} />
          </aside>
        )}
      </div>

      {/* Mobile Layout - Full Width Call Interface */}
      <main className="relative flex flex-1 flex-col items-center justify-center bg-[#F6F8F8] lg:hidden">
        <div
          onClick={() => setIsPracticePreviewModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsPracticePreviewModalOpen(true);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={t('roleplay.practiceOverview')}
          className={
            'absolute top-3 right-4 left-4 z-40 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-all duration-200'
          }
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {t('roleplay.practiceOverview')}
            </span>
            <span className="mt-0.5 text-xs text-gray-700">
              {t('roleplay.practiceOverviewDescription')}
            </span>
          </div>

          <div className="flex h-5 w-5 items-center justify-center text-gray-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>

        {sessionTimeWarningBanner}

        <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col pt-20">
          <div
            className={clsx(
              'relative z-20 m-5 flex items-center',
              displayTranscript ? 'h-[25%]' : 'flex-1 justify-center',
            )}
          >
            <CenterSection
              handleStartPractice={handleStartPractice}
              isAISpeaking={isAISpeaking}
              sessionPhaseRef={sessionPhaseRef}
              persona={session?.persona}
              displayTranscript={displayTranscript}
              product={session?.product?.name}
              callType={session?.module?.title ?? t('sessions.discovery')}
              assessmentType={session?.assessmentType}
              onImportTranscript={
                canImportTranscript
                  ? () => setIsTranscriptImportModalOpen(true)
                  : undefined
              }
            />
          </div>

          {displayTranscript && (
            <div
              className={clsx(
                'relative flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out',
                displayTranscript ? 'h-[75%]' : 'h-0',
              )}
            >
              <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-20 bg-gradient-to-b from-[#F6F8F8] to-transparent" />
              <Transcript
                messages={transcriptWithFeedback}
                characterName={session?.persona?.name}
                isAIResponding={isAIResponding}
                endOfMessagesRef={endOfMessages}
                className="relative z-0 h-full overflow-y-auto"
              />
            </div>
          )}

          <div className="mt-auto flex flex-shrink-0 justify-center">
            <RealtimeFeedbackControls
              sessionPhaseRef={sessionPhaseRef}
              startTimeRef={startTimeRef}
              realtimeCoachingEnabled={realtimeCoachingEnabled}
              onToggleRealtimeCoaching={handleToggleRealtimeCoaching}
              isMobile={true}
            />
          </div>
          <InfoModal
            isOpen={isPracticePreviewModalOpen}
            onClose={() => setIsPracticePreviewModalOpen(false)}
            title={t('roleplay.practiceDetails')}
          >
            <PracticeOverview
              session={session}
              onGoToRoleplay={() => setIsPracticePreviewModalOpen(false)}
            />
          </InfoModal>
        </div>
      </main>
    </div>
  );
}, withAuthenticationRequiredOptions);
