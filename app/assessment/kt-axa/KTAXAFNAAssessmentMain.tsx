import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import KTAXASoftSkills from './KTAXASoftSkills';
import KTAXAKnowledgeSkills from './KTAXAKnowledgeSkills';
import KTAXAProductKnowledge from './KTAXAProductKnowledge';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

const KTAXAFNAAssessmentMain = () => {
  const { setSections } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'soft-skills-section', title: t('assessment.softSkills') },
      { id: 'knowledge-skills-section', title: t('assessment.knowledgeSkills') },
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

      <div id="soft-skills-section">
        <KTAXASoftSkills />
      </div>

      <div id="knowledge-skills-section">
        <KTAXAKnowledgeSkills />
      </div>

      <div id="product-knowledge-section">
        <KTAXAProductKnowledge />
      </div>
    </div>
  );
};

export default KTAXAFNAAssessmentMain;
