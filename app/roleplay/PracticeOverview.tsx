import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/button';
import ClientAndProductInfoSection from '~/roleplay/ClientAndProductInfoSection';
import RoleplayDetailsSection from '~/roleplay/RoleplayDetailsSection';

interface PracticeOverviewProps {
  session: any; // Replace 'any' with your actual session type
  onGoToRoleplay: () => void;
}

export function PracticeOverview({
  session,
  onGoToRoleplay,
}: PracticeOverviewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'support'>(
    'overview',
  );
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      {/* Tab Navigation */}
      <div className="px-6">
        <div className="mb-2 rounded-lg bg-gray-100">
          <div className="relative flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 rounded-md px-4 py-2 text-sm transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('assessment.overview')}
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex-1 rounded-md px-4 py-2 text-sm transition-all duration-200 ${
                activeTab === 'support'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('roleplay.supportMaterials')}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-auto flex-1 pt-2">
          {activeTab === 'overview' && (
            <RoleplayDetailsSection session={session} />
          )}
          {activeTab === 'support' && (
            <ClientAndProductInfoSection session={session} />
          )}
        </div>
      </div>
      {/* Fixed Button Container */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white px-4 py-3">
        <Button
          className="flex w-full items-center justify-center"
          onClick={onGoToRoleplay}
        >
          {t('roleplay.goToRoleplay')}
        </Button>
      </div>
    </div>
  );
}
