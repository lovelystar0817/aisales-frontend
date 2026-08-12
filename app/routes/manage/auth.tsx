import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useManageAuthStore } from '~/store/manageAuth';
import { useAdminLogout } from '~/hooks/useAdminLogout';
import { useTranslation } from 'react-i18next';

export default function AdminAuth() {
  const logout = useAdminLogout();
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const { getToken } = useManageAuthStore();
  const [showError, setShowError] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading) {
      // Check both Auth0 authentication AND our backend token
      const hasBackendToken = !!getToken();

      if (isAuthenticated && hasBackendToken) {
        navigate('/manage/dashboard', { replace: true });
      } else if (!isAuthenticated) {
        loginWithRedirect();
      } else if (isAuthenticated && !hasBackendToken) {
        // User is authenticated with Auth0 but not authorized by our backend
        // Show error after a brief delay to allow callback to complete
        const timer = setTimeout(() => {
          setShowError(true);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, navigate, getToken]);

  if (isLoading) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />
          <p>{t('common.loading')}</p>
        </div>
      </main>
    );
  }

  // Show error if user is authenticated but not authorized
  if (showError && isAuthenticated && !getToken()) {
    return (
      <main className="flex min-h-full w-full items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <img
              className="mx-auto mb-4 h-10"
              src="/logos/Hupo_Logotype_Orange(noR).svg"
              alt={t('auth.hupoLogoAlt')}
            />
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              {t('auth.errors.title')}
            </h2>
            <p className="mb-6 text-gray-600">
              {t(
                'auth.admin.notAuthorized',
                'Your account is not authorized to access the admin panel. Please contact your administrator to request access.',
              )}
            </p>
            <div className="space-y-3">
              <button
                onClick={logout}
                className="w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading state while waiting for auth callback to complete
  if (isAuthenticated && !getToken() && !showError) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt')}
          />
          <p>{t('auth.admin.verifyingAccess', 'Verifying access...')}</p>
        </div>
      </main>
    );
  }

  // Fallback
  return null;
}
