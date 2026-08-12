import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext'
import Overview from '../regular/Overview'
import { AIAKOE2EAssessmentSection } from './AIAKOE2EAssessmentSection'

const E2E_SECTION_COUNT = 6;

const AIAKOE2EAssessmentMain = () => {
  const { setSections, aiaKoE2EAssessmentData } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    setSections([
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'e2e-section-0', title: t('assessment.aiaKoE2E.introduction') },
      { id: 'e2e-section-1', title: t('assessment.aiaKoE2E.needsAnalysis') },
      { id: 'e2e-section-2', title: t('assessment.aiaKoE2E.productPitch') },
      { id: 'e2e-section-3', title: t('assessment.aiaKoE2E.objectionHandling') },
      { id: 'e2e-section-4', title: t('assessment.aiaKoE2E.closing') },
      { id: 'e2e-section-5', title: t('assessment.aiaKoE2E.other') },
    ]);
  }, [setSections, t]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <Overview />
      </div>

      {[...Array(E2E_SECTION_COUNT)].map((_, index) => {
        const sectionId = `e2e-section-${index}`;
        return (
          <div key={sectionId} id={sectionId}>
            <AIAKOE2EAssessmentSection
              section={aiaKoE2EAssessmentData?.sections?.[index]}
              sectionId={sectionId}
              sectionIndex={index}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AIAKOE2EAssessmentMain;
