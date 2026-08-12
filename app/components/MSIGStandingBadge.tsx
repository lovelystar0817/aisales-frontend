import { useTranslation } from 'react-i18next';

interface Standing {
  tierLevel: number;
  tierName: string;
}

// Helper function to get the appropriate badge icon
function getBadgeIcon(tierLevel: number, className?: string) {
  if (tierLevel === 1) {
    return (
      <img
        src="/icons/newbie-sales-badge.png"
        className={className}
        alt="Newbie sales badge"
      />
    );
  } else if (tierLevel === 2) {
    return (
      <img
        src="/icons/emerging-sales-badge.png"
        className={className}
        alt="Emerging sales badge"
      />
    );
  } else if (tierLevel === 3) {
    return (
      <img
        src="/icons/intermediate-sales-badge.png"
        className={className}
        alt="Intermediate sales badge"
      />
    );
  } else if (tierLevel === 4) {
    return (
      <img
        src="/icons/expert-sales-badge.png"
        className={className}
        alt="Expert sales badge"
      />
    );
  } else {
    return (
      <img
        src="/icons/not-available-sales-badge.png"
        className={className}
        alt="Not available badge"
      />
    );
  }
}

export function MSIGStandingBadge({ standing }: { standing: Standing | null }) {
  const { t } = useTranslation();
  const tierName = standing?.tierName || t('notAvailable', 'Not available');

  return (
    <div className="flex items-center gap-x-4">
      <div className="text-right">
        <div className="flex flex-col text-sm font-medium text-gray-500">
          <span className="whitespace-nowrap">
            {t('sessions.sessionStanding')}
          </span>
          <span className="text-[16px] font-bold whitespace-nowrap text-[#161618]">
            {tierName}
          </span>
        </div>
      </div>
      {getBadgeIcon(standing?.tierLevel ?? 0, 'size-16')}
    </div>
  );
}
