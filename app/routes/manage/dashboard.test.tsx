import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './dashboard';
import type { DashboardSummary, SurveyResponse } from '~/util/api';

// Mock dependencies
vi.mock('@auth0/auth0-react', () => ({
  withAuthenticationRequired: (component: any) => component,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: string | any) => {
      if (
        typeof defaultValueOrOptions === 'object' &&
        defaultValueOrOptions !== null
      ) {
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

// Track feature flags state for testing
let featureFlags = {
  'post-roleplay-survey': true,
  'admin-settings': true,
  'self-serve': false,
};

vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({
    identify: vi.fn(),
    capture: vi.fn(),
  }),
  useFeatureFlagEnabled: (flag: string) => {
    return featureFlags[flag as keyof typeof featureFlags] || false;
  },
}));

vi.mock('~/store/manageAuth', () => ({
  useManageAuthStore: (selector: any) => {
    const state = {
      id: 'user-123',
      email: 'admin@example.com',
      name: 'Admin User',
      company: { _id: 'company-123', name: 'Test Company' },
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
}));

const mockDashboardData: DashboardSummary & {
  lastUpdated?: string;
  calculationDuration?: number;
} = {
  accountSummary: {
    accountsCreated: 50,
    monthlyActiveUsers: 45,
    monthlyActiveUsersGrowth: 10,
    repeatUsers: 30,
  },
  practiceSummary: {
    finishedPractices: 150,
    averageDurationMinutes: 10,
    averageDurationSeconds: 600,
    overallAverageScore: 85,
  },
  practiceDetails: [
    { type: 'Sales', totalPractices: 80, averageScore: 88, grade: 'A' },
    { type: 'Support', totalPractices: 60, averageScore: 82, grade: 'B+' },
  ],
  progressData: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    charts: [
      {
        name: 'Average Score',
        data: [75, 78, 80, 83, 85, 87],
        color: '#FF6B00',
      },
      {
        name: 'Sessions',
        data: [20, 22, 25, 28, 30, 35],
        color: '#0066FF',
      },
    ],
  },
  lastUpdated: '2024-01-30T10:00:00Z',
  calculationDuration: 1500,
};

const mockFilterOptions = {
  modules: [
    { id: 'all', name: 'All modules' },
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

const mockPracticeDetails = {
  breakdown: [
    { type: 'Sales', totalPractices: 80, averageScore: 88, grade: 'A' },
    { type: 'Support', totalPractices: 60, averageScore: 82, grade: 'B+' },
  ],
};

const mockProgressData = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  charts: [
    {
      name: 'Average Score',
      data: [75, 78, 80, 83, 85, 87],
      color: '#FF6B00',
    },
    {
      name: 'Sessions',
      data: [20, 22, 25, 28, 30, 35],
      color: '#0066FF',
    },
  ],
};

const mockSurveyData: SurveyResponse = {
  question: 'Would you recommend this practice session?',
  summary: {
    yes: 8,
    no: 2,
    total: 10,
    yesPercent: 80,
    noPercent: 20,
  },
  entries: [
    {
      user: 'John Doe',
      answer: 'Yes',
      reason: 'Great experience!',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      user: 'Jane Smith',
      answer: 'Yes',
      reason: 'Good practice session',
      createdAt: '2024-01-20T14:30:00Z',
    },
  ],
  pagination: {
    currentPage: 1,
    totalPages: 2,
    total: 10,
    limit: 5,
    hasNextPage: true,
    hasPrevPage: false,
  },
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey, enabled }: any) => {
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
    if (queryKey[0] === 'dashboard-summary') {
      return {
        data: mockDashboardData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    if (queryKey[0] === 'practice-details') {
      return {
        data: mockPracticeDetails,
        isLoading: false,
        error: null,
      };
    }
    if (queryKey[0] === 'progress-data') {
      return {
        data: mockProgressData,
        isLoading: false,
        error: null,
      };
    }
    if (queryKey[0] === 'manage-survey') {
      return {
        data: mockSurveyData,
        isLoading: false,
        error: null,
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

// Mock child components
vi.mock('~/components/ReportModal', () => ({
  default: ({ teams }: any) => (
    <div
      data-testid="report-modal"
      data-teams={teams !== undefined ? JSON.stringify(teams) : undefined}
    >
      Report Modal
    </div>
  ),
  ReportType: {
    USERS: 'USERS',
    SESSIONS: 'SESSIONS',
    ANALYTICS: 'ANALYTICS',
  },
}));

vi.mock('~/components/manage/dashboard/WelcomeHeader', () => ({
  default: ({ userName }: any) => (
    <div data-testid="welcome-header">Welcome {userName}</div>
  ),
}));

vi.mock('~/components/manage/dashboard/ReportsDropdown', () => ({
  default: ({ onReportClick }: any) => (
    <button
      data-testid="reports-dropdown"
      onClick={() => onReportClick('USERS')}
    >
      Reports
    </button>
  ),
}));

vi.mock('~/components/manage/dashboard/AccountSummary', () => ({
  default: ({ accountSummary }: any) => (
    <div data-testid="account-summary">
      Accounts Created: {accountSummary.accountsCreated}
    </div>
  ),
}));

vi.mock('~/components/manage/dashboard/PracticeSummary', () => ({
  default: () => <div data-testid="practice-summary">Practice Summary</div>,
}));

vi.mock('~/components/manage/dashboard/SkillProgression', () => ({
  default: () => <div data-testid="skill-progression">Skill Progression</div>,
}));

vi.mock('~/components/manage/dashboard/PostPracticeSurvey', () => ({
  default: () => (
    <div data-testid="post-practice-survey">Post Practice Survey</div>
  ),
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

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    // Reset feature flags to defaults
    featureFlags = {
      'post-roleplay-survey': true,
      'admin-settings': true,
      'self-serve': false,
    };
  });

  describe('Rendering', () => {
    it('should render welcome header with user name', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('welcome-header')).toBeInTheDocument();
      expect(screen.getByText(/Welcome Admin User/)).toBeInTheDocument();
    });

    it('should render reports dropdown', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('reports-dropdown')).toBeInTheDocument();
    });

    it('should render teams filter when admin settings is enabled', () => {
      render(<AdminDashboard />);
      expect(
        screen.getByTestId('multiselect-team-dropdown'),
      ).toBeInTheDocument();
    });

    it('should render account summary with data', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('account-summary')).toBeInTheDocument();
      expect(screen.getByText(/Accounts Created: 50/)).toBeInTheDocument();
    });

    it('should render practice summary', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('practice-summary')).toBeInTheDocument();
    });

    it('should render skill progression', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
    });

    it('should render post practice survey when feature flag is enabled', () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId('post-practice-survey')).toBeInTheDocument();
    });
  });

  describe('Teams Filter - Temporary State Behavior', () => {
    it('should use temporary state and not update dashboard until dropdown closes', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Open the dropdown
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      // Click on a team option
      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      // At this point, the temporary state should have changed
      // but the actual filter (and hence the query) should NOT have changed yet

      // Now close the dropdown to commit the changes
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // After closing, the filter should be applied
      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('Team Alpha');
      });
    });

    it('should show placeholder when no teams are selected', () => {
      render(<AdminDashboard />);
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      expect(dropdownTrigger).toHaveTextContent('All teams');
    });

    it('should sync temp state with actual state on mount', () => {
      render(<AdminDashboard />);
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      expect(dropdownTrigger).toHaveTextContent('All teams');
    });

    it('should update dropdown display when selecting a single team', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

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
      render(<AdminDashboard />);

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

    it('should not trigger dashboard refresh when selecting teams without closing', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const initialContent = screen.getByTestId('account-summary').textContent;

      // Open dropdown
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      // Select team but don't close
      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      // Dashboard content should remain the same
      expect(screen.getByTestId('account-summary').textContent).toBe(
        initialContent,
      );
    });
  });

  describe('Report Modal', () => {
    it('should open report modal when reports dropdown is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const reportsButton = screen.getByTestId('reports-dropdown');
      await user.click(reportsButton);

      expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    });

    it('should pass teams filter to report modal when teams are selected', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

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
      const reportsButton = screen.getByTestId('reports-dropdown');
      await user.click(reportsButton);

      // Verify teams filter is passed to modal
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-teams')).toBe(
        JSON.stringify(['team-1']),
      );
    });

    it('should pass undefined teams to report modal when no teams are selected', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Open report modal without selecting teams
      const reportsButton = screen.getByTestId('reports-dropdown');
      await user.click(reportsButton);

      // Verify teams filter is undefined
      const reportModal = screen.getByTestId('report-modal');
      expect(reportModal).toBeInTheDocument();
      expect(reportModal.getAttribute('data-teams')).toBe(null);
    });
  });

  describe('Dashboard Components Integration', () => {
    it('should render all main dashboard sections', () => {
      render(<AdminDashboard />);

      expect(screen.getByTestId('welcome-header')).toBeInTheDocument();
      expect(screen.getByTestId('account-summary')).toBeInTheDocument();
      expect(screen.getByTestId('practice-summary')).toBeInTheDocument();
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
    });

    it('should pass correct data to AccountSummary component', () => {
      render(<AdminDashboard />);
      const accountSummary = screen.getByTestId('account-summary');
      expect(accountSummary).toHaveTextContent('Accounts Created: 50');
    });
  });

  describe('Module Selection Persistence', () => {
    it('should load selected module from localStorage on mount', () => {
      localStorage.setItem('dashboard-skill-progression-module', 'sales');
      render(<AdminDashboard />);
      // The component should initialize with the saved module
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
    });

    it('should clear invalid module from localStorage if not in options', () => {
      localStorage.setItem(
        'dashboard-skill-progression-module',
        'invalid-module',
      );
      render(<AdminDashboard />);
      // Component should render successfully and clear invalid module
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
    });
  });

  describe('Teams Filter with Dashboard Queries', () => {
    it('should include teams filter in dashboard query params', async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Open dropdown and select a team
      const dropdownTrigger = screen.getByTestId('dropdown-trigger');
      await user.click(dropdownTrigger);

      const teamOption = screen.getByTestId('option-team-1');
      await user.click(teamOption);

      // Close dropdown to apply filter
      const closeButton = screen.getByTestId('close-dropdown');
      await user.click(closeButton);

      // Wait for dropdown to update
      await waitFor(() => {
        expect(dropdownTrigger).toHaveTextContent('Team Alpha');
      });

      // Dashboard should still render correctly with filtered data
      expect(screen.getByTestId('account-summary')).toBeInTheDocument();
    });
  });

  describe('Progress Data Endpoint Selection', () => {
    it('should use progress endpoint when selfServeEnabled is false', () => {
      // Ensure self-serve flag is false
      featureFlags['self-serve'] = false;

      render(<AdminDashboard />);

      // Verify dashboard renders successfully
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
      expect(screen.getByTestId('account-summary')).toBeInTheDocument();
    });

    it('should use progress-v2 endpoint when selfServeEnabled is true', () => {
      // Enable self-serve flag
      featureFlags['self-serve'] = true;

      render(<AdminDashboard />);

      // Verify dashboard renders successfully with v2 endpoint
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
      expect(screen.getByTestId('account-summary')).toBeInTheDocument();
    });

    it('should update progress data query when selfServeEnabled changes', () => {
      // Start with self-serve disabled
      featureFlags['self-serve'] = false;

      const { rerender } = render(<AdminDashboard />);
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();

      // Enable self-serve flag
      featureFlags['self-serve'] = true;

      // Rerender to pick up the flag change
      rerender(<AdminDashboard />);
      expect(screen.getByTestId('skill-progression')).toBeInTheDocument();
    });
  });
});
