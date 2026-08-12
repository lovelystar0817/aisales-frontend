import { Loader2, ArrowUp } from 'lucide-react';
import { Button } from '~/components/button';
import { InfoIcon } from 'public/icons/icons';

interface ScenarioPreview {
  title: string;
  description: string;
  primaryObjection: string;
}

interface ScenarioPreviewProps {
  scenarioPreview: ScenarioPreview | null;
  refinementPrompt: string;
  isActive: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  isSaving: boolean;
  onRefinementPromptChange: (value: string) => void;
  onRefine: () => void;
  onActiveToggle: (value: boolean) => void;
  onBack: () => void;
  onSave: () => void;
  saveButtonText?: string;
}

export function ScenarioPreview({
  scenarioPreview,
  refinementPrompt,
  isActive,
  isGenerating,
  isRefining,
  isSaving,
  onRefinementPromptChange,
  onRefine,
  onActiveToggle,
  onBack,
  onSave,
  saveButtonText = 'Save',
}: ScenarioPreviewProps) {
  return (
    <div className="flex-1 rounded-xl bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scenario preview</h3>
      </div>

      {isGenerating || isRefining ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 p-4 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-500">
            {isRefining
              ? 'Refining scenario...'
              : 'Generating scenario preview...'}
          </span>
        </div>
      ) : scenarioPreview ? (
        <div className="space-y-6">
          {/* Preview Content */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div>
              <h4 className="text-md mb-1 font-semibold text-gray-900">
                {scenarioPreview.title}
              </h4>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                {scenarioPreview.description}
              </p>
              <h5 className="mb-1 text-sm font-semibold text-gray-900">
                Primary objection
              </h5>
              <p className="text-sm leading-relaxed text-gray-500">
                {scenarioPreview.primaryObjection}
              </p>
            </div>
          </div>

          {/* Refinement Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Prompt
            </label>
            <div className="relative">
              <textarea
                value={refinementPrompt}
                onChange={(e) => onRefinementPromptChange(e.target.value)}
                placeholder="Refine scenario"
                className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={4}
              />
              <button
                onClick={onRefine}
                disabled={!refinementPrompt.trim() || isRefining}
                className="bg-primary-500 hover:bg-primary-600 absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refine scenario"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="flex items-center text-sm font-medium text-gray-700">
                Status: <InfoIcon className="ml-1 h-4 w-4" />
              </span>
              <label className="mt-1 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onChange={(e) => onActiveToggle(e.target.checked)}
                />
                <span className="text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            No preview available. Please try again.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-3">
        <Button
          variant="custom"
          onClick={onBack}
          size="lg"
          className="min-w-[120px] rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          size="lg"
          className="w-[120px]"
          disabled={!scenarioPreview || isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            saveButtonText
          )}
        </Button>
      </div>
    </div>
  );
}
