import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { manageUsersApi, type FilterOption } from '../../../../util/api';
import { toast } from 'react-hot-toast';
import { CustomDropdown } from '~/components/CustomDropdown';
import { FILTER_ROLES } from '../settings';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: FilterOption[] | undefined;
}

export function InviteUserModal({
  isOpen,
  onClose,
  teams,
}: InviteUserModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    teamIds: [] as string[],
  });
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const inviteUserMutation = useMutation({
    mutationFn: (data: any) => manageUsersApi.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-users'] });
      onClose();
      // Reset form
      setFormData({
        email: '',
        role: '',
        teamIds: [],
      });
      toast.success(t('manage.settings.userInvited', 'User invited.'));
    },
    onError: (error: any) => {
      // Don't show toast if it's a userExists error (inline error already shown)
      if (!error?.json?.userExists) {
        toast.error(
          t('manage.settings.errorInvitingUser', 'Error inviting user'),
        );
      }
    },
  });

  // Reset form and clear errors when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        role: '',
        teamIds: [],
      });
      inviteUserMutation.reset();
    }
  }, [isOpen]);

  // Handle superadmin role selection - auto-select all teams and disable team selection
  useEffect(() => {
    if (formData.role === 'superadmin' && teams) {
      setFormData((prev) => ({
        ...prev,
        teamIds: teams.map((team) => team.id),
      }));
    }
  }, [formData.role, teams]);

  // Close dropdown when clicking outside or when modal closes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTeamDropdownOpen(false);
      }
    };

    if (isTeamDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTeamDropdownOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      teamIds: formData.role === 'superadmin' ? [] : formData.teamIds,
    };
    inviteUserMutation.mutate(submitData);
  };

  const handleTeamToggle = (teamId: string) => {
    // Don't allow team changes for superadmin
    if (formData.role === 'superadmin') return;

    // Allow multiple selection for all roles
    setFormData((prev) => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter((id) => id !== teamId)
        : [...prev.teamIds, teamId],
    }));
  };


  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      // Clear teams when role changes (except for superadmin which will be handled by useEffect)
      teamIds: newRole === 'superadmin' ? prev.teamIds : [],
    }));
  };

  const getSelectedTeamsText = () => {
    if (!teams) return 'No teams available';
    if (formData.teamIds.length === 0) return 'Select team(s)';

    if (formData.role === 'superadmin') {
      return 'All teams';
    }

    if (formData.teamIds.length === 1) {
      const selectedTeam = teams.find(
        (team) => team.id === formData.teamIds[0],
      );
      return selectedTeam?.name || '';
    }
    return `${formData.teamIds.length} teams selected`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isTeamSelectionDisabled = formData.role === 'superadmin';
  const shouldShowTeamSelection = formData.role && formData.role !== '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-[480px] overflow-visible rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Invite user</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          {/* Email Field */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="Enter email address"
              required
            />
            {inviteUserMutation.error?.json?.userExists && (
              <div className="m-1 text-sm text-red-600">
                {t(
                  'manage.settings.userAlreadyExists',
                  'This email belongs to an existing user (including deactivated accounts). Please update their details in the existing record.',
                )}
              </div>
            )}
          </div>

          {/* Role Dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role *
            </label>
            <CustomDropdown
              value={formData.role}
              onChange={handleRoleChange}
              options={FILTER_ROLES?.filter(
                (role: any) => role.id !== 'all',
              ).map((role: any) => {
                return {
                  value: role.id,
                  label: role.name,
                  description: role.description ? t(role.description) : undefined,
                };
              })}
              placeholder="Select role"
            />
          </div>

          {/* Teams Dropdown - Only show after role is selected */}
          {shouldShowTeamSelection && (
            <div className="relative" ref={dropdownRef}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Team{' '}
                <span className="font-normal text-gray-500">(Optional)</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  !isTeamSelectionDisabled &&
                  setIsTeamDropdownOpen(!isTeamDropdownOpen)
                }
                disabled={isTeamSelectionDisabled}
                className={`flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-left text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                  isTeamSelectionDisabled
                    ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                    : 'bg-white'
                }`}
              >
                <span
                  className={
                    formData.teamIds.length === 0 && !isTeamSelectionDisabled
                      ? 'text-gray-500'
                      : 'text-gray-900'
                  }
                >
                  {getSelectedTeamsText()}
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isTeamDropdownOpen ? 'rotate-180 transform' : ''
                  } ${isTeamSelectionDisabled ? 'opacity-50' : ''}`}
                />
              </button>

              {isTeamDropdownOpen && !isTeamSelectionDisabled && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg">
                  <div className="max-h-40 overflow-y-auto">
                    {teams && teams.length > 0 ? (
                      <>
                        {teams.map((team: FilterOption) => (
                          <label
                            key={team.id}
                            className="flex cursor-pointer items-center p-3 hover:bg-gray-50"
                            onClick={(e) => {
                              e.preventDefault();
                              handleTeamToggle(team.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.teamIds.includes(team.id)}
                              onChange={() => handleTeamToggle(team.id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="ml-3 flex-1">
                              <span className="text-sm text-gray-700">
                                {team.name}
                              </span>
                            </div>
                          </label>
                        ))}
                      </>
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        No teams available
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="mt-1 text-xs text-gray-500">
                This user will only have access to data from their assigned
                team.
              </p>
            </div>
          )}
          {inviteUserMutation.error &&
            !inviteUserMutation.error?.json?.userExists && (
              <div className="mt-[-12px] text-sm text-red-600">
                {(inviteUserMutation.error as any)?.json?.error ||
                  'Failed to send invite'}
              </div>
            )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                inviteUserMutation.isPending ||
                !formData.email ||
                !formData.role
              }
              className="rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inviteUserMutation.isPending ? 'Sending invite...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
