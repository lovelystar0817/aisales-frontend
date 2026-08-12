import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import {
  manageTeamsApi,
  manageUsersApi,
  type Team,
} from '../../../../util/api';
import { useDebounce } from '~/hooks/useDebounce';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export type TeamModalMode = 'create' | 'view' | 'edit';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TeamModalMode;
  team?: Team | null;
}

export function TeamManagementModal({
  isOpen,
  onClose,
  mode,
  team,
}: TeamManagementModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentMode, setCurrentMode] = useState<TeamModalMode>(mode);
  const [formData, setFormData] = useState({
    name: '',
    selectedUserIds: [] as string[],
  });
  const [initialFormData, setInitialFormData] = useState({
    name: '',
    selectedUserIds: [] as string[],
  });
  const [duplicateNameError, setDuplicateNameError] = useState(false);

  // Map to store userId -> email mappings for all users we've seen
  // This ensures we can map ALL selected user IDs to emails, even when filtered
  const [userIdToEmailMap, setUserIdToEmailMap] = useState<Record<string, string>>({});

  // Separate search terms for view and edit modes
  const [viewSearchTerm, setViewSearchTerm] = useState('');
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const debouncedViewSearchTerm = useDebounce(viewSearchTerm, 300);
  const debouncedEditSearchTerm = useDebounce(editSearchTerm, 300);

  // Get available users for assignment in edit/create mode
  const { data: availableUsers } = useQuery({
    queryKey: ['team-modal-users', debouncedEditSearchTerm],
    queryFn: () =>
      manageUsersApi.getUsers({
        search: debouncedEditSearchTerm,
        limit: 100,
        page: 1,
      }),
    enabled: isOpen && (currentMode === 'create' || currentMode === 'edit'),
  });

  // Get detailed team data when viewing/editing
  const { data: teamDetails } = useQuery({
    queryKey: ['team-details', team?.id],
    queryFn: () => manageTeamsApi.getTeamDetails(team!.id),
    enabled:
      isOpen && !!team && (currentMode === 'view' || currentMode === 'edit'),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Map selected user IDs to their emails using the accumulated map
      // This ensures ALL selected users are included, even if they're not in the current filtered view
      const selectedEmails = data.selectedUserIds
        .map((userId) => userIdToEmailMap[userId])
        .filter((email): email is string => !!email);

      return await manageTeamsApi.createTeam({
        name: data.name,
        emails: selectedEmails,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['settings-filter-teams'] });
      onClose();
      resetForm();
      toast.success(t('manage.settings.teamSaved', 'Team saved.'));
    },
    onError: (error: any) => {
      const errorMessage = error?.json?.error || '';
      if (errorMessage === 'Team name already exists') {
        setDuplicateNameError(true);
      } else {
        toast.error(t('manage.settings.errorSavingTeam', 'Error saving team'));
      }
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!team?.id) throw new Error('Team ID is required');

      // Map selected user IDs to their emails using the accumulated map
      // This ensures ALL selected users are included, even if they're not in the current filtered view
      const selectedEmails = data.selectedUserIds
        .map((userId) => userIdToEmailMap[userId])
        .filter((email): email is string => !!email);

      return await manageTeamsApi.updateTeam(team.id, {
        name: data.name,
        emails: selectedEmails,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-details', team?.id] });
      queryClient.invalidateQueries({ queryKey: ['settings-filter-teams'] });
      setCurrentMode('view');
      resetForm();
      onClose();
      toast.success(t('manage.settings.teamEdited', 'Team edited.'));
    },
    onError: (error: any) => {
      const errorMessage = error?.json?.error || '';
      if (errorMessage === 'Team name already exists') {
        setDuplicateNameError(true);
      } else {
        toast.error(t('manage.settings.errorEditingTeam', 'Error editing team'));
      }
    },
  });

  const resetForm = () => {
    setFormData({ name: '', selectedUserIds: [] });
    setInitialFormData({ name: '', selectedUserIds: [] });
    setViewSearchTerm('');
    setEditSearchTerm('');
    setDuplicateNameError(false);
    setUserIdToEmailMap({});
  };

  // Update userIdToEmailMap whenever we receive new user data from availableUsers
  useEffect(() => {
    if (availableUsers?.users) {
      setUserIdToEmailMap((prevMap) => {
        const newMap = { ...prevMap };
        availableUsers.users.forEach((user) => {
          newMap[user.id] = user.email;
        });
        return newMap;
      });
    }
  }, [availableUsers]);

  // Update userIdToEmailMap whenever we receive team member data
  useEffect(() => {
    if (teamDetails?.members) {
      setUserIdToEmailMap((prevMap) => {
        const newMap = { ...prevMap };
        teamDetails.members.forEach((member: any) => {
          const memberId = member._id || member.id;
          newMap[memberId] = member.email;
        });
        return newMap;
      });
    }
  }, [teamDetails]);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode);

      if (mode === 'create') {
        resetForm();
      } else if (mode === 'edit' && team && teamDetails) {
        // Initialize form data for edit mode when teamDetails is available
        const initialData = {
          name: team.name,
          selectedUserIds: teamDetails.members?.map((m: any) => m._id || m.id) || [],
        };
        setFormData(initialData);
        setInitialFormData(initialData);
        setViewSearchTerm('');
        setEditSearchTerm('');
        setDuplicateNameError(false);
      } else if (mode === 'view') {
        setViewSearchTerm('');
        setEditSearchTerm('');
        setDuplicateNameError(false);
      }
    }
  }, [isOpen, mode, team, teamDetails]);

  // Separate effect to handle mode switching from view to edit
  useEffect(() => {
    if (currentMode === 'edit' && team && teamDetails && isOpen) {
      const initialData = {
        name: team.name,
        selectedUserIds: teamDetails.members?.map((m: any) => m._id || m.id) || [],
      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setDuplicateNameError(false);
    }
  }, [currentMode, team, teamDetails, isOpen]);

  // Filter and sort members for view mode search (sorted alphabetically by email)
  const filteredMembers =
    teamDetails?.members
      ?.filter(
        (member: any) =>
          debouncedViewSearchTerm === '' ||
          member.name
            ?.toLowerCase()
            .includes(debouncedViewSearchTerm.toLowerCase()) ||
          member.email
            ?.toLowerCase()
            .includes(debouncedViewSearchTerm.toLowerCase()),
      )
      .sort((a: any, b: any) => a.email.localeCompare(b.email)) || [];

  // Sort users: checked first, then unchecked, alphabetically by email within each group
  const sortUsersBySelectionAndEmail = (users: any[], selectedIds: string[]) => {
    return [...users].sort((a, b) => {
      const aIsSelected = selectedIds.includes(a.id);
      const bIsSelected = selectedIds.includes(b.id);

      // If selection status differs, checked users come first
      if (aIsSelected !== bIsSelected) {
        return aIsSelected ? -1 : 1;
      }

      // Within same group, sort alphabetically by email
      return a.email.localeCompare(b.email);
    });
  };

  // Get sorted users for edit/create mode
  const sortedUsers = availableUsers?.users
    ? sortUsersBySelectionAndEmail(availableUsers.users, formData.selectedUserIds)
    : [];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMode === 'create') {
      createTeamMutation.mutate(formData);
    } else if (currentMode === 'edit') {
      updateTeamMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleUserToggle = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter((id) => id !== userId)
        : [...prev.selectedUserIds, userId],
    }));
  };

  const getModalTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Create team';
      case 'view':
        return team?.name || 'View team';
      case 'edit':
        return `Edit team`;
      default:
        return 'Team Management';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const isLoading =
    createTeamMutation.isPending || updateTeamMutation.isPending;

  const isFormDirty = () => {
    // For create mode, always return true (allow creation with valid name)
    if (currentMode === 'create') {
      return true;
    }

    // For edit mode, check if anything has changed
    if (formData.name !== initialFormData.name) {
      return true;
    }

    // Compare selectedUserIds arrays (order independent)
    if (formData.selectedUserIds.length !== initialFormData.selectedUserIds.length) {
      return true;
    }

    const currentUserIdsSet = new Set(formData.selectedUserIds);
    const initialUserIdsSet = new Set(initialFormData.selectedUserIds);

    for (const id of currentUserIdsSet) {
      if (!initialUserIdsSet.has(id)) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Sliding panel */}
      <div className="relative ml-auto w-full max-w-lg transform bg-white shadow-xl transition-transform">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {getModalTitle()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col overflow-hidden p-6">
            {currentMode === 'view' ? (
              // View Mode
              <div className="flex h-full flex-col overflow-y-auto">
                {/* Members List */}
                {teamDetails?.members && teamDetails.members.length > 0 && (
                  <div className="flex-1 overflow-y-auto">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Users
                      </h3>
                      <p className="text-sm text-gray-500">
                        {teamDetails.members.length} users
                      </p>
                    </div>
                    <div className="mt-3 rounded-md border border-gray-300">
                      <div className="relative m-2">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={viewSearchTerm}
                          onChange={(e) => setViewSearchTerm(e.target.value)}
                          className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {filteredMembers.length === 0 &&
                        debouncedViewSearchTerm ? (
                          <div className="p-4 text-center text-gray-500">
                            <p>
                              No users found matching "{debouncedViewSearchTerm}
                              "
                            </p>
                          </div>
                        ) : (
                          filteredMembers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center p-3"
                            >
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {teamDetails?.members?.length === 0 && (
                  <div className="mt-6 flex flex-1 items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p>No members in this team yet.</p>
                      <button
                        onClick={() => setCurrentMode('edit')}
                        className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                      >
                        Add members
                      </button>
                    </div>
                  </div>
                )}

                {teamDetails?.lastModifiedBy && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Last edited by {teamDetails?.lastModifiedBy?.email} on{' '}
                      {teamDetails?.lastModifiedAt
                        ? format(
                            teamDetails?.lastModifiedAt,
                            `dd MMM yyyy 'at' HH:mm`,
                          )
                        : '-'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Create/Edit Mode
              <form
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
                className="flex h-full flex-col"
              >
                {/* Team Details */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (duplicateNameError) {
                          setDuplicateNameError(false);
                        }
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      required
                      maxLength={100}
                      placeholder="Enter team name"
                      autoFocus={currentMode === 'create'}
                    />
                    {/* Error Messages */}
                    {duplicateNameError && (
                      <div className="mt-2 text-sm text-red-600">
                        {t(
                          'manage.settings.teamNameAlreadyExists',
                          'This team name is already in use. Please choose a different name.',
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Members */}
                <div className="mt-6 flex flex-1 flex-col overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">Users</p>
                      <p className="ml-2 text-sm text-gray-500">(Optional)</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.selectedUserIds.length} selected
                    </p>
                  </div>

                  {/* Users List */}
                  <div className="mt-3 flex-1 overflow-y-auto rounded-md border border-gray-300">
                    <div className="relative m-2">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={editSearchTerm}
                        onChange={(e) => setEditSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    {sortedUsers.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        <div className="text-center">
                          <p>No users found.</p>
                          {editSearchTerm && (
                            <p className="text-sm">
                              Try adjusting your search term.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {sortedUsers.map((user) => (
                          <label
                            key={user.id}
                            className="flex cursor-pointer p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedUserIds.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="mt-[2px] rounded border border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
                              style={{ width: '16px', height: '16px' }}
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm">{user.email}</div>
                              {user.teams && user.teams.length > 0 ? (
                                <div className="text-sm text-gray-500">
                                  {user.teams
                                    .map((team: { id: string; name: string }) => team.name)
                                    .join(', ')}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  {t('no_team_assigned', 'No team assigned')}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !formData.name.trim() ||
                      !isFormDirty() ||
                      duplicateNameError
                    }
                    className="rounded-full bg-orange-600 px-6 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading
                      ? 'Saving...'
                      : currentMode === 'create'
                        ? 'Create Team'
                        : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
