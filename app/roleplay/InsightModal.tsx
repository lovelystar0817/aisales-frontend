import {
  Dialog,
  Transition,
  TransitionChild,
  DialogTitle,
  DialogPanel,
} from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { noop } from '~/util/constants';

export function InsightModal(props: {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  shouldReturnHome: boolean;
}) {
  const { isOpen, onClose, shouldReturnHome } = props;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleReturn = () => {
    onClose();
    if (shouldReturnHome) {
      navigate('/');
    } else if (props.sessionId) {
      navigate('/sessions/' + props.sessionId + '?fromPast=1');
    }
  };

  return (
    <Transition static appear show={isOpen} as={Fragment}>
      <Dialog static as="div" className="relative z-50" onClose={noop}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="max-w-[30rem] transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="p-6 pb-3">
                  <DialogTitle className="text-[20px] font-semibold">
                    {t('insights.notAvailable')}
                  </DialogTitle>
                  <p className="mt-2 text-[14px] font-[400] text-gray-600">
                    {t('insights.tooShort')}
                  </p>
                </div>
                <div className="flex justify-end p-4">
                  <button
                    type="button"
                    className="bg-primary hover:bg-primary-600 rounded-full px-6 py-3 leading-5 tracking-tight text-white transition-colors duration-200"
                    onClick={handleReturn}
                  >
                    {shouldReturnHome
                      ? t('insights.returnHome')
                      : t('insights.returnToChat')}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
