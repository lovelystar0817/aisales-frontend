import {
  Button,
  CloseButton,
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { cn } from '~/util/utils';

import xIcon from '~/assets/icons/x.svg';

export function Dialog(props: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  title: string;
  description: string;
  confirmText: string;
  confirmButtonClassName?: string;
}) {
  const { title, description, confirmText, isOpen, onConfirm, onClose, confirmButtonClassName } = props;
  const { t } = useTranslation();

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
            <div className="flex justify-between gap-4 p-4">
              <DialogTitle
                as="h3"
                className="flex-1 text-xl/7 font-bold tracking-tight text-black"
              >
                {title}
              </DialogTitle>

              <CloseButton>
                <img src={xIcon} alt={t('common.close')} />
              </CloseButton>
            </div>
            <div className="px-4 pb-6">
              <p className="text-base/6 tracking-tight text-[#19222A]/70">
                {description}
              </p>
            </div>
            <div className="flex justify-end px-4 py-3">
              <Button
                className={cn(
                  'bg-primary data-[hover]:bg-primary-600 data-[open]:bg-primary-700 data-[focus]:outline-primary rounded-full px-6 py-3 text-sm/5 text-white focus:outline-none data-[focus]:outline-1',
                  confirmButtonClassName
                )}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
