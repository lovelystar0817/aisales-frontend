import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { UsersTable } from './UsersTable';
import type { ManageUsersResponse, ManageUser } from '~/util/api';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('./components/ActionDropdown', () => ({
  ActionDropdown: ({
    trigger,
    actions,
  }: {
    trigger: React.ReactNode;
    actions: Array<{ label: string; onClick: () => void; disabled?: boolean }>;
  }) => (
    <div data-testid="action-dropdown">
      {trigger}
      <div data-testid="actions">
        {actions.map((action, index) => (
          <button
            key={index}
            data-testid={`action-${index}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  ),
}));

vi.mock('./components/DeactivateUserModal', () => ({
  DeactivateUserModal: () => null,
}));

vi.mock('./components/ReactivateUserModal', () => ({
  ReactivateUserModal: () => null,
}));

describe('UsersTable - ActionDropdown Visibility', () => {
  const mockOnEditUser = vi.fn();

  const mockActiveUser: ManageUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockInactiveUser: ManageUser = {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'inactive',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockUsersData: ManageUsersResponse = {
    users: [mockActiveUser, mockInactiveUser],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalUsers: 2,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when userRole is superadmin', () => {
    it('should show ActionDropdown for each user', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actionDropdowns = screen.getAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(2);
    });

    it('should enable button for active users', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const rows = screen.getAllByRole('row');
      const activeUserRow = rows[1]; // First data row (index 0 is header)

      const buttons = within(activeUserRow).getAllByRole('button');
      const triggerButton = buttons.find(
        (btn) => btn.className.includes('rounded-md'),
      );
      expect(triggerButton).not.toBeDisabled();
    });

    it('should enable button for inactive users (for reactivation)', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const rows = screen.getAllByRole('row');
      const inactiveUserRow = rows[2]; // Second data row

      const buttons = within(inactiveUserRow).getAllByRole('button');
      const triggerButton = buttons.find(
        (btn) => btn.className.includes('rounded-md'),
      );
      expect(triggerButton).not.toBeDisabled();
    });
  });

  describe('when userRole is admin', () => {
    it('should NOT show ActionDropdown', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="admin"
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });

  describe('when userRole is manager', () => {
    it('should NOT show ActionDropdown', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="manager"
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });

  describe('when userRole is user', () => {
    it('should NOT show ActionDropdown', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole="user"
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });

  describe('when userRole is null', () => {
    it('should NOT show ActionDropdown', () => {
      render(
        <UsersTable
          data={mockUsersData}
          onEditUser={mockOnEditUser}
          userRole={null}
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });

  describe('getUserActions based on user status', () => {
    it('should show "Edit User" action for active users', () => {
      const mockData: ManageUsersResponse = {
        users: [mockActiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const actionButtons = within(actions).getAllByRole('button');

      // Should have 2 actions: Edit User and Deactivate user
      expect(actionButtons).toHaveLength(2);
      expect(actionButtons[0]).toHaveTextContent('Edit User');
      expect(actionButtons[1]).toHaveTextContent('Deactivate user');
    });

    it('should NOT show "Edit User" action for invited users', () => {
      const mockInvitedUser: ManageUser = {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'user',
        status: 'invited',
        teams: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockData: ManageUsersResponse = {
        users: [mockInvitedUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const actionButtons = within(actions).getAllByRole('button');

      // Should have only 1 action: Deactivate user (no Edit User)
      expect(actionButtons).toHaveLength(1);
      expect(actionButtons[0]).toHaveTextContent('Deactivate user');
      expect(
        within(actions).queryByText('Edit User'),
      ).not.toBeInTheDocument();
    });

    it('should show "Reactivate user" action for inactive users instead of "Edit User" or "Deactivate user"', () => {
      const mockData: ManageUsersResponse = {
        users: [mockInactiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const actionButtons = within(actions).getAllByRole('button');

      // Should have only 1 action: Reactivate user (no Edit User or Deactivate user)
      expect(actionButtons).toHaveLength(1);
      expect(actionButtons[0]).toHaveTextContent('Reactivate user');
      expect(
        within(actions).queryByText('Edit User'),
      ).not.toBeInTheDocument();
      expect(
        within(actions).queryByText('Deactivate user'),
      ).not.toBeInTheDocument();
    });

    it('should call onEditUser when Edit User is clicked for active users', () => {
      const mockData: ManageUsersResponse = {
        users: [mockActiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const editButton = within(actions).getByText('Edit User');

      editButton.click();

      expect(mockOnEditUser).toHaveBeenCalledWith(mockActiveUser);
      expect(mockOnEditUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('reactivate user functionality', () => {
    it('should show "Reactivate user" action for inactive users', () => {
      const mockData: ManageUsersResponse = {
        users: [mockInactiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const reactivateButton = within(actions).getByText('Reactivate user');

      expect(reactivateButton).toBeInTheDocument();
    });

    it('should NOT show "Reactivate user" action for active users', () => {
      const mockData: ManageUsersResponse = {
        users: [mockActiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');

      expect(
        within(actions).queryByText('Reactivate user'),
      ).not.toBeInTheDocument();
      expect(within(actions).getByText('Edit User')).toBeInTheDocument();
      expect(within(actions).getByText('Deactivate user')).toBeInTheDocument();
    });

    it('should NOT show "Reactivate user" action for invited users', () => {
      const mockInvitedUser: ManageUser = {
        id: '3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'user',
        status: 'invited',
        teams: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const mockData: ManageUsersResponse = {
        users: [mockInvitedUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');

      expect(
        within(actions).queryByText('Reactivate user'),
      ).not.toBeInTheDocument();
      expect(within(actions).getByText('Deactivate user')).toBeInTheDocument();
    });

    it('should have correct button for inactive users (enabled, not disabled)', () => {
      const mockData: ManageUsersResponse = {
        users: [mockInactiveUser],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 1,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={mockData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actions = screen.getByTestId('actions');
      const reactivateButton = within(actions).getByText('Reactivate user');

      expect(reactivateButton).not.toBeDisabled();
    });
  });

  describe('empty state', () => {
    it('should show empty state message when no users', () => {
      const emptyData: ManageUsersResponse = {
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalUsers: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={emptyData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your search or filters'),
      ).toBeInTheDocument();
    });

    it('should NOT show ActionDropdown in empty state', () => {
      const emptyData: ManageUsersResponse = {
        users: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalUsers: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <UsersTable
          data={emptyData}
          onEditUser={mockOnEditUser}
          userRole="superadmin"
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });
});
