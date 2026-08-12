import { useAuth0 } from '@auth0/auth0-react';
import * as Sentry from '@sentry/react';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { usePostHog } from '~/context/posthog';
import { SelectClient } from '~/practice/SelectClient';
import { SelectModule } from '~/practice/SelectModule';
import { useAuthStore } from '~/store/auth';
import { apiProtected } from '~/util/api';
import {
  withGuestAwareAuth,
  withAuthenticationRequiredOptions,
} from '~/util/auth0';

// Module-level variable to track token check state across renders
const tokenCheckState = {
  hasChecked: false,
  lastCheckTime: 0,
  scheduledRefreshTimeout: null as NodeJS.Timeout | null,
};

export function meta() {
  return [
    { title: 'Hupo Sales AI | Practice' },
  ];
}
export default withGuestAwareAuth(function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const posthog = usePostHog();
  const isRefreshingToken = useRef(false);
  const componentMountTime = useRef(Date.now());
  const renderCount = useRef(0);
  
  // Use shallow comparison to prevent unnecessary re-renders
  const email = useAuthStore((state) => state.email);
  const name = useAuthStore((state) => state.name);
  const userId = useAuthStore((state) => state.id);
  const company = useAuthStore((state) => state.company);
  const guestMode = useAuthStore((state) => state.guestMode);
  const setToken = useAuthStore((state) => state.setToken);

  // Track renders
  renderCount.current += 1;
  console.log(`[Home Component] Render #${renderCount.current}`, {
    timeSinceMount: Date.now() - componentMountTime.current,
    searchParams: Object.fromEntries(searchParams),
    pathname: window.location.pathname,
    guestMode,
  });

  // Only use Auth0 hooks for non-guest users
  const auth0 = guestMode ? null : useAuth0();
  const getIdTokenClaims = guestMode
    ? () => Promise.resolve(null)
    : auth0?.getIdTokenClaims || (() => Promise.resolve(null));
  const getAccessTokenSilently = guestMode
    ? () => Promise.resolve('')
    : auth0?.getAccessTokenSilently || (() => Promise.resolve(''));
  const { t } = useTranslation();

  console.log('home ::: auth0', auth0, ', guestMode', guestMode);

  useEffect(() => {
    if (userId.length > 0) {
      Sentry.setUser({ id: userId, email, username: name });
      posthog.identify(userId, {
        email,
        name,
        company: company.name,
        companyId: company._id,
      });
      posthog.capture('home_page_viewed');
    }
    console.log('home ::: useEffect');
  }, [userId, name, email, posthog]);

  const refreshToken = useCallback(() => {
    console.log('[Token Refresh] Starting refresh attempt', {
      guestMode,
      isRefreshing: isRefreshingToken.current,
      hasAuth0: !!auth0,
      isAuthenticated: auth0?.isAuthenticated,
    });

    if (guestMode) {
      console.log('[Token Refresh] Skipping - guest mode');
      return;
    }

    if (!auth0 || !auth0.isAuthenticated) {
      console.log('[Token Refresh] Skipping - Auth0 not ready or not authenticated');
      return;
    }

    // Prevent concurrent refresh attempts
    if (isRefreshingToken.current) {
      console.log('[Token Refresh] Already in progress, skipping duplicate attempt');
      return;
    }

    isRefreshingToken.current = true;

    getAccessTokenSilently({ cacheMode: 'off' })
      .then((token) => {
        console.log('[Token Refresh] Success - new token obtained');
        setToken(token);
        posthog.capture('token_refreshed');
      })
      .catch((error) => {
        console.error('[Token Refresh] Failed:', {
          errorMessage: error.message,
          errorCode: error.error,
          errorDescription: error.error_description,
        });
        
        // Don't capture failed refresh as successful event
        posthog.capture('token_refresh_failed', {
          error: error.message,
          errorCode: error.error,
        });

        // If token refresh fails due to login_required, don't redirect
        // The Auth0 wrapper will handle this gracefully
        if (error.error === 'login_required') {
          console.log('[Token Refresh] Login required - Auth0 will handle redirect');
        }
      })
      .finally(() => {
        isRefreshingToken.current = false;
        console.log('[Token Refresh] Completed');
      });
  }, [getAccessTokenSilently, setToken, posthog, guestMode, auth0]);

  useEffect(() => {
    const now = Date.now();
    
    console.log('[Token Expiry Check] Effect triggered', {
      guestMode,
      hasCheckedToken: tokenCheckState.hasChecked,
      timeSinceLastCheck: tokenCheckState.lastCheckTime ? now - tokenCheckState.lastCheckTime : 'never',
      hasAuth0: !!auth0,
      isAuthenticated: auth0?.isAuthenticated,
      isLoading: auth0?.isLoading,
    });

    if (guestMode) {
      console.log('[Token Expiry Check] Skipping - guest mode');
      return;
    }

    // Wait for Auth0 to be ready
    if (!auth0 || auth0.isLoading) {
      console.log('[Token Expiry Check] Auth0 not ready yet');
      return;
    }

    // Only proceed if authenticated
    if (!auth0.isAuthenticated) {
      console.log('[Token Expiry Check] Not authenticated');
      return;
    }

    // Prevent multiple executions - check if we've already scheduled a refresh
    if (tokenCheckState.hasChecked && tokenCheckState.scheduledRefreshTimeout) {
      console.log('[Token Expiry Check] Already checked and refresh scheduled, skipping');
      return;
    }

    tokenCheckState.hasChecked = true;
    tokenCheckState.lastCheckTime = now;

    getIdTokenClaims()
      .then((claims) => {
        if (!claims || !claims.exp) {
          console.log('[Token Expiry Check] No claims or expiry found');
          return;
        }

        const exp = claims.exp as number;
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpiresInMinutes = (exp - currentTime) / 60;

        console.log('[Token Expiry Check] Token status:', {
          expiresInMinutes: tokenExpiresInMinutes.toFixed(2),
          expiryTime: new Date(exp * 1000).toISOString(),
          currentTime: new Date(currentTime * 1000).toISOString(),
        });

        // Token already expired
        if (tokenExpiresInMinutes <= 0) {
          console.log('[Token Expiry Check] Token already expired');
          return;
        }

        // For tokens that expire in more than 24 hours, skip automatic refresh
        // Auth0 will handle refresh when needed
        if (tokenExpiresInMinutes > 1440) { // 24 hours
          console.log('[Token Expiry Check] Token has long expiry (>24h), skipping auto-refresh setup');
          return;
        }

        // Refresh token if it expires in less than 60 minutes
        if (tokenExpiresInMinutes < 60) {
          console.log('[Token Expiry Check] Token expires soon, refreshing now');
          refreshToken();
        } else {
          // Schedule a refresh 1 hour before expiration
          // Calculate milliseconds until we should refresh (1 hour before expiry)
          const secondsUntilExpiry = exp - currentTime;
          const secondsUntilRefresh = secondsUntilExpiry - 3600; // 1 hour before expiry
          const millisecondsUntilRefresh = secondsUntilRefresh * 1000;

          if (millisecondsUntilRefresh > 0) {
            const minutesUntilRefresh = millisecondsUntilRefresh / 1000 / 60;
            console.log('[Token Expiry Check] Scheduling refresh in', 
              minutesUntilRefresh.toFixed(2), 'minutes');
            
            // Clear any existing timeout
            if (tokenCheckState.scheduledRefreshTimeout) {
              clearTimeout(tokenCheckState.scheduledRefreshTimeout);
            }
            
            tokenCheckState.scheduledRefreshTimeout = setTimeout(() => {
              console.log('[Token Expiry Check] Scheduled refresh triggered');
              tokenCheckState.scheduledRefreshTimeout = null;
              refreshToken();
            }, millisecondsUntilRefresh);
          } else {
            console.log('[Token Expiry Check] Token should be refreshed now');
            refreshToken();
          }
        }
      })
      .catch((error) => {
        console.error('[Token Expiry Check] Error:', error);
        // Reset the check flag on error so it can be retried
        tokenCheckState.hasChecked = false;
        tokenCheckState.lastCheckTime = 0;
      });

    // Cleanup function - note: we don't clear the timeout here
    // because it should persist across component re-renders
    return () => {
      console.log('[Token Expiry Check] Component unmounting, scheduled refresh will persist');
    };
  }, [getIdTokenClaims, refreshToken, guestMode, auth0]);

  const step = useMemo(() => searchParams.get('step'), [searchParams]);
  console.log('home ::: step:', step);

  return (
    <div className="h-full px-6 lg:px-10">
      {(!step || step === 'select-module') && <SelectModule />}
      {step === 'select-client' && <SelectClient />}
    </div>
  );
}, withAuthenticationRequiredOptions);
