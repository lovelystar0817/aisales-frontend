import { useAuth0 } from '@auth0/auth0-react';
import { useAuthCallbackForModule } from '~/hooks/useAuthCallback';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useManageAuthStore } from '~/store/manageAuth';
import { usePostHog } from '~/context/posthog';
import * as Sentry from '@sentry/react';

export default function AdminAuthCallback() {
  const { error } = useAuth0();
  const { t } = useTranslation();
  const store = useManageAuthStore();
  const posthog = usePostHog();

  // Use the simplified module-based auth callback
  const { isLoading, error: callbackError } =
    useAuthCallbackForModule('manage');

  // Track if logout has been called to prevent multiple logout calls
  const hasLoggedOut = useRef(false);

  // Check if account is inactive
  const isAccountInactive =
    callbackError?.message === 'ACCOUNT_INACTIVE' ||
    callbackError?.name === 'AccountInactiveError';

  // For inactive accounts, clear local state and redirect (Auth0 logout happens on inactive page)
  useEffect(() => {
    if (isAccountInactive && !hasLoggedOut.current) {
      hasLoggedOut.current = true;

      // Clean up local state following the same sequence as useAdminLogout
      store.logout();
      posthog.reset(true);
      Sentry.setUser(null);

      // Redirect to inactive page without Auth0 logout
      // Auth0 session will be cleared when user clicks "Try Again" on inactive page
      window.location.href = '/manage/auth/inactive';
    }
  }, [isAccountInactive, store, posthog]);

  // Handle Auth0 errors (non-inactive errors)
  if (error || (callbackError && !isAccountInactive)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="text-center">
            <img
              className="mx-auto mb-4 h-10"
              src="/logos/Hupo_Logotype_Orange(noR).svg"
              alt={t('auth.hupoLogoAlt', 'Hupo Logo')}
            />
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              {t('auth.errors.title', 'Authentication Error')}
            </h2>
            <p className="mb-4 text-gray-600">
              {t(
                'auth.admin.message',
                'There was an error during admin authentication.',
              )}
            </p>
            <button
              onClick={() => (window.location.href = '/manage/auth')}
              className="rounded-md bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
            >
              {t('auth.errors.tryAgain', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt', 'Hupo Logo')}
          />
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
          <p className="text-gray-600">
            {t('auth.admin.syncing', 'Processing admin authentication...')}
          </p>
        </div>
      </div>
    );
  }

  // This shouldn't render since we navigate away on success, but included for completeness
  return null;
}
