import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Overview from '../regular/Overview';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { AIAKOAssessmentSection } from './AIAKOAssessmentSection';

const AIAKOProductPitchAssessmentMain = () => {
  const {
    setSections,
    aiaKoNeedsAnalysisData,
    aiaKoProductPitchData,
    aiaKoProductPitchObjectionHandlingData,
  } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'needs-analysis-section', title: t('assessment.needsAnalysis') },
      {
        id: 'product-pitch-section',
        title: t('assessment.productPitch'),
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
        <Overview />
      </div>

      <div id="needs-analysis-section">
        <AIAKOAssessmentSection
          type="needsAnalysis"
          data={aiaKoNeedsAnalysisData}
          sectionId="aia-ko-needs-analysis"
        />
      </div>

      <div id="product-pitch-section">
        <AIAKOAssessmentSection
          type="productPitch"
          data={aiaKoProductPitchData}
          sectionId="aia-ko-product-pitch"
        />
      </div>

      <div id="objection-handling-section">
        <AIAKOAssessmentSection
          type="objectionHandling"
          data={aiaKoProductPitchObjectionHandlingData}
          sectionId="aia-ko-product-pitch-objection-handling"
        />
      </div>
    </div>
  );
};

export default AIAKOProductPitchAssessmentMain;
