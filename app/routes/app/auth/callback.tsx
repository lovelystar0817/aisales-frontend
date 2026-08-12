import { useAuth0 } from '@auth0/auth0-react';
import { useAuthCallbackForModule } from '~/hooks/useAuthCallback';
import { useTranslation } from 'react-i18next';
import { NameInputDialog } from '~/components/NameInputDialog';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '~/store/auth';
import { usePostHog } from '~/context/posthog';
import * as Sentry from '@sentry/react';

/**
 * This component is rendered on the /auth/callback route.
 * It handles the post-login synchronization with the backend.
 */
export default function AuthCallback() {
  const { error } = useAuth0();
  const { t } = useTranslation();
  const store = useAuthStore();
  const posthog = usePostHog();

  // Use the simplified module-based auth callback
  const {
    isLoading,
    error: callbackError,
    showNameInput,
    pendingAuthData,
    isUpdatingName,
    handleNameSubmit,
  } = useAuthCallbackForModule('app');

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

      // Clean up local state following the same sequence as logout
      store.logout();
      posthog.reset(true);
      Sentry.setUser(null);

      // Redirect to inactive page without Auth0 logout
      // Auth0 session will be cleared when user clicks "Try Again" on inactive page
      window.location.href = '/auth/inactive';
    }
  }, [isAccountInactive, store, posthog]);

  // Handle Auth0 errors (non-inactive errors)
  if (error || (callbackError && !isAccountInactive)) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt', 'Hupo Logo')}
          />
          <p className="mb-4 text-red-600">
            {(error as any)?.error === 'access_denied' &&
            (error as any)?.error_description
              ? (error as any)?.error_description
              : t(
                  'auth.errors.unknown_auth0',
                  'Authentication failed. Please try again.',
                )}
          </p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="rounded-md bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
          >
            {t('auth.errors.tryAgain', 'Try Again')}
          </button>
        </div>
      </main>
    );
  }

  // Show name input dialog if needed
  if (showNameInput) {
    return (
      <NameInputDialog
        isOpen={showNameInput}
        onSubmit={handleNameSubmit}
        isLoading={isUpdatingName}
      />
    );
  }

  // Show loading state while we sync
  if (isLoading) {
    return (
      <main className="flex min-h-full w-full items-center justify-center">
        <div className="text-center">
          <img
            className="mx-auto mb-4 h-10"
            src="/logos/Hupo_Logotype_Orange(noR).svg"
            alt={t('auth.hupoLogoAlt', 'Hupo Logo')}
          />
          <p>{t('auth.syncing', 'Syncing your account...')}</p>
        </div>
      </main>
    );
  }

  // This shouldn't render since we navigate away on success, but included for completeness
  return null;
}
