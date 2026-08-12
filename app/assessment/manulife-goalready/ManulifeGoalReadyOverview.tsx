import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '../shared/AssessmentContext';

export function ManulifeGoalReadyOverview() {
  const { t } = useTranslation();
  const { overviewData } = useAssessmentContext();

  if (!overviewData) {
    return (
      <div className="space-y-4 rounded-2xl bg-white p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[24px] rounded-[12px] bg-white p-[16px]">
      <h2 className="text-[16px] font-bold leading-[24px] tracking-[-0.16px] text-[#161618]">
        {t('assessment.overview')}
      </h2>

      <div className="flex flex-col gap-[24px]">
        {overviewData.summary && (
          <div className="flex flex-col gap-[8px]">
            <h3 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
              Summary
            </h3>
            <p className="text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
              {overviewData.summary}
            </p>
          </div>
        )}

        {overviewData.suggestedNextSteps &&
          overviewData.suggestedNextSteps.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h3 className="text-[14px] font-bold leading-[20px] tracking-[-0.084px] text-[#161618]">
                Suggested next steps
              </h3>
              <ul className="list-disc space-y-0 pl-[21px] text-[14px] font-normal leading-[20px] tracking-[-0.084px] text-[#58595A]">
                {overviewData.suggestedNextSteps.map((step, idx) => (
                  <li key={idx} className="mb-0">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  );
}
