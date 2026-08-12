import type { StandingProgressionType } from '~/assessment/types';

interface SummaryParams {
  overviewData: {
    summary?: string;
    suggestedNextSteps?: string[];
  } | null;
  session: {
    standingProgression?: {
      type: StandingProgressionType;
      currentStanding?: {
        tierName: string;
        tierLevel: number;
      };
      isHighestLevel?: boolean;
    };
  } | null;
  salesTechniquesData: {
    frameworkExecution?: {
      overallScore: number;
      completedItems: string[];
      toImproveItems: string[];
    };
    objectionHandling?: {
      overallScore: number;
      completedItems: string[];
      toImproveItems: string[];
      objections: any[];
    };
    clientVerification?: {
      completed: boolean;
      completedItems?: string[];
      toImproveItems?: string[];
    };
  } | null;
  isColdCall: boolean;
  t: (key: string, params?: any) => string;
}

export const getDynamicSummary = ({
  overviewData,
  session,
  salesTechniquesData,
  isColdCall,
  t,
}: SummaryParams): string => {
  // Client verification is only required for cold calls
  const clientVerification = salesTechniquesData?.clientVerification;
  const mandatoryNotMet = isColdCall && (!clientVerification || !clientVerification.completed);
  
  // Get standing progression from session data
  const standingProgression = session?.standingProgression;
  const progressionType: StandingProgressionType = standingProgression?.type || 'no-standing';
  const currentStanding = standingProgression?.currentStanding;
  const isHighestLevel = standingProgression?.isHighestLevel;

  if (mandatoryNotMet) {
    return t('assessment.prudentialMandatoryNotMet.summary');
  }

  if (!overviewData || !overviewData.summary) {
    return '';
  }

  const baseSummary = overviewData.summary;
  const tierName = currentStanding?.tierName || '';
  
  switch (progressionType) {
    case 'first-time':
      return t(isHighestLevel ? 'assessment.progressionSummary.firstTimeHighest' : 'assessment.progressionSummary.firstTime', { 
        tierName, 
        summary: baseSummary 
      });
    
    case 'upgrade':
      return t(isHighestLevel ? 'assessment.progressionSummary.upgradeHighest' : 'assessment.progressionSummary.upgrade', { 
        tierName, 
        summary: baseSummary 
      });
    
    case 'maintained-same':
      return t(isHighestLevel ? 'assessment.progressionSummary.maintainedHighest' : 'assessment.progressionSummary.maintainedSame', { 
        tierName, 
        summary: baseSummary 
      });
    
    case 'maintained-improved':
      return t(isHighestLevel ? 'assessment.progressionSummary.maintainedImprovedHighest' : 'assessment.progressionSummary.maintainedImproved', { 
        tierName, 
        summary: baseSummary 
      });
    
    case 'downgrade':
      return t('assessment.progressionSummary.downgrade', { 
        tierName, 
        summary: baseSummary 
      });
    
    case 'no-standing':
    default:
      return baseSummary;
  }
};

export const getDynamicSuffix = ({
  overviewData,
  session,
  salesTechniquesData,
  isColdCall,
  t,
}: SummaryParams): string => {
  // Client verification is only required for cold calls
  const clientVerification = salesTechniquesData?.clientVerification;
  const mandatoryNotMet = isColdCall && (!clientVerification || !clientVerification.completed);
  
  // Get standing progression from session data
  const standingProgression = session?.standingProgression;
  const progressionType: StandingProgressionType = standingProgression?.type || 'no-standing';
  const isHighestLevel = standingProgression?.isHighestLevel;

  // No suffix for unavailable standing (mandatory not met)
  if (mandatoryNotMet) {
    return '';
  }

  // No suffix for no-standing case
  if (progressionType === 'no-standing') {
    return '';
  }

  // Handle different progression types
  switch (progressionType) {
    case 'first-time':
    case 'upgrade':
    case 'maintained-same':
    case 'maintained-improved':
      if (isHighestLevel) {
        return t('assessment.progressionSummary.suffixHighestLevel');
      } else {
        // For non-highest levels, we'd need next standing info
        // For now, using a generic message without specific next standing
        return t('assessment.progressionSummary.suffixKeepPracticing');
      }
    
    case 'downgrade':
      return t('assessment.progressionSummary.suffixDowngrade');
    
    default:
      return '';
  }
};

export const getNextStepsTitle = ({
  overviewData,
  session,
  salesTechniquesData,
  isColdCall,
  t,
}: SummaryParams): string => {
  // Client verification is only required for cold calls
  const clientVerification = salesTechniquesData?.clientVerification;
  const mandatoryNotMet = isColdCall && (!clientVerification || !clientVerification.completed);
  
  const standingProgression = session?.standingProgression;
  const isHighestLevel = standingProgression?.isHighestLevel;

  if (mandatoryNotMet) {
    return t('assessment.prudentialMandatoryNotMet.nextStepsTitle');
  }
  
  if (isHighestLevel) {
    return t('assessment.progressionSummary.nextStepsHighest');
  }

  return t('assessment.progressionSummary.nextSteps');
};

export const getNextSteps = ({
  overviewData,
  session,
  salesTechniquesData,
  isColdCall,
  t,
}: SummaryParams): string[] => {
  // Client verification is only required for cold calls
  const clientVerification = salesTechniquesData?.clientVerification;
  const mandatoryNotMet = isColdCall && (!clientVerification || !clientVerification.completed);

  if (mandatoryNotMet) {
    return [t('assessment.prudentialMandatoryNotMet.suggestedNextStep')];
  }
  
  return overviewData?.suggestedNextSteps || [];
};