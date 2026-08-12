// Manulife FNA Section order for display
export const MANULIFE_SECTION_ORDER = [
  {
    key: 'introduction',
    title: 'Introduction to Manulife & Facts of Life',
  },
  {
    key: 'financialNeeds',
    title: 'Financial Needs, Goal Guide and Conclusion',
  },
] as const;

export type ManulifeSectionKey = (typeof MANULIFE_SECTION_ORDER)[number]['key'];

/**
 * Transform raw Manulife FNA sections coming from the API into a friendly array which
 * the UI can easily iterate on.
 */
export function getManulifeSectionScores(sections: any, t: any) {
  if (!sections) return [];

  return MANULIFE_SECTION_ORDER.map(({ key, title }) => {
    const section = sections[key as ManulifeSectionKey];
    if (!section || section.isGenerating) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        status: section?.isGenerating ? 'Generating...' : 'Pending',
        hasFailedItem: false,
        sectionType: section.sectionType,
      };
    }

    // Handle not-applicable sections
    if (section.notApplicable) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        status: 'Not Applicable',
        hasFailedItem: false,
        notApplicable: true,
        sectionType: section.sectionType,
      };
    }

    if (!section.evaluations || section.evaluations.length === 0) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        sectionType: section.sectionType,
        status: 'Pending',
        hasFailedItem: false,
      };
    }

    const passedCriteria = section.evaluations.filter(
      (c: any) => c.pass === true,
    );

    return {
      score: passedCriteria.length,
      sectionType: section.sectionType,
      label: t(`assessment.${key}`, title),
      status: `${passedCriteria.length}/${section.evaluations.length}`,
      hasFailedItem: passedCriteria.length !== section.evaluations.length,
    };
  });
}

/**
 * Calculate the overall score for a Manulife FNA assessment (0-100).
 * Uses simple average across all criteria (no weighting).
 */
export function calculateManulifeOverallScore(sections: any): number {
  if (!sections) return 0;

  let totalPassed = 0;

  MANULIFE_SECTION_ORDER.forEach(({ key }) => {
    const section = sections[key];

    // Only include sections that have completed evaluations and are not marked as not applicable
    if (
      section &&
      section.evaluations &&
      Array.isArray(section.evaluations) &&
      !section.isGenerating &&
      !section.notApplicable
    ) {
      const passedEvaluations = section.evaluations.filter(
        (evaluation: any) => evaluation.pass === true,
      ).length;

      totalPassed += passedEvaluations;
    }
  });

  return totalPassed;
}

/**
 * Check if Manulife FNA data is incomplete
 */
export function isManulifeDataIncomplete(sections: any): boolean {
  if (!sections) return true;

  return MANULIFE_SECTION_ORDER.some(({ key }) => {
    const section = sections[key];
    return (
      !section ||
      section.isGenerating === true ||
      (!section.notApplicable &&
        (!section.evaluations || section.evaluations.length === 0))
    );
  });
}

/**
 * Get tier name based on overall score for Manulife FNA
 */
export function getManulifeTierFromScore(score: number, t: any): string {
  if (score >= 80) return t('standings.expertAdvisor', 'Expert Advisor');
  if (score >= 70)
    return t('standings.proficientAdvisor', 'Proficient Advisor');
  if (score >= 60) return t('standings.competentAdvisor', 'Competent Advisor');
  return t('standings.developingAdvisor', 'Developing Advisor');
}

/**
 * Get Manulife tier name with all validation checks
 */
export function getManulifeTierName(sections: any, t: any): string {
  const overallScore = calculateManulifeOverallScore(sections);
  const isDataIncomplete = isManulifeDataIncomplete(sections);

  if (overallScore !== undefined && overallScore !== null) {
    if (isDataIncomplete) {
      return t('assessment.standings.notAvailable', 'Not available');
    }
    return getManulifeTierFromScore(overallScore, t);
  }
  return t('assessment.standings.notAvailable', 'Not available');
}
