import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactivateUserModal } from './ReactivateUserModal';

describe('ReactivateUserModal', () => {
  const mockOnReactivate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when modal is closed', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ReactivateUserModal
          isOpen={false}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.queryByText('Reactivate user?')).not.toBeInTheDocument();
    });
  });

  describe('when modal is open', () => {
    it('should render modal with correct title', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText('Reactivate user?')).toBeInTheDocument();
    });

    it('should render correct description text', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      expect(
        screen.getByText(
          'Reactivating this user will restore their previous roles and access to Hupo AI.',
        ),
      ).toBeInTheDocument();
    });

    it('should render Reactivate button', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivate',
      });
      expect(reactivateButton).toBeInTheDocument();
    });

    it('should have Reactivate button with correct color', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivate',
      });
      expect(reactivateButton).toHaveStyle({ backgroundColor: '#FF4B0A' });
    });

    it('should render close button (X icon)', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      const closeButtons = screen.getAllByRole('button');
      // Find the close button (not the Reactivate button)
      const closeButton = closeButtons.find(
        (btn) => !btn.textContent?.includes('Reactivate'),
      );

      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onReactivate when Reactivate button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivate',
      });
      await user.click(reactivateButton);

      expect(mockOnReactivate).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when close button (X icon) is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(
        (btn) => !btn.textContent?.includes('Reactivate'),
      );

      if (closeButton) {
        await user.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnReactivate).not.toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
        />,
      );

      // The backdrop has onClick={onClose}
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnReactivate).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show "Reactivating..." when isLoading is true', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
          isLoading={true}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivating...',
      });
      expect(reactivateButton).toBeInTheDocument();
      expect(reactivateButton).toBeDisabled();
    });

    it('should disable button when isLoading is true', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
          isLoading={true}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivating...',
      });
      expect(reactivateButton).toBeDisabled();
    });

    it('should not disable button when isLoading is false', () => {
      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
          isLoading={false}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivate',
      });
      expect(reactivateButton).not.toBeDisabled();
    });

    it('should not call onReactivate when button is clicked while loading', async () => {
      const user = userEvent.setup();

      render(
        <ReactivateUserModal
          isOpen={true}
          onReactivate={mockOnReactivate}
          onClose={mockOnClose}
          isLoading={true}
        />,
      );

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivating...',
      });
      await user.click(reactivateButton);

      // Should not be called because button is disabled
      expect(mockOnReactivate).not.toHaveBeenCalled();
    });
  });
});
