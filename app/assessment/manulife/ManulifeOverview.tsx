import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const ManulifeOverview = () => {
  const { t } = useTranslation();
  const { overviewData: data } = useAssessmentContext();

  return (
    <section id="overview" className="rounded-2xl bg-[#FFFFFF] p-4">
      <h2 className="mb-4 text-[16px] font-bold">{t('assessment.overview')}</h2>
      <h3 className="mb-2 text-[14px] font-semibold">
        {t('assessment.summary')}
      </h3>
      <p className="mb-4 text-[14px] text-[#58595A]">
        {data?.summary ||
          t(
            'assessment.fna.defaultSummary',
            'Assessment summary will appear here once the FNA evaluation is complete.',
          )}
      </p>

      <h3 className="mb-2 text-[14px] font-semibold">
        {t('assessment.toProgressfocusOn')}
      </h3>
      <div className="space-y-2">
        {data?.suggestedNextSteps?.map((step, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-[14px] text-[#58595A]">•</span>
            <span className="text-[14px] text-[#58595A]">{step}</span>
          </div>
        )) || (
          <div className="flex gap-2">
            <span className="text-[14px] text-[#58595A]">•</span>
            <span className="text-[14px] text-[#58595A]">
              {t(
                'assessment.fna.defaultNextStep',
                'Focus on areas marked for improvement to enhance your FNA presentation skills.',
              )}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default ManulifeOverview;
