import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { ActionDropdown } from '../../settings/components/ActionDropdown';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { ConfirmationModal } from '~/components/ConfirmationModal';
import { EllipsisVerticalIcon } from 'lucide-react';

export const ScenarioCard = ({
  scenario,
  handleChangeStatus,
  handleDeleteScenario,
}: {
  scenario: any;
  handleChangeStatus: (scenarioId: string, isActive: boolean) => void;
  handleDeleteScenario: (scenarioId: string) => void;
}) => {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getScenarioActions = () => [
    {
      label: 'View',
      onClick: () => navigate(`/manage/scenario/${scenario.id}`),
    },
    {
      label: 'Edit',
      onClick: () => navigate(`/manage/scenario/${scenario.id}/edit`),
      disabled: scenario.roleplayCount > 0,
      tooltip:
        scenario.roleplayCount > 0
          ? 'Roleplays that have completed sessions cannot be edited.'
          : '',
    },
    {
      label: 'Delete',
      onClick: () => {
        handleDeleteScenario(scenario.id);
      },
      className: 'text-red-600',
      disabled: scenario.hasLinkedRoleplay,
      tooltip: scenario.hasLinkedRoleplay
        ? 'Roleplays that are linked to a session cannot be deleted.'
        : '',
    },
  ];

  return (
    <div key={scenario.id} className="rounded-lg border border-gray-200">
      <div className="flex items-start gap-4">
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <img
                src={scenario.persona.image || '/default-avatar.png'}
                alt={scenario.persona.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h3 className="text-md font-semibold text-gray-900">
                  {scenario.title}
                </h3>
                {scenario.product?.name && (
                  <p className="text-sm text-gray-500">
                    Product:{' '}
                    {scenario.product?.isPlaceholderProduct
                      ? '-'
                      : scenario.product?.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle */}
              <label className="relative inline-flex cursor-pointer items-center border-r border-gray-200 pr-5">
                <input
                  type="checkbox"
                  checked={scenario.isActive}
                  onChange={() => setIsConfirmOpen(!isConfirmOpen)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
              {/* Actions Menu */}
              <ActionDropdown
                actions={getScenarioActions()}
                trigger={
                  <button className="rounded-md p-1 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none">
                    <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
                  </button>
                }
              />
            </div>
          </div>
          <div className="flex px-4 py-3">
            <div className="flex-2">
              <p className="mr-4 text-sm leading-relaxed text-gray-600">
                {scenario.description}
              </p>
            </div>

            <div className="flex flex-1 gap-6 text-sm">
              <div className="flex flex-1 flex-col items-start">
                <span className="text-sm text-gray-700">Persona</span>
                <p
                  onClick={() =>
                    navigate(`/manage/persona/${scenario.persona.id}`)
                  }
                  className="cursor-pointer text-blue-600 underline hover:text-blue-700"
                >
                  {[
                    scenario.persona.name,
                    scenario.persona.age,
                    scenario.persona.occupation,
                  ]
                    .filter((item) => Boolean(item))
                    .join(', ')}
                </p>
              </div>

              <div className="flex flex-1 flex-col items-start">
                <span className="text-sm text-gray-700">Scorecard</span>
                <p
                  onClick={() =>
                    navigate(`/manage/scorecard/${scenario.scorecard.id}`)
                  }
                  className="cursor-pointer text-blue-600 underline hover:text-blue-700"
                >
                  {scenario.scorecard?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onSubmit={() => {
          handleChangeStatus(scenario.id, !scenario.isActive);
          setIsConfirmOpen(false);
        }}
        onClose={() => setIsConfirmOpen(false)}
        title={
          scenario.isActive ? 'Deactivate roleplay?' : 'Activate roleplay?'
        }
        description={
          scenario.isActive
            ? 'Once deactivated, this roleplay will no longer be available for users to practice until you activate it again.'
            : 'Once activated, this roleplay will be available for users to practice.'
        }
        buttonClassName={
          !scenario.isActive ? 'bg-primary-500 hover:bg-primary-600' : ''
        }
        buttonText={scenario.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
};
