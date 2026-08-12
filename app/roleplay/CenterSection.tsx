import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Badge } from '~/components/badge';
import { Button } from '~/components/button';
import { VoiceWaves } from '~/components/voice-waves';
import type { Persona } from '~/routes/app/roleplay/types';
import { SessionPhase } from '~/util/constants';
import { isFeatureBranch } from '~/util/environment';

const AIA_KO_VOICE_CONFIGS = [
  { value: '11labs-direct', label: 'ElevenLabs V3 Conversational (default)' },
  { value: 'aiako-gpt52-cartesia', label: 'LK: GPT-5.2 + Cartesia Voice Clone' },
  { value: 'aiako-gpt52-turbo', label: 'LK: GPT-5.2 + Turbo v2.5' },
  { value: 'aiako-gpt41mini-turbo', label: 'LK: GPT-4.1 Mini + Turbo v2.5' },
];

function VoiceConfigSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = searchParams.get('config') || '11labs-direct';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5">
      <span className="text-xs font-medium text-orange-700">Config:</span>
      <select
        value={current}
        onChange={(e) => {
          setSearchParams((prev) => {
            prev.set('config', e.target.value);
            return prev;
          });
        }}
        className="rounded border border-orange-300 bg-white px-2 py-0.5 text-xs text-orange-800"
      >
        {AIA_KO_VOICE_CONFIGS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CenterSection({
  handleStartPractice,
  isAISpeaking,
  sessionPhaseRef,
  persona,
  displayTranscript,
  product,
  callType,
  moduleId,
  assessmentType,
  onImportTranscript,
}: {
  handleStartPractice: () => void;
  isAISpeaking: boolean;
  sessionPhaseRef: React.MutableRefObject<SessionPhase>;
  persona?: Persona;
  displayTranscript: boolean;
  product?: string;
  callType?: string;
  moduleId?: string;
  assessmentType?: string;
  onImportTranscript?: () => void;
}) {
  const { t } = useTranslation();

  const displayProduct =
    product &&
    moduleId &&
    !moduleId.startsWith('bbl-') &&
    !moduleId.startsWith('hsbc-');
  const showVoiceSelector =
    isFeatureBranch() &&
    (assessmentType === 'aia-ko-opening-objection-call' ||
      assessmentType === 'aia-ko-product-pitch');

  return (
    <>
      {/* Desktop Layout - Original Design */}
      <div className="absolute hidden h-full w-full flex-col items-center justify-center lg:flex">
        <div className="flex flex-col items-center justify-center gap-3">
          <AiAvatarSpeaking
            isAISpeaking={isAISpeaking}
            image={persona?.image}
            isDesktop={true}
            displayTranscript={displayTranscript}
          />
        </div>
        <div className="mt-8 text-center">
          <div className="mb-1 text-xl font-semibold">{persona?.name}</div>
          <div className="mb-6 text-gray-500">
            {persona?.age
              ? t('roleplay.ageAndOccupation', {
                  age: persona?.age,
                  occupation: persona?.occupation,
                })
              : persona?.occupation}
          </div>

          {sessionPhaseRef.current === SessionPhase.PRE_START && (
            <div className="flex flex-col items-center gap-3">
              {showVoiceSelector && <VoiceConfigSelector />}
              <Button
                className={`${displayTranscript ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
                onClick={handleStartPractice}
              >
                {t('practice.startCall')}
              </Button>
              {onImportTranscript && (
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                  onClick={onImportTranscript}
                >
                  Import Transcript
                </Button>
              )}
            </div>
          )}
          {sessionPhaseRef.current === SessionPhase.CONNECTING && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {t('sessions.connecting')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Layout - Call-like Design */}
      <div
        className={`flex w-full flex-col space-y-8 text-center lg:hidden ${displayTranscript ? 'items-start justify-start text-left' : 'items-center justify-center'}`}
      >
        {/* AI Avatar and Persona Information */}
        <div
          className={`flex ${displayTranscript ? 'items-start gap-6' : 'flex-col items-center space-y-6'}`}
        >
          <div className={displayTranscript ? 'mb-0' : 'mb-8'}>
            <AiAvatarSpeaking
              isAISpeaking={isAISpeaking}
              image={persona?.image}
              isDesktop={false}
              displayTranscript={displayTranscript}
            />
          </div>

          {/* Persona Information */}
          <div className={`${displayTranscript ? 'space-y-1' : 'space-y-2'}`}>
            <h1 className="text-xl font-bold text-gray-900 md:text-3xl">
              {persona?.name ?? t('roleplay.client')}
            </h1>
            <p className="text-base text-gray-600 md:px-0 md:text-lg">
              {persona?.age
                ? t('roleplay.ageAndOccupation', {
                    age: persona.age,
                    occupation: persona.occupation,
                  })
                : persona?.occupation}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge
                color="blue"
                className="flex max-w-max text-xs whitespace-nowrap"
              >
                {callType ?? 'Discovery'}
              </Badge>
              {displayProduct && (
                <Badge
                  color="gray"
                  className="flex max-w-max text-xs whitespace-nowrap"
                >
                  {product}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {/* Action Button */}
        {sessionPhaseRef.current === SessionPhase.PRE_START && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex w-full flex-col items-center gap-3 bg-gray-50"
          >
            {showVoiceSelector && <VoiceConfigSelector />}
            <Button
              className="rounded-full px-6 py-3 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
              onClick={handleStartPractice}
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <p className={'text-base'}>{t('sessions.startPractice')}</p>
            </Button>
            {onImportTranscript && (
              <Button
                variant="secondary"
                className="rounded-full px-4 py-2 text-sm"
                onClick={onImportTranscript}
              >
                Import Transcript
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}

// Extract AI Avatar component for better organization
const AiAvatarSpeaking = ({
  isAISpeaking,
  image,
  isDesktop,
  displayTranscript,
}: {
  isAISpeaking: boolean;
  image?: string;
  isDesktop: boolean;
  displayTranscript: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <motion.div
        animate={
          isAISpeaking
            ? {
                scale: [1, 1.05, 1],
                transition: { duration: 2, repeat: Infinity },
              }
            : {}
        }
      >
        <div className="relative">
          <img
            src={
              image
                ? image
                : 'https://dopmo1eihgbgm.cloudfront.net/67135d6f890cc59eb99e65f9/ai-headshot.webp'
            }
            alt={t('roleplay.aiCoach')}
            className={
              isDesktop
                ? `rounded-full object-cover shadow-lg ${displayTranscript ? 'size-32' : 'size-48'}`
                : `rounded-full border-4 border-white object-cover shadow-2xl ${
                    displayTranscript
                      ? 'h-24 w-24 md:h-38 md:w-38'
                      : 'h-48 w-48 lg:h-56 lg:w-56'
                  }`
            }
          />
          {isAISpeaking && (
            <>
              {isDesktop ? (
                <motion.div
                  className="border-primary absolute inset-0 rounded-full border-4"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              ) : (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-green-400"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-300"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
                  />
                </>
              )}
            </>
          )}
          {isAISpeaking && <VoiceWaves volume={100} />}
        </div>
      </motion.div>
    </div>
  );
};
