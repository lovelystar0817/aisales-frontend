import { useTranslation } from 'react-i18next';
import SimpleChart from '../../SimpleChart';

interface FilterOption {
  id: string;
  name: string;
}

interface SkillProgressionProps {
  filterOptions?: { modules: FilterOption[] };
  selectedModule: string;
  onModuleChange: (moduleId: string) => void;
  progressData?: {
    charts?: Array<{
      name: string;
      data: number[];
      color: string;
    }>;
    months?: string[];
  };
  isLoadingChart: boolean;
  chartError?: Error | null;
}

export default function SkillProgression({
  filterOptions,
  selectedModule,
  onModuleChange,
  progressData,
  isLoadingChart,
  chartError,
}: SkillProgressionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('manage.dashboard.skillProgression.title')}
          </h2>
          <div className="flex space-x-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={selectedModule}
              onChange={(e) => onModuleChange(e.target.value)}
            >
              <option value="" disabled>
                {t('manage.dashboard.skillProgression.scenarioPlaceholder')}
              </option>
              {filterOptions?.modules
                .filter((option) => option.id !== 'all')
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {!selectedModule || !filterOptions?.modules?.some(m => m.id === selectedModule) ? (
          <div className="col-span-2 flex h-64 items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-base font-medium">{t('manage.dashboard.skillProgression.hint')}</p>
            </div>
          </div>
        ) : (
          progressData?.charts?.map((chartData, index) => (
            <div key={index}>
              <SimpleChart
                series={[
                  {
                    name: chartData.name,
                    data: chartData.data,
                    color: chartData.color,
                  },
                ]}
                xAxisLabels={progressData?.months || []}
                isLoading={isLoadingChart}
                error={chartError ? t('manage.dashboard.skillProgression.error') : undefined}
              />
            </div>
          )) || (
            <div className="col-span-2 text-center text-gray-500">
              {t('manage.dashboard.skillProgression.noData')}
            </div>
          )
        )}
      </div>
    </div>
  );
}
