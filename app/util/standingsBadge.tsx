export type ScoringType = 'tier-based' | 'score-based' | 'manulife-score-based';

/**
 * Returns a badge icon element for the given tier level and scoring type.
 */
export function getBadgeIcon(
  tierLevel: number,
  scoringType: ScoringType,
  className?: string,
) {
  if (tierLevel === 1) {
    return (
      <img
        src="/icons/newbie-sales-badge.png"
        className={className}
        alt="Newbie sales badge"
      />
    );
  }

  if (tierLevel === 2 && scoringType === 'score-based') {
    return (
      <img
        src="/icons/emerging-sales-badge.png"
        className={className}
        alt="Emerging sales badge"
      />
    );
  }

  if (
    (tierLevel === 2 && scoringType === 'tier-based') ||
    (tierLevel === 3 && scoringType === 'score-based') ||
    (tierLevel === 2 && scoringType === 'manulife-score-based')
  ) {
    return (
      <img
        src="/icons/intermediate-sales-badge.png"
        className={className}
        alt="Intermediate sales badge"
      />
    );
  }

  if (
    (tierLevel === 3 && scoringType === 'tier-based') ||
    (tierLevel === 4 && scoringType === 'score-based') ||
    (tierLevel === 3 && scoringType === 'manulife-score-based')
  ) {
    return (
      <img
        src="/icons/expert-sales-badge.png"
        className={className}
        alt="Expert sales badge"
      />
    );
  }

  return (
    <img
      src="/icons/not-available-sales-badge.png"
      className={className}
      alt="Not available badge"
    />
  );
}
