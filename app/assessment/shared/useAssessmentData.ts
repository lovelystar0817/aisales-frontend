import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePostHog } from '~/context/posthog';
import { useAuthStore } from '~/store/auth';
import type { ExtendedSession } from '~/assessment/types';
import type { apiProtected, apiManage } from '~/util/api';
import {
  finitePollingRefetchInterval,
  getSalesTechniquesRefetchInterval,
  preferPolledOrFeedback,
} from './assessmentHelpers';

interface UseAssessmentOptions {
  id?: string;
  apiClientFactory: typeof apiProtected | typeof apiManage;
  sessionQueryKey: string; // e.g., 'session' | 'manage-session'
  collectionQueryKey: string; // e.g., 'sessions' | 'manage-sessions'
}

export function useAssessmentData({
  id,
  apiClientFactory,
  sessionQueryKey,
  collectionQueryKey,
}: UseAssessmentOptions) {
  const posthog = usePostHog();
  const { scorm: isScormMode } = useAuthStore();

  const {
    data: session,
    isLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery({
    queryKey: [sessionQueryKey, id],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}`)
        .get()
        .json<{ session: ExtendedSession; status: string }>();

      return response.session;
    },
    enabled: Boolean(id),
    retry: (failureCount, error: any) => {
      // Don't retry on 403 or 404 errors
      if (error?.status === 403 || error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    // In SCORM mode, poll session until scormCompletionReady is true
    // This is the reliable backend signal that ALL assessment jobs are done
    refetchInterval: isScormMode
      ? (query) => {
          const data = query.state.data as ExtendedSession | undefined;
          if (data?.roleplay?.scormCompletionReady) return false; // stop polling
          return 3000; // poll every 3s
        }
      : undefined,
  });

  const assessmentType = session?.assessmentType || 'regular';
  const isRegularAssessmentType =
    assessmentType === 'regular' || !session?.assessmentType;

  const isPrudential = assessmentType === 'prudential';
  const isMSIG = assessmentType === 'msig';
  const isMSIG3F = assessmentType === 'msig-3f';
  const isMSIGTravelEasy = assessmentType === 'msig-travel-easy';
  const isBBL = assessmentType === 'bbl';
  const isHSBC = assessmentType === 'hsbc';
  const isRegular = isRegularAssessmentType && session?.callType !== 'grab-mex';
  const isManulife = assessmentType === 'manulife';
  const isManulifeGoalReady = assessmentType === 'manulife-goalready';
  const isGrabMEX =
    assessmentType === 'grab-mex' ||
    (isRegularAssessmentType && session?.callType === 'grab-mex');
  const isMTLRecruitment = assessmentType === 'mtl-recruitment';
  const isMTLProspectPractice = assessmentType === 'mtl-prospect-practice';
  const isAXAPHRecruitment = assessmentType === 'axa-ph-recruitment';
  const isPrudentialObjectionHandling =
    assessmentType === 'prudential-objection-handling';
  const isAXAPHObjectionHandling =
    assessmentType === 'axa-ph-objection-handling';
  const isKTAXARecruitment = assessmentType === 'kt-axa-recruitment';
  const isKTAXAFNA = assessmentType === 'kt-axa-fna';
  const isKTAXAWealthPlus = assessmentType === 'kt-axa-wealthplus';
  const isKTAXA = isKTAXARecruitment || isKTAXAFNA || isKTAXAWealthPlus;
  const isPrudentialPHFactFinding =
    assessmentType === 'prudential-ph-fact-finding';
  const isPrudentialPHAppointmentSetting =
    assessmentType === 'prudential-ph-appointment-setting';
  const isAIAKO = assessmentType === 'aia-ko-opening-objection-call';
  const isAIAKOProductPitch = assessmentType === 'aia-ko-product-pitch';
  const isAIAKOE2E = assessmentType === 'aia-ko-end-to-end-outbound-call';
  const isGreatEastern = assessmentType === 'great-eastern';

  const feedbackData = session?.roleplay?.feedback;
  const hasOverview = Boolean(feedbackData?.overview);
  const hasSalesTechniques = Boolean(feedbackData?.salesTechniques);
  const hasProductKnowledge = Boolean(feedbackData?.productKnowledge);
  const hasTechnicalKnowledge = Boolean(feedbackData?.technicalKnowledge);
  // BBL-specific fields
  const hasAdvisoryTechnique = Boolean(feedbackData?.advisoryTechnique);
  const hasProcessAdherence = Boolean(feedbackData?.processAdherence);
  // AIA KO-specific fields
  const hasAiaKoIntroduction = Boolean(feedbackData?.aiaKoIntroduction);
  const hasAiaKoObjectionHandling = Boolean(
    feedbackData?.aiaKoObjectionHandling,
  );
  const hasAiaKoNeedsExploration = Boolean(feedbackData?.aiaKoNeedsExploration);
  // AIA KO Product Pitch-specific fields
  const hasAiaKoNeedsAnalysis = Boolean(feedbackData?.aiaKoNeedsAnalysis);
  const hasAiaKoProductPitch = Boolean(feedbackData?.aiaKoProductPitch);
  const hasAiaKoProductPitchObjectionHandling = Boolean(
    feedbackData?.aiaKoProductPitchObjectionHandling,
  );
  // AIA KO E2E-specific fields
  const hasAiaKoE2EAssessment = Boolean(feedbackData?.aiaKoE2EAssessment);
  // HSBC-specific fields
  const hasRelationshipManagement = Boolean(
    feedbackData?.relationshipManagement,
  );
  const hasHsbcProcessAdherence = Boolean(feedbackData?.hsbcProcessAdherence);
  const hasRepresentation = Boolean(feedbackData?.representation);
  const hasCommunicationAndPresence = Boolean(
    feedbackData?.communicationAndPresence,
  );

  const { data: overviewResponse } = useQuery({
    queryKey: [collectionQueryKey, id, 'overview'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/sales-overview`)
        .get()
        .json<any>();
      posthog.capture('roleplay_overview_loaded', {
        sessionId: id,
      });
      return response;
    },
    enabled: !hasOverview && Boolean(id),
  });

  const {
    data: salesTechniquesResponse,
    isFetching: isFetchingSalesTechniques,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'sales-technique'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/sales-technique`)
        .get()
        .json<any>();

      if (response.salesTechniques) {
        posthog.capture('roleplay_sales_techniques_loaded', {
          sessionId: id,
          assessmentType: response.assessmentType || 'regular',
        });
      }

      return response;
    },
    enabled:
      !isBBL &&
      !isHSBC &&
      !isPrudentialObjectionHandling &&
      !isPrudentialPHFactFinding &&
      !isGreatEastern && // Great Eastern uses its own assessment query
      !!session &&
      (isPrudential ||
        isMSIG ||
        isMSIG3F ||
        isManulife ||
        isManulifeGoalReady ||
        isMTLRecruitment ||
        isMTLProspectPractice ||
        isAXAPHRecruitment ||
        !hasSalesTechniques) &&
      !session.hasScorecards,
    refetchInterval: (query) =>
      getSalesTechniquesRefetchInterval(
        query,
        isMSIG || isMSIG3F || isManulife || isManulifeGoalReady,
        isPrudential,
      ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: isMSIG || isMSIG3F || isManulife || isManulifeGoalReady,
    staleTime: isMSIG || isMSIG3F || isManulife || isManulifeGoalReady ? 1000 : 5 * 60 * 1000,
  });

  useEffect(() => {
    if (salesTechniquesResponse?.isStandingGenerating === false) {
      refetchSession();
    }
  }, [salesTechniquesResponse, refetchSession]);

  const {
    data: productKnowledgeResponse,
    isFetching: isFetchingProductKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'product-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/product-knowledge`)
        .get()
        .json<any>();

      if (
        response.productKnowledge &&
        Object.keys(response.productKnowledge).length > 0
      ) {
        posthog.capture('roleplay_product_knowledge_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled:
      !!session &&
      !hasProductKnowledge &&
      !isPrudential &&
      !isMSIG &&
      !isManulife &&
      (!isGreatEastern ||
        session?.callType === 'great-eastern-product-pitch') && // Great Eastern product pitch (Stage 2) uses standard Product Knowledge
      Boolean(id) &&
      session?.callType !== 'cold-call' &&
      (isRegular ||
        isGreatEastern ||
        isGrabMEX ||
        (isHSBC && session?.product?.friendlyId === 'hsbc-portfolio-review')) &&
      !session.hasScorecards,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.productKnowledge &&
            Object.keys(data.productKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: technicalKnowledgeResponse,
    isFetching: isFetchingTechnicalKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'technical-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/technical-knowledge`)
        .get()
        .json<any>();

      if (
        response.technicalKnowledge &&
        Object.keys(response.technicalKnowledge).length > 0
      ) {
        posthog.capture('roleplay_technical_knowledge_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isPrudential && session?.callType !== 'cold-call' && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.technicalKnowledge &&
            Object.keys(data.technicalKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // BBL-specific queries
  const {
    data: advisoryTechniqueResponse,
    isFetching: isFetchingAdvisoryTechnique,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'bbl-advisory-technique'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/bbl-advisory-technique`)
        .get()
        .json<any>();

      if (response.salesTechniques) {
        posthog.capture('roleplay_advisory_technique_loaded', {
          sessionId: id,
          assessmentType: 'bbl',
        });
      }

      return response;
    },
    enabled: isBBL && !!session && !hasAdvisoryTechnique,
    refetchInterval: (query) =>
      getSalesTechniquesRefetchInterval(query, false, false),
    refetchIntervalInBackground: false,
  });

  const {
    data: processAdherenceResponse,
    isFetching: isFetchingProcessAdherence,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'bbl-process-adherence'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/bbl-process-adherence`)
        .get()
        .json<any>();

      if (
        response.productKnowledge &&
        Object.keys(response.productKnowledge).length > 0
      ) {
        posthog.capture('roleplay_process_adherence_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isBBL && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.productKnowledge &&
            Object.keys(data.productKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // HSBC Relationship Management query (maps to advisory technique)
  const {
    data: hsbcRelationshipManagementResponse,
    isFetching: isFetchingHsbcRelationshipManagement,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'hsbc-relationship-management'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/hsbc-relationship-management`)
        .get()
        .json<any>();

      if (response.salesTechniques) {
        posthog.capture('roleplay_hsbc_relationship_management_loaded', {
          sessionId: id,
          assessmentType: 'hsbc',
        });
      }

      return response;
    },
    enabled: isHSBC && !!session && !hasRelationshipManagement,
    refetchInterval: (query) =>
      getSalesTechniquesRefetchInterval(query, false, false),
    refetchIntervalInBackground: false,
  });

  // HSBC Process Adherence query
  const {
    data: hsbcProcessAdherenceResponse,
    isFetching: isFetchingHsbcProcessAdherence,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'hsbc-process-adherence'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/hsbc-process-adherence`)
        .get()
        .json<any>();

      if (
        response.productKnowledge &&
        Object.keys(response.productKnowledge).length > 0
      ) {
        posthog.capture('roleplay_hsbc_process_adherence_loaded', {
          sessionId: id,
          assessmentType: 'hsbc',
        });
      }

      return response;
    },
    enabled: isHSBC && !!session && !hasHsbcProcessAdherence,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.productKnowledge &&
            Object.keys(data.productKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // HSBC Representation query
  const {
    data: hsbcRepresentationResponse,
    isFetching: isFetchingHsbcRepresentation,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'hsbc-representation'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/hsbc-representation`)
        .get()
        .json<any>();

      if (
        response.productKnowledge &&
        Object.keys(response.productKnowledge).length > 0
      ) {
        posthog.capture('roleplay_hsbc_representation_loaded', {
          sessionId: id,
          assessmentType: 'hsbc',
        });
      }

      return response;
    },
    enabled: isHSBC && !!session && !hasRepresentation,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.productKnowledge &&
            Object.keys(data.productKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // HSBC Communication And Presence query
  const {
    data: hsbcCommunicationAndPresenceResponse,
    isFetching: isFetchingHsbcCommunicationAndPresence,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'hsbc-communication-and-presence'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/hsbc-communication-and-presence`)
        .get()
        .json<any>();

      if (
        response.productKnowledge &&
        Object.keys(response.productKnowledge).length > 0
      ) {
        posthog.capture('roleplay_communication_and_presence_loaded', {
          sessionId: id,
          assessmentType: 'hsbc',
        });
      }

      return response;
    },
    enabled: isHSBC && !!session && !hasCommunicationAndPresence,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.productKnowledge &&
            Object.keys(data.productKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // Grab MEX-specific query
  const {
    data: grabMexSoftSkillsResponse,
    isFetching: isFetchingGrabMexSoftSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'grab-mex-soft-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/grab-mex-soft-skills`)
        .get()
        .json<any>();

      if (
        response.grabMexSoftSkills &&
        Object.keys(response.grabMexSoftSkills).length > 0
      ) {
        posthog.capture('roleplay_grab_mex_soft_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isGrabMEX && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.grabMexSoftSkills &&
            Object.keys(data.grabMexSoftSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: axaPhSoftSkillsResponse,
    isFetching: isFetchingAxaPhSoftSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'axa-ph-soft-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/axa-ph-soft-skills`)
        .get()
        .json<any>();

      if (
        response.axaPhSoftSkills &&
        Object.keys(response.axaPhSoftSkills).length > 0
      ) {
        posthog.capture('roleplay_axa_ph_soft_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: (isAXAPHRecruitment || isAXAPHObjectionHandling) && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.axaPhSoftSkills && Object.keys(data.axaPhSoftSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: axaPhKnowledgeSkillsResponse,
    isFetching: isFetchingAxaPhKnowledgeSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'axa-ph-knowledge-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/axa-ph-knowledge-skills`)
        .get()
        .json<any>();

      if (
        response.axaPhKnowledgeSkills &&
        Object.keys(response.axaPhKnowledgeSkills).length > 0
      ) {
        posthog.capture('roleplay_axa_ph_knowledge_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: (isAXAPHRecruitment || isAXAPHObjectionHandling) && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.axaPhKnowledgeSkills &&
            Object.keys(data.axaPhKnowledgeSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // KT AXA-specific queries
  const {
    data: ktAxaSoftSkillsResponse,
    isFetching: isFetchingKtAxaSoftSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'kt-axa-soft-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/kt-axa-soft-skills`)
        .get()
        .json<any>();

      if (
        response.ktAxaSoftSkills &&
        Object.keys(response.ktAxaSoftSkills).length > 0
      ) {
        posthog.capture('roleplay_kt_axa_soft_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isKTAXA && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.ktAxaSoftSkills && Object.keys(data.ktAxaSoftSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: ktAxaKnowledgeSkillsResponse,
    isFetching: isFetchingKtAxaKnowledgeSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'kt-axa-knowledge-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/kt-axa-knowledge-skills`)
        .get()
        .json<any>();

      if (
        response.ktAxaKnowledgeSkills &&
        Object.keys(response.ktAxaKnowledgeSkills).length > 0
      ) {
        posthog.capture('roleplay_kt_axa_knowledge_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isKTAXA && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.ktAxaKnowledgeSkills &&
            Object.keys(data.ktAxaKnowledgeSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // KT AXA FNA Product Knowledge query
  const {
    data: ktAxaProductKnowledgeResponse,
    isFetching: isFetchingKtAxaProductKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'kt-axa-product-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/kt-axa-product-knowledge`)
        .get()
        .json<any>();

      if (
        response.ktAxaProductKnowledge &&
        Object.keys(response.ktAxaProductKnowledge).length > 0
      ) {
        posthog.capture('roleplay_kt_axa_product_knowledge_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: (isKTAXAFNA || isKTAXAWealthPlus) && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.ktAxaProductKnowledge &&
            Object.keys(data.ktAxaProductKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // MSIG Travel Easy-specific queries
  const {
    data: msigTravelEasySoftSkillsResponse,
    isFetching: isFetchingMsigTravelEasySoftSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'msig-travel-easy-soft-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/msig-travel-easy-soft-skills`)
        .get()
        .json<any>();

      if (
        response.msigTravelEasySoftSkills &&
        Object.keys(response.msigTravelEasySoftSkills).length > 0
      ) {
        posthog.capture('roleplay_msig_travel_easy_soft_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isMSIGTravelEasy && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.msigTravelEasySoftSkills &&
            Object.keys(data.msigTravelEasySoftSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: msigTravelEasyKnowledgeSkillsResponse,
    isFetching: isFetchingMsigTravelEasyKnowledgeSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'msig-travel-easy-knowledge-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/msig-travel-easy-knowledge-skills`)
        .get()
        .json<any>();

      if (
        response.msigTravelEasyKnowledgeSkills &&
        Object.keys(response.msigTravelEasyKnowledgeSkills).length > 0
      ) {
        posthog.capture('roleplay_msig_travel_easy_knowledge_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isMSIGTravelEasy && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.msigTravelEasyKnowledgeSkills &&
            Object.keys(data.msigTravelEasyKnowledgeSkills).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  const {
    data: msigTravelEasyProductKnowledgeResponse,
    isFetching: isFetchingMsigTravelEasyProductKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'msig-travel-easy-product-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/msig-travel-easy-product-knowledge`)
        .get()
        .json<any>();

      if (
        response.msigTravelEasyProductKnowledge &&
        Object.keys(response.msigTravelEasyProductKnowledge).length > 0
      ) {
        posthog.capture('roleplay_msig_travel_easy_product_knowledge_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isMSIGTravelEasy && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(
          data?.msigTravelEasyProductKnowledge &&
            Object.keys(data.msigTravelEasyProductKnowledge).length > 0,
        ),
      ),
    refetchIntervalInBackground: false,
  });

  // Manulife GoalReady - Sales & Negotiation Skills query
  const {
    data: manulifeGoalReadySalesResponse,
    isFetching: isFetchingManulifeSales,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'manulife-sales-and-negotiation-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/manulife-sales-and-negotiation-skills`)
        .get()
        .json<any>();

      if (response.salesAndNegotiationSkills) {
        posthog.capture('roleplay_manulife_sales_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isManulifeGoalReady && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.salesAndNegotiationSkills),
      ),
    refetchIntervalInBackground: false,
  });

  // Manulife GoalReady - Soft Skills query
  const {
    data: manulifeGoalReadySoftSkillsResponse,
    isFetching: isFetchingManulifeSoftSkills,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'manulife-soft-skills'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/manulife-soft-skills`)
        .get()
        .json<any>();

      if (response.softSkills) {
        posthog.capture('roleplay_manulife_soft_skills_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isManulifeGoalReady && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.softSkills),
      ),
    refetchIntervalInBackground: false,
  });

  // Manulife GoalReady - Product Knowledge query
  const {
    data: manulifeGoalReadyProductKnowledgeResponse,
    isFetching: isFetchingManulifeProductKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'manulife-product-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/manulife-product-knowledge`)
        .get()
        .json<any>();

      if (response.productKnowledge) {
        posthog.capture('roleplay_manulife_product_knowledge_loaded', {
          sessionId: id,
        });
      }

      return response;
    },
    enabled: isManulifeGoalReady && !!session,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.productKnowledge),
      ),
    refetchIntervalInBackground: false,
  });

  const { data: scorecardsResponse, isFetching: isFetchingScorecards } =
    useQuery({
      queryKey: [collectionQueryKey, id, 'scorecards'],
      queryFn: async () => {
        const response = await apiClientFactory()
          .url(`/sessions/${id}/scorecards`)
          .get()
          .json<any>();

        if (response.scorecards) {
          posthog.capture('roleplay_scorecards_loaded', {
            sessionId: id,
            assessmentType: response.assessmentType || 'regular',
          });
        }

        return response;
      },
      enabled: !!session && session.hasScorecards,
      refetchInterval: (query) => {
        const data = query.state.data;
        // Keep polling if generating flag is true OR if any scorecard is generating
        const isGenerating =
          data?.generating ||
          data?.scorecards?.some((sc: any) => sc.isGenerating);

        if (!isGenerating) {
          return false; // Stop polling
        }

        // Poll every 2 seconds while generating
        return 2000;
      },
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
    });

  // Prudential Objection Handling - 3F Sales Technique query
  const hasPrudentialOHSalesTechnique = Boolean(
    feedbackData?.prudentialOHSalesTechnique,
  );
  const {
    data: prudentialOHSalesTechniqueResponse,
    isFetching: isFetchingPrudentialOHSalesTechnique,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'prudential-oh-sales-technique'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/prudential-oh-sales-technique`)
        .get()
        .json<any>();

      if (response.salesTechnique) {
        posthog.capture('roleplay_prudential_oh_sales_technique_loaded', {
          sessionId: id,
          assessmentType: 'prudential-objection-handling',
        });
      }

      return response;
    },
    enabled:
      isPrudentialObjectionHandling &&
      !!session &&
      !hasPrudentialOHSalesTechnique,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.salesTechnique),
      ),
    refetchIntervalInBackground: false,
  });

  // Prudential Objection Handling - LAPR Objection Handling query
  const hasPrudentialOHObjectionHandling = Boolean(
    feedbackData?.prudentialOHObjectionHandling,
  );
  const {
    data: prudentialOHObjectionHandlingResponse,
    isFetching: isFetchingPrudentialOHObjectionHandling,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'prudential-oh-objection-handling'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/prudential-oh-objection-handling`)
        .get()
        .json<any>();

      if (response.objectionHandling) {
        posthog.capture('roleplay_prudential_oh_objection_handling_loaded', {
          sessionId: id,
          assessmentType: 'prudential-objection-handling',
        });
      }

      return response;
    },
    enabled:
      isPrudentialObjectionHandling &&
      !!session &&
      !hasPrudentialOHObjectionHandling,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.objectionHandling),
      ),
    refetchIntervalInBackground: false,
  });

  // Prudential PH Fact Finding - SPIN Technique query
  const hasPrudentialPHFactFindingTechnique = Boolean(
    feedbackData?.prudentialPHFactFindingTechnique,
  );
  const {
    data: prudentialPHFactFindingTechniqueResponse,
    isFetching: isFetchingPrudentialPHFactFindingTechnique,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'prudential-ph-fact-finding-technique'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/prudential-ph-fact-finding-technique`)
        .get()
        .json<any>();

      if (response.factFindingTechnique) {
        posthog.capture(
          'roleplay_prudential_ph_fact_finding_technique_loaded',
          {
            sessionId: id,
            assessmentType: 'prudential-ph-fact-finding',
          },
        );
      }

      return response;
    },
    enabled:
      isPrudentialPHFactFinding &&
      !!session &&
      !hasPrudentialPHFactFindingTechnique,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.factFindingTechnique),
      ),
    refetchIntervalInBackground: false,
  });

  // Prudential PH Fact Finding - FAB Product Knowledge query
  const hasPrudentialPHProductKnowledge = Boolean(
    feedbackData?.prudentialPHProductKnowledge,
  );
  const {
    data: prudentialPHProductKnowledgeResponse,
    isFetching: isFetchingPrudentialPHProductKnowledge,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'prudential-ph-product-knowledge'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/prudential-ph-product-knowledge`)
        .get()
        .json<any>();

      if (response.productKnowledge) {
        posthog.capture('roleplay_prudential_ph_product_knowledge_loaded', {
          sessionId: id,
          assessmentType: 'prudential-ph-fact-finding',
        });
      }

      return response;
    },
    enabled:
      isPrudentialPHFactFinding &&
      !!session &&
      !hasPrudentialPHProductKnowledge,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.productKnowledge),
      ),
    refetchIntervalInBackground: false,
  });

  // Prudential PH Appointment Setting query
  const hasPrudentialPHAppointmentSetting = Boolean(
    feedbackData?.prudentialPHAppointmentSetting,
  );
  const {
    data: prudentialPHAppointmentSettingResponse,
    isFetching: isFetchingPrudentialPHAppointmentSetting,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'prudential-ph-appointment-setting'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/prudential-ph-appointment-setting`)
        .get()
        .json<any>();

      if (response.appointmentSetting) {
        posthog.capture('roleplay_prudential_ph_appointment_setting_loaded', {
          sessionId: id,
          assessmentType: 'prudential-ph-appointment-setting',
        });
      }

      return response;
    },
    enabled:
      isPrudentialPHAppointmentSetting &&
      !!session &&
      !hasPrudentialPHAppointmentSetting,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.appointmentSetting),
      ),
    refetchIntervalInBackground: false,
  });

  // Great Eastern Assessment query
  const hasGreatEasternAssessment = Boolean(
    feedbackData?.greatEasternAssessment,
  );
  const {
    data: greatEasternAssessmentResponse,
    isFetching: isFetchingGreatEasternAssessment,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'great-eastern-assessment'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/sales-technique`)
        .get()
        .json<any>();

      if (response.greatEasternAssessment) {
        posthog.capture('roleplay_great_eastern_assessment_loaded', {
          sessionId: id,
          assessmentType: 'great-eastern',
        });
      }

      return response;
    },
    enabled: isGreatEastern && !!session && !hasGreatEasternAssessment,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.greatEasternAssessment),
      ),
    refetchIntervalInBackground: false,
  });

  const overviewData = preferPolledOrFeedback(
    overviewResponse?.salesOverview,
    hasOverview,
    feedbackData?.overview,
  );

  // BBL-specific data
  const bblAdvisoryTechniqueData = preferPolledOrFeedback(
    advisoryTechniqueResponse?.salesTechniques,
    hasAdvisoryTechnique,
    feedbackData?.advisoryTechnique,
  );

  const bblProcessAdherenceData = preferPolledOrFeedback(
    processAdherenceResponse?.productKnowledge,
    hasProcessAdherence,
    feedbackData?.processAdherence,
  );

  // HSBC-specific data extraction
  const hsbcRelationshipManagementData = preferPolledOrFeedback(
    hsbcRelationshipManagementResponse?.salesTechniques,
    hasRelationshipManagement,
    feedbackData?.relationshipManagement,
  );

  const hsbcProcessAdherenceData = preferPolledOrFeedback(
    hsbcProcessAdherenceResponse?.productKnowledge,
    hasHsbcProcessAdherence,
    feedbackData?.hsbcProcessAdherence,
  );

  const hsbcRepresentationData = preferPolledOrFeedback(
    hsbcRepresentationResponse?.productKnowledge,
    hasRepresentation,
    feedbackData?.representation,
  );

  const hsbcCommunicationAndPresenceData = preferPolledOrFeedback(
    hsbcCommunicationAndPresenceResponse?.productKnowledge,
    hasCommunicationAndPresence,
    feedbackData?.communicationAndPresence,
  );

  // Backwards compatibility: map relationshipManagement to advisoryTechnique
  const hsbcAdvisoryTechniqueData = hsbcRelationshipManagementData;

  // Regular assessment data
  const regularSalesTechniquesData = preferPolledOrFeedback(
    salesTechniquesResponse?.salesTechniques,
    hasSalesTechniques,
    feedbackData?.salesTechniques,
  );

  // Manulife GoalReady - Extract data from new endpoints
  const manulifeSalesData = preferPolledOrFeedback(
    manulifeGoalReadySalesResponse?.salesAndNegotiationSkills,
    false,
    undefined,
  );

  const manulifeSoftSkillsData = preferPolledOrFeedback(
    manulifeGoalReadySoftSkillsResponse?.softSkills,
    false,
    undefined,
  );

  const manulifeProductKnowledgeData = preferPolledOrFeedback(
    manulifeGoalReadyProductKnowledgeResponse?.productKnowledge,
    false,
    undefined,
  );

  // Manulife GoalReady assessment data
  const goalReadyAssessmentData = isManulifeGoalReady
    ? {
        // Prefer new endpoint data, fall back to old endpoint
        salesAndNegotiationSkills:
          manulifeSalesData ||
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.salesAndNegotiationSkills,

        softSkills:
          manulifeSoftSkillsData ||
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.softSkills,

        productKnowledge:
          manulifeProductKnowledgeData ||
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.productKnowledge,

        // Metadata - prefer new endpoint (sales-overview), fall back to old endpoint
        overallScore:
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.overallScore || 0,
        overallFeedback:
          overviewResponse?.salesOverview?.summary ||
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.overallFeedback || '',
        generating:
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.generating || false,
        nextSteps:
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.nextSteps,
        tooBrief:
          overviewResponse?.tooBrief ??
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.tooBrief,
        lastUpdated:
          salesTechniquesResponse?.salesTechniques?.goalReadyAssessment
            ?.lastUpdated,
      }
    : null;

  const regularProductKnowledgeData = preferPolledOrFeedback(
    productKnowledgeResponse?.productKnowledge,
    hasProductKnowledge,
    feedbackData?.productKnowledge,
  );

  const technicalKnowledgeData = preferPolledOrFeedback(
    technicalKnowledgeResponse?.technicalKnowledge,
    hasTechnicalKnowledge,
    feedbackData?.technicalKnowledge,
  );

  const grabMexSoftSkillsData = preferPolledOrFeedback(
    grabMexSoftSkillsResponse?.grabMexSoftSkills,
    Boolean(feedbackData?.grabMexSoftSkills),
    feedbackData?.grabMexSoftSkills,
  );

  const axaPhSoftSkillsData = preferPolledOrFeedback(
    axaPhSoftSkillsResponse?.axaPhSoftSkills,
    Boolean(feedbackData?.axaPhSoftSkills),
    feedbackData?.axaPhSoftSkills,
  );

  const axaPhKnowledgeSkillsData = preferPolledOrFeedback(
    axaPhKnowledgeSkillsResponse?.axaPhKnowledgeSkills,
    Boolean(feedbackData?.axaPhKnowledgeSkills),
    feedbackData?.axaPhKnowledgeSkills,
  );

  const ktAxaSoftSkillsData = preferPolledOrFeedback(
    ktAxaSoftSkillsResponse?.ktAxaSoftSkills,
    Boolean(feedbackData?.ktAxaSoftSkills),
    feedbackData?.ktAxaSoftSkills,
  );

  const ktAxaKnowledgeSkillsData = preferPolledOrFeedback(
    ktAxaKnowledgeSkillsResponse?.ktAxaKnowledgeSkills,
    Boolean(feedbackData?.ktAxaKnowledgeSkills),
    feedbackData?.ktAxaKnowledgeSkills,
  );

  const ktAxaProductKnowledgeData = preferPolledOrFeedback(
    ktAxaProductKnowledgeResponse?.ktAxaProductKnowledge,
    Boolean(feedbackData?.productKnowledge),
    feedbackData?.productKnowledge,
  );

  const msigTravelEasySoftSkillsData = preferPolledOrFeedback(
    msigTravelEasySoftSkillsResponse?.msigTravelEasySoftSkills,
    false,
    undefined,
  );

  const msigTravelEasyKnowledgeSkillsData = preferPolledOrFeedback(
    msigTravelEasyKnowledgeSkillsResponse?.msigTravelEasyKnowledgeSkills,
    false,
    undefined,
  );

  const msigTravelEasyProductKnowledgeData = preferPolledOrFeedback(
    msigTravelEasyProductKnowledgeResponse?.msigTravelEasyProductKnowledge,
    false,
    undefined,
  );

  // Choose the appropriate data based on assessment type
  const salesTechniquesData = isBBL
    ? bblAdvisoryTechniqueData
    : isHSBC
      ? hsbcAdvisoryTechniqueData
      : regularSalesTechniquesData;

  const productKnowledgeData = isPrudential
    ? technicalKnowledgeData?.productKnowledge
    : regularProductKnowledgeData;

  const isSalesTechniquesGenerating = isBBL
    ? !bblAdvisoryTechniqueData &&
      (isFetchingAdvisoryTechnique || advisoryTechniqueResponse?.generating)
    : isHSBC
      ? !hsbcRelationshipManagementData &&
        (isFetchingHsbcRelationshipManagement ||
          hsbcRelationshipManagementResponse?.generating)
      : !regularSalesTechniquesData &&
        (isFetchingSalesTechniques || salesTechniquesResponse?.generating);

  const isProductKnowledgeGenerating =
    !regularProductKnowledgeData &&
    (isFetchingProductKnowledge || productKnowledgeResponse?.generating);

  const isProcessAdherenceGenerating =
    !bblProcessAdherenceData &&
    (isFetchingProcessAdherence || processAdherenceResponse?.generating);

  const isHsbcProcessAdherenceGenerating =
    !hsbcProcessAdherenceData &&
    (isFetchingHsbcProcessAdherence ||
      hsbcProcessAdherenceResponse?.generating);

  const isHsbcRepresentationGenerating =
    !hsbcRepresentationData &&
    (isFetchingHsbcRepresentation || hsbcRepresentationResponse?.generating);

  const isCommunicationAndPresenceGenerating =
    !hsbcCommunicationAndPresenceData &&
    (isFetchingHsbcCommunicationAndPresence ||
      hsbcCommunicationAndPresenceResponse?.generating);

  const isTechnicalKnowledgeGenerating =
    (!technicalKnowledgeData ||
      Object.keys(technicalKnowledgeData || {}).length === 0) &&
    (isFetchingTechnicalKnowledge || technicalKnowledgeResponse?.generating);

  const isGrabMexSoftSkillsGenerating =
    !grabMexSoftSkillsData &&
    (isFetchingGrabMexSoftSkills || grabMexSoftSkillsResponse?.generating);

  // Prudential Objection Handling data extraction - two separate sections
  const prudentialOHSalesTechniqueData = preferPolledOrFeedback(
    prudentialOHSalesTechniqueResponse?.salesTechnique,
    hasPrudentialOHSalesTechnique,
    feedbackData?.prudentialOHSalesTechnique,
  );

  const prudentialOHObjectionHandlingData = preferPolledOrFeedback(
    prudentialOHObjectionHandlingResponse?.objectionHandling,
    hasPrudentialOHObjectionHandling,
    feedbackData?.prudentialOHObjectionHandling,
  );

  // Combined prudentialObjectionHandlingData for backwards compatibility
  const prudentialObjectionHandlingData =
    prudentialOHSalesTechniqueData || prudentialOHObjectionHandlingData
      ? {
          salesTechnique: prudentialOHSalesTechniqueData,
          objectionHandling: prudentialOHObjectionHandlingData,
        }
      : null;

  const isPrudentialOHSalesTechniqueGenerating =
    isPrudentialObjectionHandling &&
    !prudentialOHSalesTechniqueData &&
    (isFetchingPrudentialOHSalesTechnique ||
      prudentialOHSalesTechniqueResponse?.generating);

  const isPrudentialOHObjectionHandlingGenerating =
    isPrudentialObjectionHandling &&
    !prudentialOHObjectionHandlingData &&
    (isFetchingPrudentialOHObjectionHandling ||
      prudentialOHObjectionHandlingResponse?.generating);

  const isPrudentialObjectionHandlingSalesTechniquesGenerating =
    isPrudentialOHSalesTechniqueGenerating ||
    isPrudentialOHObjectionHandlingGenerating;

  // Prudential PH Fact Finding data extraction
  const prudentialPHFactFindingTechniqueData = preferPolledOrFeedback(
    prudentialPHFactFindingTechniqueResponse?.factFindingTechnique,
    hasPrudentialPHFactFindingTechnique,
    feedbackData?.prudentialPHFactFindingTechnique,
  );

  const prudentialPHProductKnowledgeData = preferPolledOrFeedback(
    prudentialPHProductKnowledgeResponse?.productKnowledge,
    hasPrudentialPHProductKnowledge,
    feedbackData?.prudentialPHProductKnowledge,
  );

  const isPrudentialPHFactFindingTechniqueGenerating =
    isPrudentialPHFactFinding &&
    !prudentialPHFactFindingTechniqueData &&
    (isFetchingPrudentialPHFactFindingTechnique ||
      prudentialPHFactFindingTechniqueResponse?.generating);

  const isPrudentialPHProductKnowledgeGenerating =
    isPrudentialPHFactFinding &&
    !prudentialPHProductKnowledgeData &&
    (isFetchingPrudentialPHProductKnowledge ||
      prudentialPHProductKnowledgeResponse?.generating);

  const isKtAxaProductKnowledgeGenerating =
    !ktAxaProductKnowledgeData &&
    (isFetchingKtAxaProductKnowledge ||
      ktAxaProductKnowledgeResponse?.generating);

  const isMsigTravelEasySoftSkillsGenerating =
    !msigTravelEasySoftSkillsData &&
    (isFetchingMsigTravelEasySoftSkills ||
      msigTravelEasySoftSkillsResponse?.generating);

  const isMsigTravelEasyKnowledgeSkillsGenerating =
    !msigTravelEasyKnowledgeSkillsData &&
    (isFetchingMsigTravelEasyKnowledgeSkills ||
      msigTravelEasyKnowledgeSkillsResponse?.generating);

  const isMsigTravelEasyProductKnowledgeGenerating =
    !msigTravelEasyProductKnowledgeData &&
    (isFetchingMsigTravelEasyProductKnowledge ||
      msigTravelEasyProductKnowledgeResponse?.generating);

  const isManulifeSalesGenerating =
    isManulifeGoalReady &&
    !manulifeSalesData &&
    (isFetchingManulifeSales || manulifeGoalReadySalesResponse?.generating);

  const isManulifeSoftSkillsGenerating =
    isManulifeGoalReady &&
    !manulifeSoftSkillsData &&
    (isFetchingManulifeSoftSkills ||
      manulifeGoalReadySoftSkillsResponse?.generating);

  const isManulifeProductKnowledgeGenerating =
    isManulifeGoalReady &&
    !manulifeProductKnowledgeData &&
    (isFetchingManulifeProductKnowledge ||
      manulifeGoalReadyProductKnowledgeResponse?.generating);

  // Prudential PH Appointment Setting data extraction
  const prudentialPHAppointmentSettingData = preferPolledOrFeedback(
    prudentialPHAppointmentSettingResponse?.appointmentSetting,
    hasPrudentialPHAppointmentSetting,
    feedbackData?.prudentialPHAppointmentSetting,
  );

  const isPrudentialPHAppointmentSettingGenerating =
    isPrudentialPHAppointmentSetting &&
    !prudentialPHAppointmentSettingData &&
    (isFetchingPrudentialPHAppointmentSetting ||
      prudentialPHAppointmentSettingResponse?.generating);

  // Great Eastern Assessment data extraction
  const greatEasternAssessmentData = preferPolledOrFeedback(
    greatEasternAssessmentResponse?.greatEasternAssessment,
    hasGreatEasternAssessment,
    feedbackData?.greatEasternAssessment,
  );

  const isGreatEasternAssessmentGenerating =
    isGreatEastern &&
    !greatEasternAssessmentData &&
    (isFetchingGreatEasternAssessment ||
      greatEasternAssessmentResponse?.generating);

  // AIA KO Opening & Objection Call - Introduction query
  const {
    data: aiaKoIntroductionResponse,
    isFetching: isFetchingAiaKoIntroduction,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-introduction'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-introduction`)
        .get()
        .json<any>();

      if (response.introduction) {
        posthog.capture('roleplay_aia_ko_introduction_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-opening-objection-call',
        });
      }

      return response;
    },
    enabled: isAIAKO && !!session && !hasAiaKoIntroduction,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.introduction),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Opening & Objection Call - Objection Handling query
  const {
    data: aiaKoObjectionHandlingResponse,
    isFetching: isFetchingAiaKoObjectionHandling,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-objection-handling'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-objection-handling`)
        .get()
        .json<any>();

      if (response.objectionHandling) {
        posthog.capture('roleplay_aia_ko_objection_handling_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-opening-objection-call',
        });
      }

      return response;
    },
    enabled: isAIAKO && !!session && !hasAiaKoObjectionHandling,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.objectionHandling),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Opening & Objection Call - Needs Exploration query
  const {
    data: aiaKoNeedsExplorationResponse,
    isFetching: isFetchingAiaKoNeedsExploration,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-needs-exploration'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-needs-exploration`)
        .get()
        .json<any>();

      if (response.needsExploration) {
        posthog.capture('roleplay_aia_ko_needs_exploration_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-opening-objection-call',
        });
      }

      return response;
    },
    enabled: isAIAKO && !!session && !hasAiaKoNeedsExploration,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.needsExploration),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Opening & Objection Call data extraction
  const aiaKoIntroductionData = preferPolledOrFeedback(
    aiaKoIntroductionResponse?.introduction,
    hasAiaKoIntroduction,
    feedbackData?.aiaKoIntroduction,
  );

  const aiaKoObjectionHandlingData = preferPolledOrFeedback(
    aiaKoObjectionHandlingResponse?.objectionHandling,
    hasAiaKoObjectionHandling,
    feedbackData?.aiaKoObjectionHandling,
  );

  const aiaKoNeedsExplorationData = preferPolledOrFeedback(
    aiaKoNeedsExplorationResponse?.needsExploration,
    hasAiaKoNeedsExploration,
    feedbackData?.aiaKoNeedsExploration,
  );

  const isAiaKoIntroductionGenerating =
    isAIAKO &&
    !aiaKoIntroductionData &&
    (isFetchingAiaKoIntroduction || aiaKoIntroductionResponse?.generating);

  const isAiaKoObjectionHandlingGenerating =
    isAIAKO &&
    !aiaKoObjectionHandlingData &&
    (isFetchingAiaKoObjectionHandling ||
      aiaKoObjectionHandlingResponse?.generating);

  const isAiaKoNeedsExplorationGenerating =
    isAIAKO &&
    !aiaKoNeedsExplorationData &&
    (isFetchingAiaKoNeedsExploration ||
      aiaKoNeedsExplorationResponse?.generating);

  // AIA KO Product Pitch - Needs Analysis query
  const {
    data: aiaKoNeedsAnalysisResponse,
    isFetching: isFetchingAiaKoNeedsAnalysis,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-needs-analysis'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-needs-analysis`)
        .get()
        .json<any>();

      if (response.needsAnalysis) {
        posthog.capture('roleplay_aia_ko_needs_analysis_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-product-pitch',
        });
      }

      return response;
    },
    enabled: isAIAKOProductPitch && !!session && !hasAiaKoNeedsAnalysis,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.needsAnalysis),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Product Pitch - Product Pitch query
  const {
    data: aiaKoProductPitchResponse,
    isFetching: isFetchingAiaKoProductPitch,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-product-pitch'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-product-pitch`)
        .get()
        .json<any>();

      if (response.productPitch) {
        posthog.capture('roleplay_aia_ko_product_pitch_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-product-pitch',
        });
      }

      return response;
    },
    enabled: isAIAKOProductPitch && !!session && !hasAiaKoProductPitch,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.productPitch),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Product Pitch - Objection Handling query
  const {
    data: aiaKoProductPitchObjectionHandlingResponse,
    isFetching: isFetchingAiaKoProductPitchObjectionHandling,
  } = useQuery({
    queryKey: [
      collectionQueryKey,
      id,
      'aia-ko-product-pitch-objection-handling',
    ],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-product-pitch-objection-handling`)
        .get()
        .json<any>();

      if (response.objectionHandling) {
        posthog.capture(
          'roleplay_aia_ko_product_pitch_objection_handling_loaded',
          {
            sessionId: id,
            assessmentType: 'aia-ko-product-pitch',
          },
        );
      }

      return response;
    },
    enabled:
      isAIAKOProductPitch &&
      !!session &&
      !hasAiaKoProductPitchObjectionHandling,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.objectionHandling),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO E2E (End-to-End Outbound Call) query
  const {
    data: aiaKoE2EAssessmentResponse,
    isFetching: isFetchingAiaKoE2EAssessment,
  } = useQuery({
    queryKey: [collectionQueryKey, id, 'aia-ko-e2e-assessment'],
    queryFn: async () => {
      const response = await apiClientFactory()
        .url(`/sessions/${id}/aia-ko-e2e-assessment`)
        .get()
        .json<any>();

      if (response.e2eAssessment) {
        posthog.capture('roleplay_aia_ko_e2e_assessment_loaded', {
          sessionId: id,
          assessmentType: 'aia-ko-end-to-end-outbound-call',
        });
      }

      return response;
    },
    enabled: isAIAKOE2E && !!session && !hasAiaKoE2EAssessment,
    refetchInterval: (query) =>
      finitePollingRefetchInterval(query, (data) =>
        Boolean(data?.e2eAssessment),
      ),
    refetchIntervalInBackground: false,
  });

  // AIA KO Product Pitch data extraction
  const aiaKoNeedsAnalysisData = preferPolledOrFeedback(
    aiaKoNeedsAnalysisResponse?.needsAnalysis,
    hasAiaKoNeedsAnalysis,
    feedbackData?.aiaKoNeedsAnalysis,
  );

  const aiaKoProductPitchData = preferPolledOrFeedback(
    aiaKoProductPitchResponse?.productPitch,
    hasAiaKoProductPitch,
    feedbackData?.aiaKoProductPitch,
  );

  const aiaKoProductPitchObjectionHandlingData = preferPolledOrFeedback(
    aiaKoProductPitchObjectionHandlingResponse?.objectionHandling,
    hasAiaKoProductPitchObjectionHandling,
    feedbackData?.aiaKoProductPitchObjectionHandling,
  );

  const isAiaKoNeedsAnalysisGenerating =
    isAIAKOProductPitch &&
    !aiaKoNeedsAnalysisData &&
    (isFetchingAiaKoNeedsAnalysis || aiaKoNeedsAnalysisResponse?.generating);

  const isAiaKoProductPitchGenerating =
    isAIAKOProductPitch &&
    !aiaKoProductPitchData &&
    (isFetchingAiaKoProductPitch || aiaKoProductPitchResponse?.generating);

  const isAiaKoProductPitchObjectionHandlingGenerating =
    isAIAKOProductPitch &&
    !aiaKoProductPitchObjectionHandlingData &&
    (isFetchingAiaKoProductPitchObjectionHandling ||
      aiaKoProductPitchObjectionHandlingResponse?.generating);

  // AIA KO E2E data extraction
  const aiaKoE2EAssessmentData = preferPolledOrFeedback(
    aiaKoE2EAssessmentResponse?.e2eAssessment,
    hasAiaKoE2EAssessment,
    feedbackData?.aiaKoE2EAssessment,
  );

  const isAiaKoE2EAssessmentGenerating =
    isAIAKOE2E &&
    !aiaKoE2EAssessmentData &&
    (isFetchingAiaKoE2EAssessment ||
      aiaKoE2EAssessmentResponse?.generating);

  const isStandingGenerating =
    (isPrudential || isPrudentialObjectionHandling) &&
    ((feedbackData?.isStandingGenerating ?? false) ||
      isSalesTechniquesGenerating ||
      isTechnicalKnowledgeGenerating ||
      isPrudentialObjectionHandlingSalesTechniquesGenerating);

  const isColdCall = session?.callType === 'cold-call';

  const scorecardsData = scorecardsResponse?.scorecards;

  const isScorecardsGenerating =
    !scorecardsData &&
    (isFetchingScorecards ||
      scorecardsResponse?.generating ||
      scorecardsResponse?.scorecards?.some((sc: any) => sc.isGenerating));

  return {
    session,
    isLoading,
    sessionError,
    overviewData,
    salesTechniquesData,
    goalReadyAssessmentData,
    productKnowledgeData,
    technicalKnowledgeData,
    grabMexSoftSkillsData,
    axaPhSoftSkillsData,
    axaPhKnowledgeSkillsData,
    ktAxaSoftSkillsData,
    ktAxaKnowledgeSkillsData,
    isColdCall,
    isPrudential,
    isMSIG,
    isMSIG3F,
    isMSIGTravelEasy,
    isRegular,
    isManulife,
    isManulifeGoalReady,
    isBBL,
    isHSBC,
    isGrabMEX,
    isMTLRecruitment,
    isMTLProspectPractice,
    isAXAPHRecruitment,
    isPrudentialObjectionHandling,
    isAXAPHObjectionHandling,
    isKTAXARecruitment,
    isKTAXAFNA,
    isKTAXAWealthPlus,
    isKTAXA,
    isSalesTechniquesGenerating,
    isTechnicalKnowledgeGenerating,
    isGrabMexSoftSkillsGenerating,
    isStandingGenerating,
    isProductKnowledgeGenerating,
    // BBL-specific data (exposed separately for flexibility)
    bblAdvisoryTechniqueData,
    bblProcessAdherenceData,
    isProcessAdherenceGenerating,
    // HSBC-specific data
    hsbcRelationshipManagementData,
    hsbcProcessAdherenceData,
    hsbcRepresentationData,
    hsbcCommunicationAndPresenceData,
    hsbcAdvisoryTechniqueData, // Keep for backwards compatibility
    isHsbcProcessAdherenceGenerating,
    isHsbcRepresentationGenerating,
    isCommunicationAndPresenceGenerating,
    // Prudential Objection Handling data
    prudentialObjectionHandlingData,
    isPrudentialObjectionHandlingSalesTechniquesGenerating,
    isPrudentialOHSalesTechniqueGenerating,
    isPrudentialOHObjectionHandlingGenerating,
    // Prudential PH Fact Finding data
    isPrudentialPHFactFinding,
    prudentialPHFactFindingTechniqueData,
    prudentialPHProductKnowledgeData,
    isPrudentialPHFactFindingTechniqueGenerating,
    isPrudentialPHProductKnowledgeGenerating,
    // Prudential PH Appointment Setting data
    isPrudentialPHAppointmentSetting,
    prudentialPHAppointmentSettingData,
    isPrudentialPHAppointmentSettingGenerating,

    scorecardsData,
    isScorecardsGenerating,
    // KT AXA FNA-specific data
    ktAxaProductKnowledgeData,
    isKtAxaProductKnowledgeGenerating,
    // MSIG Travel Easy-specific data
    msigTravelEasySoftSkillsData,
    msigTravelEasyKnowledgeSkillsData,
    msigTravelEasyProductKnowledgeData,
    isMsigTravelEasySoftSkillsGenerating,
    isMsigTravelEasyKnowledgeSkillsGenerating,
    isMsigTravelEasyProductKnowledgeGenerating,
    // AIA KO Opening & Objection Call data
    isAIAKO,
    aiaKoIntroductionData,
    aiaKoObjectionHandlingData,
    aiaKoNeedsExplorationData,
    isAiaKoIntroductionGenerating,
    isAiaKoObjectionHandlingGenerating,
    isAiaKoNeedsExplorationGenerating,
    // AIA KO Product Pitch data
    isAIAKOProductPitch,
    aiaKoNeedsAnalysisData,
    aiaKoProductPitchData,
    aiaKoProductPitchObjectionHandlingData,
    isAiaKoNeedsAnalysisGenerating,
    isAiaKoProductPitchGenerating,
    isAiaKoProductPitchObjectionHandlingGenerating,
    isGreatEastern,
    // AIA KO E2E (End-to-End Outbound Call) data
    isAIAKOE2E,
    aiaKoE2EAssessmentData,
    isAiaKoE2EAssessmentGenerating,
    // Great Eastern Assessment data
    greatEasternAssessmentData,
    isGreatEasternAssessmentGenerating,
    // Manulife GoalReady section-specific loading states
    isManulifeSalesGenerating,
    isManulifeSoftSkillsGenerating,
    isManulifeProductKnowledgeGenerating,
    // Raw response generating flags (backend source of truth for when scores are truly final)
    salesTechniquesResponseGenerating: (isBBL
      ? advisoryTechniqueResponse?.generating
      : isHSBC
        ? hsbcRelationshipManagementResponse?.generating
        : salesTechniquesResponse?.generating) as boolean | undefined,
    productKnowledgeResponseGenerating: productKnowledgeResponse?.generating as
      | boolean
      | undefined,
    grabMexSoftSkillsResponseGenerating:
      grabMexSoftSkillsResponse?.generating as boolean | undefined,
    // Backend-verified flag: true only when ALL assessment jobs are complete
    scormCompletionReady: session?.roleplay?.scormCompletionReady,
  } as const;
}

export type UseAssessmentDataReturn = ReturnType<typeof useAssessmentData>;
