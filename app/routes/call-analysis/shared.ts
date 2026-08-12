import type { CallAnalysisStatus } from './types';

export const getOverallScore = (analysis: CallAnalysisStatus | null) => {
  if (!analysis?.assessment) return null;

  const allCriteria = [
    ...analysis.assessment.mandatory,
    ...analysis.assessment.softSkills,
    ...analysis.assessment.knowledgeApplication,
  ];

  const totalScore = allCriteria.reduce(
    (sum, c) => sum + c.score * c.weight,
    0,
  );
  const totalMaxScore = allCriteria.reduce(
    (sum, c) => sum + c.maxScore * c.weight,
    0,
  );

  return totalMaxScore > 0
    ? ((totalScore / totalMaxScore) * 100).toFixed(1)
    : null;
};
