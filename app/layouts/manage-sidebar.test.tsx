import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ManageSidebarLayout from './manage-sidebar';

vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid={`navlink-${to}`}>
      {children}
    </a>
  ),
}));

vi.mock('~/hooks/useAdminLogout', () => ({
  useAdminLogout: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { teams: [] } }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('~/components/LanguageSelector', () => ({
  default: () => <div data-testid="language-selector">Language Selector</div>,
}));

vi.mock('~/routes/manage/settings/components/UserInfoModal', () => ({
  UserInfoModal: () => <div data-testid="user-info-modal">User Info Modal</div>,
}));

vi.mock('~/components/ReportIssueButton', () => ({
  ReportIssueButton: () => <div data-testid="report-issue-button">Report Issue</div>,
}));

const mockUseManageAuthStore = vi.hoisted(() => vi.fn());
const mockUseFeatureFlagEnabled = vi.hoisted(() => vi.fn());

vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: mockUseManageAuthStore,
}));

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: mockUseFeatureFlagEnabled,
}));

describe('ManageSidebarLayout - Settings Menu Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for useManageAuthStore
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = {
        name: 'Test User',
        role: 'user',
        email: 'test@example.com',
        teams: [],
        company: { name: 'Test Company' },
      };
      return selector(state);
    });
  });

  describe('when adminSettingsEnabled is true', () => {
    beforeEach(() => {
      mockUseFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === 'admin-settings') return true;
        if (flag === 'self-serve') return false;
        return false;
      });
    });

    it('should show Settings menu for superadmin role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Super Admin',
          role: 'superadmin',
          email: 'superadmin@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).toBeInTheDocument();
    });

    it('should show Settings menu for admin role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).toBeInTheDocument();
    });

    it('should NOT show Settings menu for regular user role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Regular User',
          role: 'user',
          email: 'user@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).not.toBeInTheDocument();
    });

    it('should NOT show Settings menu for regular user role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Another User',
          role: 'user',
          email: 'anotheruser@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).not.toBeInTheDocument();
    });
  });

  describe('when adminSettingsEnabled is false', () => {
    beforeEach(() => {
      mockUseFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === 'admin-settings') return false;
        if (flag === 'self-serve') return false;
        return false;
      });
    });

    it('should NOT show Settings menu even for superadmin role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Super Admin',
          role: 'superadmin',
          email: 'superadmin@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).not.toBeInTheDocument();
    });

    it('should NOT show Settings menu even for admin role', () => {
      mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
        const state = {
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com',
          teams: [],
          company: { name: 'Test Company' },
        };
        return selector(state);
      });

      render(<ManageSidebarLayout />);

      const settingsLink = screen.queryByTestId('navlink-/manage/settings');
      expect(settingsLink).not.toBeInTheDocument();
    });
  });

  describe('baseline navigation items', () => {
    beforeEach(() => {
      mockUseFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === 'admin-settings') return false;
        if (flag === 'self-serve') return false;
        return false;
      });
    });

    it('should always show Dashboard menu item', () => {
      render(<ManageSidebarLayout />);

      const dashboardLink = screen.getByTestId('navlink-/manage/dashboard');
      expect(dashboardLink).toBeInTheDocument();
    });

    it('should always show Users menu item', () => {
      render(<ManageSidebarLayout />);

      const usersLink = screen.getByTestId('navlink-/manage/users');
      expect(usersLink).toBeInTheDocument();
    });
  });

  describe('Superadmin-only menus (Roleplay, Persona, Product, Scorecard)', () => {
    describe('when selfserveEnabled is true', () => {
      beforeEach(() => {
        mockUseFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === 'admin-settings') return false;
          if (flag === 'self-serve') return true;
          return false;
        });
      });

      it('should show all superadmin menus for superadmin role', () => {
        mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            name: 'Super Admin',
            role: 'superadmin',
            email: 'superadmin@example.com',
            teams: [],
            company: { name: 'Test Company' },
          };
          return selector(state);
        });

        render(<ManageSidebarLayout />);

        expect(screen.getByTestId('navlink-/manage/scenario')).toBeInTheDocument();
        expect(screen.getByTestId('navlink-/manage/persona')).toBeInTheDocument();
        expect(screen.getByTestId('navlink-/manage/products')).toBeInTheDocument();
        expect(screen.getByTestId('navlink-/manage/scorecard')).toBeInTheDocument();
      });

      it('should NOT show superadmin menus for admin role', () => {
        mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            name: 'Admin User',
            role: 'admin',
            email: 'admin@example.com',
            teams: [],
            company: { name: 'Test Company' },
          };
          return selector(state);
        });

        render(<ManageSidebarLayout />);

        expect(screen.queryByTestId('navlink-/manage/scenario')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/persona')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/products')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/scorecard')).not.toBeInTheDocument();
      });

      it('should NOT show superadmin menus for regular user role', () => {
        mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            name: 'Regular User',
            role: 'user',
            email: 'user@example.com',
            teams: [],
            company: { name: 'Test Company' },
          };
          return selector(state);
        });

        render(<ManageSidebarLayout />);

        expect(screen.queryByTestId('navlink-/manage/scenario')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/persona')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/products')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/scorecard')).not.toBeInTheDocument();
      });

      it('should NOT show superadmin menus when role is null', () => {
        mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            name: 'No Role User',
            role: null,
            email: 'norole@example.com',
            teams: [],
            company: { name: 'Test Company' },
          };
          return selector(state);
        });

        render(<ManageSidebarLayout />);

        expect(screen.queryByTestId('navlink-/manage/scenario')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/persona')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/products')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/scorecard')).not.toBeInTheDocument();
      });
    });

    describe('when selfserveEnabled is false', () => {
      beforeEach(() => {
        mockUseFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === 'admin-settings') return false;
          if (flag === 'self-serve') return false;
          return false;
        });
      });

      it('should NOT show superadmin menus even for superadmin role', () => {
        mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
          const state = {
            name: 'Super Admin',
            role: 'superadmin',
            email: 'superadmin@example.com',
            teams: [],
            company: { name: 'Test Company' },
          };
          return selector(state);
        });

        render(<ManageSidebarLayout />);

        expect(screen.queryByTestId('navlink-/manage/scenario')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/persona')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/products')).not.toBeInTheDocument();
        expect(screen.queryByTestId('navlink-/manage/scorecard')).not.toBeInTheDocument();
      });
    });
  });
});
