import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import BBLAdvisoryTechnique from './BBLAdvisoryTechnique';
import BBLProcessAdherence from './BBLProcessAdherence';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const BBLAssessmentMain = () => {
  const { isColdCall, setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'advisory-technique-section', title: t('assessment.advisoryTechnique') },
    ];

    if (!isColdCall) {
      sections.push({
        id: 'process-adherence-section',
        title: t('assessment.processAdherence'),
      });
    }

    setSections(sections);
  }, [isColdCall, setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      <div id="advisory-technique-section">
        <BBLAdvisoryTechnique />
      </div>

      <div id="process-adherence-section">
        <BBLProcessAdherence />
      </div>
    </div>
  );
};

export default BBLAssessmentMain;
