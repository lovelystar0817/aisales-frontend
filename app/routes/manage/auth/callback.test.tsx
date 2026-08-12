import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminAuthCallback from './callback';

// Mock Auth0
const mockLogout = vi.fn();
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock the auth callback hook
vi.mock('~/hooks/useAuthCallback', () => ({
  useAuthCallbackForModule: vi.fn(),
}));

// Mock the manage auth store
vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: vi.fn(),
}));

// Mock PostHog
vi.mock('~/context/posthog', () => ({
  usePostHog: vi.fn(),
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}));

import { useAuth0 } from '@auth0/auth0-react';
import { useAuthCallbackForModule } from '~/hooks/useAuthCallback';
import { useManageAuthStore } from '~/store/manageAuth';
import { usePostHog } from '~/context/posthog';
import * as Sentry from '@sentry/react';

describe('AdminAuthCallback - Inactive Account Handling', () => {
  const mockStoreLogout = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockClear();

    // Mock manage auth store
    vi.mocked(useManageAuthStore).mockReturnValue({
      logout: mockStoreLogout,
    } as any);

    // Mock PostHog
    vi.mocked(usePostHog).mockReturnValue({
      reset: mockReset,
    } as any);
  });

  describe('inactive account error', () => {
    it('should logout and redirect to inactive page when account is inactive', () => {
      // Mock Auth0 with no errors
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      const { container } = render(<AdminAuthCallback />);

      // Should call cleanup functions
      expect(mockStoreLogout).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalledWith(true);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);

      // Should redirect to inactive page
      expect(window.location.href).toBe('/manage/auth/inactive');

      // Should NOT show error UI for inactive accounts (will redirect instead)
      expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'Your account has been deactivated. Please contact your administrator.',
        ),
      ).not.toBeInTheDocument();

      // Should render null (no UI shown in callback)
      expect(container.firstChild).toBeNull();
    });

    it('should detect inactive account by error message', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<AdminAuthCallback />);

      // Should call cleanup
      expect(mockStoreLogout).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();

      // Should redirect
      expect(window.location.href).toBe('/manage/auth/inactive');

      // Should NOT show error UI
      expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
    });

    it('should detect inactive account by error name', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<AdminAuthCallback />);

      // Should call cleanup
      expect(mockStoreLogout).toHaveBeenCalled();

      // Should redirect
      expect(window.location.href).toBe('/manage/auth/inactive');

      // Should NOT show error UI
      expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
    });
  });

  describe('general authentication errors', () => {
    it('should display general auth error for non-inactive errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      // Should show general authentication error
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(
        screen.getByText('There was an error during admin authentication.'),
      ).toBeInTheDocument();

      // Should show Try Again button for general errors
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      // Should show Hupo logo for general errors
      const logo = screen.getByAltText('Hupo Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logos/Hupo_Logotype_Orange(noR).svg');

      // Should NOT call cleanup for general errors
      expect(mockStoreLogout).not.toHaveBeenCalled();
    });

    it('should handle Auth0 errors', () => {
      // Mock Auth0 with error
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Auth0 error'),
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show Try Again button for general errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Some error'),
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
      expect(tryAgainButton.tagName).toBe('BUTTON');
    });
  });

  describe('loading state', () => {
    it('should display loading state when auth is in progress', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      // Should show loading message
      expect(
        screen.getByText('Processing admin authentication...'),
      ).toBeInTheDocument();

      // Should show loading spinner (by checking for the animated div)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Should show Hupo logo
      const logo = screen.getByAltText('Hupo Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/logos/Hupo_Logotype_Orange(noR).svg');
    });

    it('should not show error message during loading', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
      expect(screen.queryByText('Account Deactivated')).not.toBeInTheDocument();
    });
  });

  describe('successful authentication', () => {
    it('should return null when auth is successful (navigates away)', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      const { container } = render(<AdminAuthCallback />);

      // Should render nothing (null) when successful
      expect(container.firstChild).toBeNull();
    });
  });

  describe('error UI rendering', () => {
    it('should render error container with proper styling for general errors', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: null,
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      // Check for the error title with red color
      const title = screen.getByText('Authentication Error');
      expect(title).toBeInTheDocument();
      expect(title.className).toContain('text-red-600');

      // Should show error message
      expect(
        screen.getByText('There was an error during admin authentication.'),
      ).toBeInTheDocument();
    });

    it('should have proper accessibility for error messages', () => {
      vi.mocked(useAuth0).mockReturnValue({
        error: new Error('Some error'),
        logout: mockLogout,
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

      render(<AdminAuthCallback />);

      // Error messages should be readable
      expect(screen.getByText('Authentication Error')).toBeVisible();
      expect(
        screen.getByText('There was an error during admin authentication.'),
      ).toBeVisible();
    });
  });
});
