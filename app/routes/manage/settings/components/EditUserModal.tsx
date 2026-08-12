import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  manageUsersApi,
  type ManageUser,
  type FilterOption,
} from '../../../../util/api';
import toast from 'react-hot-toast';
import { FILTER_ROLES } from '../settings';
import { CustomDropdown } from '~/components/CustomDropdown';
import { ExternalLinkIcon } from '../../../../../public/icons/icons';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ManageUser | null;
  teams: FilterOption[] | undefined;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  teams,
}: EditUserModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    role: 'user',
    teamIds: [] as string[],
  });
  const [initialFormData, setInitialFormData] = useState({
    role: 'user',
    teamIds: [] as string[],
  });
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => manageUsersApi.updateUser(user!.email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-users'] });
      onClose();
      toast.success(t('manage.settings.userEdited', 'User edited.'));
    },
    onError: (error: any) => {
      toast.error(t('manage.settings.errorEditingUser', 'Error editing user'));
    },
  });

  useEffect(() => {
    if (user) {
      const initialData = {
        role: user.role || 'user',
        teamIds: user.teams.map((team) => team.id),
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [user]);

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

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      teamIds: formData.role === 'superadmin' ? [] : formData.teamIds,
    };
    updateUserMutation.mutate(submitData);
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

  const handleManageAllTeams = () => {
    // Select all teams when "Manage all teams" is clicked
    if (teams) {
      setFormData((prev) => ({
        ...prev,
        teamIds: teams.map((team) => team.id),
      }));
    }
  };

  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      // Clear teams when changing from superadmin to another role
      teamIds: prev.role === 'superadmin' && newRole !== 'superadmin' ? [] : prev.teamIds,
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

  const isFormDirty = () => {
    // Compare role
    if (formData.role !== initialFormData.role) {
      return true;
    }

    // Compare teamIds arrays
    if (formData.teamIds.length !== initialFormData.teamIds.length) {
      return true;
    }

    // Check if all teamIds are the same (order independent)
    const currentTeamIdsSet = new Set(formData.teamIds);
    const initialTeamIdsSet = new Set(initialFormData.teamIds);

    for (const id of currentTeamIdsSet) {
      if (!initialTeamIdsSet.has(id)) {
        return true;
      }
    }

    return false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-[480px] overflow-visible rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit user</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
          {/* Read-only Email Field */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              readOnly
            />
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

          {/* Teams Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Team <span className="font-normal text-gray-500">(Optional)</span>
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
                      {formData.role === 'admin' && (
                        <button
                          type="button"
                          onClick={handleManageAllTeams}
                          className="flex w-full cursor-pointer items-center p-3 text-left text-blue-600 hover:bg-gray-50"
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                          <div className="ml-3 flex-1">
                            <span className="text-sm font-medium">
                              Manage all teams
                            </span>
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="p-3 text-sm text-gray-500">
                      No teams available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={updateUserMutation.isPending || !isFormDirty()}
              className="rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {updateUserMutation.error && (
            <div className="mt-2 text-sm text-red-600">
              {(updateUserMutation.error as any)?.message ||
                'Failed to update user'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
