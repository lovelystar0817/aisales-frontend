import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { ManulifeGoalReadyOverview } from './ManulifeGoalReadyOverview';
import { ManulifeGoalReadySection } from './ManulifeGoalReadySection';
import { MANULIFE_GOALREADY_SECTION_ORDER } from '~/util/manulife-goalready';
import type { ManulifeGoalReadyAssessmentData } from '~/assessment/types';

interface ManulifeGoalReadyAssessmentMainProps {
  goalReadyData: ManulifeGoalReadyAssessmentData | null;
}

export function ManulifeGoalReadyAssessmentMain({
  goalReadyData,
}: ManulifeGoalReadyAssessmentMainProps) {
  const {
    setSections,
    isManulifeSalesGenerating,
    isManulifeSoftSkillsGenerating,
    isManulifeProductKnowledgeGenerating,
  } = useAssessmentContext();
  const { t } = useTranslation();

  useEffect(() => {
    const sections = [
      { id: 'overview-section', title: t('assessment.overview') },
      { id: 'sales-negotiation-section', title: 'Sales & Negotiation Skills' },
      { id: 'soft-skills-section', title: 'Soft Skills' },
      { id: 'product-knowledge-section', title: 'Product Knowledge' },
    ];

    setSections(sections);
  }, [setSections, t]);

  const sections = useMemo(() => {
    return MANULIFE_GOALREADY_SECTION_ORDER.map((sectionDef) => {
      const sectionData = goalReadyData?.[sectionDef.key];

      return {
        key: sectionDef.key,
        title: sectionDef.title,
        score: sectionData?.score || 0,
        maxScore: sectionDef.maxScore,
        subsections: sectionData?.subsections || [],
      };
    });
  }, [goalReadyData]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <ManulifeGoalReadyOverview />
      </div>

      <div id="sales-negotiation-section">
        <ManulifeGoalReadySection
          title={sections[0].title}
          score={sections[0].score}
          maxScore={sections[0].maxScore}
          subsections={sections[0].subsections}
          isGenerating={isManulifeSalesGenerating}
        />
      </div>

      <div id="soft-skills-section">
        <ManulifeGoalReadySection
          title={sections[1].title}
          score={sections[1].score}
          maxScore={sections[1].maxScore}
          subsections={sections[1].subsections}
          isGenerating={isManulifeSoftSkillsGenerating}
        />
      </div>

      <div id="product-knowledge-section">
        <ManulifeGoalReadySection
          title={sections[2].title}
          score={sections[2].score}
          maxScore={sections[2].maxScore}
          subsections={sections[2].subsections}
          isGenerating={isManulifeProductKnowledgeGenerating}
        />
      </div>
    </div>
  );
}
