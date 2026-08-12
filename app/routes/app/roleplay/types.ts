import type { Module } from '~/types/module';

export enum CallType {
  COLD_CALL = 'cold-call',
  DISCOVERY = 'discovery',
  COMPETITIVE_PROPOSAL = 'competitive-proposal',
  OBJECTION_HANDLING = 'objection-handling',
  PRODUCT_POSITIONING = 'product-positioning',
  CLOSING = 'closing',
  REVIEW_RENEWAL = 'review-renewal',
  GRAB_MEX = 'grab-mex',
}

export enum CharacterPersonality {
  NICE = 'nice',
  ANALYTICAL = 'analytical',
  SCEPTICAL = 'sceptical',
  RUDE = 'rude',
  FRIENDLY = 'friendly',
}

export enum CharacterDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ProductType {
  OWN = 'own',
  COMPETITOR = 'competitor',
}

export type AssessmentType =
  | 'regular'
  | 'prudential'
  | 'prudential-objection-handling'
  | 'msig'
  | 'msig-3f'
  | 'manulife'
  | 'manulife-goalready'
  | 'bbl'
  | 'hsbc'
  | 'grab-mex'
  | 'mtl-recruitment'
  | 'mtl-prospect-practice'
  | 'axa-ph-recruitment'
  | 'axa-ph-objection-handling'
  | 'kt-axa-recruitment'
  | 'kt-axa-fna'
  | 'kt-axa-wealthplus'
  | 'scorecard'
  | 'msig-travel-easy'
  | 'prudential-ph-appointment-setting'
  | 'prudential-ph-fact-finding'
  | 'aia-ko-opening-objection-call'
  | 'aia-ko-product-pitch'
  | 'aia-ko-end-to-end-outbound-call'
  | 'great-eastern';

export interface Framework {
  title: string;
  description?: string;
  link?: string;
  linkText?: string;
  parts?: {
    title: string;
    items: string[];
  }[];
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  friendlyId: string;
  keyFeatures?: Array<string | { title: string; children: string[] }>;
  featureHighlight?: {
    title: string;
    description: string;
  };
  evaluationFocus?: string[];
  callCriteria?: {
    title: string;
    description: string;
    criteria: string[];
    markdown?: string; // Markdown formatted criteria content
  };
  markdown?: string; // Markdown formatted product information
  titleBarHidden?: boolean; // whether to hide the product name in the roleplay title bar
  hasCompetitiveIntelligence?: boolean;
}

export interface ProcessStep {
  title: string;
  items: ProcessItem[];
  markdown?: string; // Markdown formatted content (takes precedence over items if provided)
}

export interface ProcessItem {
  title: string;
  description?: string;
  subItems?: string[];
}

export interface ProcessReference {
  title: string;
  description?: string;
  steps: ProcessStep[];
}

export type AssetGroup =
  | 'thai-fixed-income'
  | 'global-fixed-income'
  | 'allocation'
  | 'thai-equity'
  | 'dm-equity'
  | 'em-equity'
  | 'thematic'
  | 'real-asset'
  | 'commodities';

export interface ClientPortfolio {
  currentPortfolio: {
    totalValueTHB: number;
    holdings: Array<{
      assetGroup: AssetGroup;
      amountTHB: number;
      weightPercent: number;
    }>;
  };
  adjustedPortfolios: Array<{
    isSuggested: boolean;
    totalAdjustmentTHB: number;
    totalValueTHB: number;
    holdings: Array<{
      assetGroup: AssetGroup;
      adjustmentTHB: number;
      amountTHB: number;
      weightPercent: number;
    }>;
  }>;
}

export interface Session {
  _id: string;
  assessmentType?: AssessmentType;
  user: string;
  callType: string;
  product: Product;
  persona: Persona;
  startedAt: Date;
  endedAt?: Date;
  endReason?: string;
  character: {
    name: string;
    age: number;
    profile: string;
    personality: CharacterPersonality;
    difficulty: CharacterDifficulty;
  };
  roleplay: {
    title: string;
    summary: string;
    duration: number;
    objectives: string[];
    mainObjection: string;
    framework: string;
    overallScore: number;
    alternativeProducts: string[];
    feedback: {
      overview: string;
      salesTechniques: string;
      productKnowledge: string;
    };
  };
  standing?: {
    tierLevel: number;
    tierName: string;
  };
  module: Module;
  messages: Message[];
  framework: Framework;
  competitiveIntelligence?: {
    competitors: Competitor[];
  };
  processReference?: ProcessReference;
  scores?: {
    productKnowledge: number;
  };

  scorecards?: {
    name: string;
    criteria: {
      title: string;
      description: string;
    }[];
  }[];

  scenario?: {
    _id: string;
    scorecard?: {
      _id: string;
      name: string;
      sections?: {
        _id: string;
        name: string;
        description: string;
        criteria: {
          title: string;
          description: string;
        }[];
      }[];
    };
    product?: Product;
    module?: any;
    scenarioDetails?: {
      mainObjection?: string;
      salesDescription?: string;
      salesGoal?: string;
    };
  };
}

export interface PersonaDetails {
  location: string;
  education: string;
  occupation: string;
  financialSituation: string;
  keyPriorities: string[];
  productKnowledge: string;
  mainObjection: string;
  salesDescription?: string;
  salesGoal?: string;
  workHistory?: string;
  liquidityNeeds?: string;
  companySizeAndSpend?: string;
  accent?: string;
  // Alibaba-specific fields
  demographics?: string;
  companyProfile?: string;
  projectContext?: string;
  annualBudget?: string;
  competitorLandscape?: string;
}

export interface PersonalityDetails {
  persona: string;
  communicationStyle: string[];
  decisionMaking: string[];
}

export interface Persona {
  _id: string;
  friendlyId: string;
  name: string;
  age: number | null;
  gender: 'male' | 'female';
  occupation: string;
  image: string;
  difficulty: CharacterDifficulty;
  personality: CharacterPersonality;
  description: string;
  details: PersonaDetails;
  personalityDetails: PersonalityDetails;
  annualIncome: number;
  voiceId: string;
  meta?: Record<string, unknown>;
  currency?: string;
}

export interface Message {
  role: string;
  author?: string;
  content: string;
  sent: Date;

  _id: string;
}

// export interface Product {
//   name: string;
//   prompt: string;
//   friendlyId: string;
//   productType?: ProductType;
//   features: string[];
//   type: string;
//   priceHighlight: string;
//   priceDetail: string;
// }

export interface Competitor {
  name: string;
  company: string;
  type: string;
  keyFeatures: Array<string | { title: string; children: string[] }>;
  strengths: string[];
  limitations: string[];
  positioningStrategy: string;
}
