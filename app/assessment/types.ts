import type { Session } from '~/routes/app/roleplay/types';

export type StandingProgressionType =
  | 'first-time' // First time completing this scenario
  | 'upgrade' // New personal best standing
  | 'maintained-same' // Same standing as previous best, same or worse score
  | 'maintained-improved' // Same standing as previous best, better score
  | 'downgrade' // Lower standing than personal best
  | 'no-standing'; // No standing achieved (mandatory not met)

export interface StandingProgressionContext {
  type: StandingProgressionType;
  currentStanding?: {
    tierName: string;
    tierLevel: number;
  };
  previousBest?: {
    tierName: string;
    tierLevel: number;
    achievedAt: Date;
  };
  isFirstTime: boolean;
  isNewBest: boolean;
  isNewBestScore: boolean;
  isHighestLevel: boolean;
}

// Extended Session interface for assessment page
export interface ExtendedSession extends Omit<Session, 'roleplay'> {
  standing?: {
    _id: string;
    tierName: string;
    tierLevel: number;
    achievedAt: Date;
  };
  standingProgression?: StandingProgressionContext;
  hasScorecards?: boolean;

  roleplay: {
    title: string;
    summary: string;
    objectives: string[];
    mainObjection: string;
    framework: string;
    alternativeProducts: string[];
    duration?: number;
    feedback?: {
      overview?: string;
      salesTechniques?: string;
      productKnowledge?: string;
      technicalKnowledge?: string;
      // BBL-specific assessment fields
      advisoryTechnique?: string;
      processAdherence?: string;
      // HSBC-specific assessment fields
      relationshipManagement?: string;
      hsbcProcessAdherence?: string;
      representation?: string;
      communicationAndPresence?: string;
      // Grab MEX-specific assessment fields
      grabMexSoftSkills?: string;
      isStandingGenerating?: boolean;
      // AXA-PH-specific assessment fields
      axaPhSoftSkills?: string;
      axaPhKnowledgeSkills?: string;
      // Prudential Objection Handling fields
      prudentialOHSalesTechnique?: string;
      prudentialOHObjectionHandling?: string;
      // KT-AXA-specific assessment fields
      ktAxaSoftSkills?: string;
      ktAxaKnowledgeSkills?: string;
      // Prudential PH Appointment Setting fields
      prudentialPHAppointmentSetting?: string;
      prudentialPHAppointmentSettingGenerating?: boolean;
      prudentialPHFactFindingTechnique?: string;
      prudentialPHProductKnowledge?: string;
      //AIA KO
      aiaKoIntroduction?: string;
      aiaKoObjectionHandling?: string;
      aiaKoNeedsExploration?: string;
      // Great Eastern
      greatEasternAssessment?: string;

      aiaKoProductPitch?: string;
      aiaKoNeedsAnalysis?: string;
      aiaKoProductPitchObjectionHandling?: string;
      // AIA KO E2E (End-to-End Outbound Call)
      aiaKoE2EAssessment?: string;
      aiaKoE2EAssessmentGenerating?: boolean;

      scorecards?: {
        name: string;
        criteria: {
          title: string;
          description: string;
        }[];
      }[];
    };
    // SCORM completion tracking (set by backend when ALL assessment jobs are done)
    scormCompletionReady?: boolean;
    overallScore?: number;
  };
}

export interface AssessmentData {
  totalScores: TotalScore[];
  practiceInfo: PracticeInfo;
}

export interface TotalScore {
  score: number;
  label: string;
}

export interface PracticeInfo {
  type: string;
  product: string;
  client: string;
  completedAt: string;
}

export interface Overview {
  summary: string;
  suggestedNextSteps: string[];
}

export interface SalesTechniquesParams {
  description?: string;
  overallScore: number;
  maxScore?: number;
  sections?: SalesTechniquesSection[];
  // AIA KO simplified format
  strengths?: string[];
  toImprove?: string[];
  frameworkExecution?: {
    overallScore: number;
    completedItems: string[];
    toImproveItems: string[];
  };
  clientVerification?: {
    completed: boolean;
    completedItems: string[];
    toImproveItems: string[];
  };
  objectionHandling?: {
    overallScore: number;
    completedItems: string[];
    toImproveItems: string[];
    objections: {
      objection: string;
      userResponse: string;
      isSuccessful: boolean;
      feedback: string;
    }[];
  };
}

export interface SalesTechniquesSection {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  suggestion: string;
}

export interface ProductKnowledgeParams {
  description: string;
  overallScore: number;
  maxScore?: number;
  sections?: ProductKnowledgeSection[];
}

export interface CustomProductKnowledgeParams {
  description: string;
  overallScore: number;
  maxScore?: number;
  criteria?: ProductKnowledgeSection[];
  isGenerating?: boolean;
}

export interface TechnicalKnowledgeParams {
  productKnowledge: {
    overallScore: number;
    completedItems: string[];
    toImproveItems: string[];
  };
  operationalKnowledge: {
    overallScore: number;
    completedItems: string[];
    toImproveItems: string[];
  };
}

export interface ProductKnowledgeSection {
  title: string;
  score: number;
  maxScore: number;
  strengths: string[];
  toImprove: ToImpove[];
}

export interface ScorecardSection {
  name: string;
  description: string;
  overallScore: number;
  maxScore: number;
  sectionType?: string;
  criteria: {
    title: string;
    score: number;
    maxScore: number;
    reason?: string;
    suggestion?: string;
    strengths?: string[];
    toImprove?: Array<{
      status?: 'warning' | 'error';
      text: string;
      correction?: string;
    }>;
  }[];
}

export interface ToImpove {
  text: string;
  status: 'warning' | 'error';
  correction: string | null;
}

export interface GrabMexSoftSkillsToImprove {
  text: string;
  example: string;
}

export interface GrabMexSoftSkillsSection {
  title: string;
  score: number;
  maxScore: number;
  strengths: string[];
  toImprove: GrabMexSoftSkillsToImprove[];
}

export interface GrabMexSoftSkillsData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: GrabMexSoftSkillsSection[];
}

// HSBC-specific assessment types
export interface HSBCRelationshipManagementSection {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  suggestion: string;
}

export interface HSBCRelationshipManagementData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: HSBCRelationshipManagementSection[];
}

export interface HSBCProcessAdherenceSection {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  suggestion: string;
}

export interface HSBCProcessAdherenceData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: HSBCProcessAdherenceSection[];
}

export interface HSBCRepresentationData {
  description: string;
  overallScore: number;
  maxScore: number;
  title: string;
  why: string;
  suggestion: string;
}

export interface HSBCCommunicationAndPresenceSection {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  whatToImprove: string;
}

export interface HSBCCommunicationAndPresenceData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: HSBCCommunicationAndPresenceSection[];
}

// Prudential Objection Handling (LAPR Framework) types
export interface PrudentialObjectionHandlingSection {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  suggestion: string;
  completedItems?: string[];
  toImproveItems?: string[];
}

export interface PrudentialObjectionHandlingSalesTechniqueData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: PrudentialObjectionHandlingSection[];
}

export interface PrudentialObjectionHandlingLAPRData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: PrudentialObjectionHandlingSection[];
}

export interface PrudentialObjectionHandlingData {
  salesTechnique: PrudentialObjectionHandlingSalesTechniqueData;
  objectionHandling: PrudentialObjectionHandlingLAPRData;
}

// Prudential PH Appointment Setting types
export interface PrudentialPHAppointmentSettingSection {
  title: string;
  score: number;
  maxScore: number;
  isMandatory: boolean;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
  why?: string;
  suggestion?: string;
}

export interface PrudentialPHAppointmentSettingData {
  overallScore: number;
  overallFeedback: string;
  sections: PrudentialPHAppointmentSettingSection[];
  nextSteps: string[];
}

// Great Eastern Assessment types
export interface GreatEasternCriterion {
  title: string;
  score: number;
  maxScore: number;
  feedback: string;
  why?: string;
  suggestion?: string;
}

export interface GreatEasternSection {
  title: string;
  score: number;
  maxScore: number;
  feedback: string;
  why?: string;
  suggestion?: string;
  strengths: string[];
  improvements: string[];
  criteria: GreatEasternCriterion[];
}

export interface GreatEasternAssessmentData {
  overallScore: number;
  overallFeedback: string;
  sections: GreatEasternSection[];
  nextSteps: string[];
}

// AIA KO E2E (End-to-End Outbound Call) assessment types
export interface AIAKOE2ECriterion {
  title: string;
  score: number;
  maxScore: number;
  why: string;
  suggestion: string;
}

export interface AIAKOE2ESection {
  title: string;
  score: number;
  maxScore: number;
  weight: number;
  criteria: AIAKOE2ECriterion[];
}

export interface AIAKOE2EAssessmentData {
  description: string;
  overallScore: number;
  maxScore: number;
  sections: AIAKOE2ESection[];
}

// Manulife GoalReady Assessment types
export interface ManulifeGoalReadyStatement {
  text: string;
  category: 'CORRECT' | 'WARNING' | 'INCORRECT';
  correction: string;
}

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
  statements?: ManulifeGoalReadyStatement[];
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
