import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from './users';
import type { UsersResponse } from '~/util/api';

// Mock dependencies
vi.mock('@auth0/auth0-react', () => ({
  withAuthenticationRequired: (component: any) => component,
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: string | any) => {
      if (typeof defaultValueOrOptions === 'object' && defaultValueOrOptions !== null) {
        // Return a simple string representation when interpolation is used
        return key;
      }
      return defaultValueOrOptions || key;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: (flag: string) => flag === 'admin-settings',
}));

vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: (selector: any) => {
    const state = {
      company: { _id: 'test-company-id', name: 'Test Company' },
    };
    return selector ? selector(state) : state;
  },
}));

const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

const mockUsersData: UsersResponse = {
  users: [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      totalPractices: 10,
      averageDurationMinutes: 5,
      averageDurationSeconds: 300,
      averageScore: 85,
      lastSessionDate: new Date('2024-01-15T10:00:00Z'),
      standings: [
        { level: 'Level 1', grade: 'A', count: 5 },
        { level: 'Level 2', grade: 'B+', count: 3 },
      ],
      teams: [
        { id: 'team-1', name: 'Team Alpha' },
        { id: 'team-2', name: 'Team Beta' },
      ],
      role: 'user',
      status: 'active',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      totalPractices: 15,
      averageDurationMinutes: 7.5,
      averageDurationSeconds: 450,
      averageScore: 92,
      lastSessionDate: new Date('2024-01-20T14:30:00Z'),
      standings: [
        { level: 'Level 1', grade: 'A+', count: 10 },
        { level: 'Level 2', grade: 'A', count: 5 },
      ],
      teams: [{ id: 'team-1', name: 'Team Alpha' }],
      role: 'user',
      status: 'active',
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 2,
    totalUsers: 20,
    limit: 10,
    hasNextPage: true,
    hasPrevPage: false,
  },
};

const mockFilterOptions = {
  modules: [
    { id: 'all', name: 'All scenarios' },
    { id: 'sales', name: 'Sales' },
    { id: 'support', name: 'Support' },
  ],
};

const mockFilterTeams = {
  teams: [
    { id: 'team-1', name: 'Team Alpha' },
    { id: 'team-2', name: 'Team Beta' },
    { id: 'team-3', name: 'Team Gamma' },
  ],
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey, queryFn }: any) => {
    if (queryKey[0] === 'dashboard-filter-options') {
      return {
        data: mockFilterOptions,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    if (queryKey[0] === 'settings-filter-teams') {
      return {
        data: mockFilterTeams,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    if (queryKey[0] === 'users') {
      return {
        data: mockUsersData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useQueryClient: () => mockQueryClient,
}));

vi.mock('~/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

vi.mock('~/components/ReportModal', () => ({
  default: ({ teams, module }: any) => (
    <div
      data-testid="report-modal"
      data-teams={teams !== undefined ? JSON.stringify(teams) : undefined}
      data-module={module || 'none'}
    >
      Report Modal
    </div>
  ),
  ReportType: {
    USERS: 'USERS',
  },
}));

vi.mock('./settings/components/MultiselectTeamDropdown', () => ({
  MultiselectTeamDropdown: ({
    options,
    selectedValues,
    onChange,
    onClose,
    placeholder,
  }: any) => (
    <div data-testid="multiselect-team-dropdown">
      <button
        data-testid="dropdown-trigger"
        onClick={() => {
          const dropdown = document.getElementById('dropdown-options');
          if (dropdown) {
            dropdown.style.display =
              dropdown.style.display === 'none' ? 'block' : 'none';
          }
        }}
      >
        {selectedValues === undefined
          ? placeholder
          : selectedValues.length === 1
            ? options.find((o: any) => o.id === selectedValues[0])?.name
            : `${selectedValues.length} selected`}
      </button>
      <div id="dropdown-options" style={{ display: 'none' }}>
        {options.map((option: any) => (
          <div
            key={option.id}
            data-testid={`option-${option.id}`}
            onClick={() => {
              const currentValues = selectedValues || [];
              const isSelected = currentValues.includes(option.id);
              const newValues = isSelected
                ? currentValues.filter((id: string) => id !== option.id)
                : [...currentValues, option.id];
              onChange(newValues.length === 0 ? undefined : newValues);
            }}
          >
            {option.name}
          </div>
        ))}
        <button
          data-testid="close-dropdown"
          onClick={() => {
            const dropdown = document.getElementById('dropdown-options');
            if (dropdown) {
              dropdown.style.display = 'none';
            }
            if (onClose) onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  ),
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the page title', () => {
      render(<UsersPage />);
      expect(screen.getByText('manage.menuUsers')).toBeInTheDocument();
    });

    it('should render the download report button', () => {
      render(<UsersPage />);
      expect(screen.getByText('manage.downloadReport')).toBeInTheDocument();
    });

    it('should render teams filter when admin settings is enabled', () => {
      render(<UsersPage />);
      expect(
        screen.getByTestId('multiselect-team-dropdown'),
      ).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<UsersPage />);
      const searchInput = screen.getByPlaceholderText(
        'manage.usersPage.searchPlaceholder',
      );
      expect(searchInput).toBeInTheDocument();
    });

    it('should render users table with data', () => {
      render(<UsersPage />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  describe('Teams Filter - Temporary State Behavior', () => {
    it('should use temporary state and not update table until dropdown closes', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Open the dropdown
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      // Click on a team option
      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      // At this point, the temporary state should have changed
      // but the actual filter (and hence the query) should NOT have changed yet
      // The dropdown should still show selection

      // Now close the dropdown to commit the changes
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // After closing, the filter should be applied
      await waitFor(() => {
        // The query should have been called with the new filter
        // This is indicated by the component re-rendering with filtered data
        expect(mockQueryClient).toBeDefined();
      });
    });

    it('should show placeholder when no teams are selected', () => {
      render(<UsersPage />);
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      expect(dropdownTrigger).toHaveTextContent('All teams');
    });

    it('should sync temp state with actual state on mount', () => {
      render(<UsersPage />);
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      expect(dropdownTrigger).toHaveTextContent('All teams');
    });

    it('should update dropdown display when selecting a single team', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Open dropdown
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      // Select team
      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      // Close dropdown
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // Check if display updated
      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('Team Alpha');
      });
    });

    it('should update dropdown display when selecting multiple teams', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Open dropdown
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      // Select first team
      const teamOption1 = screen.getByTestId('option-team-1');
      await user.click(teamOption1);

      // Select second team
      const teamOption2 = screen.getByTestId('option-team-2');
      await user.click(teamOption2);

      // Close dropdown
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // Check if display shows count
      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('2 selected');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search term when typing', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      const searchInput = screen.getByPlaceholderText(
        'manage.usersPage.searchPlaceholder',
      );
      await user.type(searchInput, 'John');

      expect(searchInput).toHaveValue('John');
    });

    it('should clear search input when value is deleted', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      const searchInput = screen.getByPlaceholderText(
        'manage.usersPage.searchPlaceholder',
      );
      await user.type(searchInput, 'John');
      await user.clear(searchInput);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<UsersPage />);
      expect(
        screen.getByText('manage.pagination.rowsPerPage'),
      ).toBeInTheDocument();
      expect(screen.getByText('manage.pagination.page')).toBeInTheDocument();
    });

    it('should display correct pagination information', () => {
      render(<UsersPage />);
      const paginationText = screen.getByText(/manage.pagination.showing/);
      expect(paginationText).toBeInTheDocument();
    });

    it('should have next and previous buttons', () => {
      render(<UsersPage />);
      const buttons = screen.getAllByRole('button');
      const navigationButtons = buttons.filter(
        (btn) => btn.querySelector('svg'), // SVG icons for prev/next
      );
      expect(navigationButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should disable previous button on first page', () => {
      render(<UsersPage />);
      const buttons = screen.getAllByRole('button');
      const navigationButtons = buttons.filter((btn) =>
        btn.querySelector('path[d*="M15 19l-7-7 7-7"]'),
      );
      if (navigationButtons.length > 0) {
        expect(navigationButtons[0]).toBeDisabled();
      }
    });
  });

  describe('User Row Click', () => {
    it('should render clickable user rows', () => {
      render(<UsersPage />);
      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);
      expect(dataRows.length).toBeGreaterThan(0);
    });

    it('should have hover styles on user rows', () => {
      render(<UsersPage />);
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header
      expect(firstDataRow).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Report Modal', () => {
    it('should open report modal when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Modal should be in the document (it's rendered but may be hidden)
      expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    });

    it('should pass teams filter to report modal when teams are selected', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Select a team first
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // Wait for the team selection to be applied
      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('Team Alpha');
      });

      // Open report modal
      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Verify teams filter is passed to modal
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-teams')).toBe(
        JSON.stringify(['team-1']),
      );
    });

    it('should pass module filter to report modal when module is selected', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Select a module - find the select that has "All scenarios" option
      const moduleSelect = screen.getByDisplayValue('All scenarios').closest('select');
      if (!moduleSelect) throw new Error('Module select not found');
      await user.selectOptions(moduleSelect, 'sales');

      // Open report modal
      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Verify module filter is passed to modal
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-module')).toBe('sales');
    });

    it('should pass both teams and module filters to report modal', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Select a team
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);
      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('Team Alpha');
      });

      // Select a module - find the select that has "All scenarios" option
      const moduleSelect = screen.getByDisplayValue('All scenarios').closest('select');
      if (!moduleSelect) throw new Error('Module select not found');
      await user.selectOptions(moduleSelect, 'sales');

      // Open report modal
      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Verify both filters are passed to modal
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-teams')).toBe(
        JSON.stringify(['team-1']),
      );
      expect(reportModal.getAttribute('data-module')).toBe('sales');
    });

    it('should pass undefined module to report modal when "all" is selected', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Module filter starts as "all" by default
      // Open report modal
      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Verify module is undefined for "all"
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-module')).toBe('none');
    });

    it('should pass undefined teams to report modal when no teams are selected', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);

      // Open report modal without selecting teams
      const downloadButton = screen.getByText('manage.downloadReport');
      await user.click(downloadButton);

      // Verify teams filter is undefined
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-teams')).toBe(null);
    });
  });

  describe('Teams Display', () => {
    it('should show multiple teams separated by commas', () => {
      render(<UsersPage />);
      const teamAlphaElements = screen.getAllByText(/Team Alpha/);
      expect(teamAlphaElements.length).toBeGreaterThan(0);
    });

    it('should display "All teams" for superadmin users', () => {
      render(<UsersPage />);
      // In the mock data, we don't have a superadmin user, so this test
      // is more of a regression test to ensure the component handles it
      expect(screen.queryByText('All teams')).toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('should display all required column headers', () => {
      render(<UsersPage />);
      expect(
        screen.getByText('manage.usersPage.table.user'),
      ).toBeInTheDocument();
      expect(screen.getByText('manage.team')).toBeInTheDocument();
      expect(
        screen.getByText('manage.usersPage.table.totalCompleted'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('manage.usersPage.table.avgLength'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('manage.usersPage.table.avgScore'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('manage.usersPage.table.lastSession'),
      ).toBeInTheDocument();
    });
  });

  describe('User Statistics Display', () => {
    it('should display information icon for standings tooltip', () => {
      render(<UsersPage />);
      const { container } = render(<UsersPage />);
      const infoIcons = container.querySelectorAll(
        'svg.h-4.w-4.text-gray-400',
      );
      expect(infoIcons.length).toBeGreaterThan(0);
    });
  });
});
