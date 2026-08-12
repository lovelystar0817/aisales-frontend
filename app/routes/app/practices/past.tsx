import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Locale } from 'date-fns';
import { format, parseISO } from 'date-fns';
import {
  enUS,
  id as idLocale,
  ms as msLocale,
  th as thLocale,
  vi as viLocale,
} from 'date-fns/locale';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import PracticesLayout from '~/layouts/practices';
import PastPractices from '~/past-practices/PastPractices';
import { apiProtected } from '~/util/api';
import { withAuthenticationRequiredOptions } from '~/util/auth0';

interface Standing {
  _id: string;
  user: string;
  company: string;
  session: string;
  persona: string;
  standingConfiguration: string;
  tierName: string;
  tierLevel: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
interface GreatEasternCriterion {
  title: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface GreatEasternAssessmentSection {
  title: string;
  score: number;
  maxScore: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  criteria?: GreatEasternCriterion[];
}

interface GreatEasternAssessmentData {
  overallScore: number;
  overallFeedback?: string;
  sections: GreatEasternAssessmentSection[];
  nextSteps?: string[];
}

interface PastSession {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  callType: string;
  assessmentType?: string;
  product: {
    name: string;
  };
  persona: {
    name: string;
    occupation: string;
  };
  scores: {
    salesTechnique: number | null;
    productKnowledge: number | null;
    softSkills?: number | null;
    overallScore?: number | null;
    // BBL-specific scores
    processAdherence?: number | null;
    advisoryTechnique?: number | null;
    // HSBC-specific scores
    relationshipManagement?: number | null;
    hsbcProcessAdherence?: number | null;
    representation?: number | null;
    communicationAndPresence?: number | null;
    // AXA PH-specific scores
    axaPhSoftSkills?: number | null;
    axaPhKnowledgeSkills?: number | null;
    // KT AXA-specific scores
    ktAxaSoftSkills?: number | null;
    ktAxaKnowledgeSkills?: number | null;
    ktAxaProductKnowledge?: number | null;
    // MSIG Travel Easy-specific scores
    msigTravelEasySoftSkills?: number | null;
    msigTravelEasyKnowledgeSkills?: number | null;
    msigTravelEasyProductKnowledge?: number | null;
    // AIA Korea-specific scores
    aiaKoIntroduction?: number | null;
    aiaKoObjectionHandling?: number | null;
    aiaKoNeedsExploration?: number | null;
    aiaKoE2EAssessment?: number | null;
    // Prudential PH Fact Finding-specific scores
    prudentialPHFactFindingTechnique?: number | null;
    prudentialPHProductKnowledge?: number | null;
    // Great Eastern-specific scores (3 sections)
    greatEasternSoftSkills?: number | null;
    greatEasternKnowledgeSkills?: number | null;
    greatEasternFinancialPlanning?: number | null;
  };
  // Great Eastern nested assessment data (if returned by backend)
  greatEasternAssessment?: GreatEasternAssessmentData;
  standing: Standing | null;
  duration?: number;
}

interface PaginatedResponse<T> {
  data: T[];
}

const DATE_LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  id: idLocale,
  ms: msLocale,
  th: thLocale,
  tl: enUS,
  vi: viLocale,
  ceb: enUS,
};

export function meta() {
  return [
    { title: 'Hupo Sales AI | Past practices' },
    // { name: "description", content: "Welcome to React Router!" },
  ];
}

export default withAuthenticationRequired(function PastPracticesRoute() {
  const { t, i18n } = useTranslation();
  const limit = 10;
  const loaderRef = useRef<HTMLDivElement>(null);

  const dateLocale = useMemo(() => {
    const languageCode = i18n.language?.split('-')[0] ?? 'en';
    return DATE_LOCALE_MAP[languageCode] ?? enUS;
  }, [i18n.language]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['past-sessions'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await apiProtected()
          .url('/sessions/past')
          .query({ limit: limit.toString(), offset: pageParam.toString() })
          .get()
          .json<PaginatedResponse<PastSession>>();
      } catch (error) {
        console.error('Error fetching past sessions:', error);
        return { data: [] };
      }
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      return lastPage.data.length === limit ? lastPageParam + limit : undefined;
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    const currentRef = loaderRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const sessions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) =>
      page.data.map((session: PastSession) => {
        // Extract Great Eastern scores from nested assessment if available
        let greatEasternScores = {};
        const geAssessment = session.greatEasternAssessment;
        const geSections = geAssessment?.sections;
        if (
          session.assessmentType === 'great-eastern' &&
          geSections &&
          geSections.length >= 3
        ) {
          const sections = geSections;
          // Normalize scores to 0-100 scale
          const normalizeScore = (score: number, maxScore: number) =>
            maxScore && maxScore !== 100
              ? Math.round((score / maxScore) * 100)
              : score;

          greatEasternScores = {
            greatEasternSoftSkills: normalizeScore(
              sections[0].score,
              sections[0].maxScore,
            ),
            greatEasternKnowledgeSkills: normalizeScore(
              sections[1].score,
              sections[1].maxScore,
            ),
            greatEasternFinancialPlanning: normalizeScore(
              sections[2].score,
              sections[2].maxScore,
            ),
          };
        }

        return {
          ...session,
          startedAt: format(parseISO(session.startedAt), 'd MMM yyyy', {
            locale: dateLocale,
          }),
          endedAt: format(parseISO(session.endedAt), 'd MMM yyyy', {
            locale: dateLocale,
          }),
          scores: {
            ...session.scores,
            // Use extracted scores if backend doesn't provide flattened scores
            ...(session.scores.greatEasternSoftSkills == null &&
              greatEasternScores),
            // Also set overallScore from greatEasternAssessment if not set
            overallScore:
              session.scores.overallScore ?? geAssessment?.overallScore ?? null,
          },
        };
      }),
    );
  }, [data, dateLocale]);

  return (
    <PracticesLayout>
      {isLoading && (
        <div className="p-8 text-center">{t('common.loading')}</div>
      )}
      {error && (
        <div className="p-8 text-center text-red-500">
          {t('pastPractices.failedToLoad')}
        </div>
      )}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <h2 className="mb-4 text-2xl font-bold">
            {t('pastPractices.emptyTitle')}
          </h2>
          <p className="mb-8 max-w-md text-gray-600">
            {t(
              'pastPractices.emptyDescription',
              'Start your first session to practice real sales conversations, get targeted feedback, and unlock actionable tips to improve your pitch.',
            )}
          </p>
          <Link
            to="/practices/new"
            className="rounded-full bg-[#F15A29] px-6 py-3 font-medium text-white transition-colors hover:bg-[#E04D1E]"
          >
            {t('pastPractices.startNewPractice')}
          </Link>
        </div>
      )}
      {!isLoading &&
        !error &&
        sessions.length > 0 &&
        sessions.map((session: PastSession) => (
          <PastPractices
            key={session.id}
            id={session.id}
            title={session.title}
            startedAt={session.startedAt}
            endedAt={session.endedAt}
            callType={session.callType}
            product={session.product}
            persona={session.persona}
            scores={session.scores}
            assessmentType={session.assessmentType}
            standing={session.standing}
            duration={session.duration}
          />
        ))}
      {hasNextPage && (
        <div ref={loaderRef} className="p-8 text-center">
          {isFetchingNextPage ? t('common.loading') : null}
        </div>
      )}
    </PracticesLayout>
  );
}, withAuthenticationRequiredOptions);
