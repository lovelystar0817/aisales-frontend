import { Outlet, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/button';
import { XIcon } from '../../public/icons/icons';

export default function AssessmentLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const handleClose = () => {
    // Check if user came from past practices page
    const fromPast = searchParams.get('fromPast');
    if (fromPast === '1') {
      // Navigate back to past practices page
      navigate('/practices/past');
    } else {
      // Default behavior - go to home page
      navigate('/');
    }
  };
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F6F8F8]">
      {/* Assessment Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAEDEF] bg-white px-4 py-4 md:px-8">
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
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <XIcon className="size-7" />
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
