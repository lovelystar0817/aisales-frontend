import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiManage } from '~/util/api';
import { CustomDropdown } from '~/components/CustomDropdown';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface Voice {
  _id: string;
  friendlyId: string;
  providerId: string;
  name: string;
  language: string;
  gender: string;
  ageGroup?: string;
  description?: string;
}

interface VoiceListResponse {
  success: boolean;
  voices: Voice[];
  voicesByLanguage: Record<string, Voice[]>;
}

interface Props {
  gender: string;
  selectedVoices: Record<string, string>; // { langCode: voiceId }
  onChange: (voices: Record<string, string>) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', required: true },
  { code: 'id', name: 'Bahasa Indonesia', required: false },
  { code: 'ms', name: 'Bahasa Melayu', required: false },
  { code: 'th', name: 'Thai', required: false },
  { code: 'tl', name: 'Tagalog', required: false },
  { code: 'vi', name: 'Vietnamese', required: false },
];

export function LanguageVoiceSelector({
  gender,
  selectedVoices,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      if (audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
    setLoadingVoiceId(null);
  }, []);

  const playVoicePreview = useCallback(
    async (voiceId: string) => {
      // If already playing this voice, stop it
      if (playingVoiceId === voiceId) {
        stopAudio();
        return;
      }

      // Stop any currently playing audio
      stopAudio();

      setLoadingVoiceId(voiceId);

      try {
        const response = await apiManage()
          .url(`/manage/voice/preview/${voiceId}`)
          .get()
          .res();

        if (!response.ok) {
          throw new Error('Failed to fetch voice preview');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          stopAudio();
        };

        audio.onerror = () => {
          toast.error(t('errors.audioPlaybackFailed', 'Failed to play audio'));
          stopAudio();
        };

        setLoadingVoiceId(null);
        setPlayingVoiceId(voiceId);
        await audio.play();
      } catch (error) {
        console.error('Error playing voice preview:', error);
        toast.error(
          t('errors.voicePreviewFailed', 'Failed to load voice preview'),
        );
        stopAudio();
      }
    },
    [playingVoiceId, stopAudio, t],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['voices', gender],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/voice/list')
        .query({ gender })
        .get()
        .json<VoiceListResponse>();
      return response;
    },
    enabled: !!gender,
  });

  const handleVoiceChange = (lang: string, voiceId: string) => {
    onChange({
      ...selectedVoices,
      [lang]: voiceId,
    });
  };

  if (!gender) {
    return (
      <p className="text-sm text-gray-500">
        {t('manage.persona.selectGenderFirst', 'Please select a gender first')}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
        {t('manage.persona.loadingVoices', 'Loading voices...')}
      </div>
    );
  }

  const getActionLabel = (voiceId: string) => {
    if (loadingVoiceId === voiceId) return '...';
    if (playingVoiceId === voiceId) return '■';
    return '▶';
  };

  return (
    <div className="space-y-4">
      {SUPPORTED_LANGUAGES.map(({ code, name, required }) => {
        const voicesForLang = data?.voicesByLanguage?.[code] || [];
        const options = voicesForLang.map((v) => ({
          value: v._id,
          label: v.name,
          action: {
            label: getActionLabel(v._id),
            onClick: () => playVoicePreview(v._id),
            closeOnClick: false,
          },
        }));

        return (
          <div key={code} className="flex items-center gap-4">
            <span className="w-36 text-sm font-medium text-gray-900">
              {name}
              {required && <span className="ml-1 text-red-500">*</span>}
            </span>
            <div className="flex-1 max-w-[300px]">
              {options.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                  {t('manage.persona.noVoicesAvailable', 'No voices available')}
                </div>
              ) : (
                <CustomDropdown
                  value={selectedVoices[code] || ''}
                  onChange={(val) => handleVoiceChange(code, val)}
                  options={options}
                  placeholder={t('manage.persona.selectVoice', 'Select voice')}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
