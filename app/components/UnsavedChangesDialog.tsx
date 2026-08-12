import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
} from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  entityType: 'persona' | 'scorecard' | 'scenario' | 'product' | 'module';
  onGoBack: () => void;
  onKeepEditing: () => void;
}

const ENTITY_LABELS: Record<string, string> = {
  persona: 'persona',
  scorecard: 'scorecard',
  scenario: 'roleplay',
  module: 'scenario',
  product: 'product',
};

export function UnsavedChangesDialog({
  isOpen,
  entityType,
  onGoBack,
  onKeepEditing,
}: UnsavedChangesDialogProps) {
  const entityLabel = ENTITY_LABELS[entityType];

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={onKeepEditing}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-[400px] rounded-2xl bg-white p-6 shadow-xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            {/* Title with warning icon */}
            <div className="mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-primary" />
              <h3 className="text-base font-bold text-[#161618]">
                Your {entityLabel} is not saved
              </h3>
            </div>

            {/* Description */}
            <p className="mb-6 text-base text-[#58595A]">
              Exiting this page will undo all the edits you have made.
            </p>

            {/* Button group */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onGoBack}
                className="flex h-10 items-center justify-center rounded-full bg-[#FFF0EB] px-6 text-sm text-primary hover:bg-[#FFE5DC] focus:outline-none"
              >
                Go back
              </button>
              <button
                onClick={onKeepEditing}
                className="flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm text-white hover:bg-orange-700 focus:outline-none"
              >
                Keep editing
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
