import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportModal, { ReportType } from './ReportModal';

// Mock PostHog feature flag
let mockFeatureFlagValue = false;
vi.mock('posthog-js/react', () => ({
  useFeatureFlagEnabled: () => mockFeatureFlagValue,
}));

// Mock dependencies
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

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

const mockDownloadFunction = vi.fn();

vi.mock('~/util/api', () => ({
  reportsApi: {
    downloadUsersReport: (params: any) => {
      mockDownloadFunction(params);
      return Promise.resolve(new Blob(['test'], { type: 'application/xlsx' }));
    },
    downloadAccountCreationReport: (params: any) => {
      mockDownloadFunction(params);
      return Promise.resolve(new Blob(['test'], { type: 'application/xlsx' }));
    },
    downloadActiveUsersReport: (params: any) => {
      mockDownloadFunction(params);
      return Promise.resolve(new Blob(['test'], { type: 'application/xlsx' }));
    },
    downloadRepeatUsersReport: (params: any) => {
      mockDownloadFunction(params);
      return Promise.resolve(new Blob(['test'], { type: 'application/xlsx' }));
    },
    downloadCompletedPracticesReport: (params: any) => {
      mockDownloadFunction(params);
      return Promise.resolve(new Blob(['test'], { type: 'application/xlsx' }));
    },
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: ({ mutationFn }: any) => ({
    mutate: () => mutationFn(),
    isPending: false,
  }),
}));

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = (date?: any) => {
    const actualDate = date ? new Date(date) : new Date('2024-01-30T10:00:00Z');
    return {
      format: (format: string) => {
        if (format === 'YYYY-MM-DD') {
          return actualDate.toISOString().split('T')[0];
        }
        if (format === 'DD/MM/YYYY') {
          const day = String(actualDate.getDate()).padStart(2, '0');
          const month = String(actualDate.getMonth() + 1).padStart(2, '0');
          const year = actualDate.getFullYear();
          return `${day}/${month}/${year}`;
        }
        if (format === 'YYYYMMDDHHmmss') {
          return '20240130100000';
        }
        return actualDate.toISOString();
      },
      subtract: (amount: number, unit: string) => mockDayjs(new Date('2024-01-01T10:00:00Z')),
      toDate: () => actualDate,
      isValid: () => true,
    };
  };
  return {
    default: mockDayjs,
  };
});

describe('ReportModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeatureFlagValue = false;
  });

  describe('Rendering', () => {
    it('should render the modal when open', () => {
      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      expect(screen.getByText('manage.dashboard.reports.users')).toBeInTheDocument();
    });

    it('should display correct title for each report type', () => {
      const reportTypes = [
        { type: ReportType.USERS, title: 'manage.dashboard.reports.users' },
        {
          type: ReportType.ACCOUNT_CREATION,
          title: 'Account creation report',
        },
        { type: ReportType.ACTIVE_USERS, title: 'Active user report' },
        { type: ReportType.REPEAT_USERS, title: 'Repeat user report' },
        {
          type: ReportType.COMPLETED_PRACTICES,
          title: 'Completed practice report',
        },
      ];

      reportTypes.forEach(({ type, title }) => {
        const { unmount } = render(
          <ReportModal isOpen={true} onClose={mockOnClose} reportType={type} />,
        );
        expect(screen.getByText(title)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render all period options', () => {
      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      expect(
        screen.getByText('manage.dashboard.reportModal.allTime'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('manage.dashboard.reportModal.last30Days'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('manage.dashboard.reportModal.customDate'),
      ).toBeInTheDocument();
    });

    it('should render download button', () => {
      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      expect(
        screen.getByText('manage.dashboard.reportModal.download'),
      ).toBeInTheDocument();
    });
  });

  describe('Teams Filter', () => {
    it('should pass teams filter to download function when teams are provided', async () => {
      const user = userEvent.setup();
      const teams = ['team-1', 'team-2'];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACCOUNT_CREATION}
          teams={teams}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
      });
    });

    it('should pass undefined teams when no teams filter is provided', async () => {
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACTIVE_USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.not.objectContaining({ teams: expect.anything() }),
        );
      });
    });

    it('should pass empty array teams filter correctly', async () => {
      const user = userEvent.setup();
      const teams: string[] = [];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.REPEAT_USERS}
          teams={teams}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
      });
    });
  });

  describe('Module Filter', () => {
    it('should pass module filter for USERS report type', async () => {
      const user = userEvent.setup();
      const module = 'sales';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
          module={module}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ module }),
        );
      });
    });

    it('should NOT pass module filter for non-USERS report types', async () => {
      const user = userEvent.setup();
      const module = 'sales';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACCOUNT_CREATION}
          module={module}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.not.objectContaining({ module: expect.anything() }),
        );
      });
    });

    it('should handle undefined module filter', async () => {
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.not.objectContaining({ module: expect.anything() }),
        );
      });
    });
  });

  describe('Combined Filters', () => {
    it('should pass both teams and module filters for USERS report', async () => {
      const user = userEvent.setup();
      const teams = ['team-1', 'team-2'];
      const module = 'sales';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
          teams={teams}
          module={module}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams, module }),
        );
      });
    });

    it('should pass teams but not module for ACCOUNT_CREATION report', async () => {
      const user = userEvent.setup();
      const teams = ['team-1'];
      const module = 'sales';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACCOUNT_CREATION}
          teams={teams}
          module={module}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.not.objectContaining({ module: expect.anything() }),
        );
      });
    });
  });

  describe('Date Range with Filters', () => {
    it('should pass date range and teams filter together', async () => {
      const user = userEvent.setup();
      const teams = ['team-1'];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.COMPLETED_PRACTICES}
          teams={teams}
        />,
      );

      // Select last 30 days
      const last30DaysOption = screen.getByText(
        'manage.dashboard.reportModal.last30Days',
      );
      await user.click(last30DaysOption);

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({
            teams,
            dateFrom: expect.any(String),
            dateTo: expect.any(String),
          }),
        );
      });
    });

    it('should pass all filters together for USERS report with date range', async () => {
      const user = userEvent.setup();
      const teams = ['team-1', 'team-2'];
      const module = 'support';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
          teams={teams}
          module={module}
        />,
      );

      // Select last 30 days
      const last30DaysOption = screen.getByText(
        'manage.dashboard.reportModal.last30Days',
      );
      await user.click(last30DaysOption);

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({
            teams,
            module,
            dateFrom: expect.any(String),
            dateTo: expect.any(String),
          }),
        );
      });
    });
  });

  describe('All Report Types with Teams Filter', () => {
    it('should pass teams filter for ACTIVE_USERS report', async () => {
      const user = userEvent.setup();
      const teams = ['team-1'];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACTIVE_USERS}
          teams={teams}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
      });
    });

    it('should pass teams filter for REPEAT_USERS report', async () => {
      const user = userEvent.setup();
      const teams = ['team-1', 'team-2'];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.REPEAT_USERS}
          teams={teams}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
      });
    });

    it('should pass teams filter for COMPLETED_PRACTICES report', async () => {
      const user = userEvent.setup();
      const teams = ['team-3'];

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.COMPLETED_PRACTICES}
          teams={teams}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams }),
        );
      });
    });
  });

  describe('Team Column Feature Flag (tc parameter)', () => {
    it('should NOT pass tc parameter when feature flag is disabled', async () => {
      mockFeatureFlagValue = false;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.not.objectContaining({ tc: expect.anything() }),
        );
      });
    });

    it('should pass tc=1 parameter when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ tc: 1 }),
        );
      });
    });

    it('should pass tc=1 for ACCOUNT_CREATION report when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACCOUNT_CREATION}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ tc: 1 }),
        );
      });
    });

    it('should pass tc=1 for ACTIVE_USERS report when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.ACTIVE_USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ tc: 1 }),
        );
      });
    });

    it('should pass tc=1 for REPEAT_USERS report when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.REPEAT_USERS}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ tc: 1 }),
        );
      });
    });

    it('should pass tc=1 for COMPLETED_PRACTICES report when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.COMPLETED_PRACTICES}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ tc: 1 }),
        );
      });
    });

    it('should pass tc=1 along with teams and module filters when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();
      const teams = ['team-1', 'team-2'];
      const module = 'sales';

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.USERS}
          teams={teams}
          module={module}
        />,
      );

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({ teams, module, tc: 1 }),
        );
      });
    });

    it('should pass tc=1 along with date range when feature flag is enabled', async () => {
      mockFeatureFlagValue = true;
      const user = userEvent.setup();

      render(
        <ReportModal
          isOpen={true}
          onClose={mockOnClose}
          reportType={ReportType.COMPLETED_PRACTICES}
        />,
      );

      // Select last 30 days
      const last30DaysOption = screen.getByText(
        'manage.dashboard.reportModal.last30Days',
      );
      await user.click(last30DaysOption);

      const downloadButton = screen.getByText(
        'manage.dashboard.reportModal.download',
      );
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadFunction).toHaveBeenCalledWith(
          expect.objectContaining({
            tc: 1,
            dateFrom: expect.any(String),
            dateTo: expect.any(String),
          }),
        );
      });
    });
  });
});
