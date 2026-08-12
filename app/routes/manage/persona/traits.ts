// Central configuration for all persona traits
export interface TraitDefinition {
  value: string;
  label: string;
}

export interface TraitConfig {
  personalityTones: TraitDefinition[];
  buyerBehaviors: TraitDefinition[];
  communicationStyles: TraitDefinition[];
}

export const TRAITS_CONFIG: TraitConfig = {
  personalityTones: [
    { value: 'friendly', label: 'Friendly' },
    { value: 'polite', label: 'Polite' },
    { value: 'rude', label: 'Rude' },
    { value: 'talkative', label: 'Talkative' },
    { value: 'guarded', label: 'Guarded' },
  ],
  buyerBehaviors: [
    { value: 'priceSensitive', label: 'Price-sensitive' },
    { value: 'qualityFocused', label: 'Quality-focused' },
    { value: 'dataDriven', label: 'Data-driven' },
    { value: 'feelingsDriven', label: 'Feelings-driven' },
    { value: 'riskAverse', label: 'Risk-averse' },
    { value: 'riskTolerant', label: 'Risk-tolerant' },
    { value: 'decisive', label: 'Decisive' },
    { value: 'indecisive', label: 'Indecisive' },
    { value: 'impulsive', label: 'Impulsive' },
  ],
  communicationStyles: [
    { value: 'patient', label: 'Patient' },
    { value: 'impatient', label: 'Impatient' },
    { value: 'straightToThePoint', label: 'Straight to the point' },
    { value: 'casualConversational', label: 'Casual and conversational' },
    { value: 'prefersRealExamples', label: 'Prefers real examples' },
    {
      value: 'visionaryStrategicFraming',
      label: 'Visionary strategic framing',
    },
  ],
};

// Hard exclusives - traits that cannot be selected together
export const HARD_EXCLUSIVES: Record<string, string[]> = {
  friendly: ['rude'],
  polite: ['rude'],
  rude: ['friendly', 'polite'],
  patient: ['impatient'],
  impatient: ['patient'],
  riskAverse: ['riskTolerant'],
  riskTolerant: ['riskAverse'],
  decisive: ['indecisive'],
  indecisive: ['decisive', 'impulsive'],
  impulsive: ['indecisive'],
  dataDriven: ['feelingsDriven'],
  feelingsDriven: ['dataDriven'],
};

// Helper to create trait labels map for backend
export function getTraitLabelsMap(): Record<string, string> {
  const labelsMap: Record<string, string> = {};

  TRAITS_CONFIG.personalityTones.forEach((trait) => {
    labelsMap[trait.value] = trait.label;
  });

  TRAITS_CONFIG.buyerBehaviors.forEach((trait) => {
    labelsMap[trait.value] = trait.label;
  });

  TRAITS_CONFIG.communicationStyles.forEach((trait) => {
    labelsMap[trait.value] = trait.label;
  });

  return labelsMap;
}

// Helper to get all trait values
export function getAllTraitValues(): string[] {
  return [
    ...TRAITS_CONFIG.personalityTones.map((t) => t.value),
    ...TRAITS_CONFIG.buyerBehaviors.map((t) => t.value),
    ...TRAITS_CONFIG.communicationStyles.map((t) => t.value),
  ];
}
