import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import PrudentialPHFactFindingOverview from './PrudentialPHFactFindingOverview';
import PrudentialPHFactFindingTechnique from './PrudentialPHFactFindingTechnique';
import PrudentialPHFactFindingProductKnowledge from './PrudentialPHFactFindingProductKnowledge';

const PrudentialPHFactFindingAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      {
        id: 'fact-finding-technique-section',
        title: t('assessment.factFindingTechnique', 'Fact Finding Technique'),
      },
      {
        id: 'product-knowledge-section',
        title: t('assessment.productKnowledge'),
      },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <PrudentialPHFactFindingOverview />
      </div>

      <div id="fact-finding-technique-section">
        <PrudentialPHFactFindingTechnique />
      </div>

      <div id="product-knowledge-section">
        <PrudentialPHFactFindingProductKnowledge />
      </div>
    </div>
  );
};

export default PrudentialPHFactFindingAssessmentMain;
