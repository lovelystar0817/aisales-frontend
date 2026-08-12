import { Dialog } from '~/components/Dialog';
import { useTranslation } from 'react-i18next';

export function EndSessionDialog(props: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { isOpen, onConfirm, onClose } = props;
  const { t } = useTranslation();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('sessions.endSessionTitle')}
      description={t('sessions.endSessionDescription')}
      confirmText={t('sessions.endSession')}
      confirmButtonClassName="!bg-[#E60D00] !hover:bg-[#C50B00]"
    />
  );
}
