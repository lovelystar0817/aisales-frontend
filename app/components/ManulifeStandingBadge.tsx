import { useTranslation } from 'react-i18next';
import { getBadgeIcon } from '~/assessment/manulife/ManulifeSessionCard';

interface Standing {
  tierLevel: number;
  tierName: string;
}

export function ManulifeStandingBadge({
  standing,
}: {
  standing: Standing | null;
}) {
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
      {getBadgeIcon(standing?.tierName, 'size-16')}
    </div>
  );
}
