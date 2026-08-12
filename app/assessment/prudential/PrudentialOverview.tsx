import { useTranslation } from 'react-i18next';
import { PrudentialOverviewSkeleton } from '~/assessment/prudential/PrudentialOverviewSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { 
  getDynamicSummary, 
  getDynamicSuffix, 
  getNextStepsTitle, 
  getNextSteps 
} from '~/assessment/prudential/summary';

const PrudentialOverview = () => {
  const { t } = useTranslation();
  const {
    session,
    overviewData: data,
    isColdCall,
    salesTechniquesData,
    isStandingGenerating,
  } = useAssessmentContext();

  if (isStandingGenerating) {
    return <PrudentialOverviewSkeleton />;
  }

  // Use shared utility functions
  const dynamicSummary = getDynamicSummary({
    overviewData: data ?? null,
    session: session ?? null,
    salesTechniquesData: salesTechniquesData ?? null,
    isColdCall,
    t
  });

  const dynamicSuffix = getDynamicSuffix({
    overviewData: data ?? null,
    session: session ?? null,
    salesTechniquesData: salesTechniquesData ?? null,
    isColdCall,
    t
  });

  const nextStepsTitle = getNextStepsTitle({
    overviewData: data ?? null,
    session: session ?? null,
    salesTechniquesData: salesTechniquesData ?? null,
    isColdCall,
    t
  });

  const nextSteps = getNextSteps({
    overviewData: data ?? null,
    session: session ?? null,
    salesTechniquesData: salesTechniquesData ?? null,
    isColdCall,
    t
  });

  return (
    <section id="overview" className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-[16px] font-bold">{t('assessment.overview')}</h2>
      </div>
      
      <p className="mb-4 text-[14px] text-[#58595A]">
        {dynamicSummary}
      </p>

      <h3 className="mb-2 text-[14px] font-semibold">
        {nextStepsTitle}
      </h3>
      <div className="space-y-2">
        {nextSteps.map((step: string, i: number) => (
          <div key={i} className="flex gap-2">
            <span className="text-[14px] text-[#58595A]">•</span>
            <span className="text-[14px] text-[#58595A]">{step}</span>
          </div>
        ))}
      </div>
      {dynamicSuffix && (
        <p className="text-[14px] mt-2 text-[#58595A]">
          {dynamicSuffix}
        </p>
      )}
    </section>
  );
};

export default PrudentialOverview; 