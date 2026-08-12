import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthCallback from './callback';

// Mock dependencies
const mockReset = vi.fn();
const mockStoreLogout = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('~/hooks/useAuthCallback', () => ({
  useAuthCallbackForModule: vi.fn(),
}));

vi.mock('~/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('~/context/posthog', () => ({
  usePostHog: vi.fn(),
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}));

import { useAuth0 } from '@auth0/auth0-react';
import { useAuthCallbackForModule } from '~/hooks/useAuthCallback';
import { useAuthStore } from '~/store/auth';
import { usePostHog } from '~/context/posthog';
import * as Sentry from '@sentry/react';

describe('AuthCallback - Inactive Account Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store
    vi.mocked(useAuthStore).mockReturnValue({
      logout: mockStoreLogout,
    } as any);

    // Mock PostHog
    vi.mocked(usePostHog).mockReturnValue({
      reset: mockReset,
    } as any);
  });

  describe('inactive account error', () => {
    it('should clear state and redirect to inactive page when account is inactive', () => {
      // Mock Auth0 with no errors
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      // Mock callback hook with inactive account error
      const inactiveError = new Error('ACCOUNT_INACTIVE');
      inactiveError.name = 'AccountInactiveError';

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: inactiveError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      const { container } = render(<AuthCallback />);

      // Should call cleanup functions
      expect(mockStoreLogout).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledWith(true);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);

      // Should redirect to inactive page
      expect(window.location.href).toBe('/auth/inactive');

      // Should NOT show error UI for inactive accounts (will redirect instead)
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();

      // Should render null (no UI shown after redirect)
      expect(container.firstChild).toBeNull();
    });

    it('should detect inactive account by error message', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      // Test with just the message (no name property)
      const inactiveError = new Error('ACCOUNT_INACTIVE');

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: inactiveError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<AuthCallback />);

      // Should call cleanup
      expect(mockStoreLogout).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();

      // Should redirect
      expect(window.location.href).toBe('/auth/inactive');

      // Should NOT show error UI
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
    });

    it('should detect inactive account by error name', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      // Test with just the name (different message)
      const inactiveError = new Error('Some other message');
      inactiveError.name = 'AccountInactiveError';

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: inactiveError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<AuthCallback />);

      // Should call cleanup
      expect(mockStoreLogout).toHaveBeenCalled();

      // Should redirect
      expect(window.location.href).toBe('/auth/inactive');

      // Should NOT show error UI
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
    });

    it('should only call cleanup once even with multiple renders', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      const inactiveError = new Error('ACCOUNT_INACTIVE');
      inactiveError.name = 'AccountInactiveError';

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: inactiveError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      delete (window as any).location;
      (window as any).location = { href: '' };

      const { rerender } = render(<AuthCallback />);

      expect(mockStoreLogout).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledTimes(1);

      // Rerender
      rerender(<AuthCallback />);

      // Should still only be called once (hasLoggedOut ref prevents multiple calls)
      expect(mockStoreLogout).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('general authentication errors', () => {
    it('should display general auth error for non-inactive errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      // Mock with a different error
      const generalError = new Error('Network error');

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: generalError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      // Should show general authentication error
      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();

      // Should show Try Again button for general errors
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Should show Hupo logo for general errors
      const logo = screen.getByAltText(/hupo logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logos/Hupo_Logotype_Orange(noR).svg');

      // Should NOT call cleanup for general errors
      expect(mockStoreLogout).not.toHaveBeenCalled();
    });

    it('should handle Auth0 errors', () => {
      // Mock Auth0 with error
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Auth0 error'),
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle Auth0 access_denied error with custom description', () => {
      const auth0Error: any = {
        error: 'access_denied',
        error_description: 'You do not have permission to access this resource',
      };

      vi.mocked(useAuth0).mockReturnValue({
        error: auth0Error,
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      // Should show the custom error description
      expect(screen.getByText('You do not have permission to access this resource')).toBeInTheDocument();
    });

    it('should show Try Again button for general errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Some error'),
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
      expect(tryAgainButton.tagName).toBe('BUTTON');
    });
  });

  describe('loading state', () => {
    it('should display loading state when auth is in progress', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: true,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: false,
      });

      render(<AuthCallback />);

      // Should show loading message
      expect(screen.getByText('Syncing your account...')).toBeInTheDocument();

      // Should show Hupo logo
      const logo = screen.getByAltText(/hupo logo/i);
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logos/Hupo_Logotype_Orange(noR).svg');
    });

    it('should not show error message during loading', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: true,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: false,
      });

      render(<AuthCallback />);

      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
      expect(screen.queryByText('Account Deactivated')).not.toBeInTheDocument();
    });
  });

  describe('name input dialog', () => {
    it('should display name input dialog when showNameInput is true', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: true,
        pendingAuthData: { name: 'user@example.com', email: 'user@example.com' },
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: false,
      });

      render(<AuthCallback />);

      // NameInputDialog should be rendered (we're not testing its internals here)
      // Just verify we don't show loading or error states
      expect(screen.queryByText('Syncing your account...')).not.toBeInTheDocument();
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('successful authentication', () => {
    it('should return null when auth is successful (navigates away)', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      const { container } = render(<AuthCallback />);

      // Should render nothing (null) when successful
      expect(container.firstChild).toBeNull();
    });
  });

  describe('error UI rendering', () => {
    it('should render error container with proper styling for general errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
      } as any);

      const generalError = new Error('Network error');

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: generalError,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      // Check for the error message with red color
      const errorMessage = screen.getByText('Authentication failed. Please try again.');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.className).toContain('text-red-600');
    });

    it('should have proper accessibility for error messages', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Some error'),
      } as any);

      vi.mocked(useAuthCallbackForModule).mockReturnValue({
        isLoading: false,
        error: null,
        showNameInput: false,
        pendingAuthData: null,
        isUpdatingName: false,
        handleNameSubmit: vi.fn(),
        syncCompleted: true,
      });

      render(<AuthCallback />);

      // Error messages should be readable
      expect(screen.getByText('Authentication failed. Please try again.')).toBeVisible();
    });
  });
});
