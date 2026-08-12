import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  CloseButton,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import xIcon from '~/assets/icons/x.svg';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function InfoModal({
  isOpen,
  onClose,
  title,
  children,
}: InfoModalProps) {
  const { t } = useTranslation();

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={onClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 z-10 w-screen">
        <DialogPanel
          transition
          className="flex h-full w-full flex-col bg-white backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
        >
          {/* Header - Fixed at top */}
          <div className="flex flex-shrink-0 items-center justify-between gap-4 bg-white p-6">
            <DialogTitle
              as="h3"
              className="flex-1 text-xl/7 font-bold tracking-tight text-black"
            >
              {title}
            </DialogTitle>

            <CloseButton className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
              <img src={xIcon} alt={t('common.close')} className="h-4 w-4" />
            </CloseButton>
          </div>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}
