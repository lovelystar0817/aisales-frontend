import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '~/components/button';
import toast from 'react-hot-toast';
import CustomRichTextArea from '../../persona/components/CustomRichTextArea';
import { UnsavedChangesDialog } from '~/components/UnsavedChangesDialog';
import { DuplicateInfoBanner } from '~/components/DuplicateInfoBanner';
import { useTranslation } from 'react-i18next';

type ScenarioModalMode = 'create' | 'view' | 'edit';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScenarioFormData) => void;
  mode: ScenarioModalMode;
  initialData?: ScenarioFormData;
  isLoading?: boolean;
  duplicateId?: string | null;
  titleError?: string | null;
}

export interface ScenarioFormData {
  _id?: string;
  title: string;
  description: string;
  scenarioSetup: string;
  objectives: string;
  roleplays?: number;
}

export const ScenarioModuleModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  isLoading = false,
  duplicateId,
  titleError: titleErrorProp,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ScenarioFormData>({
    title: '',
    description: '',
    scenarioSetup: '',
    objectives: '',
  });
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [shouldBlockClose, setShouldBlockClose] = useState(true);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Update local error state when prop changes
  useEffect(() => {
    if (titleErrorProp !== undefined) {
      setTitleError(titleErrorProp);
    }
  }, [titleErrorProp]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        description: '',
        scenarioSetup: '',
        objectives: '',
      });
    }
    // Reset block state when modal opens or mode changes
    setShouldBlockClose(true);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Name is required');
      return;
    } else if (!formData.description) {
      toast.error('Description is required');
      return;
    } else if (!formData.scenarioSetup) {
      toast.error('Scenario setup is required');
      return;
    } else if (!formData.objectives) {
      toast.error('Project objectives are required');
      return;
    }

    // Don't disable close protection here - let the parent handle modal closing on success
    onSubmit(formData);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    if (isLoading) return;

    // Don't show dialog in view mode or if form is being edited
    if (isViewMode || !shouldBlockClose) {
      onClose();
    } else {
      // Show confirmation dialog for create/edit modes
      setShowUnsavedDialog(true);
    }
  };

  const handleGoBack = () => {
    setShowUnsavedDialog(false);
    setShouldBlockClose(false);
    onClose();
  };

  const handleKeepEditing = () => {
    setShowUnsavedDialog(false);
  };

  const isViewMode = mode === 'view';

  const getTitle = () => {
    switch (mode) {
      case 'view':
        return 'View Scenario';
      case 'edit':
        return 'Edit Scenario';
      case 'create':
        return 'Create Scenario';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-semibold">{getTitle()}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-4">
          <DuplicateInfoBanner
            show={!!duplicateId}
            translationKey="manage.scenario.duplicateNotice"
            defaultMessage="Duplicated scenario is not affecting or linked to any roleplay yet."
            t={t}
          />

          {/* Name Field */}

          {isViewMode ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.title}
              </h3>{' '}
              <p className="text-sm text-gray-900">{formData.description}</p>
              <label className="mt-6 mb-1 block text-sm font-medium">
                Roleplays
              </label>
              <p className="text-sm text-gray-900">{initialData?.roleplays}</p>
            </div>
          ) : (
            <div>
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  type="text"
                  placeholder="E.g. Cold Call, Discovery Call, Closing Call"
                  className={`focus:ring-0.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${
                    titleError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-primary-500'
                  }`}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setTitleError(null);
                  }}
                  disabled={isLoading}
                />
                {titleError && (
                  <p className="mt-1 text-sm text-red-600">{titleError}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="mt-6">
                <label className="mb-1 block text-sm font-medium">
                  One-liner description
                </label>
                <input
                  type="text"
                  placeholder="E.g. Contact a new lead to book a first meeting"
                  className="focus:ring-0.5 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  A short summary of the call.
                </p>
              </div>
            </div>
          )}

          {/* Scenario Setup Field */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Scenario setup
            </label>
            {isViewMode ? (
              <p className="text-sm whitespace-pre-wrap text-gray-900">
                {formData.scenarioSetup}
              </p>
            ) : (
              <>
                <textarea
                  placeholder={`E.g. In this cold call, the agent is contacting a lead for the first time. The persona doesn't know the agent or the product, so they may be skeptical or dismissive at the start. They might ask "I'm not interested" before the agent can explain the value. The goal is to see how the agent handles objections and builds enough trust to secure a follow-up meeting.`}
                  className="focus:ring-0.5 focus:ring-primary-500 min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                  value={formData.scenarioSetup}
                  rows={4}
                  onChange={(e) =>
                    setFormData({ ...formData, scenarioSetup: e.target.value })
                  }
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Describe the situation: what the persona knows, how they might
                  react, and the challenges the agent should expect.
                </p>
              </>
            )}
          </div>

          {/* Practice Objectives Field */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Practice objectives
            </label>
            {isViewMode ? (
              <p className="text-sm whitespace-pre-line text-gray-900">
                {formData.objectives}
              </p>
            ) : (
              <>
                <CustomRichTextArea
                  value={formData.objectives}
                  onChange={(value) =>
                    setFormData({ ...formData, objectives: value })
                  }
                  placeholder="E.g. Get agreement to a discovery meeting."
                  minHeight="80px"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The goal of the call. This will be shown to users as their
                  practice objective.
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {!isViewMode && (
            <div className="flex justify-end gap-3">
              <Button
                variant="primary"
                onClick={handleSubmit}
                size="lg"
                className="flex w-[140px] justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        entityType="module"
        onGoBack={handleGoBack}
        onKeepEditing={handleKeepEditing}
      />
    </div>
  );
};
