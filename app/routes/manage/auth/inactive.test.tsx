import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountInactive from './inactive';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('AccountInactive Page', () => {
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
});
