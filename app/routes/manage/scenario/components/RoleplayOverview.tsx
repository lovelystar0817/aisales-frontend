import { useNavigate } from 'react-router';

interface RoleplayOverviewProps {
  selectedPersona?: {
    id?: string;
    _id?: string;
    name: string;
    image?: string;
    occupation: string;
    age?: number;
  } | null;
  selectedModule?: {
    objectives?: string | string[];
  } | null;
  selectedScorecard?: {
    id?: string;
    _id?: string;
    name: string;
  } | null;
  selectedProduct?: {
    name: string;
  } | null;
  personaId: string;
  scorecardId: string;
}

export function RoleplayOverview({
  selectedPersona,
  selectedModule,
  selectedScorecard,
  selectedProduct,
  personaId,
  scorecardId,
}: RoleplayOverviewProps) {
  const navigate = useNavigate();

  return (
    <div className="max-h-[max-content] w-1/3 space-y-4 rounded-xl bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Roleplay overview</h3>

      {/* Persona Info */}
      {selectedPersona && (
        <div>
          <div className="flex items-center gap-3">
            <img
              src={selectedPersona.image || '/default-avatar.png'}
              alt={selectedPersona.name}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-medium">{selectedPersona.name}</div>
              <div className="text-sm text-gray-500">
                {selectedPersona.age && `Age ${selectedPersona.age}, `}
                {selectedPersona.occupation}
              </div>
            </div>
            <button
              onClick={() => navigate(`/manage/persona/${personaId}`)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              View details
            </button>
          </div>
        </div>
      )}

      {/* Practice Objectives */}
      {selectedModule?.objectives && (
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-1 text-sm font-medium">Practice objectives</div>
          <div className="text-sm whitespace-pre-line text-gray-600">
            {Array.isArray(selectedModule.objectives)
              ? selectedModule.objectives
                  ?.map((item: string) =>
                    selectedModule?.objectives &&
                    selectedModule?.objectives?.length > 1
                      ? `• ${item}`
                      : item,
                  )
                  ?.join('\n ')
              : selectedModule.objectives}
          </div>
        </div>
      )}

      {/* Scorecard */}
      {selectedScorecard && (
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-1 text-sm font-medium">Scorecard</div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedScorecard.name}
            </div>
            <button
              onClick={() => navigate(`/manage/scorecard/${scorecardId}`)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              View details
            </button>
          </div>
        </div>
      )}

      {/* Product */}
      {selectedProduct && (
        <div className="border-t border-gray-200 pt-4">
          <div className="mb-2 text-sm font-medium">Product</div>
          <div className="text-sm text-gray-600">{selectedProduct.name}</div>
        </div>
      )}
    </div>
  );
}
