import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteUserModal } from './InviteUserModal';
import type { FilterOption } from '~/util/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockMutate = vi.fn();
const mockReset = vi.fn();
const mockInvalidateQueries = vi.fn();

let mockMutationError: any = null;
let mockMutationIsPending = false;

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    isPending: mockMutationIsPending,
    error: mockMutationError,
    reset: mockReset,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock('~/components/CustomDropdown', () => ({
  CustomDropdown: ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder: string;
  }) => (
    <select
      data-testid="role-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../settings', () => ({
  FILTER_ROLES: [
    { id: 'all', name: 'All' },
    { id: 'superadmin', name: 'Superadmin', description: 'Full access' },
    { id: 'admin', name: 'Admin', description: 'Admin access' },
    { id: 'manager', name: 'Manager', description: 'Manager access' },
    { id: 'user', name: 'User', description: 'User access' },
  ],
}));

describe('InviteUserModal', () => {
  const mockTeams: FilterOption[] = [
    { id: 'team-1', name: 'Sales Team' },
    { id: 'team-2', name: 'Marketing Team' },
    { id: 'team-3', name: 'Engineering Team' },
  ];

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationError = null;
    mockMutationIsPending = false;
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <InviteUserModal
          isOpen={false}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(screen.queryByText('Invite user')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Invite user')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const closeButton = screen.getByRole('button', { name: '' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const backdrop = screen.getByText('Invite user').parentElement
        ?.parentElement?.parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Form Fields', () => {
    it('should render email input field', () => {
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should render role dropdown', () => {
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      expect(roleDropdown).toBeInTheDocument();
    });

    it('should not show team dropdown before role is selected', () => {
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(screen.queryByText('Select team(s)')).not.toBeInTheDocument();
    });

    it('should show team dropdown after role is selected', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(screen.getByText('Select team(s)')).toBeInTheDocument();
      });
    });
  });

  describe('Team Selection - Checkboxes for All Roles', () => {
    it('should show checkboxes for user role', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('should show checkboxes for admin role', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('should show checkboxes for superadmin role (before auto-selection)', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={[]}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      expect(screen.getByText('No teams available')).toBeInTheDocument();
    });

    it('should allow multiple team selection for user role', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();
      });

      expect(screen.getByText('2 teams selected')).toBeInTheDocument();
    });

    it('should allow multiple team selection for admin role', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).toBeChecked();
      });

      expect(screen.getByText('3 teams selected')).toBeInTheDocument();
    });

    it('should allow deselecting teams', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });

      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });

      expect(screen.getAllByText('Marketing Team').length).toBeGreaterThan(0);
    });

    it('should display single team name when one team is selected', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
      });

      expect(screen.getAllByText('Sales Team').length).toBeGreaterThan(0);
    });

    it('should keep dropdown open after selecting teams', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
      });

      expect(screen.getAllByText('Sales Team').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Marketing Team').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Engineering Team').length).toBeGreaterThan(
        0,
      );
    });
  });

  describe('Superadmin Special Behavior', () => {
    it('should auto-select all teams when superadmin is selected', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });
    });

    it('should disable team selection for superadmin', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      await waitFor(() => {
        const teamButton = screen.getByRole('button', {
          name: /All teams/i,
        });
        expect(teamButton).toBeDisabled();
      });
    });

    it('should not open dropdown when clicking disabled superadmin team button', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      const teamButton = await screen.findByText('All teams');
      await user.click(teamButton);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'test@example.com');

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const submitButton = screen.getByText('Invite');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          role: 'user',
          teamIds: ['team-1'],
        });
      });
    });

    it('should submit form with multiple teams', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'test@example.com');

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      const submitButton = screen.getByText('Invite');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          role: 'admin',
          teamIds: ['team-1', 'team-3'],
        });
      });
    });

    it('should disable submit button when email is empty', () => {
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Invite');
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when role is not selected', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByText('Invite');
      expect(submitButton).toBeDisabled();
    });

    it('should submit form without teams (optional)', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'test@example.com');

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const submitButton = screen.getByText('Invite');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          role: 'user',
          teamIds: [],
        });
      });
    });

    it('should submit form with empty teamIds array for superadmin', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText('Enter email address');
      await user.type(emailInput, 'test@example.com');

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Invite');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          role: 'superadmin',
          teamIds: [],
        });
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal opens', async () => {
      const { rerender } = render(
        <InviteUserModal
          isOpen={false}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      rerender(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByPlaceholderText(
        'Enter email address',
      ) as HTMLInputElement;
      const roleDropdown = screen.getByTestId(
        'role-dropdown',
      ) as HTMLSelectElement;

      expect(emailInput.value).toBe('');
      expect(roleDropdown.value).toBe('');
    });
  });

  describe('Empty Teams', () => {
    it('should show "No teams available" when teams is undefined', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={undefined}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(screen.getByText('No teams available')).toBeInTheDocument();
      });
    });

    it('should show "No teams available" when teams is empty', async () => {
      const user = userEvent.setup();
      render(
        <InviteUserModal isOpen={true} onClose={mockOnClose} teams={[]} />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      const teamButton = await screen.findByText('Select team(s)');
      await user.click(teamButton);

      expect(screen.getByText('No teams available')).toBeInTheDocument();
    });
  });


  describe('Error Handling and Clearing', () => {
    it('should clear error messages when modal is closed and reopened', async () => {
      mockMutationError = {
        json: { userExists: true },
      };

      const { rerender } = render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(
        screen.getByText(
          'This email belongs to an existing user (including deactivated accounts). Please update their details in the existing record.',
        ),
      ).toBeInTheDocument();

      rerender(
        <InviteUserModal
          isOpen={false}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      rerender(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(mockReset).toHaveBeenCalled();
    });

    it('should reset mutation state when modal opens', async () => {
      const { rerender } = render(
        <InviteUserModal
          isOpen={false}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      rerender(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(mockReset).toHaveBeenCalled();
    });

    it('should display userExists error message when present', async () => {
      mockMutationError = {
        json: { userExists: true },
      };

      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(
        screen.getByText(
          'This email belongs to an existing user (including deactivated accounts). Please update their details in the existing record.',
        ),
      ).toBeInTheDocument();
    });

    it('should display generic error message when userExists is false', async () => {
      mockMutationError = {
        json: { error: 'Something went wrong', userExists: false },
      };

      render(
        <InviteUserModal
          isOpen={true}
          onClose={mockOnClose}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.queryByText(
          'This email belongs to an existing user (including deactivated accounts). Please update their details in the existing record.',
        ),
      ).not.toBeInTheDocument();
    });
  });
});
