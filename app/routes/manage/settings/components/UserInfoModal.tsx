import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole: string | null;
  userTeams: string[] | null;
  teams: any;
}

export function UserInfoModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  userTeams,
  teams,
}: UserInfoModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const getAvatarInitials = (name: string): string => {
    if (!name?.trim()) return '?';

    const words = name.trim().split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatRole = (role: string | null): string => {
    if (!role) return 'Superadmin';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const renderTeams = () => {
    if (
      userRole === 'superadmin' ||
      (userRole === 'admin' && !userTeams?.length)
    ) {
      return (
        <p className="text-sm text-gray-900">
          {t('manage.userDetails.allTeams', 'All teams')}
        </p>
      );
    }

    if (!teams?.length) {
      return (
        <span className="text-sm text-gray-500">
          {' '}
          {t('manage.noTeams', 'No teams assigned')}
        </span>
      );
    }

    const teamNames = teams.map((team: any) => team.name).join(', ');
    return <p className="text-sm text-gray-900">{teamNames}</p>;
  };

  if (!isOpen) return null;

  const avatarInitials = getAvatarInitials(userName);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-info-title"
    >
      <div
        ref={modalRef}
        className="mx-4 max-h-[90vh] w-full max-w-[360px] overflow-visible rounded-lg bg-white px-4 py-6 shadow-xl"
        role="document"
      >
        {/* Header */}
        <div className="flex justify-between">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D85604]">
            <span
              className="text-lg font-semibold text-white"
              aria-hidden="true"
            >
              {avatarInitials}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User Info Content */}
        <div>
          <p
            id="user-info-title"
            className="text-md font-semibold text-[#161618]"
          >
            {userName}
          </p>
          <p className="text-sm text-gray-600">{userEmail}</p>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* Role and Teams Section */}
          <div className="space-y-4">
            {/* Role */}
            <div className="mb-4">
              <p className="block text-sm text-gray-500">
                {t('manage.role', 'Role')}
              </p>
              <p className="text-sm text-gray-900">{formatRole(userRole)}</p>
            </div>

            {/* Teams */}
            <div className="mb-4">
              <p className="block text-sm text-gray-500">
                {' '}
                {t('manage.teams', 'Teams')}
              </p>
              {renderTeams()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
