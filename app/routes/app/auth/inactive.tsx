import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';

export default function AccountInactive() {
  const { t } = useTranslation();
  const { logout } = useAuth0();

  const handleTryAgain = () => {
    // Logout from Auth0 to clear the session, then redirect to auth page
    logout({
      logoutParams: {
        returnTo: `${window.location.origin}/logout`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="text-center">
          <img
            className="mx-auto mb-6 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt', 'Hupo Logo')}
          />
          <p className="mb-6 text-gray-600">
            {t(
              'auth.errors.accountInactive.message',
              'Your account has been deactivated. Please contact your administrator.',
            )}
          </p>
          <button
            onClick={handleTryAgain}
            className="rounded-md bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
          >
            {t('auth.logout', 'Log out')}
          </button>
        </div>
      </div>
    </div>
  );
}
