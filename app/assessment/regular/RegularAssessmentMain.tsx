import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from './Overview';
import SalesTechnique from './SalesTechnique';
import ProductKnowledge from './ProductKnowledge';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const RegularAssessmentMain = () => {
  const { isColdCall, setSections, session } = useAssessmentContext();
  const { t } = useTranslation();

  // Check if this is an Alibaba Cloud telesales session
  const isAlibabaTelesales =
    session?.roleplay?.framework === 'ALIBABA_TELESALES';

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'sales-technique-section', title: t('assessment.salesTechnique') },
    ];

    // Don't show product knowledge for cold calls or Alibaba telesales
    if (!isColdCall && !isAlibabaTelesales) {
      sections.push({
        id: 'product-knowledge-section',
        title: t('assessment.productKnowledge'),
      });
    }

    setSections(sections);
  }, [isColdCall, isAlibabaTelesales, setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      <div id="sales-technique-section">
        <SalesTechnique />
      </div>

      {!isColdCall && !isAlibabaTelesales && (
        <div id="product-knowledge-section">
          <ProductKnowledge />
        </div>
      )}
    </div>
  );
};

export default RegularAssessmentMain;
