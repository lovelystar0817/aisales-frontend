import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useManageAuthStore } from '~/store/manageAuth';
import { usePostHog } from '../context/posthog';
import * as Sentry from '@sentry/react';

export function useAdminLogout() {
  const { logout } = useAuth0();
  const store = useManageAuthStore();
  const posthog = usePostHog();

  return useCallback(async () => {
    store.logout();
    await logout({
      logoutParams: {
        returnTo: `${window.location.origin}/manage/logout`,
      },
    });
    posthog.reset(true);
    Sentry.setUser(null);
  }, [logout, store, posthog]);
} 
