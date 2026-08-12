import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '~/components/button';
import { HARD_EXCLUSIVES, TRAITS_CONFIG } from '../traits';

interface TraitsPopupProps {
  onClose: () => void;
  onGenerate: (traits: {
    personality: Array<{ value: string; label: string }>;
    buyer: Array<{ value: string; label: string }>;
    communication: Array<{ value: string; label: string }>;
  }) => void;
  isGenerating?: boolean;
}

export default function TraitsPopup({
  onClose,
  onGenerate,
  isGenerating = false,
}: TraitsPopupProps) {
  const { t } = useTranslation();
  const [selectedPersonalityTones, setSelectedPersonalityTones] = useState<
    string[]
  >([]);
  const [selectedBuyerBehaviors, setSelectedBuyerBehaviors] = useState<
    string[]
  >([]);
  const [selectedCommunicationStyles, setSelectedCommunicationStyles] =
    useState<string[]>([]);

  // Check if a trait is disabled due to hard exclusives
  const isTraitDisabled = (
    trait: string,
    category: 'personality' | 'buyer' | 'communication',
  ): boolean => {
    const allSelected = [
      ...selectedPersonalityTones,
      ...selectedBuyerBehaviors,
      ...selectedCommunicationStyles,
    ];

    // Check if any selected trait excludes this trait
    return allSelected.some((selectedTrait) => {
      return HARD_EXCLUSIVES[selectedTrait]?.includes(trait);
    });
  };

  const toggleTrait = (
    trait: string,
    category: 'personality' | 'buyer' | 'communication',
  ) => {
    if (isTraitDisabled(trait, category)) {
      return;
    }

    if (category === 'personality') {
      setSelectedPersonalityTones((prev) =>
        prev.includes(trait)
          ? prev.filter((t) => t !== trait)
          : [...prev, trait],
      );
    } else if (category === 'buyer') {
      setSelectedBuyerBehaviors((prev) =>
        prev.includes(trait)
          ? prev.filter((t) => t !== trait)
          : [...prev, trait],
      );
    } else if (category === 'communication') {
      setSelectedCommunicationStyles((prev) =>
        prev.includes(trait)
          ? prev.filter((t) => t !== trait)
          : [...prev, trait],
      );
    }
  };

  const totalSelectedTraits =
    selectedPersonalityTones.length +
    selectedBuyerBehaviors.length +
    selectedCommunicationStyles.length;

  const handleGenerate = () => {
    // Send full trait objects (value + label) to backend
    onGenerate({
      personality: selectedPersonalityTones.map((value) => {
        const trait = TRAITS_CONFIG.personalityTones.find(
          (t) => t.value === value,
        );
        return { value, label: trait?.label || value };
      }),
      buyer: selectedBuyerBehaviors.map((value) => {
        const trait = TRAITS_CONFIG.buyerBehaviors.find(
          (t) => t.value === value,
        );
        return { value, label: trait?.label || value };
      }),
      communication: selectedCommunicationStyles.map((value) => {
        const trait = TRAITS_CONFIG.communicationStyles.find(
          (t) => t.value === value,
        );
        return { value, label: trait?.label || value };
      }),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-1/3 left-3/10 z-50 w-[470px] -translate-x-1/2 -translate-y-1/2">
        <div className="flex max-h-[90vh] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <p className="text-sm font-semibold">
              {t('manage.persona.traits.traits')}
            </p>
            <p className="mb-4 text-xs text-gray-600">
              {t('manage.persona.selectTraitsDescription')}
            </p>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium text-gray-900">
                {t('manage.persona.personalityTone')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRAITS_CONFIG.personalityTones.map(({ value, label }) => {
                  const isSelected = selectedPersonalityTones.includes(value);
                  const isDisabled = isTraitDisabled(value, 'personality');

                  return (
                    <button
                      key={value}
                      onClick={() => toggleTrait(value, 'personality')}
                      disabled={isGenerating || isDisabled}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      } ${isGenerating ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium text-gray-900">
                {t('manage.persona.buyerBehavior')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRAITS_CONFIG.buyerBehaviors.map(({ value, label }) => {
                  const isSelected = selectedBuyerBehaviors.includes(value);
                  const isDisabled = isTraitDisabled(value, 'buyer');

                  return (
                    <button
                      key={value}
                      onClick={() => toggleTrait(value, 'buyer')}
                      disabled={isGenerating || isDisabled}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      } ${isGenerating ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-xs font-medium text-gray-900">
                {t('manage.persona.communicationStyle')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRAITS_CONFIG.communicationStyles.map(({ value, label }) => {
                  const isSelected =
                    selectedCommunicationStyles.includes(value);
                  const isDisabled = isTraitDisabled(value, 'communication');

                  return (
                    <button
                      key={value}
                      onClick={() => toggleTrait(value, 'communication')}
                      disabled={isGenerating || isDisabled}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      } ${isGenerating ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Buttons at bottom right */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Button
              variant="custom"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={totalSelectedTraits < 3 || isGenerating}
              className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isGenerating
                ? 'Generating...'
                : t('manage.persona.generatePersonality')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
