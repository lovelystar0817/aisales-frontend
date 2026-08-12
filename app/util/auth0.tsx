import type { WithAuthenticationRequiredOptions } from '@auth0/auth0-react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import * as React from 'react';
import { useAuthStore } from '~/store/auth';
import { useManageAuthStore } from '~/store/manageAuth';

// Track redirect attempts to prevent infinite loops
const redirectAttempts = new Map<string, { count: number; lastAttempt: number }>();
const REDIRECT_COOLDOWN = 5000; // 5 seconds
const MAX_REDIRECT_ATTEMPTS = 3;

// Base configuration factory to ensure consistency
function createAuthOptions(
  authPath: string,
  authStore: typeof useAuthStore | typeof useManageAuthStore,
): WithAuthenticationRequiredOptions {
  return {
    loginOptions: {
      openUrl(url) {
        const currentPath = window.location.pathname;
        const redirectKey = `${currentPath}->${url}`;
        
        // Check redirect attempts
        const now = Date.now();
        const attempts = redirectAttempts.get(redirectKey);
        
        if (attempts) {
          const timeSinceLastAttempt = now - attempts.lastAttempt;
          
          if (timeSinceLastAttempt < REDIRECT_COOLDOWN) {
            console.warn('[Auth0] Redirect blocked - too frequent', {
              redirectKey,
              attempts: attempts.count,
              cooldownRemaining: REDIRECT_COOLDOWN - timeSinceLastAttempt,
            });
            return;
          }
          
          if (attempts.count >= MAX_REDIRECT_ATTEMPTS) {
            console.error('[Auth0] Max redirect attempts reached', {
              redirectKey,
              attempts: attempts.count,
            });
            return;
          }
        }
        
        // Update redirect tracking
        redirectAttempts.set(redirectKey, {
          count: (attempts?.count || 0) + 1,
          lastAttempt: now,
        });
        
        // Clean up old entries
        for (const [key, value] of redirectAttempts.entries()) {
          if (now - value.lastAttempt > 60000) { // 1 minute
            redirectAttempts.delete(key);
          }
        }
        
        console.log('[Auth0] Processing redirect', {
          from: currentPath,
          to: url,
          hasToken: !!authStore.getState().getToken(),
        });

        if (!authStore.getState().getToken()) {
          // For main auth store, check guest mode and redirect accordingly
          let redirectPath = authPath;
          if (authStore === useAuthStore) {
            const guestMode = authStore.getState().guestMode;
            redirectPath = guestMode ? '/guest/auth' : authPath;
          }
          console.log('[Auth0] No token found, redirecting to', redirectPath);
          window.location.replace(redirectPath);
          return;
        }

        try {
          const parsedUrl = new URL(url);
          // For development: check if the hostname ends with "auth0.com"
          // For production: check if the hostname equals "auth.hupo.co"
          if (
            parsedUrl.hostname.endsWith('auth0.com') ||
            parsedUrl.hostname === 'auth.hupo.co'
          ) {
            console.log('[Auth0] Redirecting to Auth0 domain');
            window.location.replace(url);
            return;
          }
        } catch (error) {
          console.error('[Auth0] Error parsing URL:', error);
        }
        
        // For main auth store, check guest mode and redirect accordingly
        let redirectPath = authPath;
        if (authStore === useAuthStore) {
          const guestMode = authStore.getState().guestMode;
          redirectPath = guestMode ? '/guest/auth' : authPath;
        }

        if (window.location.pathname === redirectPath) {
          console.log('[Auth0] Already on auth path, redirecting to Auth0');
          window.location.replace(url);
          return;
        }
        
        console.log('[Auth0] Redirecting to auth path with returnTo');
        window.location.replace(
          `${redirectPath}?returnTo=${encodeURIComponent(url)}`,
        );
      },
      // Always use the current auth data from the store
      // authorizationParams: authStore.getState().getAuth0Data(),
    },
  };
}

// App module auth configuration (main user authentication)
export const withAuthenticationRequiredOptions = createAuthOptions(
  '/auth',
  useAuthStore,
);

// Manage module auth configuration (admin authentication)
export const withManageAuthenticationRequiredOptions = createAuthOptions(
  '/manage/auth',
  useManageAuthStore,
);

// Custom wrapper that handles guest mode
export function withGuestAwareAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithAuthenticationRequiredOptions,
) {
  return React.memo(function GuestAwareComponent(props: P) {
    const { guestMode } = useAuthStore();
    console.log('withGuestAwareAuth ::: guestMode:', guestMode);
    if (guestMode) {
      // In guest mode, render component directly without Auth0 wrapper
      return <Component {...props} />;
    }

    // In regular mode, use Auth0 authentication wrapper
    const AuthedComponent = React.useMemo(
      () => withAuthenticationRequired(Component, options),
      [Component, options]
    );
    return <AuthedComponent {...props} />;
  });
}
