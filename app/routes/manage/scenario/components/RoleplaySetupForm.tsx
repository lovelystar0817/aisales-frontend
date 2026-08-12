import { ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CustomDropdown } from '~/components/CustomDropdown';
import { Button } from '~/components/button';

interface RoleplaySetupFormProps {
  roleplayForm: {
    moduleId: string;
    personaId: string;
    scorecardId: string;
    productId: string;
  };
  modules: any[];
  personas: any[];
  scorecards: any[];
  products: any[];
  onFieldChange: (
    field: keyof RoleplaySetupFormProps['roleplayForm'],
    value: string,
  ) => void; // Changed this line
  onCancel: () => void;
  onNext: () => void;
  isDisabled?: boolean;
}

export function RoleplaySetupForm({
  roleplayForm,
  modules,
  personas,
  scorecards,
  products,
  onFieldChange,
  onCancel,
  onNext,
  isDisabled = false,
}: RoleplaySetupFormProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white p-6">
      <h3 className="mb-6 text-xl font-semibold">Roleplay setup</h3>

      <div className="space-y-6">
        {/* Scenario Field */}
        <div>
          <label className="mb-1 block text-sm font-medium">Scenario</label>
          <CustomDropdown
            value={roleplayForm.moduleId}
            onChange={(value) => onFieldChange('moduleId', value)}
            placeholder="Select scenario"
            options={[
              ...(modules as any).map((module: any) => ({
                value: module._id,
                label: module.title,
                description: module.description,
              })),
              {
                value: 'custom',
                type: 'custom' as const,
                component: (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('/manage/scenario?modal=open', '_blank');
                    }}
                    className="flex w-full cursor-pointer items-center px-3 py-4 text-sm font-semibold text-blue-500 hover:bg-gray-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new call type
                  </button>
                ),
              },
            ]}
          />
        </div>

        {/* Persona Field */}
        <div>
          <label className="mb-1 block text-sm font-medium">Persona</label>
          <CustomDropdown
            value={roleplayForm.personaId}
            onChange={(value) => onFieldChange('personaId', value)}
            placeholder="Select persona"
            options={[
              ...(personas as any).map((persona: any) => ({
                value: persona.id,
                label: persona.name,
                description: `${persona.age ? `Age ${persona.age}, ` : ''}${persona.occupation}`,
                image: persona.image,
              })),
              {
                value: 'custom',
                type: 'custom' as const,
                component: (
                  <div className="px-3 py-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/manage/persona/new', '_blank');
                      }}
                      className="flex cursor-pointer items-center text-sm font-semibold text-blue-500 hover:underline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create persona
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/manage/persona', '_blank');
                      }}
                      className="mt-4 flex cursor-pointer items-center text-sm font-semibold text-blue-500 hover:underline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage all personas
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Scorecard Field */}
        <div>
          <label className="mb-1 block text-sm font-medium">Scorecard</label>
          <CustomDropdown
            value={roleplayForm.scorecardId}
            onChange={(value) => onFieldChange('scorecardId', value)}
            placeholder="Select scorecard"
            options={[
              ...(scorecards as any).map((scorecard: any) => ({
                value: scorecard.id,
                label: scorecard.name,
                tags: scorecard.sections?.map((s: any) => s.name) || [],
                action: {
                  label: 'View',
                  onClick: () => {
                    window.open(`/manage/scorecard/${scorecard.id}`, '_blank');
                  },
                },
              })),
              {
                value: 'custom',
                type: 'custom' as const,
                component: (
                  <div className="px-3 py-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/manage/scorecard/new', '_blank');
                      }}
                      className="flex cursor-pointer items-center text-sm font-semibold text-blue-500 hover:underline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create scorecard
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('/manage/scorecard', '_blank');
                      }}
                      className="mt-4 flex cursor-pointer items-center text-sm font-semibold text-blue-500 hover:underline"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Manage all scorecards
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Product Field */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Product{' '}
            <span className="font-normal text-gray-500">(Optional)</span>
          </label>
          <CustomDropdown
            value={roleplayForm.productId}
            onChange={(value) => onFieldChange('productId', value)}
            placeholder="Select product"
            options={products.map((product: any) => ({
              value: product.id || product._id,
              label: product.name,
            }))}
            clearable={true}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <Button
          variant="custom"
          onClick={onCancel}
          size="lg"
          className="min-w-[120px] rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          size="lg"
          className="w-[120px] justify-center"
          disabled={!roleplayForm.moduleId || isDisabled}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
