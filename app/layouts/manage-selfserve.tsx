import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { XIcon } from '../../public/icons/icons';
import { useTitleBarStore } from '~/store/title-bar';

export default function ManagePersonaLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const titleBarStore = useTitleBarStore();

  const handleClose = () => {
    navigate(-1);
  };
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F6F8F8]">
      {/* Assessment Header */}
      <header className="flex items-center justify-between border-b border-[#EAEDEF] bg-white px-4 py-3 lg:px-25">
        <div className="flex items-center">
          <XIcon
            className="size-5 cursor-pointer text-gray-500"
            onClick={handleClose}
          />
          <div className="mx-4 h-5 border-l border-[#888888]"></div>

          <h1 className="text-base font-bold text-gray-900 md:text-xl">
            {titleBarStore.title ?? 'Create'}
          </h1>
        </div>
        {titleBarStore.action}
      </header>

      <main className="w-full flex-1 py-6">
        <div className="mx-auto max-w-screen-xl px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
