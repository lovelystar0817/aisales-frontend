import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function PrudentialPHAppointmentSettingOverview() {
  const { t } = useTranslation();
  const { prudentialPHAppointmentSettingData: data } = useAssessmentContext();

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t('assessment.overview')}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  return (
    <section id="overview" className="rounded-2xl bg-[#FFFFFF] p-4">
      <h2 className="mb-4 text-[16px] font-bold">
        {t('assessment.overview')}
      </h2>
      <p className="mb-4 text-[14px] text-[#58595A]">{data.overallFeedback}</p>

      {data.nextSteps?.length > 0 && (
        <>
          <h3 className="mb-2 text-[14px] font-semibold">
            {t('callAnalysis.assessment.suggestedNextSteps')}
          </h3>
          <div className="space-y-2">
            {data.nextSteps.map((step: string, i: number) => (
              <div key={i} className="flex gap-2">
                <span className="text-[14px] text-[#58595A]">&bull;</span>
                <span className="text-[14px] text-[#58595A]">{step}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
