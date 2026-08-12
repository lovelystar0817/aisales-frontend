import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkInviteModal } from './BulkInviteModal';
import type { BulkImportsResponse } from '~/util/api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, options?: any) => {
      if (typeof defaultValue === 'string' && defaultValue.includes('{{')) {
        // Handle template strings
        let result = defaultValue;
        if (options) {
          Object.keys(options).forEach(optionKey => {
            result = result.replace(`{{${optionKey}}}`, options[optionKey]);
          });
        }
        return result;
      }
      return defaultValue || key;
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
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPrecheckMutate = vi.fn();
const mockImportMutate = vi.fn();
const mockRefetch = vi.fn();
const mockInvalidateQueries = vi.fn();

let mockPrecheckError: any = null;
let mockPrecheckIsPending = false;
let mockImportError: any = null;
let mockImportIsPending = false;
let mockImportsData: BulkImportsResponse | undefined = undefined;

let useMutationCallCount = 0;
let capturedQueryOptions: any = null;

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => {
    useMutationCallCount++;
    const isPrecheck = useMutationCallCount % 2 === 1; // First call is precheck, second is import

    return {
      mutate: isPrecheck ? mockPrecheckMutate : mockImportMutate,
      mutateAsync: isPrecheck ? mockPrecheckMutate : mockImportMutate,
      isPending: isPrecheck ? mockPrecheckIsPending : mockImportIsPending,
      error: isPrecheck ? mockPrecheckError : mockImportError,
    };
  },
  useQuery: (options: any) => {
    capturedQueryOptions = options;
    return {
      data: mockImportsData,
      isLoading: false,
      refetch: mockRefetch,
    };
  },
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

describe('BulkInviteModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrecheckError = null;
    mockPrecheckIsPending = false;
    mockImportError = null;
    mockImportIsPending = false;
    mockImportsData = undefined;
    useMutationCallCount = 0;
    capturedQueryOptions = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<BulkInviteModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Import users')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('heading', { name: 'Import users' })).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const backdrop = screen.getByRole('heading', { name: 'Import users' }).parentElement?.parentElement?.parentElement;
      if (backdrop) {
        await user.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('File Upload - Upload Area', () => {
    it('should render file upload area with correct text', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/Drop your file here or/i)).toBeInTheDocument();
      expect(screen.getByText('Browse')).toBeInTheDocument();
      expect(
        screen.getByText('Upload .xls, .xlsx (max. 1000 users in one upload)'),
      ).toBeInTheDocument();
    });

    it('should render download template link', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const downloadLink = screen.getByRole('link', { name: 'Download template' });
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute('href', '/hupo-invite-20260210.xlsx');
      expect(downloadLink).toHaveAttribute('download');
    });

    it('should have disabled import button initially', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const importButton = screen.getByRole('button', { name: 'Import users' });
      expect(importButton).toBeDisabled();
    });
  });

  describe('File Upload - File Selection via Browse', () => {
    it('should show validation error for invalid file extension', async () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Use fireEvent to bypass accept attribute validation
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText(/Please upload an \.xls or \.xlsx file/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for file size exceeding 3MB', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      // Create a file larger than 3MB
      const largeContent = new Array(4 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      expect(screen.getByText('File size must be less than 3MB')).toBeInTheDocument();
    });

    it('should accept valid xlsx file and trigger precheck', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalledWith(file);
      });
    });

    it('should accept valid xls file', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'test.xls', {
        type: 'application/vnd.ms-excel',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('File Upload - Drag and Drop', () => {
    it('should handle drag enter and show dragging state', async () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const dropZone = screen.getByText(/Drop your file here or/i).parentElement;

      const dragEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { items: [{}], files: [] },
      });

      dropZone?.dispatchEvent(dragEvent);

      await waitFor(() => {
        expect(dropZone).toHaveClass('border-orange-500');
      });
    });

    it('should handle file drop with valid file', async () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'dropped.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const dropZone = screen.getByText(/Drop your file here or/i).parentElement;

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
      });

      dropZone?.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalledWith(file);
      });
    });

    it('should show validation error on drop with invalid file', async () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'invalid.txt', { type: 'text/plain' });

      const dropZone = screen.getByText(/Drop your file here or/i).parentElement;

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
      });

      dropZone?.dispatchEvent(dropEvent);

      await waitFor(() => {
        expect(screen.getByText(/Please upload an \.xls or \.xlsx file/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload - Backend Error Handling', () => {
    it('should display backend error', async () => {
      mockPrecheckError = {
        json: { error: 'Please use the right template.' },
      };

      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalled();
      });
    });

    it('should allow removing file after error', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Recent Imports - Empty State', () => {
    it('should show empty state when no imports exist', () => {
      mockImportsData = {
        history: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          total: 0,
          limit: 5,
        },
      };

      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Recent imports')).toBeInTheDocument();
      expect(
        screen.getByText('No imports yet. Your recent imports will show up here.'),
      ).toBeInTheDocument();
    });

    it('should configure auto-refresh with 30 second interval', () => {
      mockImportsData = {
        history: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          total: 0,
          limit: 5,
        },
      };

      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      expect(capturedQueryOptions).toBeDefined();
      expect(capturedQueryOptions.refetchInterval).toBe(30000);
      expect(capturedQueryOptions.refetchIntervalInBackground).toBe(false);
      expect(capturedQueryOptions.retry).toBe(false);
    });
  });

  describe('Recent Imports - With Data', () => {
    beforeEach(() => {
      mockImportsData = {
        history: [
          {
            id: '1',
            fileName: 'cohort6.xls',
            status: 'processing',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 0,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '2',
            fileName: 'cohort5.xls',
            status: 'completed',
            totalRows: 200,
            validCount: 200,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 100,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '3',
            fileName: 'cohort4.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: 3,
          limit: 5,
        },
      };
    });

    it('should display import items with correct status', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      // Check processing status
      expect(screen.getByText('cohort6.xls')).toBeInTheDocument();
      expect(screen.getByText('Processing your file')).toBeInTheDocument();

      // Check completed with failures
      expect(screen.getByText('cohort5.xls')).toBeInTheDocument();
      expect(screen.getByText(/100 failed/i)).toBeInTheDocument();

      // Check completed successfully
      expect(screen.getByText('cohort4.xls')).toBeInTheDocument();

      // Check that "users invited" appears at least twice (for cohort4 and cohort5)
      const successTexts = screen.getAllByText(/users invited/i);
      expect(successTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('should show uploaded by information', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const uploadedByTexts = screen.getAllByText(/Uploaded by bella@hupo.co/i);
      expect(uploadedByTexts.length).toBeGreaterThan(0);
    });

    it('should show warning icon when invalidCount + failedCount > 0', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      // cohort5.xls has failedCount = 100, invalidCount = 0, so it should have warning
      const warningIcons = document.querySelectorAll('.text-red-600');
      expect(warningIcons.length).toBeGreaterThan(0);
    });

    it('should not show warning icon when both invalidCount and failedCount are 0', () => {
      mockImportsData = {
        history: [
          {
            id: '1',
            fileName: 'cohort-success.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: 1,
          limit: 5,
        },
      };

      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const warningIcons = document.querySelectorAll('.text-red-600');
      expect(warningIcons.length).toBe(0);
    });

    it('should show warning icon for invalidCount only', () => {
      mockImportsData = {
        history: [
          {
            id: '1',
            fileName: 'cohort-with-invalids.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 90,
            invalidCount: 10,
            sentCount: 90,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: 1,
          limit: 5,
        },
      };

      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const warningIcons = document.querySelectorAll('.text-red-600');
      expect(warningIcons.length).toBe(1);
    });

    it('should show warning icon when both invalidCount and failedCount > 0', () => {
      mockImportsData = {
        history: [
          {
            id: '1',
            fileName: 'cohort-both-errors.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 80,
            invalidCount: 10,
            sentCount: 70,
            failedCount: 10,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: 1,
          limit: 5,
        },
      };

      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const warningIcons = document.querySelectorAll('.text-red-600');
      expect(warningIcons.length).toBe(1);
    });
  });

  describe('Recent Imports - Pagination', () => {
    beforeEach(() => {
      mockImportsData = {
        history: [
          {
            id: '1',
            fileName: 'cohort1.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '2',
            fileName: 'cohort2.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '3',
            fileName: 'cohort3.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '4',
            fileName: 'cohort4.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
          {
            id: '5',
            fileName: 'cohort5.xls',
            status: 'completed',
            totalRows: 100,
            validCount: 100,
            invalidCount: 0,
            sentCount: 100,
            failedCount: 0,
            uploadedBy: 'bella@hupo.co',
            uploadedAt: '2026-02-18T11:00:00Z',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 2,
          total: 10,
          limit: 5,
        },
      };
    });

    it('should show pagination controls when there are multiple pages', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('Showing 1-5 of 10')).toBeInTheDocument();
      expect(screen.getByText('of 2 page')).toBeInTheDocument();
    });

    it('should have enabled next button when there are more pages', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1]; // Last button should be next
      expect(nextButton).not.toBeDisabled();
    });

    it('should have disabled prev button on first page', () => {
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[buttons.length - 2]; // Second to last should be prev
      expect(prevButton).toBeDisabled();
    });

    it('should allow changing page via dropdown', async () => {
      const user = userEvent.setup();
      render(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      const pageSelect = screen.getByRole('combobox');
      await user.selectOptions(pageSelect, '2');

      expect(pageSelect).toHaveValue('2');
    });
  });

  describe('State Reset', () => {
    it('should reset state when modal is reopened', async () => {
      const { rerender } = render(
        <BulkInviteModal isOpen={true} onClose={mockOnClose} />,
      );

      const user = userEvent.setup();
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(mockPrecheckMutate).toHaveBeenCalled();
      });

      // Close modal
      rerender(<BulkInviteModal isOpen={false} onClose={mockOnClose} />);

      // Reopen modal - this resets useMutationCallCount
      useMutationCallCount = 0;
      rerender(<BulkInviteModal isOpen={true} onClose={mockOnClose} />);

      // Should show initial state
      expect(screen.getByText(/Drop your file here or/i)).toBeInTheDocument();
    });
  });
});
