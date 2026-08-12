import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamsTable } from './TeamsTable';
import type { TeamsResponse, Team } from '~/util/api';

interface ActionItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

vi.mock('./components/ActionDropdown', () => ({
  ActionDropdown: ({ actions }: { actions: ActionItem[] }) => {
    return (
      <div data-testid="action-dropdown">
        {actions.map((action, index) => (
          <button
            key={index}
            data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  },
}));

describe('TeamsTable - User Role Permissions', () => {
  const mockOnViewTeam = vi.fn();
  const mockOnEditTeam = vi.fn();

  const mockRegularTeam: Team = {
    id: 'team-1',
    name: 'Engineering Team',
    userCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockNoTeam: Team = {
    id: 'no-team',
    name: 'No Team',
    userCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTeamsData: TeamsResponse = {
    teams: [mockRegularTeam, mockNoTeam],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalTeams: 2,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when userRole is superadmin', () => {
    it('should show ActionDropdown with both View team and Edit team actions', () => {
      render(
        <TeamsTable
          data={mockTeamsData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const actionDropdowns = screen.getAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(2);

      const viewTeamButtons = screen.getAllByTestId('action-view-team');
      expect(viewTeamButtons).toHaveLength(2);

      const editTeamButtons = screen.getAllByTestId('action-edit-team');
      expect(editTeamButtons).toHaveLength(2);
    });

    it('should have View team action that calls onViewTeam callback', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const viewButton = screen.getByTestId('action-view-team');
      viewButton.click();

      expect(mockOnViewTeam).toHaveBeenCalledWith(mockRegularTeam);
      expect(mockOnViewTeam).toHaveBeenCalledTimes(1);
    });

    it('should have Edit team action that calls onEditTeam callback', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const editButton = screen.getByTestId('action-edit-team');
      editButton.click();

      expect(mockOnEditTeam).toHaveBeenCalledWith(mockRegularTeam);
      expect(mockOnEditTeam).toHaveBeenCalledTimes(1);
    });

    it('should enable Edit team action for regular teams', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const editButton = screen.getByTestId('action-edit-team');
      expect(editButton).not.toBeDisabled();
    });

    it('should disable Edit team action when team.id is "no-team"', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockNoTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const editButton = screen.getByTestId('action-edit-team');
      expect(editButton).toBeDisabled();
    });
  });

  describe('when userRole is admin', () => {
    it('should show ActionDropdown with only View team action', () => {
      render(
        <TeamsTable
          data={mockTeamsData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="admin"
        />,
      );

      const actionDropdowns = screen.getAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(2);

      const viewTeamButtons = screen.getAllByTestId('action-view-team');
      expect(viewTeamButtons).toHaveLength(2);

      const editTeamButtons = screen.queryAllByTestId('action-edit-team');
      expect(editTeamButtons).toHaveLength(0);
    });

    it('should have View team action that calls onViewTeam callback', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="admin"
        />,
      );

      const viewButton = screen.getByTestId('action-view-team');
      viewButton.click();

      expect(mockOnViewTeam).toHaveBeenCalledWith(mockRegularTeam);
      expect(mockOnViewTeam).toHaveBeenCalledTimes(1);
    });

    it('should not call onEditTeam since Edit team action is not available', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="admin"
        />,
      );

      expect(mockOnEditTeam).not.toHaveBeenCalled();
    });
  });

  describe('when userRole is manager', () => {
    it('should show ActionDropdown with only View team action', () => {
      render(
        <TeamsTable
          data={mockTeamsData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="manager"
        />,
      );

      const viewTeamButtons = screen.getAllByTestId('action-view-team');
      expect(viewTeamButtons).toHaveLength(2);

      const editTeamButtons = screen.queryAllByTestId('action-edit-team');
      expect(editTeamButtons).toHaveLength(0);
    });
  });

  describe('when userRole is user', () => {
    it('should show ActionDropdown with only View team action', () => {
      render(
        <TeamsTable
          data={mockTeamsData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="user"
        />,
      );

      const viewTeamButtons = screen.getAllByTestId('action-view-team');
      expect(viewTeamButtons).toHaveLength(2);

      const editTeamButtons = screen.queryAllByTestId('action-edit-team');
      expect(editTeamButtons).toHaveLength(0);
    });
  });

  describe('when userRole is null', () => {
    it('should show ActionDropdown with only View team action', () => {
      render(
        <TeamsTable
          data={mockTeamsData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole={null}
        />,
      );

      const viewTeamButtons = screen.getAllByTestId('action-view-team');
      expect(viewTeamButtons).toHaveLength(2);

      const editTeamButtons = screen.queryAllByTestId('action-edit-team');
      expect(editTeamButtons).toHaveLength(0);
    });
  });

  describe('empty state', () => {
    it('should show empty state message when no teams', () => {
      const emptyData: TeamsResponse = {
        teams: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTeams: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <TeamsTable
          data={emptyData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      expect(screen.getByText('No teams found')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first team to get started'),
      ).toBeInTheDocument();
    });

    it('should NOT show ActionDropdown in empty state', () => {
      const emptyData: TeamsResponse = {
        teams: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalTeams: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      render(
        <TeamsTable
          data={emptyData}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      const actionDropdowns = screen.queryAllByTestId('action-dropdown');
      expect(actionDropdowns).toHaveLength(0);
    });
  });

  describe('team information display', () => {
    it('should display team name correctly', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
    });

    it('should display user count with singular form', () => {
      const singleUserTeam: Team = {
        id: 'team-2',
        name: 'Design Team',
        userCount: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      render(
        <TeamsTable
          data={{
            teams: [singleUserTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      expect(screen.getByText('1 user')).toBeInTheDocument();
    });

    it('should display user count with plural form', () => {
      render(
        <TeamsTable
          data={{
            teams: [mockRegularTeam],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalTeams: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }}
          onViewTeam={mockOnViewTeam}
          onEditTeam={mockOnEditTeam}
          userRole="superadmin"
        />,
      );

      expect(screen.getByText('5 users')).toBeInTheDocument();
    });
  });
});
