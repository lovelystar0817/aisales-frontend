import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PrudentialSectionSkeleton } from '~/assessment/prudential/PrudentialSectionSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { getSectionStatus, PrudentialSection } from './PrudentialSection';

const PrudentialSalesTechnique = () => {
  const { t } = useTranslation();
  const {
    salesTechniquesData: data,
    session,
    isSalesTechniquesGenerating,
    isColdCall,
  } = useAssessmentContext();

  const prudentialSections = useMemo(() => {
    const aggregatedSections = [];

    // Section 1: Client Verification (only for cold calls)
    if (isColdCall) {
      if (isSalesTechniquesGenerating) {
        aggregatedSections.push({
          key: 'clientVerification',
          title: t('assessment.standings.clientVerification'),
          isMandatory: true,
          isLoading: true,
        });
      } else if (data?.clientVerification) {
        const {
          completedItems = [],
          toImproveItems = [],
        } = data.clientVerification;
        const totalItems = completedItems.length + toImproveItems.length;
        const score =
          totalItems > 0
            ? Math.round((completedItems.length / totalItems) * 100)
            : 0;

        aggregatedSections.push({
          key: 'clientVerification',
          title: t('assessment.standings.clientVerification'),
          score,
          status: getSectionStatus(score, 'clientVerification', t),
          isMandatory: true,
          completed: completedItems,
          toImprove: toImproveItems,
        });
      }
    }

    // Section 2: Framework Execution
    if (isSalesTechniquesGenerating) {
      const dynamicTitle =
        session?.framework?.title && session?.framework?.parts
          ? t('assessment.standings.dynamicFramework', {
              framework: session.framework.title,
              parts: session.framework.parts
                .map((p: any) => p.title)
                .join(', '),
            })
          : 'Framework Execution';

      aggregatedSections.push({
        key: 'frameworkExecution',
        title: dynamicTitle,
        isLoading: true,
      });
    } else if (data?.frameworkExecution) {
      const { overallScore, completedItems, toImproveItems } =
        data.frameworkExecution;

      const dynamicTitle =
        session?.framework?.title && session?.framework?.parts
          ? t('assessment.standings.dynamicFramework', {
              framework: session.framework.title,
              parts: session.framework.parts
                .map((p: any) => p.title)
                .join(', '),
            })
          : 'Framework Execution';

      aggregatedSections.push({
        key: 'frameworkExecution',
        title: dynamicTitle,
        score: overallScore,
        status: getSectionStatus(overallScore, 'frameworkExecution', t),
        isMandatory: false,
        completed: completedItems || [],
        toImprove: toImproveItems || [],
      });
    }

    // Section 3: Objection Handling
    if (isSalesTechniquesGenerating) {
      aggregatedSections.push({
        key: 'objectionHandling',
        title: t('assessment.standings.objectionHandling'),
        isLoading: true,
      });
    } else if (data?.objectionHandling) {
      const {
        overallScore = 0,
        completedItems = [],
        toImproveItems = [],
        objections = [],
      } = data.objectionHandling;
      
      // Calculate attemptCount and successfulCount from objections array
      const attemptCount = objections.length;
      const successfulCount = objections.filter((obj: any) => obj.isSuccessful).length;
      const score = overallScore;

      // Use the toImproveItems and completedItems from the API response
      const toImprove = toImproveItems;
      const completed = completedItems;

      aggregatedSections.push({
        key: 'objectionHandling',
        title: t('assessment.standings.objectionHandling'),
        score,
        status: getSectionStatus(score, 'objectionHandling', t),
        isMandatory: false,
        toImprove,
        completed,
      });
    }

    return aggregatedSections;
  }, [data, session, t, isSalesTechniquesGenerating, isColdCall]);

  const clientVerificationSection = prudentialSections.find(
    (s) => s.key === 'clientVerification',
  );
  const clientVerificationIsLoading = clientVerificationSection?.isLoading;
  const clientVerificationIsIncomplete =
    !clientVerificationIsLoading &&
    clientVerificationSection?.status ===
      t('assessment.standings.incomplete');
  const frameworkExecutionSection = prudentialSections.find(
    (s) => s.key === 'frameworkExecution',
  );

  return (
    <section id="sales-technique" className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="space-y-4">
        <h2 className="mb-4 text-[16px] font-bold">
          {t('assessment.salesTechnique')}
        </h2>

        {prudentialSections.map((section: any) => {
          if (section.isLoading) {
            return (
              <PrudentialSectionSkeleton
                key={section.key}
                title={section.title}
                isMandatory={section.isMandatory}
              />
            );
          }
          return (
            <PrudentialSection
              key={section.key}
              section={section}
              hideScore={
                clientVerificationIsIncomplete &&
                section.key !== 'clientVerification'
              }
            />
          );
        })}
      </div>
    </section>
  );
};

export default PrudentialSalesTechnique; 