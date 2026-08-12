import type {
  RoomOptions,
  TrackPublication,
  TranscriptionSegment,
} from 'livekit-client';
import { Participant, Room, RoomEvent, Track } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiProtected } from '~/util/api';
import type {
  ConversationInterface,
  ConversationParams,
  TranscriptEntry,
} from './useConversation';
import { useLanguage } from '~/context/language';

export const useLivekit = ({
  session,
  startTimeRef,
  isIntroCompletedRef,
  setIsAISpeaking,
  setError,
}: ConversationParams): ConversationInterface => {
  const disconnectionInProgressRef = useRef(false);
  const isConnectedRef = useRef(false);
  const livekitURL = import.meta.env.VITE_LIVEKIT_URL!;
  const roomRef = useRef<Room | null>(null);
  const [roomSid, setRoomSid] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const segmentMapRef = useRef<Map<string, TranscriptEntry>>(new Map());
  const { language } = useLanguage();
  const searchParams = new URLSearchParams(window.location.search);
  const voiceConfig =
    searchParams.get('config') || searchParams.get('voice-config') || '';

  const mergeConsecutiveMessages = (
    entries: TranscriptEntry[],
  ): TranscriptEntry[] => {
    if (entries.length === 0) return entries;

    const merged: TranscriptEntry[] = [];
    let currentEntry = { ...entries[0] };

    for (let i = 1; i < entries.length; i++) {
      const nextEntry = entries[i];

      if (currentEntry.source === nextEntry.source) {
        currentEntry.message = `${currentEntry.message} ${nextEntry.message}`;
        currentEntry.timestamp = nextEntry.timestamp;
      } else {
        merged.push(currentEntry);
        currentEntry = { ...nextEntry };
      }
    }

    merged.push(currentEntry);

    return merged;
  };

  // Handle transcription events
  useEffect(() => {
    if (!roomRef.current) return;

    const updateTranscriptions = (
      segments: TranscriptionSegment[],
      participant?: Participant,
      publication?: TrackPublication,
    ) => {
      let shouldUpdate = false;

      segments.forEach((segment) => {
        if (!segment.id) return;

        const existingEntry = segmentMapRef.current.get(segment.id);
        const source = participant?.identity?.startsWith('agent-')
          ? 'ai'
          : 'user';

        // For AI: show segments with sufficient length or final for real-time, for User: show segments with sufficient length or final
        const shouldInclude = segment.text.trim().length > 3 || segment.final; // Show user segments with 4+ chars or final for real-time

        if (shouldInclude) {
          // Strip Scribe V2 STT audio event tags, including unclosed ones (e.g. [키보드 타이핑], [코 훌쩍이는 소)
          const cleanText = segment.text
            .replace(/\[[^\]]{2,}\]?/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

          if (!cleanText) return;

          // Use firstReceivedTime from LiveKit segment for accurate ordering
          // This prevents transcript ordering issues when segments arrive out of order
          const segmentTimestamp = segment.firstReceivedTime
            ? new Date(segment.firstReceivedTime)
            : (existingEntry?.timestamp ?? new Date());

          const entry: TranscriptEntry = {
            source,
            message: cleanText,
            timestamp: segmentTimestamp,
            isStreaming: !segment.final, // Mark messages as streaming if not final (for both AI and user)
          };

          // Only update if this is a new entry or the message has changed significantly
          if (!existingEntry || existingEntry.message !== entry.message) {
            segmentMapRef.current.set(segment.id, entry);
            shouldUpdate = true;
          }
        }
      });

      // Only update transcript if we have new final segments
      if (shouldUpdate) {
        const allEntries = Array.from(segmentMapRef.current.values()).sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );

        const mergedEntries = mergeConsecutiveMessages(allEntries);
        setTranscript(mergedEntries);
      }
    };

    roomRef.current.on(RoomEvent.TranscriptionReceived, updateTranscriptions);
    return () => {
      roomRef.current?.off(
        RoomEvent.TranscriptionReceived,
        updateTranscriptions,
      );
    };
  }, [roomRef.current]);

  // Handle participant attributes (including agent state)
  useEffect(() => {
    if (!roomRef.current) return;

    const handleParticipantAttributesChanged = (
      changed: Record<string, string>,
      participant: Participant,
    ) => {
      // Debug logging
      console.log('Participant attributes changed:', {
        changedAttributes: changed,
        participantIdentity: participant.identity,
        allAttributes: participant.attributes,
      });

      // Check agent state changes
      if ('lk.agent.state' in changed) {
        const isSpeaking = changed['lk.agent.state'] === 'speaking';
        setIsAISpeaking(isSpeaking);
        console.log(`Agent speaking state changed to: ${isSpeaking}`);
      }
    };

    roomRef.current.on(
      RoomEvent.ParticipantAttributesChanged,
      handleParticipantAttributesChanged,
    );
    return () => {
      roomRef.current?.off(
        RoomEvent.ParticipantAttributesChanged,
        handleParticipantAttributesChanged,
      );
    };
  }, [roomRef.current, setIsAISpeaking]);

  const getToken = useCallback(
    async (
      username: string,
      room: string,
      language: string,
      voiceConfig?: string,
      firstMessage?: string,
    ): Promise<string> => {
      try {
        const response = await apiProtected()
          .url(`/livekit/token`)
          .query({ username, room, language, voiceConfig, firstMessage })
          .get()
          .json<{ token: string }>();
        if (!response) {
          throw new Error('Failed to get token');
        }
        return response.token;
      } catch (error) {
        console.error('Failed to get token:', error);
        throw error;
      }
    },
    [],
  );

  const attachAudioTrack = useCallback(
    (track: Track) => {
      // Early return if disconnection is in progress
      if (disconnectionInProgressRef.current) {
        return;
      }
      // Create and configure audio element
      const audioElement = new Audio();
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.volume = 1.0;
      audioElement.setAttribute('data-livekit-audio', 'true');
      audioElement.setAttribute('data-track-sid', track.sid || '');
      // Set up event handlers
      audioElement.onplay = () => {
        setIsAISpeaking(true);
      };
      audioElement.onerror = (error) => {
        console.warn('Audio playback error:', error);
        setIsAISpeaking(false);
      };
      audioElement.onpause = () => {
        setIsAISpeaking(false);
      };
      audioElement.onended = () => {
        setIsAISpeaking(false);
      };
      // Attach track and add to DOM
      track.attach(audioElement);
      document.body.appendChild(audioElement);
      // Handle audio playback with retry logic
      audioElement.load();
      audioElement.play().catch((error) => {
        setIsAISpeaking(false);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          console.warn('Autoplay blocked, retrying in 1 second...');
          // Retry once after 1 second
          setTimeout(() => {
            audioElement.play().catch((retryError) => {
              console.error('Audio playback failed on retry:', retryError);
              setIsAISpeaking(false);
            });
          }, 1000);
        } else {
          console.error('Audio playback failed:', error);
        }
      });
      // Set up track cleanup
      const cleanup = () => {
        setIsAISpeaking(false);
        if (audioElement?.parentNode) {
          audioElement.pause();
          audioElement.srcObject = null;
          // Remove all event listeners to prevent memory leaks
          audioElement.onplay = null;
          audioElement.onerror = null;
          audioElement.onpause = null;
          audioElement.onended = null;
          document.body.removeChild(audioElement);
        }
      };
      track.on('ended', cleanup);
    },
    [setIsAISpeaking],
  );

  const setupRoomListeners = useCallback(
    (room: Room): void => {
      room
        .on(RoomEvent.ParticipantConnected, (participant) => {
          if (participant.identity.startsWith('agent-')) {
            console.log('AI Agent has joined the room:', participant.identity);
          }
        })
        .on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('Participant disconnected:', participant.identity);
        })
        .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (
            track.kind === 'audio' &&
            participant.identity.startsWith('agent-')
          ) {
            attachAudioTrack(track);
          }
        })
        .on(RoomEvent.TrackUnsubscribed, (_, __, participant) => {
          if (participant?.identity?.startsWith('agent-')) {
            setIsAISpeaking(false);
          }
        })
        .on(RoomEvent.Disconnected, () => {
          console.log('Disconnected from room');
          isConnectedRef.current = false;
        });
    },
    [attachAudioTrack, setIsAISpeaking],
  );

  const connectConversation = useCallback(async (): Promise<void> => {
    disconnectionInProgressRef.current = false;
    if (isConnectedRef.current) {
      console.log('Already connected to LiveKit');
      return;
    }
    try {
      const roomName = session._id;
      const username = `user-${Date.now()}`;
      let config = voiceConfig;

      if (session.assessmentType === 'bbl') {
        config = 'thai14';
      }

      // Use OpenAI Realtime for KT-AXA assessment types
      if (
        session.assessmentType === 'kt-axa-recruitment' ||
        session.assessmentType === 'kt-axa-fna' ||
        session.assessmentType === 'kt-axa-wealthplus'
      ) {
        config = 'thai14';
      }

      // AIA Korea → ElevenLabs via LiveKit
      if (
        session.assessmentType === 'aia-ko-opening-objection-call' ||
        session.assessmentType === 'aia-ko-product-pitch'
      ) {
        config = config || 'aiako-gpt52-turbo';
      }

      const firstMessage =
        typeof session?.voice?.firstMessage === 'string'
          ? session.voice.firstMessage
          : session?.voice?.firstMessage?.main ||
            session?.voice?.firstMessage?.intro ||
            '';
      const token = await getToken(
        username,
        roomName,
        language,
        config,
        firstMessage,
      );

      const roomOptions: RoomOptions = {
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        publishDefaults: {
          simulcast: true,
        },
        reconnectPolicy: {
          nextRetryDelayInMs: (context: {
            elapsedMs: number;
            retryCount: number;
          }) => {
            if (context.retryCount >= 60) {
              return null; // Stop retrying after 60 attempts (~10 minutes)
            }
            // Exponential backoff with jitter: base delay of 300ms, multiplied by 1.5^retryCount, capped at 10 seconds
            const delay = Math.min(
              300 * Math.pow(1.5, context.retryCount),
              10_000,
            );
            console.log(
              `Reconnection attempt #${context.retryCount}, retrying in ${delay} ms`,
            );
            return delay;
          },
        },
      };
      const room = new Room(roomOptions);
      setupRoomListeners(room);
      // Connect to room
      console.log(`🔄 Connecting to room: ${roomName}...`);
      await room.connect(livekitURL, token);
      console.log(`Connected to room: ${roomName}`);

      // Get the room session ID
      try {
        const sid = await room.getSid();
        setRoomSid(sid);
        console.log(`Room session ID: ${sid}`);
      } catch (error) {
        console.warn('Failed to get room SID:', error);
      }
      // Enable microphone via SDK (handles getUserMedia + publishTrack internally)
      try {
        console.log('🎤 Enabling microphone...');
        await room.localParticipant.setMicrophoneEnabled(true);
        console.log('🎤 Microphone enabled');
        // Update refs
        roomRef.current = room;
        isConnectedRef.current = true;
        startTimeRef.current = Date.now();
        if (isIntroCompletedRef) {
          isIntroCompletedRef.current = true;
        }
        // Disconnect cleanup if the room fires "Disconnected"
        room.on(RoomEvent.Disconnected, () => {
          console.log('⚠️ Room disconnected');
          disconnectConversation();
        });
      } catch (audioError) {
        console.error('❌ Error enabling microphone:', audioError);
        setError('Failed to access microphone. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      setError('Failed to connect to voice service. Please try again.');
    }
  }, [
    getToken,
    setupRoomListeners,
    session,
    setError,
    startTimeRef,
    isIntroCompletedRef,
    voiceConfig,
  ]);

  const disconnectConversation = useCallback(async (): Promise<void> => {
    console.log('LiveKit: Disconnecting conversation');
    disconnectionInProgressRef.current = true;
    // Stop and unpublish local tracks first
    const room = roomRef.current;
    if (room && room.localParticipant) {
      console.log('Unpublishing local tracks...');
      // Unpublish all tracks first
      room.localParticipant.audioTrackPublications.forEach((publication) => {
        if (publication.track) {
          room.localParticipant.unpublishTrack(publication.track);
        }
      });
    }
    // Stop any remaining local audio tracks managed by the SDK
    if (room?.localParticipant) {
      room.localParticipant.audioTrackPublications.forEach((pub) => {
        if (pub.track) {
          pub.track.stop();
        }
      });
    }

    // Clear transcript state
    segmentMapRef.current.clear();
    setTranscript([]);

    // Disconnect from room if connected
    if (room) {
      console.log('Disconnecting from LiveKit room');
      // First attempt to send the end session signal if possible
      if (room.state !== 'disconnected' && room.localParticipant) {
        try {
          console.log('Sending session_end signal to agent...');
          // Send a disconnect signal to the agent
          const endSessionData = JSON.stringify({
            type: 'session_end',
            timestamp: Date.now(),
            action: 'stop_speaking',
          });
          room.localParticipant.publishData(
            new TextEncoder().encode(endSessionData),
            {
              reliable: true,
            },
          );
          // Wait a moment for the signal to be sent before disconnecting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (e) {
          // Just log this error, but continue with disconnect process
          console.warn('Could not send end session signal:', e);
        }
      }
      // Now attempt to disconnect
      try {
        // Check if room is already disconnected
        if (room.state !== 'disconnected') {
          console.log('Disconnecting from room...');
          await room.disconnect();
        } else {
          console.log('Room already disconnected');
        }
      } catch (e) {
        console.error('Error disconnecting from room:', e);
      }
      // Clear the room reference
      roomRef.current = null;
    }
    // Clean up any audio elements added to the DOM
    try {
      document
        .querySelectorAll('audio[data-livekit-audio="true"]')
        .forEach((el) => {
          console.log('Removing audio element from DOM');
          try {
            const audioEl = el as HTMLAudioElement;
            audioEl.pause();
            audioEl.srcObject = null;
            el.remove();
          } catch (audioErr) {
            console.error('Error removing audio element:', audioErr);
          }
        });
    } catch (domErr) {
      console.error('Error querying audio elements:', domErr);
    }
    // Always reset state
    isConnectedRef.current = false;
    setIsAISpeaking(false);
    // Force a small delay to ensure browser processes the track stops
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log('✅ LiveKit disconnection complete');
  }, [setIsAISpeaking]);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      disconnectConversation().catch((err) => {
        console.error('Error during unmount cleanup:', err);
      });
    };
  }, [disconnectConversation]);

  return {
    connectConversation,
    disconnectConversation,
    transcript,
    conversation: roomSid
      ? `https://cloud.livekit.io/projects/p_4gyxyli705z/sessions/${roomSid}`
      : null,
  };
};
