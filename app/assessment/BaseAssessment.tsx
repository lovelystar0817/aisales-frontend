import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { useAuthStore } from '~/store/auth';
import AssessmentContext from '~/assessment/shared/AssessmentContext';
import JumpToSection from './shared/JumpToSection';
import { RoleplayTranscript } from './shared/RoleplayTranscript';
import PrudentialSessionCard from './prudential/PrudentialSessionCard';
import SessionCard from './regular/SessionCard';
import RegularAssessmentMain from './regular/RegularAssessmentMain';
import PrudentialAssessmentMain from './prudential/PrudentialAssessmentMain';
import type { Section } from '~/assessment/shared/AssessmentContext';
import { t } from 'i18next';
import { XIcon, AlertCircle } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { ChatBubbleIcon } from '../../public/icons/icons';
import MSIGSessionCard from './msig/MSIGTelesalesSessionCard';
import MSIGProductPositioningSessionCard from './msig/MSIGProductPositioningSessionCard';
import MSIGAssessmentMain from './msig/MSIGAssessmentMain';
import { useAssessmentData } from './shared/useAssessmentData';
import ManulifeAssessmentMain from './manulife/ManulifeAssessmentMain';
import ManulifeSessionCard from './manulife/ManulifeSessionCard';
import { ManulifeGoalReadyAssessmentMain } from './manulife-goalready/ManulifeGoalReadyAssessmentMain';
import { ManulifeGoalReadySessionCard } from './manulife-goalready/ManulifeGoalReadySessionCard';
import BBLAssessmentMain from './bbl/BBLAssessmentMain';
import BBLSessionCard from './bbl/BBLSessionCard';
import HSBCAssessmentMain from './hsbc/HSBCAssessmentMain';
import HSBCSessionCard from './hsbc/HSBCSessionCard';
import GrabMexAssessmentMain from './grab-mex/GrabMexAssessmentMain';
import GrabMexSessionCard from './grab-mex/GrabMexSessionCard';
import MTLRecruitmentAssessmentMain from './mtl-recruitment/MTLRecruitmentAssessmentMain';
import MTLRecruitmentSessionCard from './mtl-recruitment/MTLRecruitmentSessionCard';
import AXAPHAssessmentMain from './axa-ph/AXAPHAssessmentMain';
import AXAPHSessionCard from './axa-ph/AXAPHSessionCard';
import KTAXAAssessmentMain from './kt-axa/KTAXAAssessmentMain';
import KTAXAFNAAssessmentMain from './kt-axa/KTAXAFNAAssessmentMain';
import KTAXASessionCard from './kt-axa/KTAXASessionCard';
import KTAXAFNASessionCard from './kt-axa/KTAXAFNASessionCard';
import MTLProspectPracticeAssessmentMain from './mtl-prospect-practice/MTLProspectPracticeAssessmentMain';
import MTLProspectPracticeSessionCard from './mtl-prospect-practice/MTLProspectPracticeSessionCard';
import ScorecardSessionCard from './scorecard/ScorecardSessionCard';
import ScorecardAssessmentMain from './scorecard/ScorecardAssessmentMain';
import PrudentialObjectionHandlingAssessmentMain from './prudential-objection-handling/PrudentialObjectionHandlingAssessmentMain';
import PrudentialObjectionHandlingSessionCard from './prudential-objection-handling/PrudentialObjectionHandlingSessionCard';
import MSIGTravelEasySessionCard from './msig/MSIGTravelEasySessionCard';
import MSIGTravelEasyAssessmentMain from './msig/MSIGTravelEasyAssessmentMain';
import PrudentialPHFactFindingAssessmentMain from './prudential-ph-fact-finding/PrudentialPHFactFindingAssessmentMain';
import PrudentialPHFactFindingSessionCard from './prudential-ph-fact-finding/PrudentialPHFactFindingSessionCard';
import PrudentialPHAppointmentSettingAssessmentMain from './prudential-ph-appointment-setting/PrudentialPHAppointmentSettingAssessmentMain';
import PrudentialPHAppointmentSettingSessionCard from './prudential-ph-appointment-setting/PrudentialPHAppointmentSettingSessionCard';
import AIAKOAssessmentMain from './aia-ko/AIAKOAssessmentMain';
import AIAKOSessionCard from './aia-ko/AIAKOSessionCard';
import AIAKOProductPitchAssessmentMain from './aia-ko/AIAKOProductPitchAssessmentMain';
import AIAKOE2EAssessmentMain from './aia-ko/AIAKOE2EAssessmentMain';
import GreatEasternAssessmentMain from './great-eastern/GreatEasternAssessmentMain';
import GreatEasternSessionCard from './great-eastern/GreatEasternSessionCard';

interface BaseAssessmentProps {
  sessionId?: string;
  apiClient: () => any;
  sessionQueryKey: string;
  collectionQueryKey: string;
  isAdminView: boolean;
  showFeedbackButton?: boolean;
  homeLink?: string;
}

export default function BaseAssessment({
  sessionId,
  apiClient,
  sessionQueryKey,
  collectionQueryKey,
  isAdminView,
  showFeedbackButton = false,
  homeLink = '/',
}: BaseAssessmentProps) {
  const [searchParams] = useSearchParams();
  const { scorm: isScormMode } = useAuthStore();
  const [showTranscript, setShowTranscript] = useQueryState(
    'transcript',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push' }),
  );
  const [sections, setSections] = useState<Section[]>([]);
  const fromPast = searchParams.get('fromPast') === '1';
  const [showFeedbackModal, setShowFeedbackModal] = useState(!isScormMode);
  const [dontShowFeedbackModalOnceSent, setDontShowFeedbackModalOnceSent] =
    useState(false);

  const {
    session,
    isLoading,
    sessionError,
    overviewData,
    salesTechniquesData,
    goalReadyAssessmentData,
    productKnowledgeData,
    technicalKnowledgeData,
    grabMexSoftSkillsData,
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
    isSalesTechniquesGenerating,
    isTechnicalKnowledgeGenerating,
    isGrabMexSoftSkillsGenerating,
    isStandingGenerating,
    isProductKnowledgeGenerating,
    // BBL-specific fields
    bblAdvisoryTechniqueData,
    bblProcessAdherenceData,
    isProcessAdherenceGenerating,
    // HSBC-specific fields
    hsbcRelationshipManagementData,
    hsbcProcessAdherenceData,
    hsbcRepresentationData,
    hsbcCommunicationAndPresenceData,
    hsbcAdvisoryTechniqueData, // backwards compatibility
    isHsbcProcessAdherenceGenerating,
    isHsbcRepresentationGenerating,
    isCommunicationAndPresenceGenerating,
    scorecardsData,
    isScorecardsGenerating,
    // AXA-PH-specific fields
    axaPhSoftSkillsData,
    axaPhKnowledgeSkillsData,
    // Prudential Objection Handling fields
    prudentialObjectionHandlingData,
    isPrudentialObjectionHandlingSalesTechniquesGenerating,
    // Prudential PH Fact Finding fields
    isPrudentialPHFactFinding,
    prudentialPHFactFindingTechniqueData,
    prudentialPHProductKnowledgeData,
    isPrudentialPHFactFindingTechniqueGenerating,
    isPrudentialPHProductKnowledgeGenerating,
    // Prudential PH Appointment Setting fields
    isPrudentialPHAppointmentSetting,
    prudentialPHAppointmentSettingData,
    isPrudentialPHAppointmentSettingGenerating,
    // KT-AXA-specific fields
    ktAxaSoftSkillsData,
    ktAxaKnowledgeSkillsData,
    ktAxaProductKnowledgeData,
    isKtAxaProductKnowledgeGenerating,
    // MSIG Travel Easy-specific fields
    msigTravelEasySoftSkillsData,
    msigTravelEasyKnowledgeSkillsData,
    msigTravelEasyProductKnowledgeData,
    isMsigTravelEasySoftSkillsGenerating,
    isMsigTravelEasyKnowledgeSkillsGenerating,
    isMsigTravelEasyProductKnowledgeGenerating,
    // AIA KO Opening & Objection Call fields
    isAIAKO,
    isGreatEastern,
    aiaKoIntroductionData,
    aiaKoObjectionHandlingData,
    aiaKoNeedsExplorationData,
    isAiaKoIntroductionGenerating,
    isAiaKoObjectionHandlingGenerating,
    isAiaKoNeedsExplorationGenerating,
    // AIA KO Product Pitch fields
    isAIAKOProductPitch,
    aiaKoNeedsAnalysisData,
    aiaKoProductPitchData,
    aiaKoProductPitchObjectionHandlingData,
    isAiaKoNeedsAnalysisGenerating,
    isAiaKoProductPitchGenerating,
    isAiaKoProductPitchObjectionHandlingGenerating,
    // AIA KO E2E (End-to-End Outbound Call) fields
    isAIAKOE2E,
    aiaKoE2EAssessmentData,
    isAiaKoE2EAssessmentGenerating,
    // Great Eastern-specific fields
    greatEasternAssessmentData,
    isGreatEasternAssessmentGenerating,
    // Manulife GoalReady section-specific loading states
    isManulifeSalesGenerating,
    isManulifeSoftSkillsGenerating,
    isManulifeProductKnowledgeGenerating,
    // Raw response generating flags
    salesTechniquesResponseGenerating,
    productKnowledgeResponseGenerating,
    grabMexSoftSkillsResponseGenerating,
    scormCompletionReady,
  } = useAssessmentData({
    id: sessionId,
    apiClientFactory: apiClient,
    sessionQueryKey,
    collectionQueryKey,
  });

  const onViewTranscript = useCallback(
    () => setShowTranscript(true),
    [setShowTranscript],
  );

  const contextValue = useMemo(
    () => ({
      session,
      overviewData,
      salesTechniquesData,
      productKnowledgeData,
      technicalKnowledgeData,
      grabMexSoftSkillsData,
      axaPhSoftSkillsData,
      axaPhKnowledgeSkillsData,
      ktAxaSoftSkillsData,
      ktAxaKnowledgeSkillsData,
      ktAxaProductKnowledgeData,
      isKtAxaProductKnowledgeGenerating,
      msigTravelEasySoftSkillsData,
      msigTravelEasyKnowledgeSkillsData,
      msigTravelEasyProductKnowledgeData,
      isMsigTravelEasySoftSkillsGenerating,
      isMsigTravelEasyKnowledgeSkillsGenerating,
      isMsigTravelEasyProductKnowledgeGenerating,
      isColdCall,
      isLoading,
      onViewTranscript,
      isSalesTechniquesGenerating,
      isTechnicalKnowledgeGenerating,
      isGrabMexSoftSkillsGenerating,
      isStandingGenerating,
      sections,
      setSections,
      apiClient,
      isAdminView,
      isProductKnowledgeGenerating,
      // BBL-specific fields
      bblAdvisoryTechniqueData,
      bblProcessAdherenceData,
      isProcessAdherenceGenerating,
      // HSBC-specific fields
      hsbcRelationshipManagementData,
      hsbcProcessAdherenceData,
      hsbcRepresentationData,
      hsbcCommunicationAndPresenceData,
      hsbcAdvisoryTechniqueData, // backwards compatibility
      isHsbcProcessAdherenceGenerating,
      isHsbcRepresentationGenerating,
      isCommunicationAndPresenceGenerating,
      scorecardsData,
      isScorecardsGenerating,
      prudentialObjectionHandlingData,
      isPrudentialObjectionHandlingSalesTechniquesGenerating,
      prudentialPHFactFindingTechniqueData,
      prudentialPHProductKnowledgeData,
      isPrudentialPHFactFindingTechniqueGenerating,
      isPrudentialPHProductKnowledgeGenerating,
      prudentialPHAppointmentSettingData,
      isPrudentialPHAppointmentSettingGenerating,
      aiaKoIntroductionData,
      aiaKoObjectionHandlingData,
      aiaKoNeedsExplorationData,
      isAiaKoIntroductionGenerating,
      isAiaKoObjectionHandlingGenerating,
      isAiaKoNeedsExplorationGenerating,
      aiaKoNeedsAnalysisData,
      aiaKoProductPitchData,
      aiaKoProductPitchObjectionHandlingData,
      isAiaKoNeedsAnalysisGenerating,
      isAiaKoProductPitchGenerating,
      isAiaKoProductPitchObjectionHandlingGenerating,
      greatEasternAssessmentData,
      isGreatEasternAssessmentGenerating,
      aiaKoE2EAssessmentData,
      isAiaKoE2EAssessmentGenerating,
      // Manulife GoalReady section-specific loading states
      isManulifeSalesGenerating,
      isManulifeSoftSkillsGenerating,
      isManulifeProductKnowledgeGenerating,
      salesTechniquesResponseGenerating,
      productKnowledgeResponseGenerating,
      grabMexSoftSkillsResponseGenerating,
      scormCompletionReady,
    }),
    [
      session,
      overviewData,
      salesTechniquesData,
      productKnowledgeData,
      technicalKnowledgeData,
      grabMexSoftSkillsData,
      axaPhSoftSkillsData,
      axaPhKnowledgeSkillsData,
      ktAxaSoftSkillsData,
      ktAxaKnowledgeSkillsData,
      ktAxaProductKnowledgeData,
      isKtAxaProductKnowledgeGenerating,
      msigTravelEasySoftSkillsData,
      msigTravelEasyKnowledgeSkillsData,
      msigTravelEasyProductKnowledgeData,
      isMsigTravelEasySoftSkillsGenerating,
      isMsigTravelEasyKnowledgeSkillsGenerating,
      isMsigTravelEasyProductKnowledgeGenerating,
      isColdCall,
      isLoading,
      onViewTranscript,
      isSalesTechniquesGenerating,
      isTechnicalKnowledgeGenerating,
      isGrabMexSoftSkillsGenerating,
      isStandingGenerating,
      sections,
      setSections,
      apiClient,
      isAdminView,
      isProductKnowledgeGenerating,
      bblAdvisoryTechniqueData,
      bblProcessAdherenceData,
      isProcessAdherenceGenerating,
      hsbcRelationshipManagementData,
      hsbcProcessAdherenceData,
      hsbcRepresentationData,
      hsbcCommunicationAndPresenceData,
      hsbcAdvisoryTechniqueData,
      isHsbcProcessAdherenceGenerating,
      isHsbcRepresentationGenerating,
      isCommunicationAndPresenceGenerating,
      scorecardsData,
      isScorecardsGenerating,
      prudentialObjectionHandlingData,
      isPrudentialObjectionHandlingSalesTechniquesGenerating,
      prudentialPHFactFindingTechniqueData,
      prudentialPHProductKnowledgeData,
      isPrudentialPHFactFindingTechniqueGenerating,
      isPrudentialPHProductKnowledgeGenerating,
      prudentialPHAppointmentSettingData,
      isPrudentialPHAppointmentSettingGenerating,
      aiaKoIntroductionData,
      aiaKoObjectionHandlingData,
      aiaKoNeedsExplorationData,
      isAiaKoIntroductionGenerating,
      isAiaKoObjectionHandlingGenerating,
      isAiaKoNeedsExplorationGenerating,
      greatEasternAssessmentData,
      isGreatEasternAssessmentGenerating,
      aiaKoE2EAssessmentData,
      isAiaKoE2EAssessmentGenerating,
      isManulifeSalesGenerating,
      isManulifeSoftSkillsGenerating,
      isManulifeProductKnowledgeGenerating,
      salesTechniquesResponseGenerating,
      productKnowledgeResponseGenerating,
      grabMexSoftSkillsResponseGenerating,
      scormCompletionReady,
    ],
  );

  // Handle error states
  if (sessionError) {
    const errorStatus = sessionError?.status;
    const is403 = errorStatus === 403;
    const is404 = errorStatus === 404;

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F6F8F8] p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-3 text-xl font-semibold text-gray-900">
            {is404 && t('assessment.errors.sessionNotFound')}
            {is403 && t('assessment.errors.sessionForbidden')}
            {!is403 && !is404 && t('assessment.errors.genericError')}
          </h2>
          <p className="mb-6 text-gray-600">
            {is404 && t('assessment.errors.sessionNotFoundMessage')}
            {is403 && t('assessment.errors.sessionForbiddenMessage')}
            {!is403 && !is404 && t('assessment.errors.genericErrorMessage')}
          </p>
          <Link
            to={homeLink}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            {t('assessment.errors.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  if (showTranscript) {
    return (
      <RoleplayTranscript
        messages={session?.messages ?? []}
        onReturnToAssessment={() => setShowTranscript(false)}
        personaName={session?.persona.name ?? ''}
      />
    );
  }

  return (
    <AssessmentContext.Provider value={contextValue}>
      <div className="min-h-screen w-full bg-[#F6F8F8]">
        <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-6 lg:flex-row">
          <aside className="w-full lg:sticky lg:top-6 lg:w-[300px]">
            <div className="flex flex-col space-y-6">
              {isPrudential && <PrudentialSessionCard />}
              {isMSIG && <MSIGSessionCard />}
              {isMSIG3F && <MSIGProductPositioningSessionCard />}
              {isMSIGTravelEasy && <MSIGTravelEasySessionCard />}
              {isRegular && !scorecardsData?.length && <SessionCard />}
              {isGreatEastern && <GreatEasternSessionCard />}
              {isGrabMEX && <GrabMexSessionCard />}
              {isManulife && <ManulifeSessionCard />}
              {isManulifeGoalReady && (
                <ManulifeGoalReadySessionCard
                  goalReadyData={goalReadyAssessmentData}
                />
              )}
              {isBBL && <BBLSessionCard />}
              {isHSBC && <HSBCSessionCard />}
              {scorecardsData?.length && <ScorecardSessionCard />}
              {isMTLRecruitment && <MTLRecruitmentSessionCard />}
              {(isAXAPHRecruitment || isAXAPHObjectionHandling) && (
                <AXAPHSessionCard />
              )}
              {isKTAXARecruitment && <KTAXASessionCard />}
              {isKTAXAFNA && <KTAXAFNASessionCard />}
              {isKTAXAWealthPlus && <KTAXAFNASessionCard />}
              {isMTLProspectPractice && <MTLProspectPracticeSessionCard />}
              {isPrudentialObjectionHandling && (
                <PrudentialObjectionHandlingSessionCard />
              )}
              {isPrudentialPHFactFinding && (
                <PrudentialPHFactFindingSessionCard />
              )}
              {isPrudentialPHAppointmentSetting && (
                <PrudentialPHAppointmentSettingSessionCard />
              )}
              {(isAIAKO || isAIAKOProductPitch || isAIAKOE2E) && <AIAKOSessionCard />}
            </div>
          </aside>

          <main className="w-full flex-1">
            {isPrudential && <PrudentialAssessmentMain />}
            {(isRegular || isMSIG3F) && <RegularAssessmentMain />}
            {isGreatEastern && <GreatEasternAssessmentMain />}
            {isGrabMEX && <GrabMexAssessmentMain />}
            {isMSIG && <MSIGAssessmentMain />}
            {isMSIGTravelEasy && <MSIGTravelEasyAssessmentMain />}
            {isManulife && <ManulifeAssessmentMain />}
            {isManulifeGoalReady && (
              <ManulifeGoalReadyAssessmentMain
                goalReadyData={goalReadyAssessmentData}
              />
            )}
            {isBBL && <BBLAssessmentMain />}
            {isHSBC && <HSBCAssessmentMain />}
            {isMTLRecruitment && <MTLRecruitmentAssessmentMain />}
            {(isAXAPHRecruitment || isAXAPHObjectionHandling) && (
              <AXAPHAssessmentMain />
            )}
            {isKTAXARecruitment && <KTAXAAssessmentMain />}
            {isKTAXAFNA && <KTAXAFNAAssessmentMain />}
            {isKTAXAWealthPlus && <KTAXAFNAAssessmentMain />}
            {scorecardsData?.length && <ScorecardAssessmentMain />}
            {isMTLProspectPractice && <MTLProspectPracticeAssessmentMain />}
            {isPrudentialObjectionHandling && (
              <PrudentialObjectionHandlingAssessmentMain />
            )}
            {isPrudentialPHFactFinding && (
              <PrudentialPHFactFindingAssessmentMain />
            )}
            {isPrudentialPHAppointmentSetting && (
              <PrudentialPHAppointmentSettingAssessmentMain />
            )}
            {isAIAKO && <AIAKOAssessmentMain />}
            {isAIAKOProductPitch && <AIAKOProductPitchAssessmentMain />}
            {isAIAKOE2E && <AIAKOE2EAssessmentMain />}
          </main>

          <aside className="hidden w-[300px] lg:sticky lg:top-6 lg:block">
            <JumpToSection />
          </aside>
        </div>
        {showFeedbackButton &&
          !isScormMode &&
          !fromPast &&
          !dontShowFeedbackModalOnceSent && (
            <>
              {showFeedbackModal && sessionId && (
                <FeedbackModal
                  sessionId={sessionId}
                  onClose={() => {
                    setShowFeedbackModal(false);
                  }}
                  dontShowFeedbackModalOnceSent={() => {
                    setDontShowFeedbackModalOnceSent(true);
                  }}
                />
              )}

              <button
                onClick={() => setShowFeedbackModal(!showFeedbackModal)}
                className={`fixed right-8 bottom-8 z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all focus:outline-none ${showFeedbackModal ? 'bg-white text-black' : 'bg-[#DAE9FC] text-[#1C7AEB]'}`}
                aria-label={
                  showFeedbackModal
                    ? t('feedback.closeFeedback')
                    : t('feedback.shareFeedback')
                }
              >
                {showFeedbackModal ? (
                  <>
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs font-medium sm:text-sm">
                      {t('feedback.closeFeedback')}
                    </span>
                  </>
                ) : (
                  <>
                    <ChatBubbleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs font-medium sm:text-sm">
                      {t('feedback.shareFeedback')}
                    </span>
                  </>
                )}
              </button>
            </>
          )}
      </div>
    </AssessmentContext.Provider>
  );
}
