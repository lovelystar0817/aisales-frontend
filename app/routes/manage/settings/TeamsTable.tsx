import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { type Team, type TeamsResponse } from '../../../util/api';
import { ActionDropdown } from './components/ActionDropdown';

interface ActionItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface TeamsTableProps {
  data: TeamsResponse;
  onViewTeam: (team: Team) => void;
  onEditTeam: (team: Team) => void;
  userRole: string | null;
}

export function TeamsTable({ data, onViewTeam, onEditTeam, userRole }: TeamsTableProps) {
  const getTeamActions = (team: Team): ActionItem[] => {
    const actions: ActionItem[] = [
      {
        label: 'View team',
        onClick: () => onViewTeam(team),
      },
    ];

    // Only show Edit team action if user is superadmin
    if (userRole === 'superadmin') {
      actions.push({
        label: 'Edit team',
        onClick: () => onEditTeam(team),
        disabled: team.id === 'no-team',
      });
    }

    return actions;
  };

  return (
    <div className="rounded-lg bg-white shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="rounded-l-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
              Team
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
              Users
            </th>
            <th className="rounded-r-lg px-6 py-3 text-right text-sm font-medium text-gray-900"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.teams?.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center">
                <div className="text-gray-500">
                  <div className="text-sm font-medium">No teams found</div>
                  <div className="mt-1 text-xs">
                    Create your first team to get started
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.teams.map((team) => (
              <tr key={team.id}>
                <td className="px-6 py-4 align-top whitespace-nowrap">
                  <div className="text-sm text-gray-900">{team.name}</div>
                </td>
                <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                  <div className="text-sm text-gray-900">
                    {team.userCount} {team.userCount === 1 ? 'user' : 'users'}
                  </div>
                </td>
                <td className="align-center px-6 text-right text-sm whitespace-nowrap text-gray-900">
                  <ActionDropdown actions={getTeamActions(team)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
