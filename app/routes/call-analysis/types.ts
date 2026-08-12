// API Types

// Product types for Call Analysis
export type CallAnalysisProduct = 'traveleasy' | 'parecoveryplus' | 'dentiplus';

export interface TranscriptSegment {
  speaker: 0 | 1;
  role: 'agent' | 'customer';
  timestamp: number;
  content: string;
}

// MSIG 6-section assessment types (for PARecovery Plus & DentiPlus)
export interface MSIGEvaluation {
  criteriaId: string;
  criteriaText: string;
  pass: boolean;
  mandatory: boolean;
  evidence: string;
}

export interface MSIGSection {
  sectionType: string;
  sectionWeight: number;
  description: string;
  evaluations: MSIGEvaluation[];
  notApplicable?: boolean;
  notApplicableReason?: string;
  score?: number;
  maxScore?: number;
}

export interface MSIGAssessment {
  sections: Record<string, MSIGSection>;
  overallScore: number;
  tier: string;
  hasMandatoryFailures: boolean;
  summary: string;
  suggestedNextSteps: string[];
}

export interface AssessmentCriteria {
  criteria: string;
  evaluation: string;
  score: number;
  maxScore: number;
  weight: number;
}

export interface Assessment {
  summary: string;
  suggestedNextSteps: string[];
  mandatory: AssessmentCriteria[];
  softSkills: AssessmentCriteria[];
  knowledgeApplication: AssessmentCriteria[];
}

export interface CallOverview {
  keyTakeaways: string[];
  callHealth: {
    positiveSignals: string[];
    risksObserved: string[];
    recommendations: string[];
  };
  actionableNextSteps: {
    keyActions: string[];
    nextCall: string;
  };
}

export interface ProcessingStep {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface CallAnalysisStatus {
  id: string;
  status: 'uploading' | 'transcribing' | 'processing' | 'completed' | 'failed';
  product?: CallAnalysisProduct;
  processingSteps: {
    transcription: ProcessingStep;
    transcriptPIIRemoval: ProcessingStep;
    assessment: ProcessingStep;
    assessmentPIIRemoval: ProcessingStep;
  };
  transcript?: TranscriptSegment[];
  assessment?: Assessment;
  msigAssessment?: MSIGAssessment;
  overview?: CallOverview;
  audioFileName?: string;
  companyLogo?: {
    url?: string;
    height?: string;
  };
  error?: {
    step: string;
    message: string;
    timestamp: string;
  };
  completedAt?: string;
  new?: boolean;
  createdAt: string;
  updatedAt: string;
  audioFileUrl?: string;
  overallScore?: number;
}
