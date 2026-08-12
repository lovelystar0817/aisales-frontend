import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { ManulifeSection } from './ManulifeSection';
import { MANULIFE_SECTION_ORDER } from '~/util/manulife';

export const MANULIFE_SECTIONS = ['introduction', 'financialNeeds'];

const ManulifeSalesTechnique = () => {
  const { t } = useTranslation();
  const { salesTechniquesData, isSalesTechniquesGenerating } =
    useAssessmentContext();

  // Prepare sections data - always show all sections with proper state handling
  const processedSections = useMemo(() => {
    return MANULIFE_SECTION_ORDER.map(({ key, title }: any) => {
      const section: any = salesTechniquesData?.sections?.[key];

      const processedSection = {
        ...section,
        title,
        key,
        // Ensure we have default values for missing sections
        isGenerating: section?.isGenerating ?? true, // Default to generating if no data
        evaluations: section?.evaluations || [],
        description: section?.description || '',
        notApplicable: section?.notApplicable || false,
        notApplicableReason: section?.notApplicableReason || '',
      };

      // If we have no section data at all but we're still generating overall, mark as generating
      if (!section && isSalesTechniquesGenerating) {
        processedSection.isGenerating = true;
      }

      // If section is marked as not applicable, don't show as generating
      if (section?.notApplicable) {
        processedSection.isGenerating = false;
      }

      return processedSection;
    });
  }, [salesTechniquesData?.sections, isSalesTechniquesGenerating]);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4">
      <div className="flex-1">
        <h2 className="mb-1 text-[16px] font-bold">
          {t('assessment.salesTechnique')}
        </h2>
        <p className="text-[14px] text-gray-500">
          {t('assessment.msigSalesTechniqueDescription')}
        </p>
      </div>

      {processedSections?.map((section: any) => (
        <ManulifeSection key={section.key} section={section} />
      ))}
    </div>
  );
};

export default ManulifeSalesTechnique;
