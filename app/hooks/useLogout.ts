import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuthStore } from '~/store/auth';
import { usePostHog } from '../context/posthog';
import * as Sentry from '@sentry/react';

export function useLogout() {
  const { guestMode } = useAuthStore();
  const { logout } = useAuth0();
  const store = useAuthStore();
  const posthog = usePostHog();

  return useCallback(async () => {
    store.logout();
    await logout({
      logoutParams: {
        returnTo: `${window.location.origin}${guestMode ? '/guest' : ''}/logout`,
      },
    });
    posthog.reset(true);
    Sentry.setUser(null);
  }, [logout, guestMode, store, posthog]);
}
