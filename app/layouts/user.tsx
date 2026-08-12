import { Auth0Provider } from '@auth0/auth0-react';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { Outlet } from 'react-router';
import { AUTH0 } from '../util/constants';
import { useAuthStore } from '../store/auth';

export function UserLayout() {
  const { guestMode } = useAuthStore();

  // For guest users, don't wrap with Auth0Provider but still need NuqsAdapter
  if (guestMode) {
    return (
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
    );
  }

  // For regular users, use Auth0Provider
  return (
    <NuqsAdapter>
      <Auth0Provider
        domain={AUTH0.DOMAIN}
        clientId={AUTH0.CLIENT_ID}
        authorizationParams={{
          audience: AUTH0.AUDIENCE,
          redirect_uri: `${window.location.origin}/auth/callback`,
          scope: 'openid profile email',
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <Outlet />
      </Auth0Provider>
    </NuqsAdapter>
  );
}
