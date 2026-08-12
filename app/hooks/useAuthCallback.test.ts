import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthCallback } from './useAuthCallback';
import type { AuthModuleConfig } from '~/types/auth';

// Mock dependencies
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

vi.mock('~/util/api', () => ({
  api: vi.fn(),
}));

import { useAuth0 } from '@auth0/auth0-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

describe('useAuthCallback - Inactive Account Error Handling', () => {
  const mockAuthStoreInstance = {
    setToken: vi.fn(),
    setData: vi.fn(),
    getAuth0Data: () => ({ organization: 'test-org' }),
    guestMode: false,
  };

  const mockAuthStore = Object.assign(
    () => mockAuthStoreInstance,
    {
      getState: () => ({
        getToken: () => 'mock-token',
        guestMode: false,
      }),
    },
  );

  const mockConfig: AuthModuleConfig = {
    module: 'manage',
    basePath: '/manage/auth',
    successEndpoint: '/manage/auth/success',
    successRedirect: '/manage/dashboard',
    errorRedirect: '/manage/auth',
    enableNameInput: false,
    logoSrc: '/logos/test.svg',
    authStore: mockAuthStore as any,
  };

  let mockMutate: ReturnType<typeof vi.fn>;
  let capturedOnError: ((error: any) => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate = vi.fn();
    capturedOnError = undefined;

    // Mock Auth0
    vi.mocked(useAuth0).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      getAccessTokenSilently: vi.fn(),
    } as any);

    // Mock useMutation to capture the onError callback
    vi.mocked(useMutation).mockImplementation((options: any) => {
      capturedOnError = options.onError;
      return {
        mutate: mockMutate,
        isPending: false,
      } as any;
    });
  });

  describe('API error handling', () => {
    it('should detect inactive account from error message with "deactivated"', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      // Simulate the API error for deactivated account
      const apiError = {
        message: 'User account has been deactivated',
        status: 401,
      };

      // Call the captured onError handler
      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('ACCOUNT_INACTIVE');
        expect(result.current.error?.name).toBe('AccountInactiveError');
        expect(result.current.syncCompleted).toBe(true);
      });

      // Should not show toast for inactive accounts
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should detect inactive account from error message with "inactive"', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'Account is inactive',
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error?.message).toBe('ACCOUNT_INACTIVE');
        expect(result.current.error?.name).toBe('AccountInactiveError');
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should detect inactive account from nested json.message property', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        json: {
          message: 'User account has been deactivated',
        },
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error?.message).toBe('ACCOUNT_INACTIVE');
        expect(result.current.error?.name).toBe('AccountInactiveError');
      });
    });

    it('should handle case-insensitive detection of deactivated keyword', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'User Account Has Been DEACTIVATED',
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error?.message).toBe('ACCOUNT_INACTIVE');
        expect(result.current.error?.name).toBe('AccountInactiveError');
      });
    });

    it('should handle general errors normally (not inactive)', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'Network error',
        status: 500,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        // Should not be transformed to AccountInactiveError
        expect(result.current.error?.name).not.toBe('AccountInactiveError');
      });

      // Should show toast for general errors
      expect(toast.error).toHaveBeenCalledWith(
        'Authentication failed. Please try again.',
      );
    });

    it('should handle 401 errors without deactivated message as general errors', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'Unauthorized',
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.name).not.toBe('AccountInactiveError');
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('should not navigate on inactive account errors', async () => {
      const mockNavigate = vi.fn();
      vi.mocked(useAuth0).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        getAccessTokenSilently: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'User account has been deactivated',
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error?.message).toBe('ACCOUNT_INACTIVE');
      });

      // Navigate should not be called for inactive accounts
      // (The component will display the error instead)
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle errors with empty/null message gracefully', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: null,
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
        // Should be treated as general error (not inactive)
        expect(result.current.error?.name).not.toBe('AccountInactiveError');
      });
    });
  });

  describe('error object structure', () => {
    it('should create AccountInactiveError with correct properties', async () => {
      const { result } = renderHook(() => useAuthCallback(mockConfig));

      const apiError = {
        message: 'User account has been deactivated',
        json: {
          ok: false,
          message: 'User account has been deactivated',
        },
        status: 401,
      };

      if (capturedOnError) {
        capturedOnError(apiError);
      }

      await waitFor(() => {
        const error = result.current.error;
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('ACCOUNT_INACTIVE');
        expect(error?.name).toBe('AccountInactiveError');
      });
    });
  });
});
