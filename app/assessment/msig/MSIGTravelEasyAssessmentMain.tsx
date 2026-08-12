import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { MSIGTravelEasyAssessmentSection } from './MSIGTravelEasyAssessmentSection';

const MSIGTravelEasyAssessmentMain = () => {
  const {
    setSections,
    msigTravelEasySoftSkillsData,
    msigTravelEasyKnowledgeSkillsData,
    msigTravelEasyProductKnowledgeData,
  } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'soft-skills-section', title: t('assessment.softSkills') },
      {
        id: 'knowledge-skills-section',
        title: t('assessment.knowledgeSkills'),
      },
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
        <MSIGTravelEasyAssessmentSection
          type="softSkills"
          data={msigTravelEasySoftSkillsData}
          sectionId="msig-soft-skills"
        />
      </div>

      <div id="knowledge-skills-section">
        <MSIGTravelEasyAssessmentSection
          type="knowledgeSkills"
          data={msigTravelEasyKnowledgeSkillsData}
          sectionId="msig-knowledge-skills"
        />
      </div>

      <div id="product-knowledge-section">
        <MSIGTravelEasyAssessmentSection
          type="productKnowledge"
          data={msigTravelEasyProductKnowledgeData}
          sectionId="msig-product-knowledge"
        />
      </div>
    </div>
  );
};

export default MSIGTravelEasyAssessmentMain;
