import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrudentialOverview from './PrudentialOverview';
import PrudentialSalesTechnique from './PrudentialSalesTechnique';
import PrudentialTechnicalKnowledge from './PrudentialTechnicalKnowledge';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const PrudentialAssessmentMain = () => {
  const { isColdCall, setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'sales-technique-section', title: t('assessment.salesTechnique') },
    ];

    if (!isColdCall) {
      sections.push({
        id: 'technical-knowledge-section',
        title: t('assessment.technicalKnowledge'),
      });
    }

    setSections(sections);
  }, [isColdCall, setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <PrudentialOverview />
      </div>

      <div id="sales-technique-section">
        <PrudentialSalesTechnique />
      </div>

      {!isColdCall && (
        <div id="technical-knowledge-section">
          <PrudentialTechnicalKnowledge />
        </div>
      )}
    </div>
  );
};

export default PrudentialAssessmentMain; 