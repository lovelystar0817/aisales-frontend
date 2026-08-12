// Manulife GoalReady section definitions and utilities

export const MANULIFE_GOALREADY_SECTION_ORDER = [
  {
    key: 'salesAndNegotiationSkills',
    title: 'Sales & Negotiation Skills',
    maxScore: 100
  },
  {
    key: 'softSkills',
    title: 'Soft Skills',
    maxScore: 100
  },
  {
    key: 'productKnowledge',
    title: 'Product Knowledge',
    maxScore: 100
  },
] as const;

export type ManulifeGoalReadySectionKey =
  | 'salesAndNegotiationSkills'
  | 'softSkills'
  | 'productKnowledge';

export interface ManulifeGoalReadyToImproveItem {
  text: string;
  status: 'warning' | 'error';
  correction?: string;
}

export interface ManulifeGoalReadySubsection {
  title: string;
  score: number;
  maxScore: number;
  why?: string;
  suggestion?: string;
  strengths?: string[];
  toImprove?: ManulifeGoalReadyToImproveItem[];
}

export interface ManulifeGoalReadySection {
  title: string;
  score: number;
  maxScore: number;
  subsections: ManulifeGoalReadySubsection[];
}

export interface ManulifeGoalReadyAssessmentData {
  overallScore: number;
  overallFeedback: string;
  salesAndNegotiationSkills: ManulifeGoalReadySection;
  softSkills: ManulifeGoalReadySection;
  productKnowledge: ManulifeGoalReadySection;
  nextSteps?: string[];
  tooBrief?: boolean;
  generating?: boolean;
  lastUpdated?: string;
}

/**
 * Calculate average score across all sections (with 1 decimal place)
 */
export function calculateGoalReadyTotalScore(
  data: ManulifeGoalReadyAssessmentData | null
): number {
  if (!data) return 0;

  const total = (
    (data.salesAndNegotiationSkills?.score || 0) +
    (data.softSkills?.score || 0) +
    (data.productKnowledge?.score || 0)
  );

  const average = total / 3;
  
  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
}

/**
 * Calculate max score (100 since we show average)
 */
export function calculateGoalReadyMaxScore(): number {
  return 100;
}

/**
 * Get tier based on overall score (average)
 * Using 70% pass threshold: 70/100 = Pass, 80/100 = Champion
 */
export function getGoalReadyTierFromScore(score: number): string {
  if (score >= 80) return 'Champion';  // 80 <= Score <= 100
  if (score >= 50) return 'Pass';      // 50 <= Score <  80
  return 'Failed';
}

/**
 * Check if GoalReady assessment data is complete
 */
export function isGoalReadyAssessmentComplete(
  data: ManulifeGoalReadyAssessmentData | null
): boolean {
  if (!data) return false;
  if (data.generating) return false;

  // Check if all sections have scores
  const hasAllScores =
    data.salesAndNegotiationSkills?.score !== undefined &&
    data.softSkills?.score !== undefined &&
    data.productKnowledge?.score !== undefined;

  return hasAllScores;
}

/**
 * Get color based on score percentage
 * - score < 50: #E60D00 (red)
 * - 50 <= score < 80: #1C7AEB (blue)
 * - score >= 80: #38A383 (green)
 */
export function getScoreColor(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;

  if (percentage < 50) return '#E60D00';
  if (percentage < 80) return '#1C7AEB';
  return '#38A383';
}
