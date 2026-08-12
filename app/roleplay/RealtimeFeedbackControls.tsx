import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SessionPhase } from '~/util/constants';

interface RealtimeFeedbackControlsProps {
  sessionPhaseRef: React.MutableRefObject<SessionPhase>;
  startTimeRef: React.MutableRefObject<number>;
  realtimeCoachingEnabled: boolean;
  onToggleRealtimeCoaching: (enabled: boolean) => void;
  isMobile?: boolean;
}

export function RealtimeFeedbackControls({
  sessionPhaseRef,
  startTimeRef,
  realtimeCoachingEnabled,
  onToggleRealtimeCoaching,
  isMobile = false,
}: RealtimeFeedbackControlsProps) {
  const [sessionDuration, setSessionDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();

  // Duration tracking effect
  useEffect(() => {
    if (
      sessionPhaseRef.current === SessionPhase.MAIN_CONVERSATION &&
      startTimeRef.current > 0
    ) {
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSessionDuration(elapsed);
      }, 1000);
    } else {
      // Clear timer when not in conversation
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [sessionPhaseRef.current, startTimeRef.current]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle toggle with better touch support
  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleRealtimeCoaching(!realtimeCoachingEnabled);
  };

  const containerClasses = isMobile
    ? 'w-full p-4 border-t border-gray-200 bg-white'
    : 'w-full p-6 border-t border-gray-200 bg-white';

  const toggleClasses = isMobile
    ? 'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

  const toggleIndicatorClasses = isMobile
    ? 'inline-block h-3 w-3 transform rounded-full bg-white transition-transform'
    : 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform';

  const toggleTransform = isMobile
    ? realtimeCoachingEnabled
      ? 'translate-x-5'
      : 'translate-x-1'
    : realtimeCoachingEnabled
      ? 'translate-x-6'
      : 'translate-x-1';

  return (
    <div className={containerClasses}>
      <div className="flex items-center">
        {/* Duration Display */}
        <div className="flex items-center space-x-2">
          <span className="text-md">{formatDuration(sessionDuration)}</span>
        </div>

        <div
          className="mx-4 border-l border-gray-200"
          style={{ height: '16px' }}
        />

        {/* Real-time Coaching Toggle */}
        <div
          className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}
        >
          <button
            onClick={handleToggle}
            onTouchEnd={handleToggle}
            className={`${toggleClasses} ${
              realtimeCoachingEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            type="button"
            role="switch"
            aria-checked={realtimeCoachingEnabled}
            aria-label={`Toggle real-time coaching ${realtimeCoachingEnabled ? 'off' : 'on'}`}
          >
            <span className={`${toggleIndicatorClasses} ${toggleTransform}`} />
          </button>
          <span className="text-sm">{t('sessions.realtimeCoaching')}</span>
        </div>
      </div>
    </div>
  );
}
