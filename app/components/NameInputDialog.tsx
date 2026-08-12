import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Input,
  Label,
} from '@headlessui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from './LoadingSpinner';

export function NameInputDialog({
  isOpen,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999]"
      onClose={() => {}} // Empty function to prevent closing on backdrop click
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 flex items-center justify-center">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6">
          <DialogTitle className="mb-4 text-xl font-bold">
            {t('nameInput.whatsYourName')}
          </DialogTitle>

          <Field className="space-y-2">
            <Label className="font-medium">{t('nameInput.name')}</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="data-[focus]:border-primary data-[focus]:ring-primary data-[focus]:ring-1mt-1 mt-1 w-full rounded-full border border-[#C7C7C7] px-4 py-2"
              placeholder={t('nameInput.enterYourName')}
            />
          </Field>

          <p className="mb-2 text-sm text-gray-500">
            {t('nameInput.description')}
          </p>

          <button
            onClick={() => onSubmit(name)}
            disabled={!name.trim() || isLoading}
            className="bg-primary mt-6 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-white disabled:bg-gray-300"
          >
            {isLoading ? (
              <LoadingSpinner className="size-5" />
            ) : (
              t('nameInput.continue')
            )}
          </button>
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}
