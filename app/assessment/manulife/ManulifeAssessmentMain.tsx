import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import ManulifeOverview from './ManulifeOverview';
import ManulifeSalesTechnique from './ManulifeSalesTechnique';

const ManulifeAssessmentMain = () => {
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
        <ManulifeOverview />
      </div>

      <div id="sales-technique-section">
        <ManulifeSalesTechnique />
      </div>
    </div>
  );
};

export default ManulifeAssessmentMain;
