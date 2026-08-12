import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import GreatEasternOverview from './GreatEasternOverview';
import GreatEasternSections from './GreatEasternSections';
import ProductKnowledge from '../regular/ProductKnowledge';

const GreatEasternAssessmentMain = () => {
  const {
    setSections,
    greatEasternAssessmentData,
    productKnowledgeData,
    isProductKnowledgeGenerating,
    session,
  } = useAssessmentContext();
  const { t } = useTranslation();
  const prevSectionsRef = useRef<string>('');

  // Check if this is the product pitch module (Stage 2)
  const isProductPitch = session?.callType === 'great-eastern-product-pitch';

  // Show product knowledge section if it's product pitch and either data exists or it's generating
  const showProductKnowledge =
    isProductPitch && (productKnowledgeData || isProductKnowledgeGenerating);

  useEffect(() => {
    const baseSections = [
      { id: 'overview-section', title: t('assessment.overview') },
    ];

    // Add dynamic sections from the assessment data
    const dynamicSections =
      greatEasternAssessmentData?.sections?.map((section, index) => ({
        id: `section-${index}`,
        title: section.title,
      })) || [];

    // Add product knowledge section for product pitch module only (show even when generating)
    const productKnowledgeSection = showProductKnowledge
      ? [
          {
            id: 'product-knowledge-section',
            title: t('assessment.productKnowledge'),
          },
        ]
      : [];

    const newSections = [
      ...baseSections,
      ...dynamicSections,
      ...productKnowledgeSection,
    ];
    const newSectionsKey = JSON.stringify(newSections);

    // Only update if sections actually changed
    if (prevSectionsRef.current !== newSectionsKey) {
      prevSectionsRef.current = newSectionsKey;
      setSections(newSections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    greatEasternAssessmentData?.sections?.length,
    isProductPitch,
    showProductKnowledge,
  ]);

  return (
    <div className="flex flex-col space-y-6">
      <div id="overview-section">
        <GreatEasternOverview />
      </div>

      <GreatEasternSections />

      {/* Product Knowledge Section - Only for Product Pitch (Stage 2) */}
      {showProductKnowledge && (
        <div id="product-knowledge-section">
          <ProductKnowledge useLinearScore={true} />
        </div>
      )}
    </div>
  );
};

export default GreatEasternAssessmentMain;
