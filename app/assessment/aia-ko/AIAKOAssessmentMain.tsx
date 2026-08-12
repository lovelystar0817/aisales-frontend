import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { AIAKOAssessmentSection } from './AIAKOAssessmentSection';

const AIAKOAssessmentMain = () => {
  const {
    setSections,
    aiaKoIntroductionData,
    aiaKoObjectionHandlingData,
    aiaKoNeedsExplorationData,
  } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'introduction-section', title: t('assessment.introduction') },
      {
        id: 'objection-handling-section',
        title: t('assessment.objectionHandling'),
      },
      {
        id: 'needs-exploration-section',
        title: t('assessment.needsHealthExploration'),
      },
    ];

    setSections(sections);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      <div id="introduction-section">
        <AIAKOAssessmentSection
          type="introduction"
          data={aiaKoIntroductionData}
          sectionId="aia-ko-introduction"
        />
      </div>

      <div id="objection-handling-section">
        <AIAKOAssessmentSection
          type="objectionHandling"
          data={aiaKoObjectionHandlingData}
          sectionId="aia-ko-objection-handling"
        />
      </div>

      <div id="needs-exploration-section">
        <AIAKOAssessmentSection
          type="needsExploration"
          data={aiaKoNeedsExplorationData}
          sectionId="aia-ko-needs-exploration"
        />
      </div>
    </div>
  );
};

export default AIAKOAssessmentMain;
