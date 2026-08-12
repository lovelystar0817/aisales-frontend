import { useTranslation } from 'react-i18next';
import { Button } from '~/components/button';
import { useLogout } from '~/hooks/useLogout';
import { UserLayout } from '../layouts/user';
import { useAuthStore } from '../store/auth';

export default function AppRoute() {
  const { guestMode, emailVerified } = useAuthStore();
  const logout = useLogout();
  const { t } = useTranslation();

  console.log('APP ::: guestMode', guestMode);

  if (!emailVerified) {
    return (
      <div className="bg-pattern flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 sm:py-16 lg:px-8">
        <div className="max-w-md text-center">
          <h1 className="font-everett text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('auth.verifyEmailTitle')}
          </h1>
          <p className="text-gray mt-4 text-base leading-7">
            {t('auth.verifyEmailDescription')}
          </p>
          <Button
            variant="primary"
            className="mt-6 w-1/3 justify-center"
            size="lg"
            onClick={logout}
          >
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    );
  }

  return <UserLayout />;
}
