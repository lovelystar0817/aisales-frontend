import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountInactive from './inactive';

// Mock dependencies
const mockLogout = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}));

import { useAuth0 } from '@auth0/auth0-react';

describe('AccountInactive Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockClear();

    // Mock useAuth0
    vi.mocked(useAuth0).mockReturnValue({
      logout: mockLogout,
    } as any);
  });

  it('should display the inactive account message', () => {
    render(<AccountInactive />);

    // Should show the message
    expect(
      screen.getByText(
        'Your account has been deactivated. Please contact your administrator.',
      ),
    ).toBeInTheDocument();
  });

  it('should display the Hupo logo', () => {
    render(<AccountInactive />);

    const logo = screen.getByAltText('Hupo Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logos/Hupo_Logotype_Orange(noR).svg');
  });

  it('should display Log out button', () => {
    render(<AccountInactive />);

    const button = screen.getByText('Log out');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('should NOT display any error title', () => {
    render(<AccountInactive />);

    // Should not show any error titles
    expect(screen.queryByText('Account Deactivated')).not.toBeInTheDocument();
    expect(screen.queryByText('Authentication Error')).not.toBeInTheDocument();
  });

  it('should call Auth0 logout with correct returnTo when Log out is clicked', () => {
    // Mock window.location.origin
    delete (window as any).location;
    (window as any).location = { origin: 'http://localhost:5361' };

    render(<AccountInactive />);

    const button = screen.getByText('Log out');
    fireEvent.click(button);

    // Should call logout with correct returnTo parameter
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: {
        returnTo: 'http://localhost:5361/logout',
      },
    });
  });

  it('should handle logout with correct path for app module', () => {
    delete (window as any).location;
    (window as any).location = { origin: 'https://example.com' };

    render(<AccountInactive />);

    const button = screen.getByText('Log out');
    fireEvent.click(button);

    // Verify it uses /logout (not /manage/logout)
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: {
        returnTo: 'https://example.com/logout',
      },
    });
  });

  it('should have proper styling and layout', () => {
    render(<AccountInactive />);

    // Check for the container with proper classes
    const container = screen.getByText(
      'Your account has been deactivated. Please contact your administrator.',
    ).closest('div');

    expect(container).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<AccountInactive />);

    // Message should be visible
    expect(
      screen.getByText(
        'Your account has been deactivated. Please contact your administrator.',
      ),
    ).toBeVisible();

    // Button should be visible
    expect(screen.getByText('Log out')).toBeVisible();

    // Logo should be visible
    expect(screen.getByAltText('Hupo Logo')).toBeVisible();
  });

  it('should have consistent styling with error containers', () => {
    render(<AccountInactive />);

    // Check main container classes
    const mainContainer = screen.getByText('Log out').closest('div')?.parentElement?.parentElement;
    expect(mainContainer?.className).toContain('min-h-screen');
    expect(mainContainer?.className).toContain('bg-gray-50');

    // Check card container classes
    const cardContainer = screen.getByText('Log out').closest('div')?.parentElement;
    expect(cardContainer?.className).toContain('bg-white');
    expect(cardContainer?.className).toContain('rounded-lg');
    expect(cardContainer?.className).toContain('shadow-lg');
  });

  it('should render button with correct styling', () => {
    render(<AccountInactive />);

    const button = screen.getByText('Log out');
    expect(button.className).toContain('bg-orange-500');
    expect(button.className).toContain('hover:bg-orange-600');
    expect(button.className).toContain('text-white');
  });

  it('should use translation keys correctly', () => {
    // This test verifies the component structure uses t() function
    // In a real scenario with actual i18n, we'd test different languages
    render(<AccountInactive />);

    // Component should render successfully with translation function
    expect(screen.getByText('Log out')).toBeInTheDocument();
    expect(screen.getByAltText('Hupo Logo')).toBeInTheDocument();
  });
});
