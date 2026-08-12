import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GrabMexSoftSkills from '~/assessment/grab-mex/GrabMexSoftSkills';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import Overview from '../regular/Overview';
import ProductKnowledge from '../regular/ProductKnowledge';
import SalesTechnique from '../regular/SalesTechnique';

const GrabMexAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'grab-mex-soft-skills-section', title: t('assessment.softSkills') },
      { id: 'sales-technique-section', title: t('assessment.salesTechnique') },
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
        <Overview />
      </div>

      <div id="grab-mex-soft-skills-section">
        <GrabMexSoftSkills />
      </div>

      <div id="sales-technique-section">
        <SalesTechnique />
      </div>

      <div id="product-knowledge-section">
        <ProductKnowledge />
      </div>
    </div>
  );
};

export default GrabMexAssessmentMain;
