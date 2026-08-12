import { getScoreRating } from '~/util/scoreRating';

// MSIG Section order for display (copied from MSIGSessionCard & StandingsModal)
export const MSIG_SECTION_ORDER = [
  { key: 'introduction', title: 'Introduction', weight: 5 },
  { key: 'presentation', title: 'Presentation', weight: 40 },
  { key: 'communication', title: 'Communication', weight: 10 },
  { key: 'salesConfirmation', title: 'Sales Confirmation', weight: 20 },
  { key: 'mandatoryDisclosure', title: 'Mandatory Disclosure', weight: 20 },
  { key: 'closure', title: 'Closure', weight: 5 },
] as const;

export type MSIGSectionKey = (typeof MSIG_SECTION_ORDER)[number]['key'];

/**
 * Transform raw MSIG sections coming from the API into a friendly array which
 * the UI can easily iterate on.  This mirrors the existing logic inside
 * `StandingsModal`.
 */
export function getMSIGSectionScores(sections: any, t: any) {
  if (!sections) return [];

  // for MSIG-3F, check if this is an MSIG-3F (Product Positioning) structure
  const isMSIG3F = sections.salesTechnique && sections.productKnowledge;
  if (isMSIG3F) {
    // for MSIG-3F, handle MSIG-3F structure with Sales Technique and Product Knowledge
    const msig3fSections = [
      {
        key: 'salesTechnique',
        section: sections.salesTechnique,
        label: t('assessment.salesTechnique', 'Sales Technique'),
        weight: 50,
      },
      {
        key: 'productKnowledge', 
        section: sections.productKnowledge,
        label: t('assessment.productKnowledge', 'Product Knowledge'),
        weight: 50,
      }
    ];

    return msig3fSections.map(({ key, section, label, weight }) => {
      if (!section || section.isGenerating) {
        return {
          score: 0,
          label,
          status: section?.isGenerating ? 'Generating...' : 'Pending',
          weight,
          hasFailedMandatory: false,
        };
      }

      // for MSIG-3F, handle not-applicable sections
      if (section.notApplicable) {
        return {
          score: 0,
          label,
          status: 'Not Applicable',
          weight,
          hasFailedMandatory: false,
          hasFailedItem: false,
          notApplicable: true,
        };
      }

      // for MSIG-3F, use the overallScore directly
      const score = section.overallScore || 0;
      
      return {
        score,
        label,
        status: `${score}/100`,
        weight,
        hasFailedMandatory: false, // for MSIG-3F, there are no mandatory criteria
        hasFailedItem: score < 50,
      };
    });
  }

  // for MSIG telesales, calculate score for each section
  return MSIG_SECTION_ORDER.map(({ key, title, weight }) => {
    const section = sections[key as MSIGSectionKey];
    if (!section || section.isGenerating) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        status: section?.isGenerating ? 'Generating...' : 'Pending',
        weight,
        hasFailedMandatory: false,
      };
    }

    // for MSIG telesales, handle not-applicable sections
    if (section.notApplicable) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        status: 'Not Applicable',
        weight,
        hasFailedMandatory: false,
        hasFailedItem: false,
        notApplicable: true,
      };
    }

    if (!section.evaluations || section.evaluations.length === 0) {
      return {
        score: 0,
        label: t(`assessment.${key}`, title),
        status: 'Pending',
        weight,
        hasFailedMandatory: false,
      };
    }

    const passedCriteria = section.evaluations.filter((c: any) => c.pass === true);
    const score = Math.round((passedCriteria.length / section.evaluations.length) * 100);

    return {
      score,
      label: t(`assessment.${key}`, title),
      status: `${passedCriteria.length}/${section.evaluations.length}`,
      weight,
      hasFailedMandatory: section.evaluations.some((c: any) => c.mandatory && !c.pass),
      hasFailedItem: passedCriteria.length !== section.evaluations.length,
    };
  });
}

/**
 * Calculate the overall weighted score for an MSIG assessment (0-100).
 */
export function calculateMSIGOverallScore(sections: any): number {
  if (!sections) return 0;

  // for MSIG-3F, calculate combined score from Sales Technique and Product Knowledge
  const isMSIG3F = sections.salesTechnique && sections.productKnowledge;
  if (isMSIG3F) {
    const salesTechScore = sections.salesTechnique?.overallScore || 0;
    const productKnowledgeScore = sections.productKnowledge?.overallScore || 0;
    
    if (salesTechScore > 0 && productKnowledgeScore > 0) {
      return Math.round((salesTechScore + productKnowledgeScore) / 2);
    } else if (salesTechScore > 0) {
      return salesTechScore;
    } else if (productKnowledgeScore > 0) {
      return productKnowledgeScore;
    }
    return 0;
  }

  // handle MSIG telesales structure
  let totalWeightedScore = 0;
  let totalWeight = 0;

  MSIG_SECTION_ORDER.forEach(({ key, weight }) => {
    const section = sections[key];
    if (
      section &&
      section.evaluations &&
      Array.isArray(section.evaluations) &&
      !section.isGenerating &&
      !section.notApplicable
    ) {
      const passed = section.evaluations.filter((e: any) => e.pass === true).length;
      const total = section.evaluations.length;
      if (total > 0) {
        const sectionScore = (passed / total) * 100;
        totalWeightedScore += sectionScore * weight;
        totalWeight += weight * 100;
      }
    }
  });

  return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) : 0;
}

/** Return true if at least one mandatory criterion failed */
export function hasFailedMandatory(sections: any): boolean {
  if (!sections) return false;
  
  // for MSIG-3F, there are no mandatory criteria
  const isMSIG3F = sections.salesTechnique && sections.productKnowledge;
  if (isMSIG3F) {
    return false;
  }

  return Object.values(sections).some(
    (section: any) =>
      !section?.notApplicable &&
      section?.evaluations?.some((criteria: any) => criteria.mandatory && !criteria.pass),
  );
}
