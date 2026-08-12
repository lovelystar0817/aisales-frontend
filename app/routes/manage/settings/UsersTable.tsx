import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import {
  manageUsersApi,
  type ManageUser,
  type ManageUsersResponse,
} from '../../../util/api';
import { ActionDropdown } from './components/ActionDropdown';
import { useState } from 'react';
import { DeactivateUserModal } from './components/DeactivateUserModal';
import { ReactivateUserModal } from './components/ReactivateUserModal';
import toast from 'react-hot-toast';

interface UsersTableProps {
  data: ManageUsersResponse;
  onEditUser: (user: ManageUser) => void;
  userRole: string | null;
}

export function UsersTable({ data, onEditUser, userRole }: UsersTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [deactivateUserEmail, setDeactivateUserEmail] = useState<string | null>(null);
  const [reactivateUserEmail, setReactivateUserEmail] = useState<string | null>(null);

  // Memoize users data to prevent unnecessary re-renders
  const users = useMemo(() => data.users || [], [data.users]);

  const deactivateUserMutation = useMutation({
    mutationFn: (email: string) => manageUsersApi.deactivateManageUser(email),
    onSuccess: () => {
      // More specific invalidation to prevent cache issues
      queryClient.invalidateQueries({
        queryKey: ['manage-users'],
        exact: false, // This will invalidate all manage-users queries regardless of params
      });
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ['settings-filter-teams'] });
      queryClient.invalidateQueries({ queryKey: ['settings-filter-roles'] });
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: (email: string) => manageUsersApi.reactivateManageUser(email),
    onSuccess: () => {
      // More specific invalidation to prevent cache issues
      queryClient.invalidateQueries({
        queryKey: ['manage-users'],
        exact: false, // This will invalidate all manage-users queries regardless of params
      });
      // Also invalidate filter-related queries
      queryClient.invalidateQueries({ queryKey: ['settings-filter-teams'] });
      queryClient.invalidateQueries({ queryKey: ['settings-filter-roles'] });
    },
  });

  const handleDeactivateConfirm = () => {
    if (deactivateUserEmail) {
      deactivateUserMutation.mutate(deactivateUserEmail, {
        onSuccess: () => {
          setDeactivateUserEmail(null);
          toast.success(
            t('manage.settings.userDeactivated', 'User deactivated.'),
          );
        },

        onError: (error: any) => {
          toast.error(
            t(
              'manage.settings.errorDeactivatingUser',
              'Error deactivating user',
            ),
          );
        },
      });
    }
  };

  const handleReactivateConfirm = () => {
    if (reactivateUserEmail) {
      reactivateUserMutation.mutate(reactivateUserEmail, {
        onSuccess: () => {
          setReactivateUserEmail(null);
          toast.success(
            t('manage.settings.userReactivated', 'User reactivated.'),
          );
        },

        onError: (error: any) => {
          toast.error(
            t(
              'manage.settings.errorReactivatingUser',
              'Error reactivating user',
            ),
          );
        },
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#E7F8F3] text-[#058A62]';
      case 'invited':
        return 'bg-[#E8F1FD] text-[#1C7AEB]';
      default:
        return 'bg-[#EAEDEF] text-[#58595A]';
    }
  };

  // Memoize user actions to prevent unnecessary re-renders
  const getUserActions = useMemo(
    () => (user: ManageUser) => {
      const actions = [];

      // For inactive users, show reactivate option
      if (user.status === 'inactive') {
        actions.push({
          label: reactivateUserMutation.isPending
            ? 'Reactivating...'
            : 'Reactivate user',
          onClick: () => setReactivateUserEmail(user.email),
          disabled: reactivateUserMutation.isPending,
        });
      } else {
        // For active users, show edit and deactivate options
        if (user.status === 'active') {
          actions.push({
            label: 'Edit User',
            onClick: () => onEditUser(user),
          });
        }

        actions.push({
          label: deactivateUserMutation.isPending
            ? 'Deactivating...'
            : 'Deactivate user',
          onClick: () => setDeactivateUserEmail(user.email),
          disabled: deactivateUserMutation.isPending,
        });
      }

      return actions;
    },
    [onEditUser, deactivateUserMutation.isPending, reactivateUserMutation.isPending],
  );

  return (
    <div className="rounded-lg bg-white shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="rounded-l-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
              User
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
              Role
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
              Status
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
              Teams
            </th>
            <th className="rounded-r-lg px-6 py-3 text-right text-sm font-medium text-gray-900"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center">
                <div className="text-gray-500">
                  <div className="text-sm font-medium">No users found</div>
                  <div className="mt-1 text-xs">
                    Try adjusting your search or filters
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={`user-${user.id}-${user.email}`} // More unique key
              >
                <td className="align-center px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="align-center px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {t(
                      user.role,
                      `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`,
                    )}
                  </div>
                </td>
                <td className="align-center px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-sm ${getStatusBadgeColor(
                      user.status,
                    )}`}
                  >
                    {user.status === 'inactive'
                      ? t('deactivated', 'Deactivated')
                      : user.status.charAt(0).toUpperCase() +
                        user.status.slice(1)}
                  </span>
                </td>
                <td className="align-center px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                  {user.role === 'superadmin' ? (
                    'All teams'
                  ) : user.teams?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.teams.map((team, index, array) => (
                        <span key={team.id} className="text-sm text-gray-900">
                          {team.name}
                          {index < array.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm">No teams assigned</span>
                  )}
                </td>
                <td className="align-center px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
                  {userRole === 'superadmin' && (
                    <ActionDropdown
                      actions={getUserActions(user)}
                      trigger={
                        <button
                          className="rounded-md p-1 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                        >
                          <EllipsisHorizontalIcon className="h-7 w-7 text-gray-900" />
                        </button>
                      }
                    />
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Deactivate User Modal */}
      <DeactivateUserModal
        isOpen={Boolean(deactivateUserEmail)}
        onDeactivate={handleDeactivateConfirm}
        onClose={() => setDeactivateUserEmail(null)}
        isLoading={deactivateUserMutation.isPending}
      />

      {/* Reactivate User Modal */}
      <ReactivateUserModal
        isOpen={Boolean(reactivateUserEmail)}
        onReactivate={handleReactivateConfirm}
        onClose={() => setReactivateUserEmail(null)}
        isLoading={reactivateUserMutation.isPending}
      />
    </div>
  );
}
