import { useCallback, useEffect, useRef, useState } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { SessionPhase } from '~/util/constants';
import type { TranscriptEntry } from './useConversation';

export interface ResponseTimeMeasurement {
  turnIndex: number;
  responseTimeSec: number;
}

interface UseResponseTimeTrackingOptions {
  isAISpeaking: boolean;
  transcript: TranscriptEntry[];
  sessionPhase: SessionPhase;
  enabled: boolean;
}

interface UseResponseTimeTrackingResult {
  responseTimes: ResponseTimeMeasurement[];
  averageResponseTimeSec: number | null;
  isVadReady: boolean;
}

export function useResponseTimeTracking({
  isAISpeaking,
  transcript,
  sessionPhase,
  enabled,
}: UseResponseTimeTrackingOptions): UseResponseTimeTrackingResult {
  const [responseTimes, setResponseTimes] = useState<
    ResponseTimeMeasurement[]
  >([]);

  const aiEndTimeRef = useRef<number | null>(null);
  const waitingForUserSpeechRef = useRef(false);
  const turnIndexRef = useRef(0);
  const prevIsAISpeakingRef = useRef(false);
  const destroyedRef = useRef(false);

  // Safe wrappers that guard against calling VAD methods after destroy
  const safeVadStart = useCallback((v: { start: () => void }) => {
    if (destroyedRef.current) return;
    try {
      v.start();
    } catch {
      // VAD already destroyed during navigation
    }
  }, []);

  const safeVadPause = useCallback((v: { pause: () => void }) => {
    if (destroyedRef.current) return;
    try {
      v.pause();
    } catch {
      // VAD already destroyed during navigation
    }
  }, []);

  const handleSpeechStart = useCallback(() => {
    if (!waitingForUserSpeechRef.current || aiEndTimeRef.current === null)
      return;

    const userStartTime = performance.now();
    const responseTimeMs = userStartTime - aiEndTimeRef.current;
    const responseTimeSec = Math.max(
      0,
      Math.round((responseTimeMs / 1000) * 10) / 10,
    );

    setResponseTimes((prev) => [
      ...prev,
      {
        turnIndex: turnIndexRef.current,
        responseTimeSec,
      },
    ]);

    turnIndexRef.current += 1;
    waitingForUserSpeechRef.current = false;
    aiEndTimeRef.current = null;

    safeVadPause(vad);
  }, []);

  const vad = useMicVAD({
    startOnLoad: false,
    positiveSpeechThreshold: 0.3,
    minSpeechMs: 400,
    redemptionMs: 1400,
    baseAssetPath:
      'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/',
    onnxWASMBasePath:
      'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.1/dist/',
    onSpeechStart: handleSpeechStart,
    onVADMisfire: () => {
      // Ignore misfires (very short sounds like coughs/clicks)
    },
  });

  // Track unmount to prevent VAD calls after destroy
  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
    };
  }, []);

  // Watch isAISpeaking transitions
  useEffect(() => {
    if (!enabled) return;

    const wasAISpeaking = prevIsAISpeakingRef.current;
    prevIsAISpeakingRef.current = isAISpeaking;

    if (sessionPhase !== SessionPhase.MAIN_CONVERSATION) return;

    // AI just stopped speaking -> start listening for user
    if (wasAISpeaking && !isAISpeaking) {
      aiEndTimeRef.current = performance.now();
      waitingForUserSpeechRef.current = true;
      safeVadStart(vad);
    }

    // AI just started speaking -> stop VAD to avoid detecting AI audio
    if (!wasAISpeaking && isAISpeaking) {
      waitingForUserSpeechRef.current = false;
      aiEndTimeRef.current = null;
      safeVadPause(vad);
    }
  }, [isAISpeaking, enabled, sessionPhase, vad, safeVadStart, safeVadPause]);

  // Clean up on session end
  useEffect(() => {
    if (
      sessionPhase === SessionPhase.ENDING ||
      sessionPhase === SessionPhase.DONE
    ) {
      waitingForUserSpeechRef.current = false;
      aiEndTimeRef.current = null;
      safeVadPause(vad);
    }
  }, [sessionPhase, vad, safeVadPause]);

  const averageResponseTimeSec =
    responseTimes.length > 0
      ? Math.round(
          (responseTimes.reduce((sum, rt) => sum + rt.responseTimeSec, 0) /
            responseTimes.length) *
            10,
        ) / 10
      : null;

  return {
    responseTimes,
    averageResponseTimeSec,
    isVadReady: vad.listening || !vad.loading,
  };
}
