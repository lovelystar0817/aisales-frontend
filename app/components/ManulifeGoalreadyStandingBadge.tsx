import { useTranslation } from 'react-i18next';
import { CircularProgressChart } from '~/assessment/manulife-goalready/CircularProgressChart';

interface Standing {
  tierLevel: number;
  tierName: string;
}

export function ManulifeGoalreadyStandingBadge({
  standing,
  overallScore,
}: {
  standing: Standing | null;
  overallScore: number;
}) {
  const { t } = useTranslation();
  const tierName = standing?.tierName || t('notAvailable', 'Not available');

  return (
    <div className="flex items-center gap-x-4">
      <div className="text-right">
        <div className="flex flex-col text-sm font-medium text-gray-500">
          <span className="whitespace-nowrap">
            {t('overallScore')}
          </span>
          <span className="text-[16px] font-bold whitespace-nowrap text-[#161618]">
            {tierName}
          </span>
        </div>
      </div>
      <CircularProgressChart
        score={overallScore}
        maxScore={100}
        size={66}
        strokeWidth={4}
      />
    </div>
  );
}
