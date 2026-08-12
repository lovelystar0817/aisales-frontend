import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

// Mock all dependencies before importing component
vi.mock('~/i18n/i18n', () => ({ default: { language: 'en' } }));
vi.mock('~/util/netlify-backend', () => ({ getBackendUrl: () => '', waitForBackendReady: () => Promise.resolve() }));
vi.mock('~/store/auth', () => ({ useAuthStore: { getState: () => ({ getToken: () => 'token', guestMode: false }), setState: vi.fn(), getInitialState: () => ({}) } }));
vi.mock('~/store/manageAuth', () => ({ useManageAuthStore: { getState: () => ({ getToken: () => 'token' }), setState: vi.fn(), getInitialState: () => ({}) } }));
vi.mock('wretch', () => ({ default: () => ({ addon: vi.fn().mockReturnThis(), middlewares: vi.fn().mockReturnThis(), errorType: vi.fn().mockReturnThis() }) }));
vi.mock('wretch/addons/formData', () => ({ default: vi.fn() }));
vi.mock('wretch/addons/queryString', () => ({ default: vi.fn() }));
vi.mock('dayjs', () => ({ default: () => ({ isValid: () => true, format: () => '' }) }));
vi.mock('~/hooks/useDebounce', () => ({ useDebounce: (v: any) => v }));
vi.mock('date-fns', () => ({ format: () => '01 Jan 2024 at 12:00' }));
// Translation mock with specific keys
const translations: Record<string, string> = {
  'manage.settings.teamNameAlreadyExists': 'This team name is already in use. Please choose a different name.',
  'manage.settings.teamSaved': 'Team saved.',
  'manage.settings.errorSavingTeam': 'Error saving team',
  'manage.settings.teamEdited': 'Team edited.',
  'manage.settings.errorEditingTeam': 'Error editing team',
  'no_team_assigned': 'No team assigned',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => translations[key] || defaultValue || key
  })
}));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Mock data
const mockUsers = [
  {
    id: 'user-1',
    name: 'User One',
    email: 'charlie@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    name: 'User Two',
    email: 'alice@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-3',
    name: 'User Three',
    email: 'bob@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-4',
    name: 'User Four',
    email: 'david@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-5',
    name: 'User Five',
    email: 'eve@example.com',
    role: 'user',
    status: 'active',
    teams: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

// Create stable mock data objects to prevent infinite re-renders
const mockAvailableUsersData = { users: mockUsers };
const mockTeamDetailsData = { members: [] };
const mockDefaultQueryData = { data: undefined, isLoading: false };

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useQuery: ({ queryKey, enabled }: any) => {
    // Don't execute queryFn if disabled
    if (enabled === false) {
      return mockDefaultQueryData;
    }

    // Mock for getting available users
    if (queryKey && queryKey[0] === 'team-modal-users') {
      return {
        data: mockAvailableUsersData,
        isLoading: false,
      };
    }
    // Mock for getting team details
    if (queryKey && queryKey[0] === 'team-details') {
      return {
        data: mockTeamDetailsData,
        isLoading: false,
      };
    }
    // Default return
    return { data: mockAvailableUsersData, isLoading: false };
  },
}));

import { TeamManagementModal } from './TeamManagementModal';
import type { Team } from '~/util/api';

describe('TeamManagementModal - User Sorting', () => {
  const mockTeam: Team = {
    id: 'team-1',
    name: 'Test Team',
    userCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edit Mode - User List Sorting', () => {
    it('should sort users alphabetically by email when none are selected', async () => {
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent || '';
      });

      // All unchecked, should be sorted alphabetically by email
      expect(labels[0]).toContain('alice@example.com');
      expect(labels[1]).toContain('bob@example.com');
      expect(labels[2]).toContain('charlie@example.com');
      expect(labels[3]).toContain('david@example.com');
      expect(labels[4]).toContain('eve@example.com');
    });

    it('should display checked users first, sorted alphabetically', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      // Select users: charlie, eve, and bob
      const checkboxes = screen.getAllByRole('checkbox');

      // Find and check specific users by their email
      const aliceCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('alice@example.com');
      });
      const charlieCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('charlie@example.com');
      });
      const eveCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('eve@example.com');
      });

      if (charlieCheckbox) await user.click(charlieCheckbox);
      if (eveCheckbox) await user.click(eveCheckbox);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const updatedLabels = updatedCheckboxes.map((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent || '';
        });

        // Checked users (charlie, eve) should come first, sorted alphabetically
        expect(updatedLabels[0]).toContain('charlie@example.com');
        expect(updatedLabels[1]).toContain('eve@example.com');

        // Unchecked users (alice, bob, david) should come after, sorted alphabetically
        expect(updatedLabels[2]).toContain('alice@example.com');
        expect(updatedLabels[3]).toContain('bob@example.com');
        expect(updatedLabels[4]).toContain('david@example.com');
      });
    });

    it('should maintain sorted order when unchecking users', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');

      // Select charlie and eve
      const charlieCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('charlie@example.com');
      });
      const eveCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('eve@example.com');
      });

      if (charlieCheckbox) await user.click(charlieCheckbox);
      if (eveCheckbox) await user.click(eveCheckbox);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        expect(updatedCheckboxes[0]).toBeChecked();
        expect(updatedCheckboxes[1]).toBeChecked();
      });

      // Uncheck charlie
      const updatedCheckboxes = screen.getAllByRole('checkbox');
      await user.click(updatedCheckboxes[0]);

      await waitFor(() => {
        const finalCheckboxes = screen.getAllByRole('checkbox');
        const finalLabels = finalCheckboxes.map((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent || '';
        });

        // Only eve should be checked and at the top
        expect(finalLabels[0]).toContain('eve@example.com');
        expect(finalCheckboxes[0]).toBeChecked();

        // Unchecked users should be sorted alphabetically
        expect(finalLabels[1]).toContain('alice@example.com');
        expect(finalLabels[2]).toContain('bob@example.com');
        expect(finalLabels[3]).toContain('charlie@example.com');
        expect(finalLabels[4]).toContain('david@example.com');
      });
    });

    it('should sort checked users alphabetically within their group', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');

      // Select users in non-alphabetical order: eve, bob, david
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });
      const davidCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('david@example.com');
      });
      const eveCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('eve@example.com');
      });

      if (eveCheckbox) await user.click(eveCheckbox);
      if (bobCheckbox) await user.click(bobCheckbox);
      if (davidCheckbox) await user.click(davidCheckbox);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const updatedLabels = updatedCheckboxes.map((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent || '';
        });

        // Checked users should be alphabetically sorted: bob, david, eve
        expect(updatedLabels[0]).toContain('bob@example.com');
        expect(updatedLabels[1]).toContain('david@example.com');
        expect(updatedLabels[2]).toContain('eve@example.com');

        // Verify they are all checked
        expect(updatedCheckboxes[0]).toBeChecked();
        expect(updatedCheckboxes[1]).toBeChecked();
        expect(updatedCheckboxes[2]).toBeChecked();

        // Unchecked users should follow: alice, charlie
        expect(updatedLabels[3]).toContain('alice@example.com');
        expect(updatedLabels[4]).toContain('charlie@example.com');
      });
    });

    it('should handle selecting and deselecting multiple users while maintaining sort order', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      let checkboxes = screen.getAllByRole('checkbox');

      // Select all users
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      await waitFor(() => {
        const allChecked = screen.getAllByRole('checkbox');
        expect(allChecked.every((cb) => (cb as HTMLInputElement).checked)).toBe(
          true,
        );
      });

      // Deselect bob and david
      checkboxes = screen.getAllByRole('checkbox');
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });
      const davidCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('david@example.com');
      });

      if (bobCheckbox) await user.click(bobCheckbox);
      if (davidCheckbox) await user.click(davidCheckbox);

      await waitFor(() => {
        const finalCheckboxes = screen.getAllByRole('checkbox');
        const finalLabels = finalCheckboxes.map((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent || '';
        });

        // Checked users (alice, charlie, eve) should come first, sorted alphabetically
        expect(finalLabels[0]).toContain('alice@example.com');
        expect(finalLabels[1]).toContain('charlie@example.com');
        expect(finalLabels[2]).toContain('eve@example.com');
        expect(finalCheckboxes[0]).toBeChecked();
        expect(finalCheckboxes[1]).toBeChecked();
        expect(finalCheckboxes[2]).toBeChecked();

        // Unchecked users (bob, david) should follow, sorted alphabetically
        expect(finalLabels[3]).toContain('bob@example.com');
        expect(finalLabels[4]).toContain('david@example.com');
        expect(finalCheckboxes[3]).not.toBeChecked();
        expect(finalCheckboxes[4]).not.toBeChecked();
      });
    });
  });

  describe('Create Mode - User List Sorting', () => {
    it('should sort all users alphabetically by email in create mode', async () => {
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent || '';
      });

      // All unchecked, should be sorted alphabetically by email
      expect(labels[0]).toContain('alice@example.com');
      expect(labels[1]).toContain('bob@example.com');
      expect(labels[2]).toContain('charlie@example.com');
      expect(labels[3]).toContain('david@example.com');
      expect(labels[4]).toContain('eve@example.com');
    });

    it('should move checked users to top when selected in create mode', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');

      // Select eve and bob
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });
      const eveCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('eve@example.com');
      });

      if (eveCheckbox) await user.click(eveCheckbox);
      if (bobCheckbox) await user.click(bobCheckbox);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const updatedLabels = updatedCheckboxes.map((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent || '';
        });

        // Checked users (bob, eve) should come first, sorted alphabetically
        expect(updatedLabels[0]).toContain('bob@example.com');
        expect(updatedLabels[1]).toContain('eve@example.com');

        // Unchecked users should follow, sorted alphabetically
        expect(updatedLabels[2]).toContain('alice@example.com');
        expect(updatedLabels[3]).toContain('charlie@example.com');
        expect(updatedLabels[4]).toContain('david@example.com');
      });
    });
  });

  describe('View Mode - User List Sorting', () => {
    it('should sort team members alphabetically by email in view mode', async () => {
      // Update mock to return team with members in non-alphabetical order
      const mockTeamDetailsWithMembers = {
        members: [
          { id: 'user-3', email: 'eve@example.com', name: 'User Five' },
          { id: 'user-1', email: 'alice@example.com', name: 'User Two' },
          { id: 'user-4', email: 'david@example.com', name: 'User Four' },
          { id: 'user-2', email: 'bob@example.com', name: 'User Three' },
          { id: 'user-5', email: 'charlie@example.com', name: 'User One' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      // Override the useQuery mock for this test
      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="view"
          team={mockTeam}
        />,
      );

      await waitFor(() => {
        // Find all email divs (they have text-sm and text-gray-900 classes)
        const userElements = screen.getAllByText(/@example\.com/i);

        // Verify they are sorted alphabetically
        expect(userElements[0].textContent).toBe('alice@example.com');
        expect(userElements[1].textContent).toBe('bob@example.com');
        expect(userElements[2].textContent).toBe('charlie@example.com');
        expect(userElements[3].textContent).toBe('david@example.com');
        expect(userElements[4].textContent).toBe('eve@example.com');
      });
    });

    it('should maintain alphabetical sorting when searching in view mode', async () => {
      const user = userEvent.setup();

      const mockTeamDetailsWithMembers = {
        members: [
          { id: 'user-1', email: 'charlie@example.com', name: 'Charlie User' },
          { id: 'user-2', email: 'alice@example.com', name: 'Alice User' },
          { id: 'user-3', email: 'bob@example.com', name: 'Bob User' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="view"
          team={mockTeam}
        />,
      );

      // Search for users with 'example' in their email (should match all)
      const searchInput = screen.getByPlaceholderText('Search users...');
      await user.type(searchInput, 'example');

      await waitFor(() => {
        const userElements = screen.getAllByText(/@example\.com/i);

        // Should still be sorted alphabetically after search
        expect(userElements[0].textContent).toBe('alice@example.com');
        expect(userElements[1].textContent).toBe('bob@example.com');
        expect(userElements[2].textContent).toBe('charlie@example.com');
      });
    });

    it('should sort filtered results alphabetically in view mode', async () => {
      const user = userEvent.setup();

      const mockTeamDetailsWithMembers = {
        members: [
          { id: 'user-1', email: 'zebra@example.com', name: 'Zebra User' },
          { id: 'user-2', email: 'alice@example.com', name: 'Alice User' },
          { id: 'user-3', email: 'bob@other.com', name: 'Bob User' },
          { id: 'user-4', email: 'charlie@example.com', name: 'Charlie User' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="view"
          team={mockTeam}
        />,
      );

      // Search for users with '@example.com' domain (should match 3 users)
      const searchInput = screen.getByPlaceholderText('Search users...');
      await user.type(searchInput, '@example.com');

      await waitFor(() => {
        // Get all user divs that are within the scrollable member list area
        // These are the divs with "flex items-center p-3" class inside the divide-y container
        const container = screen.getByPlaceholderText('Search users...').parentElement?.parentElement;
        const userDivs = container?.querySelectorAll('.divide-y > .flex.items-center.p-3');

        // Should show only filtered results (3 users with @example.com)
        expect(userDivs).toHaveLength(3);

        // Get email text content from each user div
        const emails = Array.from(userDivs || []).map(
          (div) => div.querySelector('.text-sm.text-gray-900')?.textContent
        );

        // Should be sorted alphabetically
        expect(emails[0]).toBe('alice@example.com');
        expect(emails[1]).toBe('charlie@example.com');
        expect(emails[2]).toBe('zebra@example.com');
      });
    });

    it('should handle empty team members list in view mode', async () => {
      const mockEmptyTeamDetails = {
        members: [],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockEmptyTeamDetails,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="view"
          team={mockTeam}
        />,
      );

      await waitFor(() => {
        // Should show "No members in this team yet." message
        expect(screen.getByText('No members in this team yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Dirty State - Edit Mode', () => {
    it('should disable submit button when form is not dirty in edit mode', async () => {
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      await waitFor(() => {
        const submitButton = screen.getByText('Save Changes');
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when team name is changed in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Team Name');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should enable submit button when a member is added in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const checkboxes = screen.getAllByRole('checkbox');
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });

      if (bobCheckbox) await user.click(bobCheckbox);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should enable submit button when a member is removed in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
          { _id: 'user-2', id: 'user-2', email: 'bob@example.com', name: 'Bob' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      const checkboxes = screen.getAllByRole('checkbox');
      const aliceCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('alice@example.com');
      });

      if (aliceCheckbox) await user.click(aliceCheckbox);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should disable submit button when changes are reverted to original state in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Change team name
      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Revert back to original name
      await user.clear(nameInput);
      await user.type(nameInput, 'Test Team');

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when both name and members are changed in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Change team name
      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Team');

      // Add a member
      const checkboxes = screen.getAllByRole('checkbox');
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });

      if (bobCheckbox) await user.click(bobCheckbox);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should handle member selection order (order-independent comparison) in edit mode', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
          { _id: 'user-2', id: 'user-2', email: 'bob@example.com', name: 'Bob' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();

      // Remove alice
      const checkboxes = screen.getAllByRole('checkbox');
      const aliceCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('alice@example.com');
      });

      if (aliceCheckbox) await user.click(aliceCheckbox);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Re-add alice (should return to original state)
      if (aliceCheckbox) await user.click(aliceCheckbox);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Form Dirty State - Create Mode', () => {
    it('should enable submit button in create mode when name is provided', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'New Team');

      const submitButton = screen.getByText('Create Team');
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button in create mode when name is empty', () => {
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const submitButton = screen.getByText('Create Team');
      expect(submitButton).toBeDisabled();
    });

    it('should keep button enabled in create mode even without members', async () => {
      const user = userEvent.setup();
      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'New Team');

      const submitButton = screen.getByText('Create Team');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Email Mapping on Form Submission', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should map selected user IDs to emails when creating a team', async () => {
      const user = userEvent.setup();
      let capturedData: any = null;

      const mockMutateCapture = vi.fn().mockImplementation((data: any) => {
        capturedData = data;
        return Promise.resolve({ id: 'new-team', name: data.name });
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: async (data: any) => {
            const result = await mockMutateCapture(data);
            if (options.onSuccess) {
              options.onSuccess(result);
            }
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'New Team');

      // Select alice and bob
      const checkboxes = screen.getAllByRole('checkbox');
      const aliceCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('alice@example.com');
      });
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });

      if (aliceCheckbox) await user.click(aliceCheckbox);
      if (bobCheckbox) await user.click(bobCheckbox);

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        // Verify that the mutation was called
        expect(mockMutateCapture).toHaveBeenCalled();
      });
    });

    it('should map selected user IDs to emails when updating a team', async () => {
      const user = userEvent.setup();
      let capturedData: any = null;

      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const mockMutateCapture = vi.fn().mockImplementation((data: any) => {
        capturedData = data;
        return Promise.resolve({ id: mockTeam.id, name: data.name });
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: async (data: any) => {
            const result = await mockMutateCapture(data);
            if (options.onSuccess) {
              options.onSuccess(result);
            }
          },
          isPending: false,
          error: null,
        } as any;
      });

      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      // Add bob to the team
      const checkboxes = screen.getAllByRole('checkbox');
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });

      if (bobCheckbox) await user.click(bobCheckbox);

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        // Verify that the mutation was called
        expect(mockMutateCapture).toHaveBeenCalled();
      });
    });

    it('should maintain selected users state when rendering in create mode', async () => {
      const user = userEvent.setup();

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'New Team');

      // Select alice, bob, and charlie
      const checkboxes = screen.getAllByRole('checkbox');
      const aliceCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('alice@example.com');
      });
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });
      const charlieCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('charlie@example.com');
      });

      if (aliceCheckbox) await user.click(aliceCheckbox);
      if (bobCheckbox) await user.click(bobCheckbox);
      if (charlieCheckbox) await user.click(charlieCheckbox);

      // Wait for selection to complete
      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const checkedCount = updatedCheckboxes.filter(cb => (cb as HTMLInputElement).checked).length;
        expect(checkedCount).toBe(3);
      });

      // Verify the submit button is enabled
      const submitButton = screen.getByText('Create Team');
      expect(submitButton).not.toBeDisabled();
    });

    it('should maintain selected users when adding members in edit mode', async () => {
      const user = userEvent.setup();

      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-2', id: 'user-2', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      // Wait for alice to be checked (existing member)
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const aliceCheckbox = checkboxes.find((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent?.includes('alice@example.com');
        });
        expect(aliceCheckbox).toBeChecked();
      });

      // Select bob and charlie (in addition to existing alice)
      const checkboxes = screen.getAllByRole('checkbox');
      const bobCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('bob@example.com');
      });
      const charlieCheckbox = checkboxes.find((checkbox) => {
        const label = checkbox.closest('label');
        return label?.textContent?.includes('charlie@example.com');
      });

      if (bobCheckbox) await user.click(bobCheckbox);
      if (charlieCheckbox) await user.click(charlieCheckbox);

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        const checkedCount = updatedCheckboxes.filter(cb => (cb as HTMLInputElement).checked).length;
        // alice (existing) + bob + charlie = 3
        expect(checkedCount).toBe(3);
      });

      // Verify the form is dirty and can be submitted
      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).not.toBeDisabled();
    });

    it('should map team member emails from teamDetails on mount in edit mode', async () => {
      // Create team members with matching IDs from mockUsers
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-2', id: 'user-2', email: 'alice@example.com', name: 'User Two' },
          { _id: 'user-3', id: 'user-3', email: 'bob@example.com', name: 'User Three' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const aliceCheckbox = checkboxes.find((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent?.includes('alice@example.com');
        });
        const bobCheckbox = checkboxes.find((checkbox) => {
          const label = checkbox.closest('label');
          return label?.textContent?.includes('bob@example.com');
        });

        // Both existing members should be checked
        expect(aliceCheckbox).toBeChecked();
        expect(bobCheckbox).toBeChecked();
      });
    });
  });

  describe('Duplicate Team Name Error Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should display inline error message when team name already exists during create', async () => {
      const user = userEvent.setup();

      // Mock mutation to return duplicate error
      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Team name already exists' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'Existing Team');

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This team name is already in use. Please choose a different name.')).toBeInTheDocument();
      });
    });

    it('should display inline error message when team name already exists during edit', async () => {
      const user = userEvent.setup();
      const mockTeamDetailsWithMembers = {
        members: [
          { _id: 'user-1', id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        ],
        lastModifiedBy: { email: 'admin@example.com' },
        lastModifiedAt: '2024-01-01',
      };

      // Mock mutation to return duplicate error
      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Team name already exists' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');

      // Mock all mutations to return error (both create and update)
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      vi.spyOn(originalModule, 'useQuery').mockImplementation(({ queryKey, enabled }: any) => {
        if (enabled === false) {
          return mockDefaultQueryData as any;
        }
        if (queryKey && queryKey[0] === 'team-details') {
          return {
            data: mockTeamDetailsWithMembers,
            isLoading: false,
          } as any;
        }
        return { data: mockAvailableUsersData, isLoading: false } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
          team={mockTeam}
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Existing Team');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This team name is already in use. Please choose a different name.')).toBeInTheDocument();
      });
    });

    it('should disable save button when duplicate name error is shown', async () => {
      const user = userEvent.setup();

      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Team name already exists' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'Existing Team');

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This team name is already in use. Please choose a different name.')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should clear error and re-enable button when user types a different name', async () => {
      const user = userEvent.setup();

      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Team name already exists' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'Existing Team');

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This team name is already in use. Please choose a different name.')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Type a different name
      await user.type(nameInput, ' New');

      await waitFor(() => {
        expect(screen.queryByText('This team name is already in use. Please choose a different name.')).not.toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should not show toast error when duplicate team name error occurs', async () => {
      const user = userEvent.setup();

      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Team name already exists' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'Existing Team');

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('This team name is already in use. Please choose a different name.')).toBeInTheDocument();
      });

      // Verify toast.error was not called
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show toast error for other types of errors', async () => {
      const user = userEvent.setup();

      const mockMutateWithError = vi.fn().mockImplementation(() => {
        const error = {
          json: { error: 'Network error' }
        };
        return Promise.reject(error);
      });

      const originalModule = await import('@tanstack/react-query');
      vi.spyOn(originalModule, 'useMutation').mockImplementation((options: any) => {
        return {
          mutate: (data: any) => {
            mockMutateWithError(data).catch((error: any) => {
              if (options.onError) {
                options.onError(error);
              }
            });
          },
          isPending: false,
          error: null,
        } as any;
      });

      render(
        <TeamManagementModal
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
      );

      const nameInput = screen.getByPlaceholderText('Enter team name');
      await user.type(nameInput, 'New Team');

      const submitButton = screen.getByText('Create Team');
      await user.click(submitButton);

      await waitFor(() => {
        // Should show toast for non-duplicate errors
        expect(toast.error).toHaveBeenCalledWith('Error saving team');
      });
    });
  });
});
