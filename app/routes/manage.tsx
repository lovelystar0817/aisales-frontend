import { Auth0Provider } from '@auth0/auth0-react';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { Outlet, useLocation } from 'react-router';
import { ADMIN_AUTH0, ADMIN_SCOPES } from '../util/admin';
import { useQuery } from '@tanstack/react-query';
import { manageUsersApi } from '~/util/api';
import { useManageAuthStore } from '~/store/manageAuth';
import { useEffect } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const token = useManageAuthStore((state) => state.token);
  const setData = useManageAuthStore((state) => state.setData);

  // Only fetch user data when authenticated (token exists) and not on auth routes
  const isAuthRoute = location.pathname.startsWith('/manage/auth');
  const isLogoutRoute = location.pathname === '/manage/logout';
  const shouldFetchUser = !!token && !isAuthRoute && !isLogoutRoute;

  const { data: userData } = useQuery({
    queryKey: ['manage-user-me'],
    queryFn: () => manageUsersApi.getCurrentUser(),
    enabled: shouldFetchUser,
    refetchInterval: 60000, // Refresh every 1 minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Update store when user data changes
  useEffect(() => {
    if (userData) {
      setData(userData);
    }
  }, [userData, setData]);

  return (
    <NuqsAdapter>
      <Auth0Provider
        domain={ADMIN_AUTH0.DOMAIN}
        clientId={ADMIN_AUTH0.CLIENT_ID}
        authorizationParams={{
          audience: ADMIN_AUTH0.AUDIENCE,
          redirect_uri: `${window.location.origin}/manage/auth/callback`,
          scope: ADMIN_SCOPES.join(' '),
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <Outlet />
      </Auth0Provider>
    </NuqsAdapter>
  );
} 
