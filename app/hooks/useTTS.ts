import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { apiProtected } from '~/util/api'; // Assuming apiProtected is available and configured in aisales-frontend
import { useLanguage } from '~/context/language';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

// Tiny silent WAV used to "unlock" audio playback on iOS Safari.
// iOS requires audio.play() to be called synchronously within a user gesture.
// By playing this silent clip first, we unlock the Audio element so it can be
// reused after an async fetch completes. WAV decodes reliably across all browsers.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// Minimal set of props needed for SessionCard usage
interface TTSHookProps {
  setIsAISpeaking: (isAISpeaking: boolean) => void;
  onPlaybackComplete?: () => void; // Optional callback for when audio finishes
}

export const useTTS = ({
  setIsAISpeaking,
  onPlaybackComplete,
}: TTSHookProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false); // To prevent multiple playbacks at once
  const [isLoading, setIsLoading] = useState(false);

  const stopAudio = useCallback(() => {
    console.log('🔇 Stopping current audio playback');
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onplay = null;
      audioRef.current.pause();
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
    setIsAISpeaking(false);
    isPlayingRef.current = false;
    setIsLoading(false);
  }, [setIsAISpeaking]);

  const handlePlaybackComplete = useCallback(() => {
    console.log('🔊 Audio ended naturally');
    setIsAISpeaking(false);
    isPlayingRef.current = false;
    setIsLoading(false);
    if (onPlaybackComplete) {
      onPlaybackComplete();
    }
  }, [setIsAISpeaking, onPlaybackComplete]);

  const playAudio = useCallback(
    async (
      text: string,
      // sessionId is kept as it's often useful for logging/context on backend
      // but the aisales-backend /tts/generate endpoint currently doesn't require it.
      sessionId?: string,
      provider = language === 'yue'
        ? 'qwen'
        : language === 'th'
          ? 'cartesia'
          : 'elevenlabs', // Use qwen for Cantonese, cartesia for Thai, elevenlabs for others
      voiceId?: string, // Voice ID can be passed if specific voice is needed
      personaId?: string, // For voice styling
      companyFriendlyId?: string, // For pronunciation dictionary (e.g., 'kt-axa')
    ) => {
      if (isPlayingRef.current) {
        console.warn('⚠️ playAudio called while already playing. Ignoring.');
        return;
      }

      setIsLoading(true);
      isPlayingRef.current = true;
      console.log('▶️ Attempting to play audio...');

      try {
        // Stop any currently playing audio first - this might be too aggressive
        // if we want to queue. For now, it stops previous before playing new.
        if (audioRef.current) {
          console.log('Stopping existing audio before playing new one.');
          stopAudio();
        }

        // On iOS Safari, audio.play() must be called synchronously within the
        // user gesture call stack. We "unlock" the Audio element here (before
        // the async fetch) by playing a tiny silent WAV, so the element can be
        // reused once the real audio data arrives.
        const audio = new Audio();
        audioRef.current = audio;

        if (isIOS()) {
          // Play a silent clip to "unlock" the audio element while still in
          // the user gesture call stack. No event handlers are attached yet so
          // the instant-completion of the 0-byte WAV won't trigger onended or
          // onerror and reset state prematurely.
          audio.src = SILENT_WAV;
          await audio.play().catch(() => {});
          audio.pause();
        }

        const requestBody: any = {
          text,
          provider,
        };
        if (voiceId) requestBody.voice = voiceId;
        if (personaId) requestBody.personaId = personaId;
        if (sessionId) requestBody.sessionId = sessionId; // Pass if available
        if (companyFriendlyId) requestBody.companyFriendlyId = companyFriendlyId;

        const response = await apiProtected()
          .url('/tts/generate') // Updated endpoint for aisales-backend
          .post(requestBody)
          .res();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `Failed to generate TTS: ${response.statusText}`,
          }));
          throw new Error(
            errorData.error || `Failed to generate TTS: ${response.statusText}`,
          );
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        console.log('🔊 TTS audio received, starting playback');
        setIsLoading(false);
        setIsAISpeaking(true);

        // Attach handlers only now — right before loading the real audio.
        // They must not be present during the silent-WAV unlock phase because
        // the 0-byte WAV completes instantly and would trigger onended/onerror.
        audio.onended = handlePlaybackComplete;
        audio.onerror = (e) => {
          console.error('❌ Failed to play audio:', e);
          toast.error(t('errors.audioPlaybackFailed'));
          stopAudio();
        };

        // Reuse the already-unlocked audio element instead of creating a new one
        audio.src = audioUrl;
        await audio.play().catch((err) => {
          console.error('❌ Failed to play audio (catch):', err);
          toast.error(t('errors.audioPlaybackStart'));
          stopAudio(); // Ensure cleanup and state reset
        });
      } catch (error: any) {
        console.error('❌ Error processing TTS:', error);
        toast.error(error.message || t('errors.audioGenerationFailed'));
        stopAudio(); // Ensure cleanup and state reset
      }
      // Note: isPlayingRef.current is reset by stopAudio or handlePlaybackComplete
    },
    [
      language,
      setIsLoading,
      setIsAISpeaking,
      handlePlaybackComplete,
      stopAudio,
      t,
    ],
  );

  const playStreamingAudio = useCallback(
    async (
      text: string,
      sessionId?: string,
      provider = language === 'yue'
        ? 'qwen'
        : language === 'th'
          ? 'cartesia'
          : 'elevenlabs', // Use qwen for Cantonese, cartesia for Thai, elevenlabs for others
      voiceId?: string,
      personaId?: string,
      companyFriendlyId?: string, // For pronunciation dictionary (e.g., 'kt-axa')
    ) => {
      if (isPlayingRef.current) {
        console.warn(
          '⚠️ playStreamingAudio called while already playing. Ignoring.',
        );
        return;
      }

      console.log('▶️ Attempting to play streaming audio...');

      // iOS Safari does not support MediaSource and the fallback to playAudio
      // loses the user gesture context. Delegate to playAudio early (before any
      // async work) so the iOS audio-unlock trick in playAudio can work.
      if (isIOS()) {
        console.log('iOS detected, using non-streaming playback');
        return playAudio(text, sessionId, provider, voiceId, personaId, companyFriendlyId);
      }

      // Qwen doesn't support true streaming, use non-streaming playAudio instead
      if (provider === 'qwen') {
        console.log('Qwen provider detected, using non-streaming playback');
        return playAudio(text, sessionId, provider, voiceId, personaId, companyFriendlyId);
      }

      setIsLoading(true);
      isPlayingRef.current = true;

      try {
        // Stop any currently playing audio first
        if (audioRef.current) {
          console.log(
            'Stopping existing audio before playing streaming audio.',
          );
          stopAudio();
        }

        // Check if MediaSource is supported, fallback to blob if not
        if (!window.MediaSource) {
          console.warn(
            'MediaSource not supported, falling back to blob approach',
          );
          isPlayingRef.current = false;
          setIsLoading(false);
          return playAudio(text, sessionId, provider, voiceId, personaId, companyFriendlyId);
        }

        const requestBody: any = {
          text,
          provider,
        };
        if (voiceId) requestBody.voice = voiceId;
        if (personaId) requestBody.personaId = personaId;
        if (sessionId) requestBody.sessionId = sessionId;
        if (companyFriendlyId) requestBody.companyFriendlyId = companyFriendlyId;

        const response = await apiProtected()
          .url('/tts/stream')
          .post(requestBody)
          .res();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `Failed to start streaming TTS: ${response.statusText}`,
          }));
          throw new Error(
            errorData.error ||
              `Failed to start streaming TTS: ${response.statusText}`,
          );
        }

        // Set loading to false once we have the response - streaming will start soon
        setIsLoading(false);

        const mediaSource = new MediaSource();
        const audioUrl = URL.createObjectURL(mediaSource);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = handlePlaybackComplete;
        audio.onerror = (e) => {
          console.error('❌ Failed to play streaming audio:', e);
          toast.error(t('errors.audioPlaybackFailed'));
          stopAudio();
        };

        mediaSource.addEventListener('sourceopen', async () => {
          try {
            console.log('🔊 MediaSource opened, setting up streaming...');

            // Try different MIME types for better browser compatibility
            const supportedTypes = [
              'audio/mpeg',
              'audio/mpeg; codecs="mp3"',
              'audio/mp3',
            ];

            let mimeType = supportedTypes.find((type) =>
              MediaSource.isTypeSupported(type),
            );
            if (!mimeType) {
              throw new Error(
                'No supported audio MIME type found for streaming',
              );
            }

            const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
            sourceBuffer.mode = 'sequence';

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body reader available');
            }

            let hasStartedPlaying = false;

            const processStream = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();

                  if (done) {
                    console.log('🏁 Streaming complete, ending MediaSource');
                    // Wait for any pending updates before ending
                    while (sourceBuffer.updating) {
                      await new Promise<void>((resolve) => {
                        sourceBuffer.addEventListener(
                          'updateend',
                          () => resolve(),
                          { once: true },
                        );
                      });
                    }
                    if (mediaSource.readyState === 'open') {
                      mediaSource.endOfStream();
                    }
                    break;
                  }

                  // Check if MediaSource is still open
                  if (mediaSource.readyState !== 'open') {
                    console.warn(
                      'MediaSource is no longer open, stopping stream processing',
                    );
                    break;
                  }

                  // Wait for SourceBuffer to be completely ready before appending
                  while (sourceBuffer.updating) {
                    await new Promise<void>((resolve) => {
                      sourceBuffer.addEventListener(
                        'updateend',
                        () => resolve(),
                        { once: true },
                      );
                    });
                  }

                  try {
                    sourceBuffer.appendBuffer(value);
                  } catch (appendError: any) {
                    console.error('❌ Failed to append buffer:', appendError);
                    // Try to wait a bit and retry once
                    if (!hasStartedPlaying) {
                      await new Promise((resolve) => setTimeout(resolve, 50));
                      if (
                        !sourceBuffer.updating &&
                        mediaSource.readyState === 'open'
                      ) {
                        try {
                          sourceBuffer.appendBuffer(value);
                        } catch (retryError: any) {
                          throw new Error(
                            `Failed to append buffer after retry: ${retryError.message}`,
                          );
                        }
                      } else {
                        throw appendError;
                      }
                    } else {
                      throw appendError;
                    }
                  }

                  // Start playing after first chunk is buffered
                  if (!hasStartedPlaying) {
                    // Wait for this append to complete
                    while (sourceBuffer.updating) {
                      await new Promise<void>((resolve) => {
                        sourceBuffer.addEventListener(
                          'updateend',
                          () => resolve(),
                          { once: true },
                        );
                      });
                    }

                    console.log('🎵 Starting audio playback with first chunk');
                    hasStartedPlaying = true;
                    setIsAISpeaking(true);

                    audio.play().catch((err) => {
                      console.error(
                        '❌ Failed to start streaming audio playback:',
                        err,
                      );
                      toast.error(t('errors.audioPlaybackStart'));
                      stopAudio();
                    });
                  }
                }
              } catch (streamError: any) {
                console.error('❌ Error processing audio stream:', streamError);
                toast.error(t('errors.audioGenerationFailed'));
                stopAudio();
              }
            };

            processStream();
          } catch (sourceError: any) {
            console.error('❌ Error setting up MediaSource:', sourceError);
            toast.error(
              sourceError.message || t('errors.audioGenerationFailed'),
            );
            stopAudio();
          }
        });

        mediaSource.addEventListener('error', (e) => {
          console.error('❌ MediaSource error:', e);
          toast.error(t('errors.audioPlaybackFailed'));
          stopAudio();
        });
      } catch (error: any) {
        console.error('❌ Error starting streaming TTS:', error);
        toast.error(error.message || t('errors.audioGenerationFailed'));
        stopAudio();
      }
    },
    [setIsAISpeaking, stopAudio, handlePlaybackComplete, t, playAudio],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleaning up audio on unmount');
        stopAudio();
      }
    };
  }, [stopAudio]);

  return { playAudio, playStreamingAudio, stopAudio, isLoading };
};
