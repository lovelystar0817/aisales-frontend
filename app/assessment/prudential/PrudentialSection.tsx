import { useTranslation } from 'react-i18next';
import { cn } from '~/util/utils';
import { CorrectIcon, IncorrectIcon } from '../../../public/icons/icons';

export const getSectionStatus = (
  score: number,
  sectionType: string = 'default',
  t?: any,
) => {
  if (sectionType === 'clientVerification') {
    return score >= 100
      ? t('assessment.standings.completed')
      : t('assessment.standings.incomplete');
  }
  if (score >= 100) return t('assessment.standings.completed');
  if (score >= 67) return t('assessment.standings.expert');
  if (score >= 34) return t('assessment.standings.intermediate');
  return t('assessment.standings.beginner');
};

export const ProgressBar = ({
  value,
  status,
  isClientVerification = false,
}: {
  value: number;
  status: string;
  isClientVerification?: boolean;
}) => {
  const { t } = useTranslation();
  if (isClientVerification) {
    const isComplete = status === t('assessment.standings.completed');
    const fillColor = isComplete ? 'bg-green-600' : 'bg-red-500';
    const statusColor = isComplete ? 'text-gray-700' : 'text-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className={cn('text-sm font-semibold', statusColor)}>{status}</div>
        <div className="relative h-2 w-20 overflow-hidden rounded-sm bg-red-200">
          <div
            className={cn('absolute left-0 top-0 h-full', fillColor)}
            style={{ width: `${value}%` }}
          />
        </div>
        <div className="text-sm font-semibold text-gray-500">{value}%</div>
      </div>
    );
  }

  const levels = [
    { name: t('assessment.standings.beginner'), start: 0, end: 34 },
    { name: t('assessment.standings.intermediate'), start: 34, end: 67 },
    { name: t('assessment.standings.completed'), start: 67, end: 100 },
  ];

  let color = 'bg-gray-300';
  let statusColor = 'text-gray-500';

  if (status === t('assessment.standings.beginner')) {
    color = 'bg-orange-500';
    statusColor = 'text-gray-700';
  } else if (status === t('assessment.standings.intermediate')) {
    color = 'bg-blue-500';
    statusColor = 'text-gray-700';
  } else if (status === t('assessment.standings.expert') || status === t('assessment.standings.completed')) {
    color = 'bg-green-600';
    statusColor = 'text-gray-700';
  }

  const getFillPercent = (start: number, end: number) => {
    if (value <= start) return 0;
    if (value >= end) return 100;
    return ((value - start) / (end - start)) * 100;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('text-sm font-semibold', statusColor)}>{status}</div>
      <div className="flex h-2 w-20 gap-1">
        {levels.map((level, index) => {
          const fillPercent = getFillPercent(level.start, level.end);
          return (
            <div
              key={index}
              className={cn(
                'relative h-full flex-1 overflow-hidden bg-gray-200',
                index === 0 && 'rounded-l-sm',
                index === levels.length - 1 && 'rounded-r-sm',
              )}
            >
              <div
                className={cn('absolute left-0 top-0 h-full', color)}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="text-sm font-semibold text-gray-500">{value}%</div>
    </div>
  );
};

export const ChecklistItem = ({
  text,
  isCompleted,
}: {
  text: string;
  isCompleted: boolean;
}) => {
  return (
    <li className="flex items-start gap-2">
      <span>
        {isCompleted ? (
          <CorrectIcon className="h-5 w-5 text-green-500" />
        ) : (
          <IncorrectIcon className="h-5 w-5 text-red-500" />
        )}
      </span>
      <span className="text-sm text-gray-700">{text}</span>
    </li>
  );
};

export const PrudentialSection = ({
  section,
  hideScore = false,
}: {
  section: any;
  hideScore?: boolean;
}) => {
  const { t } = useTranslation();
  const isClientVerification =
    section.title === t('assessment.standings.clientVerification');
  const isIncomplete =
    isClientVerification &&
    section.status === t('assessment.standings.incomplete');

  return (
    <div
      className={cn(
        'rounded-lg border',
        isIncomplete ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white',
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-800">{section.title}</h4>
          {section.isMandatory && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
              {t('assessment.standings.mandatory')}
            </span>
          )}
        </div>
        {hideScore ? (
          <span className="text-lg text-gray-400">-</span>
        ) : (
          <ProgressBar
            value={section.score}
            status={section.status}
            isClientVerification={isClientVerification}
          />
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <ul className="space-y-3">
          {section.toImprove && section.toImprove.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.toImprove', 'To improve')}
              </h5>
              <ul className="space-y-2">
                {section.toImprove.map((item: string, index: number) => (
                  <ChecklistItem key={index} text={item} isCompleted={false} />
                ))}
              </ul>
            </li>
          )}

          {section.completed && section.completed.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.completed', 'Completed')}
              </h5>
              <ul className="space-y-2">
                {section.completed.map((item: string, index: number) => (
                  <ChecklistItem key={index} text={item} isCompleted />
                ))}
              </ul>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}; 