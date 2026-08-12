import React from 'react';
import { getScoreRating } from '~/util/scoreRating';

interface Props {
  score: number;
  label: string;
  status?: string;
  hasFailedItem?: boolean;
  notApplicable?: boolean;
}

/**
 * Small indicator used inside MSIG assessments to visualise section scores.
 * This component was extracted from the large StandingsModal file to improve
 * readability and maintainability.
 */
export const MSIGScoreIndicator: React.FC<Props> = ({
  score,
  label,
  status,
  hasFailedItem,
  notApplicable,
}) => {
  const { color } = getScoreRating(score, false);

  // Use gray color for not applicable sections
  const indicatorColor = notApplicable
    ? '#9CA3AF'
    : hasFailedItem
      ? '#E60D00'
      : color;
  const textColor = notApplicable ? 'text-gray-400' : 'text-gray-700';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-gray-200" />
          <span className={`text-sm ${textColor}`}>{label}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 pl-3">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: indicatorColor }}
          />
          <span className={`text-sm font-medium ${textColor}`}>
            {notApplicable ? '-' : status ? status : score}
            {!notApplicable && !status && (
              <span className="text-gray-500"> / 100</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
