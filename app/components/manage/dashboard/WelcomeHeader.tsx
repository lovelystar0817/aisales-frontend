import { RefreshCcwIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

interface WelcomeHeaderProps {
  userName?: string;
  lastUpdated?: string;
  calculationDuration?: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function WelcomeHeader({
  userName,
  lastUpdated,
  calculationDuration,
  onRefresh,
  isRefreshing,
}: WelcomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('manage.dashboard.welcomeBack', { name: userName?.split(' ')[0] || 'Admin' })}
      </h1>
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-500">
          {lastUpdated
            ? `${t('manage.dashboard.lastUpdated')}` + ' ' + dayjs(lastUpdated).format('DD/MM/YYYY HH:mm:ss')
            : `${t('manage.dashboard.lastUpdated')}: ${t('manage.dashboard.unknown')}`}
          {calculationDuration && ` (${calculationDuration}ms)`}
        </p>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title={t('manage.dashboard.refreshTooltip')}
        >
          <RefreshCcwIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
