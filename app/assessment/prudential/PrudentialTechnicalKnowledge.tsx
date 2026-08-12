import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { PrudentialSection, getSectionStatus } from './PrudentialSection';
import { PrudentialSectionSkeleton } from './PrudentialSectionSkeleton';

const PrudentialTechnicalKnowledge = () => {
  const { t } = useTranslation();
  const { technicalKnowledgeData: data, session, isTechnicalKnowledgeGenerating } = useAssessmentContext();

  const technicalSections = useMemo(() => {
    if (isTechnicalKnowledgeGenerating || !data) {
      return [
        {
          key: 'productKnowledge',
          title: t('assessment.productKnowledge'),
          isLoading: true,
        },
        {
          key: 'operationalKnowledge',
          title: t('assessment.operationalKnowledge'),
          isLoading: true,
        },
      ];
    }

    const { productKnowledge, operationalKnowledge } = data;
    const sections = [];

    if (productKnowledge) {
      sections.push({
        key: 'productKnowledge',
        title: t('assessment.productKnowledge'),
        score: productKnowledge.overallScore,
        status: getSectionStatus(productKnowledge.overallScore, 'default', t),
        completed: productKnowledge.completedItems,
        toImprove: productKnowledge.toImproveItems,
      });
    }

    if (operationalKnowledge) {
      sections.push({
        key: 'operationalKnowledge',
        title: t('assessment.operationalKnowledge'),
        score: operationalKnowledge.overallScore,
        status: getSectionStatus(
          operationalKnowledge.overallScore,
          'default',
          t,
        ),
        completed: operationalKnowledge.completedItems,
        toImprove: operationalKnowledge.toImproveItems,
      });
    }

    return sections;
  }, [data, isTechnicalKnowledgeGenerating, t]);

  return (
    <section id="technical-knowledge" className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="space-y-4">
        <h2 className="mb-4 text-[16px] font-bold">
          {t('assessment.technicalKnowledge')}
        </h2>

        {technicalSections.map((section: any) => {
          if (section.isLoading) {
            return (
              <PrudentialSectionSkeleton
                key={section.key}
                title={section.title}
              />
            );
          }
          return <PrudentialSection key={section.key} section={section} />;
        })}
      </div>
    </section>
  );
};

export default PrudentialTechnicalKnowledge; 