import { Check, Loader2, User2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonaAvatar = ({
  avatars,
  selectedAvatarId,
  onSelectAvatar,
  handleGenerateAvatar,
  isImageGenerating,
  generatedImage,
}: {
  avatars: any[] | undefined;
  selectedAvatarId: string | null;
  onSelectAvatar: (id: string, image: string) => void;
  handleGenerateAvatar: () => void;
  isImageGenerating: boolean;
  generatedImage: string | null;
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-900">
          {t('manage.persona.selectPersonaImage')}
        </label>
        <div className="mb-3 grid grid-cols-3 gap-3">
          {avatars?.map((persona) => (
            <button
              key={persona.id}
              onClick={() => onSelectAvatar(persona.id, persona.image)}
              className={`aspect-square rounded-full border-4 transition-all ${
                selectedAvatarId === persona.id
                  ? 'scale-95 border-blue-500'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={persona.image}
                alt={`Persona ${persona.id}`}
                className="h-full w-full rounded-full object-cover"
              />
              {selectedAvatarId === persona.id && (
                <span className="absolute inset-x-0 bottom-[-12px] mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <Check className="size-3 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <div className="w-full border-t border-gray-200" />
          <p className="mx-4 mt-[-10px] text-center text-sm text-gray-600">
            or
          </p>
          <div className="w-full border-t border-gray-200" />
        </div>
      </div>

      <div>
        <label className="mt-5 mb-2 block text-sm font-medium text-gray-900">
          {t('manage.persona.generatePersonaImage')}
        </label>
        <p className="mb-3 text-sm text-gray-600">
          {t('manage.persona.generatePersonaImageDescription')}
        </p>
        <div className="flex flex-col">
          <div className="mt-1 mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
            {generatedImage ? (
              <div className="h-full w-full scale-100 rounded-full border-4 border-blue-500">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="h-full w-full rounded-full object-cover"
                />

                <span className="absolute inset-x-0 bottom-[-12px] mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                  <Check className="size-3 text-white" />
                </span>
              </div>
            ) : (
              <User2Icon className="h-16 w-16 text-gray-300" />
            )}
          </div>
          <button
            onClick={handleGenerateAvatar}
            className="mt-1 w-34 rounded-full border border-gray-300 px-2 py-[6px] text-sm text-gray-900 hover:bg-gray-50"
            disabled={isImageGenerating}
          >
            {isImageGenerating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : generatedImage ? (
              'Regenerate image'
            ) : (
              'Generate image'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
