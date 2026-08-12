import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import SalesTechnique from '../regular/SalesTechnique';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const MTLRecruitmentAssessmentMain = () => {
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
        <Overview />
      </div>

      <div id="sales-technique-section">
        <SalesTechnique />
      </div>
    </div>
  );
};

export default MTLRecruitmentAssessmentMain;

