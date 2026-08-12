import { XMarkIcon } from '@heroicons/react/24/outline';

interface DeactivateModalProps {
  isOpen: boolean;
  onDeactivate: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const DeactivateUserModal = ({
  isOpen,
  onDeactivate,
  onClose,
  isLoading = false,
}: DeactivateModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center text-center sm:items-center sm:p-0">
        <div className="relative max-w-[360px] transform overflow-hidden rounded-lg bg-white p-4 text-left shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Deactivate user?
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Deactivating this user will immediately remove their access to
                  Hupo AI.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-row-reverse">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto"
              onClick={onDeactivate}
              disabled={isLoading}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
