import { createContext, useContext } from 'react';
import type {
  Overview,
  ExtendedSession,
  ProductKnowledgeParams,
  SalesTechniquesParams,
  TechnicalKnowledgeParams,
  GrabMexSoftSkillsData,
  HSBCRelationshipManagementData,
  HSBCProcessAdherenceData,
  HSBCRepresentationData,
  HSBCCommunicationAndPresenceData,
  ScorecardSection,
  PrudentialObjectionHandlingData,
  PrudentialPHAppointmentSettingData,
  GreatEasternAssessmentData,
  AIAKOE2EAssessmentData,
} from '~/assessment/types';
import type { apiProtected, apiManage } from '~/util/api';

export interface Section {
  id: string;
  title: string;
}

interface AssessmentContextType {
  session: ExtendedSession | null | undefined;
  overviewData: Overview | null | undefined;
  salesTechniquesData: SalesTechniquesParams | null | undefined;
  productKnowledgeData: ProductKnowledgeParams | null | undefined;
  technicalKnowledgeData: TechnicalKnowledgeParams | null | undefined;
  grabMexSoftSkillsData: GrabMexSoftSkillsData | null | undefined;
  axaPhSoftSkillsData: SalesTechniquesParams | null | undefined;
  axaPhKnowledgeSkillsData: SalesTechniquesParams | null | undefined;
  ktAxaSoftSkillsData: SalesTechniquesParams | null | undefined;
  ktAxaKnowledgeSkillsData: SalesTechniquesParams | null | undefined;
  ktAxaProductKnowledgeData: SalesTechniquesParams | null | undefined;
  isKtAxaProductKnowledgeGenerating?: boolean;
  // MSIG Travel Easy-specific fields
  msigTravelEasySoftSkillsData: SalesTechniquesParams | null | undefined;
  msigTravelEasyKnowledgeSkillsData: SalesTechniquesParams | null | undefined;
  msigTravelEasyProductKnowledgeData: SalesTechniquesParams | null | undefined;
  isMsigTravelEasySoftSkillsGenerating?: boolean;
  isMsigTravelEasyKnowledgeSkillsGenerating?: boolean;
  isMsigTravelEasyProductKnowledgeGenerating?: boolean;
  isColdCall: boolean;
  isLoading: boolean;
  onViewTranscript: () => void;
  isSalesTechniquesGenerating: boolean;
  isTechnicalKnowledgeGenerating: boolean;
  isStandingGenerating: boolean;
  isGrabMexSoftSkillsGenerating: boolean;
  sections: Section[];
  setSections: (sections: Section[]) => void;
  apiClient: typeof apiProtected | typeof apiManage;
  isAdminView: boolean;
  isProductKnowledgeGenerating?: boolean;
  // BBL-specific fields
  bblAdvisoryTechniqueData?: SalesTechniquesParams | null | undefined;
  bblProcessAdherenceData?: ProductKnowledgeParams | null | undefined;
  isProcessAdherenceGenerating?: boolean;
  // HSBC-specific fields
  hsbcRelationshipManagementData?:
    | HSBCRelationshipManagementData
    | null
    | undefined;
  hsbcProcessAdherenceData?: HSBCProcessAdherenceData | null | undefined;
  hsbcRepresentationData?: HSBCRepresentationData | null | undefined;
  hsbcCommunicationAndPresenceData?:
    | HSBCCommunicationAndPresenceData
    | null
    | undefined;
  hsbcAdvisoryTechniqueData?: HSBCRelationshipManagementData | null | undefined; // backwards compatibility (same as relationshipManagement)
  isHsbcProcessAdherenceGenerating?: boolean;
  isHsbcRepresentationGenerating?: boolean;
  isCommunicationAndPresenceGenerating?: boolean;
  // Prudential Objection Handling fields
  prudentialObjectionHandlingData?:
    | PrudentialObjectionHandlingData
    | null
    | undefined;
  isPrudentialObjectionHandlingSalesTechniquesGenerating?: boolean;
  // Prudential PH Fact Finding fields
  prudentialPHFactFindingTechniqueData?: any | null | undefined;
  prudentialPHProductKnowledgeData?: any | null | undefined;
  isPrudentialPHFactFindingTechniqueGenerating?: boolean;
  isPrudentialPHProductKnowledgeGenerating?: boolean;
  // Prudential PH Appointment Setting fields
  prudentialPHAppointmentSettingData?:
    | PrudentialPHAppointmentSettingData
    | null
    | undefined;
  isPrudentialPHAppointmentSettingGenerating?: boolean;
  // AIA KO Opening & Objection Call fields
  aiaKoIntroductionData?: SalesTechniquesParams | null | undefined;
  aiaKoObjectionHandlingData?: SalesTechniquesParams | null | undefined;
  aiaKoNeedsExplorationData?: SalesTechniquesParams | null | undefined;
  isAiaKoIntroductionGenerating?: boolean;
  isAiaKoObjectionHandlingGenerating?: boolean;
  isAiaKoNeedsExplorationGenerating?: boolean;
  // AIA KO Product Pitch fields
  aiaKoNeedsAnalysisData?: SalesTechniquesParams | null | undefined;
  aiaKoProductPitchData?: SalesTechniquesParams | null | undefined;
  aiaKoProductPitchObjectionHandlingData?:
    | SalesTechniquesParams
    | null
    | undefined;
  isAiaKoNeedsAnalysisGenerating?: boolean;
  isAiaKoProductPitchGenerating?: boolean;
  isAiaKoProductPitchObjectionHandlingGenerating?: boolean;
  // Great Eastern Assessment data
  greatEasternAssessmentData?: GreatEasternAssessmentData | null | undefined;
  isGreatEasternAssessmentGenerating?: boolean;
  // AIA KO E2E (End-to-End Outbound Call) fields
  aiaKoE2EAssessmentData?: AIAKOE2EAssessmentData | null | undefined;
  isAiaKoE2EAssessmentGenerating?: boolean;
  // Manulife GoalReady section-specific loading states
  isManulifeSalesGenerating?: boolean;
  isManulifeSoftSkillsGenerating?: boolean;
  isManulifeProductKnowledgeGenerating?: boolean;

  scorecardsData: ScorecardSection[];
  // Raw response generating flags (backend source of truth for when scores are truly final)
  salesTechniquesResponseGenerating?: boolean;
  productKnowledgeResponseGenerating?: boolean;
  grabMexSoftSkillsResponseGenerating?: boolean;
  // Backend-verified flag: true only when ALL assessment jobs are complete
  scormCompletionReady?: boolean;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(
  undefined,
);

export function useAssessmentContext() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error(
      'useAssessmentContext must be used within an AssessmentContext.Provider',
    );
  }
  return context;
}

export default AssessmentContext;
