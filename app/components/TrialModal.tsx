import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';

export function TrialEndedModal(props: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isOpen, onClose } = props;
  const { t } = useTranslation();

  const handleContactClick = () => {
    window.location.href =
      'mailto:justin@hupo.co?subject=Hupo AI Trial Upgrade&body=Hi Justin,%0D%0A%0D%0AI would like to learn more about upgrading our Hupo AI account.';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      {/* Change z-index to be higher than sidebar (z-50) */}
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Update overlay to be fixed and cover entire viewport */}
          <div
            className="fixed inset-0 bg-black/50"
            style={{ position: 'fixed', zIndex: 100 }}
          />
        </TransitionChild>

        {/* Update modal container to be above everything */}
        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ position: 'fixed', zIndex: 101 }}
        >
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="max-h-[20rem] w-full max-w-[24rem] transform overflow-hidden rounded-[1.5rem] bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col items-start">
                  {/* Warning Icon */}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4eb]">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[#ff4b0a]"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                  </div>

                  {/* Content */}
                  <DialogTitle
                    as="h3"
                    className="mb-2 text-[18px] font-bold leading-6 tracking-tight"
                  >
                    {t('trial.ended')}
                  </DialogTitle>
                  <Description className="text-[15px] leading-normal text-[#707173]">
                    {t('trial.upgradeMessage')}
                  </Description>

                  {/* Buttons */}
                  <div className="mt-5 flex w-full items-center justify-between gap-2">
                    <button
                      onClick={onClose}
                      className="ml-6 h-[3rem] px-6 text-[14px] font-normal text-[#707173] transition-colors hover:text-[#161618]"
                    >
                      {t('common.notNow')}
                    </button>
                    <button
                      onClick={handleContactClick}
                      className="h-[3rem] min-w-[10rem] rounded-full bg-[#ff4b0a] px-12 text-[14px] font-normal text-white transition-colors hover:bg-[#ff4b0a]/90"
                    >
                      {t('common.contactUs')}
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
