import { XMarkIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { cn } from '~/util/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onSubmit: () => void;
  onClose: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  buttonText?: string;
  buttonClassName?: string;
}

export const ConfirmationModal = ({
  isOpen,
  onSubmit,
  onClose,
  isLoading = false,
  title,
  description,
  buttonText = 'Delete',
  buttonClassName,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-[360px] transform overflow-hidden rounded-2xl bg-white p-4 text-left shadow-xl transition-all">
          {/* Header with close button */}
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-3">
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {/* Action button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className={cn(
                'inline-flex justify-center rounded-full bg-red-600 px-6 py-2.5 text-sm text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50',
                buttonClassName ? buttonClassName : '',
              )}
              onClick={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 /> : buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
