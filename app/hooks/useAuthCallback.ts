import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '~/util/api';
import { AUTH_MODULE_CONFIGS } from '~/types/auth';
import type {
  AuthModuleConfig,
  AuthSuccessResponse,
  AuthModule,
} from '~/types/auth';

interface AuthCallbackConfig {
  /** Backend success endpoint */
  successEndpoint: string;
  /** Redirect path after successful auth */
  successRedirect: string;
  /** Fallback redirect path on error */
  errorRedirect: string;
  /** Whether to show name input dialog */
  enableNameInput?: boolean;
  /** Whether to show loading with logo */
  showLogo?: boolean;
  /** Logo source path */
  logoSrc?: string;
  /** Auth store to use for this module */
  authStore: any;
}

interface AuthCallbackReturn {
  /** Whether auth is still loading */
  isLoading: boolean;
  /** Any auth error */
  error: Error | null;
  /** Whether to show name input dialog */
  showNameInput: boolean;
  /** Pending auth data when name input is shown */
  pendingAuthData: any;
  /** Whether name update is in progress */
  isUpdatingName: boolean;
  /** Function to handle name submission */
  handleNameSubmit: (name: string) => void;
  /** Whether sync has completed */
  syncCompleted: boolean;
}

// Enhanced hook that accepts a module type for simplified usage
export function useAuthCallbackForModule(
  module: AuthModule,
): AuthCallbackReturn {
  const config = AUTH_MODULE_CONFIGS[module];
  return useAuthCallback(config);
}

export function useAuthCallback(
  config: AuthCallbackConfig,
): AuthCallbackReturn {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get auth store methods
  const authStore = config.authStore();
  const { setToken, setData, getAuth0Data, guestMode } = authStore;

  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState<any>(null);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { mutate: updateName, isPending: isUpdatingName } = useMutation({
    mutationFn: async (name: string) => {
      const token = config.authStore.getState().getToken();
      if (!token) {
        throw new Error('No auth token available');
      }
      return api()
        .auth(`Bearer ${token}`)
        .url('/auth/update-name')
        .post({ name })
        .json<{ name: string }>();
    },
    onSuccess: (response) => {
      // Update auth store with new name
      setData({ ...pendingAuthData, name: response.name, guestMode });

      // Close the name input dialog and mark sync as completed
      setShowNameInput(false);
      setSyncCompleted(true);

      // Navigate to success redirect, preserving SCORM parameter
      const urlParams = new URLSearchParams(window.location.search);
      const scormParam = urlParams.get('scorm');
      const redirectPath =
        scormParam === 'true'
          ? `${config.successRedirect}?scorm=true`
          : config.successRedirect;
      navigate(redirectPath);
    },
    onError: (error) => {
      console.error('Name update error:', error);
      toast.error(t('errors.nameUpdateFailed'));
      setError(error as Error);
    },
  });

  const { mutate: successfulLogin } = useMutation({
    async mutationFn(data: { token: string; auth0OrgId: string }) {
      return api()
        .url(config.successEndpoint)
        .auth(`Bearer ${data.token}`)
        .post({ auth0_org_id: data.auth0OrgId })
        .json<{
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          company: { _id: string; name: string; trialEndsAt: string | null; languages?: string[] };
          picture: string;
          onboardingTourCompleted?: boolean;
        }>();
    },
    onSuccess(data) {
      setData({ ...data, guestMode });

      // Check if name input is enabled and name equals email
      if (
        config.enableNameInput &&
        data.name.toLowerCase() === data.email.toLowerCase()
      ) {
        // Store the data temporarily and show name input
        setPendingAuthData(data);
        setShowNameInput(true);
      } else {
        // Mark sync as completed and navigate
        setSyncCompleted(true);
        navigate(config.successRedirect);
      }
    },
    onError: (error: any) => {
      console.error('Auth sync error:', error);

      // Check if this is an inactive account error (401 with deactivated message)
      const errorMessage = error?.message || error?.json?.message || '';
      const isInactiveAccount =
        errorMessage.toLowerCase().includes('deactivated') ||
        errorMessage.toLowerCase().includes('inactive');

      if (isInactiveAccount) {
        // Create a specific error for inactive accounts
        const inactiveError = new Error('ACCOUNT_INACTIVE');
        inactiveError.name = 'AccountInactiveError';
        setError(inactiveError);
        setSyncCompleted(true);
        // Don't show toast for inactive accounts
        // Don't navigate - let the component handle display
      } else {
        // Handle other errors normally
        toast.error(
          t('auth.errors.unknown', 'Authentication failed. Please try again.'),
        );
        setError(error as Error);
        navigate(config.errorRedirect);
      }
    },
  });

  console.log(
    'Auth0 isAuthenticated, isLoading, syncCompleted ::: ',
    isAuthenticated,
    isLoading,
    syncCompleted,
  );

  useEffect(() => {
    // Don't run Auth0 callbacks in guest mode
    if (config.authStore.getState().guestMode) {
      console.log('Guest mode, skipping Auth0 callbacks');
      return;
    }

    if (isLoading || !isAuthenticated || syncCompleted) {
      console.log(
        'Auth0 callbacks skipped',
        isLoading,
        isAuthenticated,
        syncCompleted,
      );
      return;
    }

    (async () => {
      try {
        console.log('Auth0 callbacks running');
        // 1. Grab the token
        const token = await getAccessTokenSilently();
        setToken(token);

        // Get auth0Data from the correct store
        const auth0Data = getAuth0Data();

        // 2. Call backend using established pattern
        successfulLogin({
          token,
          auth0OrgId: auth0Data.organization || '',
        });
      } catch (error) {
        console.error('Error getting access token:', error);
        toast.error(
          t('auth.errors.unknown', 'Authentication failed. Please try again.'),
        );
        setError(error as Error);
        navigate(config.errorRedirect);
      }
    })();
  }, [
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
    syncCompleted,
    setToken,
    getAuth0Data,
    successfulLogin,
    navigate,
    t,
    config.successEndpoint,
    config.errorRedirect,
  ]);

  const handleNameSubmit = (name: string) => {
    updateName(name);
  };

  return {
    isLoading: isLoading || (!syncCompleted && !showNameInput),
    error,
    showNameInput,
    pendingAuthData,
    isUpdatingName,
    handleNameSubmit,
    syncCompleted,
  };
}

// Alternative hook for simple redirect-based auth (like current manage module)
export function useSimpleAuthCallback(
  config: Pick<AuthCallbackConfig, 'successRedirect' | 'errorRedirect'>,
) {
  const { handleRedirectCallback, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback();
        navigate(config.successRedirect);
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate(config.errorRedirect);
      }
    };

    if (!isLoading) {
      handleCallback();
    }
  }, [
    handleRedirectCallback,
    isLoading,
    navigate,
    config.successRedirect,
    config.errorRedirect,
  ]);

  return {
    isLoading,
    error,
  };
}
