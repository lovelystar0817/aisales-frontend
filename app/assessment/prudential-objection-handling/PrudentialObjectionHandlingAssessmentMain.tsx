import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import PrudentialObjectionHandlingOverview from './PrudentialObjectionHandlingOverview';
import PrudentialObjectionHandlingSalesTechnique from './PrudentialObjectionHandlingSalesTechnique';
import PrudentialObjectionHandlingLAPR from './PrudentialObjectionHandlingLAPR';

const PrudentialObjectionHandlingAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      {
        id: 'sales-technique-section',
        title: t('assessment.salesTechnique'),
      },
      {
        id: 'objection-handling-section',
        title: t('assessment.objectionHandling'),
      },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <PrudentialObjectionHandlingOverview />
      </div>

      <div id="sales-technique-section">
        <PrudentialObjectionHandlingSalesTechnique />
      </div>

      <div id="objection-handling-section">
        <PrudentialObjectionHandlingLAPR />
      </div>
    </div>
  );
};

export default PrudentialObjectionHandlingAssessmentMain;
