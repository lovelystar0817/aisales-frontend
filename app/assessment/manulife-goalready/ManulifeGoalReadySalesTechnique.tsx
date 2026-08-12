import { useMemo } from 'react';
import type { ManulifeGoalReadyAssessmentData } from '~/assessment/types';
import { MANULIFE_GOALREADY_SECTION_ORDER } from '~/util/manulife-goalready';
import { ManulifeGoalReadySection } from './ManulifeGoalReadySection';

interface ManulifeGoalReadySalesTechniqueProps {
  data: ManulifeGoalReadyAssessmentData | null;
}

export function ManulifeGoalReadySalesTechnique({
  data,
}: ManulifeGoalReadySalesTechniqueProps) {
  const sections = useMemo(() => {
    if (!data) return [];

    return MANULIFE_GOALREADY_SECTION_ORDER.map((sectionDef) => {
      const sectionData = data[sectionDef.key];

      return {
        key: sectionDef.key,
        title: sectionDef.title,
        score: sectionData?.score || 0,
        maxScore: sectionDef.maxScore,
        subsections: sectionData?.subsections || [],
      };
    });
  }, [data]);

  if (!data) {
    return (
      <div className="space-y-6">
        {MANULIFE_GOALREADY_SECTION_ORDER.map((section) => (
          <div key={section.key} className="bg-white rounded-2xl p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full mb-6" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.generating) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
            <p className="text-gray-600">Generating assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <ManulifeGoalReadySection
          key={section.key}
          title={section.title}
          score={section.score}
          maxScore={section.maxScore}
          subsections={section.subsections}
        />
      ))}
      
      {data.nextSteps && data.nextSteps.length > 0 && (
        <div className="bg-white rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
          <ul className="list-disc list-inside space-y-2">
            {data.nextSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
