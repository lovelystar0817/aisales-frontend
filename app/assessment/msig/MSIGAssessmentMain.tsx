import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MSIGOverview from './MSIGOverview';
import MSIGSalesTechnique from './MSIGSalesTechnique';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const MSIGAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'sales-technique-section', title: t('assessment.salesTechnique') },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <MSIGOverview />
      </div>

      <div id="sales-technique-section">
        <MSIGSalesTechnique />
      </div>
    </div>
  );
};

export default MSIGAssessmentMain;
