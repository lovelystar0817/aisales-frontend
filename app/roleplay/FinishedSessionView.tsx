import { useTranslation } from 'react-i18next';
import { Button } from '~/components/button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { Session } from '~/routes/app/roleplay/types';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import { apiProtected } from '~/util/api';
import { useMemo } from 'react';

interface FinishedSessionViewProps {
  session: Session;
}

export function FinishedSessionView({ session }: FinishedSessionViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatDuration = (session: Session) => {
    let durationMs = 0;
    if (session.roleplay.duration) {
      durationMs = session.roleplay.duration * 1000;
    } else if (session.startedAt && session.endedAt) {
      durationMs =
        new Date(session.endedAt).getTime() -
        new Date(session.startedAt).getTime();
    }
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const { mutate: startNewSession } = useMutation({
    mutationFn: async ({
      personaId,
      callType,
      productId,
    }: {
      personaId: string;
      callType: string;
      productId: string;
    }) => {
      return apiProtected()
        .url('/sessions')
        .post({ personaId, callType, productId })
        .json<any>();
    },
    onSuccess(response) {
      console.log('New session created:', response.sessionId);
      navigate(`/roleplay/${response.sessionId}`);
    },
    onError(error) {
      console.error('Failed to create new session:', error);
      toast.error(error.message || t('common.error'));
    },
  });

  const regularScore = useMemo(() => {
    if (session.assessmentType !== 'prudential') {
      const feedbackData = session?.roleplay?.feedback;
      const hasSalesTechniques = Boolean(feedbackData?.salesTechniques);
      const hasProductKnowledge = Boolean(feedbackData?.productKnowledge);

      let salesTechniquesData = null;
      let productKnowledgeData = null;

      try {
        if (hasSalesTechniques) {
          salesTechniquesData = JSON.parse(feedbackData?.salesTechniques ?? '{}');
        }
        if (hasProductKnowledge) {
          productKnowledgeData = JSON.parse(feedbackData?.productKnowledge ?? '{}');
        }
      } catch (e) {
        console.error('Failed to parse feedback data:', e);
      }

      const validScores = [
        salesTechniquesData?.overallScore,
        productKnowledgeData?.overallScore,
      ].filter((score) => score != null && score !== undefined);

      return validScores.length > 0
        ? Math.round(
            validScores.reduce((acc, score) => acc + (score || 0), 0) /
              validScores.length,
          )
        : null;
    }
    return null;
  }, [session.assessmentType]);

  const onViewAssessment = () => {
    navigate(`/roleplay/${session._id}/assessment?fromPast=1`);
  };

  const onPracticeAgain = () => {
    const personaId = session.persona?._id;
    const callType = session.callType;
    const productId = session.product?.friendlyId || session.product?.id;

    if (!personaId || !callType || !productId) {
      toast.error(t('assessment.unableToRestartPractice'));
      return;
    }

    startNewSession({ personaId, callType, productId });
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto w-full max-w-2xl px-4 text-center sm:px-6">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center sm:mb-8">
          <div className="rounded-full bg-green-100 p-3 sm:p-4">
            <CheckCircleIcon className="h-12 w-12 text-green-600 sm:h-16 sm:w-16" />
          </div>
        </div>

        {/* Title and Status */}
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          {t('sessions.sessionCompleted')}
        </h1>

        <p className="mb-8 text-sm text-gray-600">
          {t('sessions.sessionCompletedDescription')}
        </p>

        {/* Session Summary Card */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-3 sm:gap-6">
            {/* Score */}
            {session.standing && (
              <div className="text-center">
                <div className="text-xs text-gray-500 sm:text-sm">
                  {t('sessions.sessionStanding')}
                </div>
                <div className="text-xl font-bold">
                  {session.standing.tierName}
                </div>
              </div>
            )}
            {!session.standing && (
              <div className="text-center">
                <div className="text-xs text-gray-500 sm:text-sm">
                  {t('sessions.overallScore')}
                </div>
                <div className="text-xl font-bold">
                  {regularScore === null ? '-' : regularScore + '%'}
                </div>
              </div>
            )}

            {/* Persona */}
            <div className="hidden text-center md:block">
              <div className="mb-4">
                {session.persona?.image && (
                  <img
                    src={session.persona.image}
                    alt={session.persona.name}
                    className="mx-auto size-10 rounded-full object-cover sm:size-16"
                  />
                )}
              </div>
              <div className="text-sm font-medium text-gray-900 sm:text-base">
                {session.persona?.name}
              </div>
              <div className="text-sm text-gray-500">
                {session.persona?.occupation}
              </div>
            </div>

            {/* Duration */}
            <div className="text-center">
              <div className="text-xs text-gray-500 sm:text-sm">
                {t('sessions.duration')}
              </div>
              <div className="text-xl font-bold text-gray-900 sm:text-2xl">
                {formatDuration(session)}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mb-10 text-xs text-gray-500 sm:text-sm">
          <p>
            {t('sessions.sessionFinishedAt', {
              time: new Date(session.endedAt!).toLocaleString(),
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mx-auto mb-6 flex max-w-[300px] flex-col justify-center gap-3 sm:gap-4">
          <Button
            onClick={onViewAssessment}
            className="inline-flex justify-center"
            size="lg"
          >
            {t('sessions.viewAssessment')}
          </Button>

          <Button
            variant="custom"
            onClick={onPracticeAgain}
            className="inline-flex justify-center border border-gray-300 bg-white"
            size="lg"
          >
            {t('sessions.practiceAgain')}
          </Button>
        </div>

        <Link to="/" className="text-sm text-gray-500">
          {t('sessions.returnHome')}
        </Link>
      </div>
    </div>
  );
}
