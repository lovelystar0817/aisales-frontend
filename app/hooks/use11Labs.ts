import { Conversation } from '@elevenlabs/client'
import { usePostHog } from 'posthog-js/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { apiProtected } from '~/util/api'
import {
  ELEVEN_LABS_AGENT_ID,
  ELEVEN_LABS_AIA_KO_AGENT_ID,
  ELEVEN_LABS_GREAT_EASTERN_AGENT_ID,
  ELEVEN_LABS_KT_AXA_AGENT_ID,
  ELEVEN_LABS_LALAMOVE_AGENT_ID,
  SessionPhase
} from '~/util/constants'
import type {
  ConversationInterface,
  ConversationParams,
  Session,
  TranscriptEntry,
} from './useConversation'
import { useSessionPhase } from './useSessionPhase'

const isKtAxaSession = (session: Session) =>
  session?.assessmentType === 'kt-axa-recruitment' ||
  session?.assessmentType === 'kt-axa-fna' ||
  session?.assessmentType === 'kt-axa-wealthplus';

const isAiaKoSession = (session: Session) =>
  session?.assessmentType === 'aia-ko-opening-objection-call' ||
  session?.assessmentType === 'aia-ko-product-pitch' ||
  session?.assessmentType === 'aia-ko-end-to-end-outbound-call';

const isLalamoveSession = (session: Session) =>
  session?.callType?.startsWith('lalamove-driver-registration');
const isGreatEasternSession = (session: Session) =>
  session?.assessmentType === 'great-eastern';

const getAgentId = (session: Session): string => {
  if (isKtAxaSession(session)) return ELEVEN_LABS_KT_AXA_AGENT_ID;
  if (isAiaKoSession(session)) return ELEVEN_LABS_AIA_KO_AGENT_ID;
  if (isGreatEasternSession(session)) return ELEVEN_LABS_GREAT_EASTERN_AGENT_ID;
  return ELEVEN_LABS_AGENT_ID;
};

const MAX_RETRIES = 5;

// Helper to detect mobile devices
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// --- Error utilities for better diagnostics ---
function isCloseEventLike(err: unknown): boolean {
  // In browsers, CloseEvent is available; otherwise detect by shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr: any = err;
  return (
    (typeof CloseEvent !== 'undefined' && err instanceof CloseEvent) ||
    (anyErr &&
      typeof anyErr === 'object' &&
      'code' in anyErr &&
      'type' in anyErr)
  );
}

function extractCloseEvent(err: unknown): {
  code?: number;
  reason?: string;
  wasClean?: boolean;
  type?: string;
} | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e: any = err;
  if (isCloseEventLike(err)) {
    return {
      code: typeof e.code === 'number' ? e.code : undefined,
      reason: typeof e.reason === 'string' ? e.reason : undefined,
      wasClean: typeof e.wasClean === 'boolean' ? e.wasClean : undefined,
      type: typeof e.type === 'string' ? e.type : undefined,
    };
  }
  return null;
}

function serializeUnknownError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  const ce = extractCloseEvent(err);
  if (ce) return { kind: 'CloseEvent', ...ce };
  if (typeof err === 'object' && err !== null) {
    try {
      // Shallow copy enumerable fields
      return { ...(err as unknown as Record<string, unknown>) };
    } catch {
      // fallthrough
    }
  }
  return { value: String(err), type: typeof err };
}

function buildNetworkBlockMessage(host?: string): string {
  const domainHint = host ? ` (${host})` : '';
  return (
    `Unable to establish voice connection${domainHint}. ` +
    'Your network may be blocking real‑time voice (WebSocket/WebRTC). ' +
    'Please try a different network or disable VPN/proxy/ad‑blockers. If on a corporate network, contact your administrator to allow wss and WebRTC traffic to the voice provider.'
  );
}

const dummyPrompt = `You will roleplay as Alex, a 45-year-old Senior Finance Director who is somewhat interested in financial solutions but still uncertain about several aspects. This is a discovery call simulation where a financial advisor will attempt to build rapport and secure a follow-up meeting with you.
Your Character (Alex)

Age: 45
Occupation: Senior Finance Director at a mid-sized tech company
Financial situation: Stable income ($175,000/year), some investments, but your financial planning is somewhat disorganized
Personality: Analytical, busy, slightly skeptical but open to valuable insights
Current concerns: You're trying to organize your finances and aren't immediately interested in insurance products

Your Behavior During the Call

Initial attitude: Be polite but reserved. You're busy and somewhat skeptical of financial advisors trying to sell you products.
Response to introduction: Ask basic questions about their background and firm, but don't show excessive interest yet.
Main objection: When they begin discussing solutions, interject with: "I appreciate the information, but I'm not really interested in insurance right now. I'm still sorting out my finances."
Response to rapport-building: Gradually warm up if they demonstrate genuine understanding of your situation without pushing products.
Response to Feel-Felt-Found technique:

Feel: If they acknowledge how you feel about organizing finances first, show slight positive response
Felt: If they share how other clients felt similar concerns, become more engaged
Found: If they explain what other clients discovered through financial check-ups (without heavy product focus), show increased interest


Decision factors: You will agree to a 30-minute discovery meeting ONLY if:

They focus on helping you organize your finances rather than selling insurance
They demonstrate specific value for someone in your position
They respect your time and concerns
They explain what you'll gain from the discovery meeting without commitment


Conversational style: Speak professionally but conversationally. Ask clarifying questions. Occasionally mention your busy schedule.

Interaction Guidelines

Don't make it too easy - pose realistic challenges that test their ability to use the 3Fs technique
If they pitch products too early, become more resistant
If they genuinely address your concerns about organizing finances first, gradually show more interest
End the call by either agreeing to a follow-up meeting (if they've met your criteria) or politely declining (if they haven't)
Provide subtle opportunities for them to demonstrate the Feel-Felt-Found technique

This roleplay should realistically test the financial advisor's ability to build rapport, address objections using the 3Fs technique, and secure a follow-up meeting without premature product pitching.`;

export const use11Labs = ({
  session,
  language: userLanguage = 'en', // Get language from params, default to English
  startTimeRef,
  setIsAISpeaking,
  setError,
}: ConversationParams): ConversationInterface => {
  const conversationRef = useRef<Conversation | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const isPreparingRef = useRef(false);
  const isPreparationCompleteRef = useRef(false);
  const lastSignedUrlRef = useRef<string | null>(null);

  const voiceConfigRef = useRef<{
    voiceId: string;
    personaName: string;
    language: string;
  } | null>(null);

  // Track reconnection attempts to prevent infinite loops
  const reconnectionAttemptsRef = useRef(0);
  const isReconnectingRef = useRef(false);
  const MAX_RECONNECTION_ATTEMPTS = 3;

  // Use actual user language instead of mocked data
  const company = { name: 'Hupo' };

  const { sessionPhaseRef, setPhase } = useSessionPhase();
  const posthog = usePostHog();

  const getAgentId = (session: Session): string => {
    const aiaKoVoiceV2Enabled =
      posthog.isFeatureEnabled('aiako-voice-v2') || false;

    if (isKtAxaSession(session)) return ELEVEN_LABS_KT_AXA_AGENT_ID;
    if (isAiaKoSession(session)) {
      return ELEVEN_LABS_AIA_KO_AGENT_ID;
      // return aiaKoVoiceV2Enabled
      //   ? ELEVEN_LABS_AIA_KO_AGENT_ID_2
      //   : ELEVEN_LABS_AIA_KO_AGENT_ID;
    }
    if (isLalamoveSession(session)) return ELEVEN_LABS_LALAMOVE_AGENT_ID;
    if (isGreatEasternSession(session)) return ELEVEN_LABS_GREAT_EASTERN_AGENT_ID;
    return ELEVEN_LABS_AGENT_ID;
  };

  console.log('VEngine: Hook initialized', {
    sessionId: session?._id,
    userLanguage: userLanguage,
    currentPhase: sessionPhaseRef.current,
    hasSession: !!session,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only log if in active conversation
        if (sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION) {
          console.log('VEngine: 📱 App backgrounded', {
            voiceId: voiceConfigRef.current?.voiceId,
            persona: voiceConfigRef.current?.personaName,
          });
        }
      } else {
        // Only log and verify if in active conversation
        if (
          conversationRef.current &&
          sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION &&
          voiceConfigRef.current
        ) {
          console.log('VEngine: 📱 App foregrounded - verifying voice config', {
            voiceId: voiceConfigRef.current.voiceId,
            persona: voiceConfigRef.current.personaName,
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?._id, sessionPhaseRef]);

  const getSignedUrl = useCallback(async (): Promise<string> => {
    try {
      const agentId = getAgentId(session);
      const response = await apiProtected()
        .url(`/elevenlabs/get-signed-url`)
        .query({ agentId })
        .get()
        .json<{ signedUrl: string }>();
      if (!response) {
        throw new Error('Failed to get token');
      }
      lastSignedUrlRef.current = response.signedUrl;
      return response.signedUrl;
    } catch (error) {
      console.error('Failed to get token:', serializeUnknownError(error));
      throw error;
    }
  }, [session]);

  // Prepare resources for faster connection later
  const prepareForConnection = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous preparation attempts
    if (isPreparingRef.current || isPreparationCompleteRef.current) {
      console.log('VEngine: Preparation already in progress or completed', {
        isPreparing: isPreparingRef.current,
        isCompleted: isPreparationCompleteRef.current,
      });
      return;
    }

    isPreparingRef.current = true;

    try {
      console.log('VEngine: Beginning advanced preparation', {
        sessionId: session?._id,
        timestamp: new Date().toISOString(),
      });

      // The 11Labs SDK doesn't have a preloadResources method,
      // but we can do some lightweight preparation
      // by pre-initializing some SDK modules
      // This is a no-op for now, but we mark preparation as complete anyway
      // to ensure consistent behavior with other providers

      console.log('VEngine: Preparation complete', {
        sessionId: session?._id,
        timestamp: new Date().toISOString(),
      });

      isPreparationCompleteRef.current = true;
    } catch (err) {
      console.log('VEngine: Preparation error', {
        sessionId: session?._id,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
      // We don't surface preparation errors to the user
    } finally {
      isPreparingRef.current = false;
    }
  }, [session?._id]);

  const getLanguageInstructions = (language: string): string => {
    const instructions: Record<string, string> = {
      en: 'IMPORTANT: You must speak ONLY in English throughout the entire conversation. Do not switch to any other language under any circumstances.',
      ru: 'ВАЖНО: Вы должны говорить ТОЛЬКО на русском языке на протяжении всего разговора. Ни при каких обстоятельствах не переходите на другой язык.',
      es: 'IMPORTANTE: Debes hablar SOLO en español durante toda la conversación. No cambies a ningún otro idioma bajo ninguna circunstancia.',
      fr: 'IMPORTANT:  Vous devez parler UNIQUEMENT en français pendant toute la conversation. Ne changez pas de langue en aucun cas.',
      de: 'WICHTIG: Sie müssen während des gesamten Gesprächs NUR auf Deutsch sprechen. Wechseln Sie unter keinen Umständen zu einer anderen Sprache.',
      it: 'IMPORTANTE: Devi parlare SOLO in italiano durante tutta la conversazione. Non cambiare lingua in nessun caso.',
      pt: 'IMPORTANTE: Você deve falar APENAS em português durante toda a conversa. Não mude de idioma em hipótese alguma.',
      zh: '重要提示：您必须在整个对话过程中只说中文。在任何情况下都不要切换到其他语言。',
      ja: '重要：会話全体を通して日本語のみで話してください。いかなる状況でも他の言語に切り替えないでください。',
      ko: '중요: 전체 대화 동안 한국어로만 말해야 합니다. 어떤 경우에도 다른 언어로 바꾸지 마세요.',
      id: 'PENTING: Anda harus berbicara HANYA dalam bahasa Indonesia sepanjang percakapan. Jangan beralih ke bahasa lain dalam keadaan apapun.',
      ms: 'PENTING: Anda mesti bercakap dalam bahasa Melayu SAHAJA sepanjang perbualan. Jangan tukar ke bahasa lain dalam apa jua keadaan.',
      vi: 'QUAN TRỌNG: Bạn phải nói CHỈ bằng tiếng Việt trong suốt cuộc trò chuyện. Không được chuyển sang ngôn ngữ khác trong bất kỳ trường hợp nào.',
      ceb: 'IMPORTANTE: Kinahanglan nimo LAMANG magsulti sa Cebuano sa tibuok panagsultihay. Ayaw pagbalhin sa lain nga pinulongan sa bisan unsang kahimtang.',
      tl: 'MAHALAGA: Dapat kang magsalita LAMANG ng Tagalog sa buong pag-uusap. Huwag lumipat sa ibang wika sa anumang sitwasyon.',
      th: 'สำคัญ: คุณต้องพูดเฉพาะภาษาไทยตลอดการสนทนา ห้ามเปลี่ยนไปใช้ภาษาอื่นไม่ว่าในกรณีใดๆ',
    };

    return instructions?.[language] || instructions?.en || '';
  };

  const connectConversation = async (): Promise<void> => {
    console.log('VEngine: Connection attempt started', {
      sessionId: session?._id,
      currentPhase: sessionPhaseRef.current,
      agentId: getAgentId(session),
      isPrepared: isPreparationCompleteRef.current,
    });

    setError(null);

    let retryCount = 0;
    let lastError: unknown = null;

    while (retryCount < MAX_RETRIES) {
      try {
        if (!userLanguage) {
          throw new Error('User language not available');
        }

        let language = userLanguage === 'English' ? 'en' : userLanguage;
        if (userLanguage === 'cmn') {
          language = 'zh';
        }

        console.log(`VEngine Attempt ${retryCount + 1}/${MAX_RETRIES}`, {
          sessionId: session?._id,
          userLanguage: userLanguage,
          mappedLanguage: language,
          timestamp: new Date().toISOString(),
        });
        console.log('VEngine: Session voice data:', session?.voice);

        console.log('VEngine: Fetching fresh signed URL for this session...');
        const signedUrl = await getSignedUrl();

        // Get voice prompts for this session
        let voicePrompt = dummyPrompt; // fallback

        if (session?.voice) {
          console.log('VEngine: Using session voice data');
          voicePrompt = session.voice.prompt.main;
        } else {
          console.warn(
            'VEngine: No voice data in session, using fallback prompt',
          );
        }

        const languageInstruction = getLanguageInstructions(language);
        voicePrompt = `${languageInstruction}\n\n${voicePrompt}`;

        console.log('VEngine: Using voice configuration', {
          hasVoicePrompt: !!voicePrompt,
          promptLength: voicePrompt?.length || 0,
          timestamp: new Date().toISOString(),
        });

        const firstMessage = session?.voice?.firstMessage || '';

        // Detect mobile device
        const isMobile = isMobileDevice();

        const config: any = {
          signedUrl,
          overrides: {
            agent: {
              prompt: {
                prompt: voicePrompt,
              },
              firstMessage: firstMessage,
              language: language,
            },
            // Apply mobile-optimized STT settings only on mobile
            ...(isMobile && {
              stt: {
                model: 'scribe_v2',
                // Mobile-specific: Longer threshold to handle network latency and prevent premature cutoffs
                // endOfSpeechThresholdMs: 1200,
                // Mobile-specific: Lower sensitivity to capture speech better in noisy mobile environments
                vadSensitivity: 'low',
              },
            }),
          },
        };

        if (isMobile) {
          console.log('VEngine: 📱 Applying mobile-optimized STT settings', {
            endOfSpeechThresholdMs: 1200,
            vadSensitivity: 'low',
          });
        }

        // Set persona-specific voice ID if available
        if (session?.persona) {
          const voiceId = session.persona.voiceId;
          console.log('Voice ID:', voiceId);

          if (voiceId) {
            voiceConfigRef.current = {
              voiceId: voiceId,
              personaName: session.persona.name,
              language: language,
            };

            config.overrides.tts = {
              voiceId: voiceId,
            };

            console.log('VEngine: Using persona-specific voice configuration', {
              provider: '11labs',
              voiceId: voiceId,
              personaName: session.persona.name,
              language: language,
              storedInRef: true,
            });
          } else {
            console.log(
              'VEngine: No voice ID found for persona, using default',
              {
                personaName: session.persona.name,
                language: language,
              },
            );
          }
        } else {
          console.log('VEngine: No persona available, using default voice');
          config.overrides.tts = {};
        }

        const conversation = await Conversation.startSession({
          ...config,
          onConnect: ({ conversationId: convId }) => {
            console.log('VEngine: Connection established successfully', {
              sessionId: session?._id,
              conversationId: convId,
              timestamp: new Date().toISOString(),
            });

            if (
              voiceConfigRef.current &&
              session?.persona?.voiceId !== voiceConfigRef.current.voiceId
            ) {
              console.error('VEngine: ⚠️ VOICE MISMATCH DETECTED!', {
                expected: voiceConfigRef.current.voiceId,
                actual: session?.persona?.voiceId,
                persona: voiceConfigRef.current.personaName,
              });
            }

            // Reset reconnection attempts on successful connection
            reconnectionAttemptsRef.current = 0;
            isReconnectingRef.current = false;

            // Save the conversation ID
            setConversationId(convId);

            startTimeRef.current = Date.now();
            setPhase(SessionPhase.MAIN_CONVERSATION);

            console.log('VEngine: Phase updated to MAIN_CONVERSATION', {
              startTime: startTimeRef.current,
              conversationId: convId,
              timestamp: new Date().toISOString(),
            });
          },
          onDisconnect: (details) => {
            console.log('VEngine: Disconnected from service', {
              sessionId: session?._id,
              timestamp: new Date().toISOString(),
              details: serializeUnknownError(details),
            });

            setIsAISpeaking(false);

            // Only attempt reconnection if:
            // 1. We have voice configuration stored
            // 2. We're in active conversation phase
            // 3. We haven't exceeded max reconnection attempts
            // 4. We're not already reconnecting
            const shouldReconnect =
              voiceConfigRef.current &&
              sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION &&
              reconnectionAttemptsRef.current < MAX_RECONNECTION_ATTEMPTS &&
              !isReconnectingRef.current;

            if (shouldReconnect) {
              reconnectionAttemptsRef.current += 1;
              isReconnectingRef.current = true;

              console.log('VEngine: 🔄 Auto-reconnect with voice restoration', {
                attempt: reconnectionAttemptsRef.current,
                voiceId: voiceConfigRef.current?.voiceId,
                persona: voiceConfigRef.current?.personaName,
              });

              // Wait 2 seconds before reconnecting to allow network to stabilize
              setTimeout(() => {
                connectConversation()
                  .then(() => {
                    console.log('VEngine: ✅ Auto-reconnection successful');
                  })
                  .catch((err) => {
                    console.error('VEngine: ❌ Auto-reconnection failed');
                    isReconnectingRef.current = false;

                    // Show error to user if all reconnection attempts failed
                    if (
                      reconnectionAttemptsRef.current >=
                      MAX_RECONNECTION_ATTEMPTS
                    ) {
                      toast.error(
                        'Connection lost. Please check your network and try reconnecting manually.',
                      );
                    }
                  });
              }, 2000);
            }
          },
          onError: (error: unknown) => {
            const serialized = serializeUnknownError(error);
            const ce = extractCloseEvent(error);
            const errorMessage =
              (serialized.message as string) ||
              (serialized.reason as string) ||
              'Connection Error';
            console.log('VEngine: onError event triggered', {
              sessionId: session?._id,
              error: serialized,
              timestamp: new Date().toISOString(),
            });
            // If we detect a network-level close (common when firewalls/VPNs block), surface a clear message
            if (
              ce &&
              (ce.code === 1006 || ce.code === 1005) &&
              ce.wasClean === false
            ) {
              const host = (() => {
                try {
                  return lastSignedUrlRef.current
                    ? new URL(lastSignedUrlRef.current).host
                    : undefined;
                } catch {
                  return undefined;
                }
              })();
              const msg = buildNetworkBlockMessage(host);
              setError(msg);
              toast.error(msg);
              return;
            }
            setError(errorMessage);
            toast.error(errorMessage);
          },
          onModeChange: ({ mode }: { mode: string }) => {
            console.log('VEngine: Mode changed', {
              sessionId: session?._id,
              newMode: mode,
              previousMode: mode === 'speaking' ? 'listening' : 'speaking',
              timestamp: new Date().toISOString(),
            });

            setIsAISpeaking(mode === 'speaking');
          },
          onMessage: ({
            source,
            message,
          }: {
            source: 'ai' | 'user';
            message: string;
          }) => {
            // Strip ElevenLabs expressive tags, Scribe V2 audio event tags (including unclosed), and XML-style tags
            const cleanMessage = message
              .replace(/\[[^\]]{2,}\]?/g, '')
              .replace(/<\/?[a-zA-Z][^>]*>/g, '')
              .replace(/\s{2,}/g, ' ')
              .trim();

            if (!cleanMessage) return;

            console.log('VEngine: Message received', {
              sessionId: session?._id,
              source,
              messageLength: cleanMessage.length,
              messagePreview:
                cleanMessage.substring(0, 30) +
                (cleanMessage.length > 30 ? '...' : ''),
              timestamp: new Date().toISOString(),
            });

            setTranscript((prev) => {
              // ElevenLabs SDK can fire onMessage twice for the same agent response,
              // sometimes with a user transcript sandwiched in between.
              // The later one is contextually correct (it's the actual response to user input),
              // so remove the earlier duplicate and append the new one.
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].source === source) {
                  if (prev[i].message === cleanMessage) {
                    const filtered = [...prev];
                    filtered.splice(i, 1);
                    return [
                      ...filtered,
                      { source, message: cleanMessage, timestamp: new Date() },
                    ];
                  }
                  break;
                }
              }

              return [
                ...prev,
                { source, message: cleanMessage, timestamp: new Date() },
              ];
            });
          },
        });

        // Connection successful
        conversationRef.current = conversation;

        // Also try to get conversation ID from the conversation object itself
        if (
          !conversationId &&
          conversation &&
          typeof conversation.getId === 'function'
        ) {
          const convId = conversation.getId();
          if (convId) {
            setConversationId(convId);
            console.log('VEngine: Got conversation ID from getId()', {
              conversationId: convId,
            });
          }
        }

        console.log('VEngine: Session started successfully', {
          sessionId: session?._id,
          conversationId: conversationId,
          timestamp: new Date().toISOString(),
        });
        return; // Exit the function on success
      } catch (err) {
        const serialized = serializeUnknownError(err);
        const ce = extractCloseEvent(err);
        console.log('VEngine: Connection error caught', {
          sessionId: session?._id,
          attemptNumber: retryCount + 1,
          errorType: (serialized as any)?.name || typeof err,
          errorMessage:
            (serialized as any)?.message ||
            (serialized as any)?.reason ||
            String(err),
          errorDetails: serialized,
          timestamp: new Date().toISOString(),
        });
        console.log('FULL ERR:', serialized);

        lastError = err;
        retryCount++;
        // Detect likely firewall/VPN/proxy block (abnormal close without reason)
        if (
          ce &&
          (ce.code === 1006 || ce.code === 1005) &&
          ce.wasClean === false
        ) {
          const host = (() => {
            try {
              return lastSignedUrlRef.current
                ? new URL(lastSignedUrlRef.current).host
                : undefined;
            } catch {
              return undefined;
            }
          })();
          const msg = buildNetworkBlockMessage(host);
          console.error('VEngine: Network blocked (firewall/VPN)', { host });
          setError(msg);
          toast.error(msg);
          return; // Stop retry loop immediately on network block
        }

        if (retryCount < MAX_RETRIES) {
          const delayMs = 1000 * retryCount;
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    console.error('VEngine: All connection attempts failed', {
      attempts: MAX_RETRIES,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    const errorMessage =
      lastError instanceof Error
        ? lastError.message
        : 'Failed to connect to AI Coach after multiple attempts';

    setError(errorMessage);
    toast.error(errorMessage);
  };

  const disconnectConversation = useCallback((): void => {
    if (conversationRef.current) {
      conversationRef.current.endSession();
      conversationRef.current = null;
      console.log('VEngine: Session ended');
    }

    // This prevents auto-reconnection after user intentionally ends the session
    voiceConfigRef.current = null;
    reconnectionAttemptsRef.current = 0;
    isReconnectingRef.current = false;

    setIsAISpeaking(false);
    isPreparationCompleteRef.current = false;
  }, [setIsAISpeaking, session?._id, conversationId]);

  const safelySendResponse = (_responseData: any): boolean => {
    // TODO: Implement if needed for sales app
    return true;
  };

  return {
    connectConversation,
    disconnectConversation,
    transcript,
    safelySendResponse,
    prepareForConnection,
    conversation: conversationId
      ? `https://elevenlabs.io/app/conversational-ai/history/${conversationId}`
      : null,
  };
};
