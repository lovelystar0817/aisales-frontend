import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { useMemo } from 'react';

const MSIGOverview = () => {
  const { t } = useTranslation();
  const { salesTechniquesData, overviewData: data } = useAssessmentContext();

  const hasFailedMandatory = useMemo(
    () =>
      salesTechniquesData?.sections
        ? Object.values(salesTechniquesData.sections).some((section: any) =>
            !section?.notApplicable &&
            section?.evaluations?.some(
              (criteria: any) => criteria.mandatory && !criteria.pass,
            ),
          )
        : false,
    [salesTechniquesData?.sections],
  );

  return (
    <section id="overview" className="rounded-2xl bg-[#FFFFFF] p-4">
      <h2 className="mb-4 text-[16px] font-bold">{t('assessment.overview')}</h2>
      <h3 className="mb-2 text-[14px] font-semibold">
        {t('assessment.summary')}
      </h3>
      <p className="mb-4 text-[14px] text-[#58595A]">
        {hasFailedMandatory
          ? t('assessment.mandatoryFailedSummary')
          : data?.summary}
      </p>

      <h3 className="mb-2 text-[14px] font-semibold">
        {t('assessment.toProgressfocusOn')}
      </h3>
      {hasFailedMandatory ? (
        <li className="mb-4 text-[14px] text-[#58595A]">
          {t('assessment.mandatoryFailedFocusOn')}
        </li>
      ) : (
        <div className="space-y-2">
          {data?.suggestedNextSteps?.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[14px] text-[#58595A]">•</span>
              <span className="text-[14px] text-[#58595A]">{step}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MSIGOverview;
