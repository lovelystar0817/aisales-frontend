import { useTranslation } from 'react-i18next';
import { ClockIcon, Circle } from 'lucide-react';
import { CorrectIcon, IncorrectIcon } from '../../../public/icons/icons';

const ProgressBar = ({
  passed,
  total,
  sectionType,
}: {
  passed: number;
  total: number;
  sectionType?: string;
}) => {
  const percentage = total > 0 ? (passed / total) * 100 : 0;

  const getIndicatorColor = () => {
    if (sectionType === 'introduction') {
      if (passed < 10) return '#E60D00';
      else return '#38A383';
    } else if (sectionType === 'financialNeeds') {
      if (passed < 14) return '#E60D00';
      else return '#38A383';
    } else return '#38A383';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700">
        {passed}/{total}
      </div>
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-300`}
          style={{
            width: `${percentage}%`,
            backgroundColor: getIndicatorColor(),
          }}
        />
      </div>
    </div>
  );
};

const ChecklistItem = ({
  text,
  isCompleted,
  evidence,
  notApplicable = false,
}: {
  text: string;
  isCompleted: boolean;
  evidence?: string;
  notApplicable?: boolean;
}) => {
  return (
    <li className="flex items-start gap-2">
      <span className="pt-[2px]">
        {notApplicable ? (
          <Circle className="h-5 w-5 text-gray-400" />
        ) : isCompleted ? (
          <CorrectIcon className="h-5 w-5 text-green-500" />
        ) : (
          <IncorrectIcon className="h-5 w-5 text-red-500" />
        )}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`mt-[2px] text-sm ${notApplicable ? 'text-gray-400' : 'text-gray-700'}`}
          >
            {text}
          </span>
        </div>
        {evidence && !notApplicable && (
          <blockquote className="mt-2 border-l-2 border-gray-300 pl-3 text-sm text-gray-500 italic">
            {evidence}
          </blockquote>
        )}
      </div>
    </li>
  );
};

export const ManulifeSection = ({ section }: { section: any }) => {
  const { t } = useTranslation();

  if (section.isGenerating) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-800">{section.title}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-600">
              {t('assessment.generating', 'Generating')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle not applicable sections
  if (section.notApplicable) {
    const allCriteria = section.evaluations || [];
    const criteriaItems = allCriteria.map((criteria: any) => ({
      text: criteria.criteriaText,
      evidence: '',
    }));

    return (
      <div className="rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-800">{section.title}</h4>
            <span className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {t('assessment.notApplicable', 'Not Applicable')}
            </span>
          </div>
          <ProgressBar passed={0} total={allCriteria.length} />
        </div>

        <div className="border-t border-gray-300 p-4">
          {criteriaItems.length > 0 && (
            <div>
              <h5 className="mb-2 text-sm font-semibold text-gray-500">
                {t('practice.standings.criteria')}
              </h5>
              <ul className="space-y-2">
                {criteriaItems.map((item: any, index: number) => (
                  <ChecklistItem
                    key={index}
                    text={item.text}
                    isCompleted={false}
                    evidence=""
                    notApplicable={true}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate section metrics
  const passedCriteria = section.evaluations.filter(
    (criteria: any) => criteria.pass,
  );
  const failedCriteria = section.evaluations.filter(
    (criteria: any) => !criteria.pass,
  );
  const totalCriteria = section.evaluations.length;

  // Create lists for completed and to improve (no mandatory distinction for Manulife)
  const completed = passedCriteria.map((criteria: any) => ({
    text: criteria.criteriaText,
    evidence: criteria.evidence || '',
  }));

  const toImprove = failedCriteria.map((criteria: any) => ({
    text: criteria.criteriaText,
    evidence: criteria.evidence || '',
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-800">{section.title}</h4>
        </div>
        <ProgressBar
          passed={passedCriteria.length}
          total={totalCriteria}
          sectionType={section.sectionType}
        />
      </div>

      <div className="border-t border-gray-200 p-4">
        <ul className="space-y-3">
          {toImprove.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.toImprove')}
              </h5>
              <ul className="space-y-2">
                {toImprove.map((item: any, index: number) => (
                  <ChecklistItem
                    key={index}
                    text={item.text}
                    isCompleted={false}
                    evidence={item.evidence}
                  />
                ))}
              </ul>
            </li>
          )}

          {completed.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.completed')}
              </h5>
              <ul className="space-y-2">
                {completed.map((item: any, index: number) => (
                  <ChecklistItem
                    key={index}
                    text={item.text}
                    isCompleted
                    // Don't render evidence for completed items to reduce clutter
                    // evidence={item.evidence}
                  />
                ))}
              </ul>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
