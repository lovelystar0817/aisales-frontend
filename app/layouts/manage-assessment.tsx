import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/button';
import { XIcon } from '../../public/icons/icons';

export default function AssessmentLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClose = () => {
    navigate(-1);
  };
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F6F8F8]">
      {/* Assessment Header */}
      <header className="flex items-center justify-between border-b border-[#EAEDEF] bg-white px-4 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <img
            src="/logos/Hupo_Icon_Orange.svg"
            alt="Logo"
            className="size-7"
          />
          <h1 className="text-base font-bold text-gray-900 md:text-xl">
            {t('assessment.roleplaySessionAssessment')}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="transition-colors duration-200 hover:bg-gray-100"
        >
          <XIcon />
        </Button>
      </header>

      <main className="w-full flex-1 py-6">
        <div className="mx-auto max-w-screen-xl px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
