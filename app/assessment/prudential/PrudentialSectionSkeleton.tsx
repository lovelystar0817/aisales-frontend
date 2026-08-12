import { ClockIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrudentialSectionSkeletonProps {
  title: string;
  isMandatory?: boolean;
}

export const PrudentialSectionSkeleton = ({
  title,
}: PrudentialSectionSkeletonProps) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        </div>
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="border-t border-gray-200 p-4 space-y-4">
        <div className="space-y-3">
          <h5 className="mb-2 text-sm font-semibold text-gray-800">
            {t('assessment.toImprove', 'To improve')}
          </h5>
          <div className="space-y-2 pl-2 pt-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6"></div>
          </div>
        </div>
        <div className="space-y-3">
          <h5 className="mb-2 text-sm font-semibold text-gray-800">
            {t('assessment.completed', 'Completed')}
          </h5>
          <div className="space-y-2 pl-2 pt-2">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}; 