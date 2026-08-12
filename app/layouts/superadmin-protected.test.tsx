import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SuperadminProtected from './superadmin-protected';

const mockUseManageAuthStore = vi.hoisted(() => vi.fn());

vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: mockUseManageAuthStore,
}));

vi.mock('react-router', () => ({
  Navigate: ({ to, replace }: { to: string; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
  Outlet: () => <div data-testid="outlet">Protected Content</div>,
}));

describe('SuperadminProtected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Outlet for superadmin role', () => {
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = { role: 'superadmin' };
      return selector(state);
    });

    render(<SuperadminProtected />);

    const outlet = screen.queryByTestId('outlet');
    const navigate = screen.queryByTestId('navigate');

    expect(outlet).toBeInTheDocument();
    expect(navigate).not.toBeInTheDocument();
  });

  it('should redirect to dashboard for admin role', () => {
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = { role: 'admin' };
      return selector(state);
    });

    render(<SuperadminProtected />);

    const outlet = screen.queryByTestId('outlet');
    const navigate = screen.queryByTestId('navigate');

    expect(outlet).not.toBeInTheDocument();
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', '/manage/dashboard');
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });

  it('should redirect to dashboard for user role', () => {
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = { role: 'user' };
      return selector(state);
    });

    render(<SuperadminProtected />);

    const outlet = screen.queryByTestId('outlet');
    const navigate = screen.queryByTestId('navigate');

    expect(outlet).not.toBeInTheDocument();
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', '/manage/dashboard');
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });

  it('should redirect to dashboard when role is null', () => {
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = { role: null };
      return selector(state);
    });

    render(<SuperadminProtected />);

    const outlet = screen.queryByTestId('outlet');
    const navigate = screen.queryByTestId('navigate');

    expect(outlet).not.toBeInTheDocument();
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', '/manage/dashboard');
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });

  it('should redirect to dashboard when role is undefined', () => {
    mockUseManageAuthStore.mockImplementation((selector: (state: any) => any) => {
      const state = { role: undefined };
      return selector(state);
    });

    render(<SuperadminProtected />);

    const outlet = screen.queryByTestId('outlet');
    const navigate = screen.queryByTestId('navigate');

    expect(outlet).not.toBeInTheDocument();
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', '/manage/dashboard');
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });
});
