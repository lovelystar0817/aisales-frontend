export interface AssessmentDetails {
  clientVerification?: {
    completed: boolean;
    score: number;
  };
  frameworkExecution?: {
    score: number;
    type: '4C' | '3F';
  };
  objectionHandling?: {
    attemptCount: number;
    successfulCount: number;
    overallScore: number;
  };
  productKnowledge?: {
    score: number;
  };
  operationalKnowledge?: {
    score: number;
  };
  // MSIG-specific fields
  msigSections?: {
    [sectionKey: string]: {
      evaluations: Array<{
        description: string;
        pass: boolean;
        mandatory?: boolean;
        reasoning?: string;
      }>;
      isGenerating?: boolean;
      notApplicable?: boolean;
    };
  };
  // MSIG-specific fields
  manulifeSections?: {
    [sectionKey: string]: {
      evaluations: Array<{
        description: string;
        pass: boolean;
        reasoning?: string;
      }>;
      isGenerating?: boolean;
      notApplicable?: boolean;
    };
  };
  assessmentType?: 'regular' | 'prudential' | 'msig' | 'msig-3f' | 'manulife' | 'manulife-goalready';
}

export interface StandingWithDetails {
  tierName: string;
  tierLevel: number;
  createdAt: Date;
  assessmentDetails?: AssessmentDetails | null;
}

export interface StandingCriterion {
  assessmentArea: string;
  condition: string;
  value: any;
  description: string;
  title?: string;
  details?: string[];
  subCriteria?: {
    title: string;
    description: string;
    items?: string[];
  }[];
}

export interface StandingTier {
  name: string;
  level: number;
  scoreRange?: string; // For score-based standings (e.g., "Score: <85")
  criteria: StandingCriterion[];
}

export interface StandingConfiguration {
  name: string;
  module: string;
  type?: 'tier-based' | 'score-based' | 'manulife-score-based'; // Distinguish between formats
  tiers: StandingTier[];
  sharedCriteria?: StandingCriterion[]; // For MSIG unified criteria
}

export interface StandingsData {
  type: 'none' | 'msig' | 'prudential' | 'manulife' | 'manulife-goalready';
  latestStanding: StandingWithDetails | null;
  personalBest: StandingWithDetails | null;
}

// Helper functions for UI display
export const getScoreLevel = (score: number, t: any) => {
  if (score >= 67)
    return {
      text: t('practice.standings.expert'),
      class: 'text-gray-700',
      dotClass: 'bg-green-600',
    };
  if (score >= 34)
    return {
      text: t('practice.standings.intermediate'),
      class: 'text-gray-700',
      dotClass: 'bg-blue-600',
    };
  return {
    text: t('practice.standings.beginner'),
    class: 'text-gray-700',
    dotClass: 'bg-orange-600',
  };
};

export const getStatusInfo = (
  assessmentDetails: AssessmentDetails | null | undefined,
  t: any,
) => {
  const defaultStatus = {
    textClass: 'text-gray-500',
    text: t('practice.standings.notStarted'),
    dotClass: 'bg-gray-400',
  };

  if (!assessmentDetails) {
    return {
      clientVerification: defaultStatus,
      frameworkExecution: defaultStatus,
      objectionHandling: defaultStatus,
      productKnowledge: defaultStatus,
      operationalKnowledge: defaultStatus,
    };
  }

  const clientVerificationStatus = assessmentDetails.clientVerification
    ?.completed
    ? {
        textClass: 'text-gray-700',
        text: t('practice.standings.completed'),
        dotClass: 'bg-green-600',
      }
    : {
        textClass: 'text-gray-700',
        text: t('practice.standings.notCompleted'),
        dotClass: 'bg-gray-400',
      };

  const frameworkScore = assessmentDetails.frameworkExecution?.score || 0;
  const frameworkLevel = getScoreLevel(frameworkScore, t);
  const frameworkStatus = {
    textClass: frameworkLevel.class,
    text: `${frameworkLevel.text} (${frameworkScore}%)`,
    dotClass: frameworkLevel.dotClass,
  };

  const objectionScore = assessmentDetails.objectionHandling?.overallScore || 0;
  const objectionLevel = getScoreLevel(objectionScore, t);
  const objectionStatus = {
    textClass: objectionLevel.class,
    text: `${objectionLevel.text} (${objectionScore}%)`,
    dotClass: objectionLevel.dotClass,
  };

  const productKnowledgeScore = assessmentDetails.productKnowledge?.score || 0;
  const productKnowledgeLevel = getScoreLevel(productKnowledgeScore, t);
  const productKnowledgeStatus = {
    textClass: productKnowledgeLevel.class,
    text: `${productKnowledgeLevel.text} (${productKnowledgeScore}%)`,
    dotClass: productKnowledgeLevel.dotClass,
  };

  const operationalKnowledgeScore =
    assessmentDetails.operationalKnowledge?.score || 0;
  const operationalKnowledgeLevel = getScoreLevel(operationalKnowledgeScore, t);
  const operationalKnowledgeStatus = {
    textClass: operationalKnowledgeLevel.class,
    text: `${operationalKnowledgeLevel.text} (${operationalKnowledgeScore}%)`,
    dotClass: operationalKnowledgeLevel.dotClass,
  };

  return {
    clientVerification: clientVerificationStatus,
    frameworkExecution: frameworkStatus,
    objectionHandling: objectionStatus,
    productKnowledge: productKnowledgeStatus,
    operationalKnowledge: operationalKnowledgeStatus,
  };
};
