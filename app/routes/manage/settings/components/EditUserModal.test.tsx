import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditUserModal } from './EditUserModal';
import type { ManageUser, FilterOption } from '~/util/api';

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
}));

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
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

describe('EditUserModal', () => {
  const mockTeams: FilterOption[] = [
    { id: 'team-1', name: 'Sales Team' },
    { id: 'team-2', name: 'Marketing Team' },
    { id: 'team-3', name: 'Engineering Team' },
  ];

  const mockUser: ManageUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    teams: [mockTeams[0]],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(
        <EditUserModal
          isOpen={false}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
    });

    it('should not render when user is null', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={null}
          teams={mockTeams}
        />,
      );

      expect(screen.queryByText('Edit user')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true and user is provided', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Edit user')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
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
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const backdrop = screen.getByText('Edit user').parentElement?.parentElement
        ?.parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Form Fields', () => {
    it('should render email field as read-only', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const emailInput = screen.getByDisplayValue('john@example.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('readonly');
    });

    it('should render role dropdown with user role pre-selected', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId(
        'role-dropdown',
      ) as HTMLSelectElement;
      expect(roleDropdown).toBeInTheDocument();
      expect(roleDropdown.value).toBe('user');
    });

    it('should render team dropdown with pre-selected teams', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Sales Team')).toBeInTheDocument();
    });

    it('should populate form with user data on mount', () => {
      const userWithMultipleTeams: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [mockTeams[0], mockTeams[1]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithMultipleTeams}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId(
        'role-dropdown',
      ) as HTMLSelectElement;
      expect(roleDropdown.value).toBe('admin');
      expect(screen.getByText('2 teams selected')).toBeInTheDocument();
    });
  });

  describe('Team Selection - Checkboxes for All Roles', () => {
    it('should show checkboxes for user role', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('should show checkboxes for admin role', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('should show checkboxes for admin role with pre-selected teams', async () => {
      const user = userEvent.setup();
      const adminUserWithTeam: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [mockTeams[0]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUserWithTeam}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
      expect(checkboxes[0]).toBeChecked();
    });

    it('should allow multiple team selection for user role', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // Sales Team already selected

      await user.click(checkboxes[1]); // Select Marketing Team
      await user.click(checkboxes[2]); // Select Engineering Team

      await waitFor(() => {
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).toBeChecked();
      });

      expect(screen.getByText('3 teams selected')).toBeInTheDocument();
    });

    it('should allow multiple team selection for admin role', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Select team(s)');
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

    it('should allow deselecting teams', async () => {
      const user = userEvent.setup();
      const userWithMultipleTeams: ManageUser = {
        ...mockUser,
        teams: [mockTeams[0], mockTeams[1]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithMultipleTeams}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('2 teams selected');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();

      await user.click(checkboxes[0]); // Deselect Sales Team

      await waitFor(() => {
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });

      expect(screen.getAllByText('Marketing Team').length).toBeGreaterThan(0);
    });

    it('should display single team name when one team is selected', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Sales Team')).toBeInTheDocument();
    });

    it('should keep dropdown open after selecting teams', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Marketing Team

      await waitFor(() => {
        expect(checkboxes[1]).toBeChecked();
      });

      // Dropdown should still be open
      expect(screen.getByText('Sales Team')).toBeInTheDocument();
      expect(screen.getByText('Marketing Team')).toBeInTheDocument();
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    });
  });

  describe('Role Change Behavior', () => {
    it('should allow changing role while keeping teams', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      expect(screen.getByText('Sales Team')).toBeInTheDocument();
    });

    it('should maintain selected teams when switching between non-superadmin roles', async () => {
      const user = userEvent.setup();
      const userWithMultipleTeams: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [mockTeams[0], mockTeams[1]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithMultipleTeams}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('2 teams selected')).toBeInTheDocument();

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(screen.getByText('2 teams selected')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with updated data', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Marketing Team

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          role: 'admin',
          teamIds: ['team-1', 'team-2'],
        });
      });
    });

    it('should submit form with single team when form is dirty', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      // Make form dirty by changing role
      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      // Revert role to original to test only team data
      await user.selectOptions(roleDropdown, 'user');

      // Button should still be disabled as no real change
      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Now make a real change by changing role again
      await user.selectOptions(roleDropdown, 'admin');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          role: 'admin',
          teamIds: ['team-1'],
        });
      });
    });

    it('should submit form with no teams when form is dirty', async () => {
      const user = userEvent.setup();
      const userWithNoTeams: ManageUser = {
        ...mockUser,
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithNoTeams}
          teams={mockTeams}
        />,
      );

      // Make form dirty by changing role
      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          role: 'admin',
          teamIds: [],
        });
      });
    });
  });

  describe('Form Dirty State', () => {
    it('should disable submit button when form is not dirty (no changes)', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when role is changed', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should enable submit button when a team is added', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Marketing Team

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should enable submit button when a team is removed', async () => {
      const user = userEvent.setup();
      const userWithMultipleTeams: ManageUser = {
        ...mockUser,
        teams: [mockTeams[0], mockTeams[1]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithMultipleTeams}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const teamButton = screen.getByText('2 teams selected');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Deselect Sales Team

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable submit button when changes are reverted to original state', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Change role
      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Revert role back to original
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when both role and teams are changed', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Change role
      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      // Add a team
      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select Marketing Team

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should handle form dirty state when user has no initial teams', async () => {
      const user = userEvent.setup();
      const userWithNoTeams: ManageUser = {
        ...mockUser,
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithNoTeams}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Add a team
      const teamButton = screen.getByText('Select team(s)');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select Sales Team

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Remove the team
      await user.click(checkboxes[0]); // Deselect Sales Team

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle team selection order (order-independent comparison)', async () => {
      const user = userEvent.setup();
      const userWithTwoTeams: ManageUser = {
        ...mockUser,
        teams: [mockTeams[0], mockTeams[1]], // team-1, team-2
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithTwoTeams}
          teams={mockTeams}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Remove team-1 and add team-2 (which is already selected)
      const teamButton = screen.getByText('2 teams selected');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');

      // Deselect team-1
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Re-select team-1 (should return to original state)
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Manage All Teams - Admin Role', () => {
    it('should show "Manage all teams" option when admin role is selected', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      expect(screen.getByText('Manage all teams')).toBeInTheDocument();
    });

    it('should not show "Manage all teams" option when user role is selected', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      expect(screen.queryByText('Manage all teams')).not.toBeInTheDocument();
    });


    it('should select all teams when "Manage all teams" is clicked', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const manageAllTeamsButton = screen.getByText('Manage all teams');
      await user.click(manageAllTeamsButton);

      await waitFor(() => {
        expect(screen.getByText('3 teams selected')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should check all teams when "Manage all teams" is clicked even if some teams were already selected', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [mockTeams[0]],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();

      const manageAllTeamsButton = screen.getByText('Manage all teams');
      await user.click(manageAllTeamsButton);

      await waitFor(() => {
        expect(screen.getByText('3 teams selected')).toBeInTheDocument();
      });

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should submit form with all teams when "Manage all teams" is clicked', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Select team(s)');
      await user.click(teamButton);

      const manageAllTeamsButton = screen.getByText('Manage all teams');
      await user.click(manageAllTeamsButton);

      await waitFor(() => {
        expect(screen.getByText('3 teams selected')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          role: 'admin',
          teamIds: ['team-1', 'team-2', 'team-3'],
        });
      });
    });

    it('should show "Manage all teams" option when switching to admin role', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      let teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      expect(screen.queryByText('Manage all teams')).not.toBeInTheDocument();

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      // Reopen dropdown after role change
      teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      await waitFor(() => {
        expect(screen.getByText('Manage all teams')).toBeInTheDocument();
      });
    });

    it('should hide "Manage all teams" option when switching from admin to user role', async () => {
      const user = userEvent.setup();
      const adminUser: ManageUser = {
        ...mockUser,
        role: 'admin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={adminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      expect(screen.getByText('Manage all teams')).toBeInTheDocument();

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(screen.queryByText('Manage all teams')).not.toBeInTheDocument();
      });
    });
  });

  describe('Superadmin Special Behavior', () => {
    it('should auto-select all teams when superadmin role is selected', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });
    });

    it('should disable team selection for superadmin', async () => {
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByRole('button', {
        name: /All teams/i,
      });
      expect(teamButton).toBeDisabled();
    });

    it('should not open dropdown when clicking disabled superadmin team button', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = await screen.findByText('All teams');
      await user.click(teamButton);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should auto-select all teams when changing role to superadmin', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });
    });

    it('should not allow team deselection for superadmin', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByRole('button', {
        name: /All teams/i,
      });

      expect(teamButton).toBeDisabled();

      await user.click(teamButton);

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should submit form with empty teamIds array for superadmin', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'user',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'superadmin');

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          role: 'superadmin',
          teamIds: [],
        });
      });
    });

    it('should clear teams when changing from superadmin to user role', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'user');

      await waitFor(() => {
        expect(screen.getByText('Select team(s)')).toBeInTheDocument();
      });
    });

    it('should clear teams when changing from superadmin to admin role', async () => {
      const user = userEvent.setup();
      const superadminUser: ManageUser = {
        ...mockUser,
        role: 'superadmin',
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={superadminUser}
          teams={mockTeams}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('All teams')).toBeInTheDocument();
      });

      const roleDropdown = screen.getByTestId('role-dropdown');
      await user.selectOptions(roleDropdown, 'admin');

      await waitFor(() => {
        expect(screen.getByText('Select team(s)')).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset on User Change', () => {
    it('should update form when user prop changes', () => {
      const { rerender } = render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      expect(screen.getByText('Sales Team')).toBeInTheDocument();

      const newUser: ManageUser = {
        ...mockUser,
        id: 'user-2',
        role: 'admin',
        teams: [mockTeams[1], mockTeams[2]],
      };

      rerender(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={newUser}
          teams={mockTeams}
        />,
      );

      const roleDropdown = screen.getByTestId(
        'role-dropdown',
      ) as HTMLSelectElement;
      expect(roleDropdown.value).toBe('admin');
      expect(screen.getByText('2 teams selected')).toBeInTheDocument();
    });
  });

  describe('Empty Teams', () => {
    it('should show "No teams available" when teams is undefined', () => {
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={undefined}
        />,
      );

      expect(screen.getByText('No teams available')).toBeInTheDocument();
    });

    it('should show "No teams available" when teams is empty', async () => {
      const user = userEvent.setup();
      const userWithNoTeams: ManageUser = {
        ...mockUser,
        teams: [],
      };

      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={userWithNoTeams}
          teams={[]}
        />,
      );

      const teamButton = screen.getByText('Select team(s)');
      await user.click(teamButton);

      expect(screen.getByText('No teams available')).toBeInTheDocument();
    });
  });

  describe('Close Dropdown on Outside Click', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <EditUserModal
          isOpen={true}
          onClose={mockOnClose}
          user={mockUser}
          teams={mockTeams}
        />,
      );

      const teamButton = screen.getByText('Sales Team');
      await user.click(teamButton);

      expect(screen.getByText('Marketing Team')).toBeInTheDocument();
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();

      const emailInput = screen.getByDisplayValue('john@example.com');
      await user.click(emailInput);

      await waitFor(() => {
        expect(screen.queryByText('Marketing Team')).not.toBeInTheDocument();
        expect(screen.queryByText('Engineering Team')).not.toBeInTheDocument();
      });
    });
  });
});
