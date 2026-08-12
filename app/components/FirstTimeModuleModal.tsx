import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import xIcon from '~/assets/icons/x.svg';
import type { Module } from '~/types/module';

interface FirstTimeModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  module: Module;
}

export function FirstTimeModuleModal({
  isOpen,
  onClose,
  onContinue,
  module,
}: FirstTimeModuleModalProps) {
  const { t } = useTranslation();

  const handleContinue = () => {
    onContinue();
    onClose();
  };

    return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md rounded-xl bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            {/* Header */}
            <div className="flex justify-between items-center gap-4 p-4 pb-2">
              <DialogTitle
                as="h3"
                className="text-lg font-semibold text-gray-900"
              >
                {t('common.importantNotice')}: {t('common.aiDisclaimer')}
              </DialogTitle>

              <CloseButton className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                <img src={xIcon} alt={t('common.close')} className="h-4 w-4" />
              </CloseButton>
            </div>

            {/* Content */}
            <div className="px-4 pb-4">
              {/* Disclaimer Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {module.disclaimer?.disclaimer || t('practice.firstTime.defaultDisclaimer')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end">
                <Button
                  onClick={handleContinue}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium"
                >
                  {t('practice.firstTime.acknowledgeAndContinue')}
                </Button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}