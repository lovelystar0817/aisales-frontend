import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import AXAPHSoftSkills from './AXAPHSoftSkills';
import AXAPHKnowledgeSkills from './AXAPHKnowledgeSkills';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const AXAPHAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'soft-skills-section', title: t('assessment.softSkills') },
      { id: 'knowledge-skills-section', title: t('assessment.knowledgeSkills') },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      <div id="soft-skills-section">
        <AXAPHSoftSkills />
      </div>

      <div id="knowledge-skills-section">
        <AXAPHKnowledgeSkills />
      </div>
    </div>
  );
};

export default AXAPHAssessmentMain;

