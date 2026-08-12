import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function GreatEasternOverview() {
  const { t } = useTranslation();
  const { greatEasternAssessmentData: data } = useAssessmentContext();

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
    <section id="overview" className="rounded-2xl bg-white p-4">
      <h2 className="mb-4 text-[16px] font-bold text-[#161618]">
        {t('assessment.overview')}
      </h2>

      <h3 className="mb-2 text-[14px] font-semibold text-[#161618]">
        {t('assessment.summary', 'Summary')}
      </h3>
      <p className="mb-4 text-[14px] leading-relaxed text-[#58595A]">
        {data.overallFeedback}
      </p>

      {data.nextSteps && data.nextSteps.length > 0 && (
        <>
          <h3 className="mb-2 text-[14px] font-semibold text-[#161618]">
            {t('assessment.suggestedNextSteps', 'Suggested next steps')}
          </h3>
          <ul className="space-y-2">
            {data.nextSteps.map((step: string, i: number) => (
              <li key={i} className="flex text-[14px] leading-relaxed text-[#58595A]">
                <span className="mr-2">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
