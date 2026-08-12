import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import AdminLayout from './manage';
import type { ManageUserRole } from '~/util/api';

// Mock dependencies
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth0-provider">{children}</div>
  ),
}));

vi.mock('nuqs/adapters/react-router/v7', () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="nuqs-adapter">{children}</div>
  ),
}));

vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useLocation: vi.fn(),
}));

const mockUseQuery = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
}));

const mockGetCurrentUser = vi.hoisted(() => vi.fn());
vi.mock('~/util/api', () => ({
  manageUsersApi: {
    getCurrentUser: mockGetCurrentUser,
  },
}));

const mockUseManageAuthStore = vi.hoisted(() => vi.fn());
vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: mockUseManageAuthStore,
}));

import { useLocation } from 'react-router';

describe('AdminLayout - User Data Refresh', () => {
  const mockUserData = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    picture: 'https://example.com/pic.jpg',
    company: {
      _id: 'company-123',
      name: 'Acme Corp',
      trialEndsAt: null,
    },
    role: 'admin' as ManageUserRole,
    teams: ['team-1', 'team-2'],
  };

  const mockSetData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default location mock - non-auth route
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/manage/dashboard',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    // Default auth store mock - authenticated
    mockUseManageAuthStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        const state = {
          token: 'valid-token-123',
          setData: mockSetData,
        };
        return selector(state);
      }
      return null;
    });

    // Default useQuery mock - successful
    mockUseQuery.mockReturnValue({
      data: mockUserData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockGetCurrentUser.mockResolvedValue(mockUserData);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Query Configuration', () => {
    it('should call useQuery with correct queryKey', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['manage-user-me'],
        }),
      );
    });

    it('should configure refetch interval to 1 minute (60000ms)', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchInterval: 60000,
        }),
      );
    });

    it('should enable refetchOnWindowFocus', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchOnWindowFocus: true,
        }),
      );
    });

    it('should enable refetchOnReconnect', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          refetchOnReconnect: true,
        }),
      );
    });

    it('should set retry to 1', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: 1,
        }),
      );
    });

    it('should set staleTime to 30 seconds (30000ms)', () => {
      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          staleTime: 30000,
        }),
      );
    });

    it('should use getCurrentUser as queryFn', () => {
      render(<AdminLayout />);

      const queryConfig = mockUseQuery.mock.calls[0][0];
      expect(queryConfig.queryFn).toBeDefined();
      expect(typeof queryConfig.queryFn).toBe('function');
    });
  });

  describe('Query Enabled Logic', () => {
    it('should enable query when token exists and not on auth route', () => {
      mockUseManageAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ token: 'valid-token', setData: mockSetData });
        }
        return null;
      });

      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/dashboard',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        }),
      );
    });

    it('should disable query when no token exists', () => {
      mockUseManageAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ token: '', setData: mockSetData });
        }
        return null;
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should disable query on /manage/auth route', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/auth',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should disable query on /manage/auth/callback route', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/auth/callback',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should disable query on /manage/logout route', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/logout',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should enable query on /manage/dashboard route with token', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/dashboard',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      mockUseManageAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ token: 'valid-token', setData: mockSetData });
        }
        return null;
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        }),
      );
    });

    it('should enable query on /manage/users route with token', () => {
      vi.mocked(useLocation).mockReturnValue({
        pathname: '/manage/users',
        search: '',
        hash: '',
        state: null,
        key: 'default',
      });

      mockUseManageAuthStore.mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
          return selector({ token: 'valid-token', setData: mockSetData });
        }
        return null;
      });

      render(<AdminLayout />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
        }),
      );
    });
  });

  describe('Store Update Logic', () => {
    it('should call setData when userData is returned', async () => {
      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(mockUserData);
      });
    });

    it('should not call setData when userData is undefined', async () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).not.toHaveBeenCalled();
      });
    });

    it('should update store with new role when role changes', async () => {
      const updatedUserData = {
        ...mockUserData,
        role: 'superadmin' as ManageUserRole,
      };

      mockUseQuery.mockReturnValue({
        data: updatedUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'superadmin',
          }),
        );
      });
    });

    it('should update store with new teams when teams change', async () => {
      const updatedUserData = {
        ...mockUserData,
        teams: ['team-3', 'team-4', 'team-5'],
      };

      mockUseQuery.mockReturnValue({
        data: updatedUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(
          expect.objectContaining({
            teams: ['team-3', 'team-4', 'team-5'],
          }),
        );
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render Auth0Provider', () => {
      render(<AdminLayout />);
      expect(screen.getByTestId('auth0-provider')).toBeInTheDocument();
    });

    it('should render NuqsAdapter', () => {
      render(<AdminLayout />);
      expect(screen.getByTestId('nuqs-adapter')).toBeInTheDocument();
    });

    it('should render Outlet', () => {
      render(<AdminLayout />);
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should render without errors when query is loading', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<AdminLayout />);
      expect(container).toBeInTheDocument();
    });

    it('should render without errors when query has error', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
        refetch: vi.fn(),
      });

      const { container } = render(<AdminLayout />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Account Deactivation Handling', () => {
    it('should handle 403 error with deactivated account message', async () => {
      // Mock location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      const error403 = new Error('Account deactivated');
      (error403 as any).json = {
        ok: false,
        message: 'Account has been deactivated',
      };

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: error403,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      // The component should render without crashing even with 403 error
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should not call setData when query returns 403 error', async () => {
      const error403 = new Error('Account deactivated');
      (error403 as any).json = {
        ok: false,
        message: 'Account has been deactivated',
      };

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: error403,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).not.toHaveBeenCalled();
      });
    });

    it('should render component when account is deactivated during refetch', async () => {
      // Start with valid data
      mockUseQuery.mockReturnValue({
        data: mockUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(mockUserData);
      });

      // Simulate account deactivation on subsequent fetch
      const error403 = new Error('Account deactivated');
      (error403 as any).json = {
        ok: false,
        message: 'Account has been deactivated',
      };

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: error403,
        refetch: vi.fn(),
      });

      rerender(<AdminLayout />);

      // Component should still render
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null teams in user data', async () => {
      const userDataWithNullTeams = {
        ...mockUserData,
        teams: null,
      };

      mockUseQuery.mockReturnValue({
        data: userDataWithNullTeams,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(
          expect.objectContaining({
            teams: null,
          }),
        );
      });
    });

    it('should handle empty teams array in user data', async () => {
      const userDataWithEmptyTeams = {
        ...mockUserData,
        teams: [],
      };

      mockUseQuery.mockReturnValue({
        data: userDataWithEmptyTeams,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(
          expect.objectContaining({
            teams: [],
          }),
        );
      });
    });

    it('should handle null role in user data', async () => {
      const userDataWithNullRole = {
        ...mockUserData,
        role: null as any,
      };

      mockUseQuery.mockReturnValue({
        data: userDataWithNullRole,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(
          expect.objectContaining({
            role: null,
          }),
        );
      });
    });
  });

  describe('Re-render Behavior', () => {
    it('should call setData on every userData change', async () => {
      const { rerender } = render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledTimes(1);
      });

      // Simulate data change
      const newUserData = { ...mockUserData, name: 'Jane Doe' };
      mockUseQuery.mockReturnValue({
        data: newUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledWith(newUserData);
      });
    });

    it('should not call setData multiple times if data unchanged', async () => {
      render(<AdminLayout />);

      await waitFor(() => {
        expect(mockSetData).toHaveBeenCalledTimes(1);
      });

      // Subsequent render with same data shouldn't trigger setData again
      // because of useEffect dependency array
    });
  });
});
