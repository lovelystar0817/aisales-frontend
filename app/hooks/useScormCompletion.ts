import { useEffect, useState } from 'react';
import { useAuthStore } from '~/store/auth';

interface ScormCompletionData {
  overallScore: number;
  sessionTime: number;
  sessionId?: string;
}

interface ScormCompletionOptions {
  overallScore?: number;
  sessionId?: string;
  /** Whether all expected scores have been fully calculated. Prevents showing the popup with partial scores. */
  isReady?: boolean;
}

export const useScormCompletion = (options: ScormCompletionOptions) => {
  const { overallScore, sessionId, isReady = true } = options;

  // Get SCORM mode and passing score from auth store
  const { scorm: isScormMode, scormPassingScore } = useAuthStore();

  console.log('SCORM completion options:', options);

  // Session start time tracking for SCORM
  const [sessionStartTime] = useState(() => {
    // Check if SCORM provided session start time
    const urlParams = new URLSearchParams(window.location.search);
    const scormStartTime = urlParams.get('sessionStartTime');

    return scormStartTime ? parseInt(scormStartTime) : Date.now();
  });

  // Check if we're in an iframe (SCORM environment)
  const [isInIframe] = useState(() => window.parent !== window);

  console.log('SCORM mode:', isScormMode, 'In iframe:', isInIframe);

  // Track completion status
  const [completionStatus, setCompletionStatus] = useState<{
    isCompleted: boolean;
    passed: boolean;
    score: number;
    threshold: number;
  } | null>(null);

  console.log('SCORM completion status:', completionStatus);

  // Track whether completion has already been triggered to avoid re-firing
  const [hasTriggered, setHasTriggered] = useState(false);

  // SCORM completion detection
  useEffect(() => {
    if (
      !hasTriggered &&
      overallScore !== undefined &&
      overallScore > 0 &&
      isReady &&
      isInIframe &&
      isScormMode
    ) {
      setHasTriggered(true);
      console.log(
        'SCORM completion triggered with overall score:',
        overallScore,
      );

      // Set completion status for UI
      const threshold = scormPassingScore;
      const passed = overallScore >= threshold;
      setCompletionStatus({
        isCompleted: true,
        passed,
        score: overallScore,
        threshold,
      });

      // Prepare completion data
      const completionData: ScormCompletionData = {
        overallScore,
        sessionTime: Date.now() - sessionStartTime,
        sessionId,
      };

      console.log('SCORM completion data:', completionData);

      // Send completion notification to SCORM wrapper
      window.parent.postMessage(
        {
          type: 'scorm-completion-ready',
          data: completionData,
        },
        '*',
      );
    }
  }, [
    hasTriggered,
    overallScore,
    sessionStartTime,
    sessionId,
    isReady,
    isInIframe,
    isScormMode,
    scormPassingScore,
  ]);

  // SCORM completion response handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'scorm-completion-success') {
        console.log('SCORM completion successful:', event.data);
      } else if (event.data.type === 'scorm-completion-error') {
        console.error('SCORM completion failed:', event.data);
      }
    };

    // Only add listener if we're in SCORM mode
    if (isScormMode) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isScormMode]);

  return {
    isScormMode,
    isInIframe,
    sessionStartTime,
    completionStatus,
    dismissCompletion: () => setCompletionStatus(null),
  };
};
