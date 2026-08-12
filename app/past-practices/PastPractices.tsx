import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Circle } from '~/components/Circle'
import { MSIGStandingBadge } from '~/components/MSIGStandingBadge'
import { ManulifeGoalreadyStandingBadge } from '~/components/ManulifeGoalreadyStandingBadge'
import { ManulifeStandingBadge } from '~/components/ManulifeStandingBadge'
import { PrudentialStandingBadge } from '~/components/PrudentialStandingBadge'
import { formatDuration } from '~/util/api'
import { getScoreRating } from '~/util/scoreRating'
import { ChevronRightIcon } from '../../public/icons/icons'

interface Standing {
  _id: string;
  user: string;
  company: string;
  session: string;
  persona: string;
  standingConfiguration: string;
  tierName: string;
  tierLevel: number;
  overallScore?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PastPracticesProps {
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
    salesTechnique?: number | null;
    productKnowledge?: number | null;
    processAdherence?: number | null;
    communicationAndPresence?: number | null;
    advisoryTechnique?: number | null;
    softSkills?: number | null;
    overallScore?: number | null;
    // HSBC-specific scores
    relationshipManagement?: number | null;
    hsbcProcessAdherence?: number | null;
    representation?: number | null;
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
    // Prudential PH Fact Finding-specific scores
    prudentialPHFactFindingTechnique?: number | null;
    prudentialPHProductKnowledge?: number | null;
    // AIA Korea-specific scores
    aiaKoIntroduction?: number | null;
    aiaKoObjectionHandling?: number | null;
    aiaKoNeedsExploration?: number | null;
    aiaKoNeedsAnalysis?: number | null;
    aiaKoProductPitch?: number | null;
    aiaKoProductPitchObjectionHandling?: number | null;
    aiaKoE2EAssessment?: number | null;
    // Great Eastern-specific scores (3 sections)
    greatEasternSoftSkills?: number | null;
    greatEasternKnowledgeSkills?: number | null;
    greatEasternFinancialPlanning?: number | null;
  };
  standing: Standing | null;
  duration?: number;
}

export default function PastPractices({
  id,
  title,
  startedAt,
  endedAt,
  callType,
  assessmentType,
  product,
  persona,
  scores,
  standing,
  duration,
}: PastPracticesProps) {
  const { t } = useTranslation();

  const subtitle = `${persona.name}, ${persona.occupation}`;

  const overallScore = useMemo(() => {
    if (assessmentType === 'bbl') {
      const scoreList = [scores.advisoryTechnique, scores.processAdherence];

      const validScores = scoreList.filter(
        (score): score is number => score !== null,
      );

      if (validScores.length === 0) return 0;

      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    if (assessmentType === 'hsbc') {
      const scoreList = [
        scores.relationshipManagement || scores.advisoryTechnique,
        scores.hsbcProcessAdherence,
        scores.representation,
        scores.communicationAndPresence,
      ];

      const validScores = scoreList.filter(
        (score): score is number => score != null && score !== undefined,
      );

      if (validScores.length === 0) return 0;

      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }
    if (assessmentType === 'scorecard' && scores.overallScore) {
      return scores.overallScore;
    }

    if (assessmentType === 'manulife-goalready' && standing?.overallScore != null) {
      return Math.round(standing.overallScore * 10) / 10;
    }

    if (assessmentType === 'great-eastern') {
      const isProductPitch = callType === 'great-eastern-product-pitch';
      const hasProductKnowledge = scores.productKnowledge != null;

      // If we have individual section scores, use them (preferred method)
      const hasSectionScores =
        scores.greatEasternSoftSkills != null ||
        scores.greatEasternKnowledgeSkills != null ||
        scores.greatEasternFinancialPlanning != null;

      if (hasSectionScores) {
        const allScores: number[] = [];

        if (scores.greatEasternSoftSkills != null) {
          allScores.push(scores.greatEasternSoftSkills);
        }
        if (scores.greatEasternKnowledgeSkills != null) {
          allScores.push(scores.greatEasternKnowledgeSkills);
        }
        if (scores.greatEasternFinancialPlanning != null) {
          allScores.push(scores.greatEasternFinancialPlanning);
        }

        // Add product knowledge for product pitch sessions
        if (isProductPitch && hasProductKnowledge && scores.productKnowledge) {
          allScores.push(Math.round((scores.productKnowledge * 33) / 100));
        }

        if (allScores.length > 0) {
          return Math.round(
            allScores.reduce((sum, s) => sum + s, 0) / allScores.length,
          );
        }
      }

      // For non-product-pitch sessions, use backend's overallScore
      if (scores.overallScore != null) {
        return scores.overallScore;
      }

      // Fallback to legacy 2-score approach
      const scoreList = [scores.salesTechnique, scores.productKnowledge].filter(
        (s): s is number => s != null && typeof s === 'number',
      );
      if (scoreList.length === 0) return 0;
      return Math.round(
        scoreList.reduce((sum, s) => sum + s, 0) / scoreList.length,
      );
    }

    // MTL recruitment and prospect practice only have sales technique
    if (
      assessmentType === 'mtl-recruitment' ||
      assessmentType === 'mtl-prospect-practice'
    ) {
      return scores.salesTechnique || 0;
    }

    // AXA PH recruitment and objection handling use soft skills and knowledge skills
    if (
      assessmentType === 'axa-ph-recruitment' ||
      assessmentType === 'axa-ph-objection-handling'
    ) {
      const scoreList = [scores.axaPhSoftSkills, scores.axaPhKnowledgeSkills];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    // KT AXA recruitment uses soft skills and knowledge skills
    if (assessmentType === 'kt-axa-recruitment') {
      const scoreList = [scores.ktAxaSoftSkills, scores.ktAxaKnowledgeSkills];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    // KT AXA FNA and WealthPlus use soft skills, knowledge skills, and product knowledge
    if (
      assessmentType === 'kt-axa-fna' ||
      assessmentType === 'kt-axa-wealthplus'
    ) {
      const scoreList = [
        scores.ktAxaSoftSkills,
        scores.ktAxaKnowledgeSkills,
        scores.ktAxaProductKnowledge,
      ];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    // Prudential PH Appointment Setting uses overallScore from the assessment
    if (assessmentType === 'prudential-ph-appointment-setting') {
      return scores.overallScore || 0;
    }

    // MSIG Travel Easy uses soft skills, knowledge skills, and product knowledge
    // Sum the scores instead of averaging (matching MSIGTravelEasySessionCard logic)
    if (assessmentType === 'msig-travel-easy') {
      const scoreList = [
        scores.msigTravelEasySoftSkills,
        scores.msigTravelEasyKnowledgeSkills,
        scores.msigTravelEasyProductKnowledge,
      ];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      // Sum all scores (not average)
      return validScores.reduce((sum, score) => sum + score, 0);
    }

    // Prudential PH Fact Finding uses fact-finding technique and product knowledge
    if (assessmentType === 'prudential-ph-fact-finding') {
      const scoreList = [
        scores.prudentialPHFactFindingTechnique,
        scores.prudentialPHProductKnowledge,
      ];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    // AIA Korea uses introduction, objection handling, and needs exploration
    if (assessmentType === 'aia-ko-opening-objection-call') {
      const scoreList = [
        scores.aiaKoIntroduction,
        scores.aiaKoObjectionHandling,
        scores.aiaKoNeedsExploration,
      ];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    // AIA Korea uses introduction, objection handling, and needs exploration
    if (assessmentType === 'aia-ko-product-pitch') {
      const scoreList = [
        scores.aiaKoNeedsAnalysis,
        scores.aiaKoProductPitch,
        scores.aiaKoProductPitchObjectionHandling,
      ];
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
      );
    }

    if (assessmentType === 'aia-ko-end-to-end-outbound-call') {
      const scoreList = [
        scores.aiaKoE2EAssessment,
      ]
      const validScores = scoreList.filter(
        (score): score is number => score != null,
      );
      if (validScores.length === 0) return 0;
      return Math.round(
        (scoreList.reduce((sum, score) => (sum || 0) + (score || 0), 0) || 0) / scoreList.length,
      );
    }

    const scoreList = [];

    // Include soft skills for grab-mex assessments
    if (assessmentType === 'grab-mex') {
      scoreList.push(scores.softSkills);
    }

    scoreList.push(scores.salesTechnique);
    scoreList.push(scores.productKnowledge);

    const validScores = scoreList.filter(
      (score): score is number => score != null,
    );

    if (validScores.length === 0) return 0;

    return Math.round(
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length,
    );
  }, [scores, assessmentType, callType]);

  const outerRingScore = useMemo(() => {
    if (assessmentType === 'bbl') {
      return scores.advisoryTechnique;
    }
    return scores.salesTechnique;
  }, [scores, assessmentType]);

  const innerRingScore = useMemo(() => {
    if (assessmentType === 'bbl') {
      return scores.processAdherence;
    }
    return scores.productKnowledge;
  }, [scores, assessmentType]);

  return (
    <div className="flex w-full max-w-[700px] flex-col justify-between gap-3 rounded-2xl border border-[#D9DDE0] bg-white p-6 md:min-w-[500px] md:flex-row md:gap-6">
      {/* header */}
      <div className="shrink-1">
        <div className="mb-1 text-[12px] uppercase">{endedAt}</div>
        <h1 className="text-[16px] font-bold text-gray-900">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </h1>
        <p className="text-[14px] text-[#58595A]">
          {subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}
        </p>
        {duration && (
          <p className="mt-1 text-[12px] text-[#58595A]">
            Duration: {formatDuration(duration)}
          </p>
        )}
      </div>

      {/* scores row */}
      <div className="flex shrink-0 items-center justify-center gap-x-2">
        {(assessmentType === 'prudential' ||
          assessmentType === 'prudential-objection-handling') && (
          <PrudentialStandingBadge standing={standing} />
        )}
        {(assessmentType === 'msig' ||
          assessmentType === 'msig-3f' ||
          assessmentType === 'msig-travel-easy') && (
          <MSIGStandingBadge standing={standing} />
        )}
        {assessmentType === 'manulife' && (
          <ManulifeStandingBadge standing={standing} />
        )}
        {assessmentType === 'manulife-goalready' && (
          <ManulifeGoalreadyStandingBadge
            standing={standing}
            overallScore={overallScore}
          />
        )}
        {assessmentType === 'grab-mex' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles */}
            <div className="relative">
              {scores.softSkills && (
                <Circle
                  size={assessmentType === 'grab-mex' ? 66 : 60}
                  strokeWidth={4}
                  value={scores.softSkills}
                  color={getScoreRating(scores.softSkills).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.salesTechnique && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={assessmentType === 'grab-mex' ? 52 : 48}
                    strokeWidth={4}
                    value={scores.salesTechnique}
                    color={getScoreRating(scores.salesTechnique, true).color}
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              {scores.productKnowledge && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={38}
                    strokeWidth={4}
                    value={scores.productKnowledge}
                    color={getScoreRating(scores.productKnowledge, true).color}
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'bbl' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* BBL circles - advisory technique and process adherence */}
            <div className="relative">
              {scores.advisoryTechnique && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={scores.advisoryTechnique}
                  color={getScoreRating(scores.advisoryTechnique).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.processAdherence && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={48}
                    strokeWidth={4}
                    value={scores.processAdherence}
                    color={getScoreRating(scores.processAdherence, true).color}
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'hsbc' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* HSBC single circle with overall score */}
            <div className="relative">
              <Circle
                value={overallScore || 0}
                color={getScoreRating(overallScore || 0).color}
                bgColor="var(--color-gray-100)"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'scorecard' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>
            {/* nested circles */}
            <div className="relative">
              {overallScore && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={overallScore}
                  color={getScoreRating(overallScore).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'great-eastern' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>
            {/* nested circles: 3 sections for Great Eastern or fallback to 2 */}
            <div className="relative">
              {/* Product pitch: soft skills + knowledge skills + product knowledge */}
              {scores.greatEasternSoftSkills != null &&
              scores.greatEasternKnowledgeSkills != null &&
              scores.productKnowledge != null &&
              (callType === 'great-eastern-product-pitch' ||
                scores.greatEasternFinancialPlanning == null) ? (
                <>
                  <Circle
                    size={66}
                    strokeWidth={4}
                    value={scores.greatEasternSoftSkills}
                    color={getScoreRating(scores.greatEasternSoftSkills).color}
                    bgColor="var(--color-gray-100)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Circle
                      size={52}
                      strokeWidth={4}
                      value={scores.greatEasternKnowledgeSkills}
                      color={
                        getScoreRating(scores.greatEasternKnowledgeSkills, true)
                          .color
                      }
                      bgColor="var(--color-gray-100)"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Circle
                      size={38}
                      strokeWidth={4}
                      value={scores.productKnowledge}
                      color={
                        getScoreRating(scores.productKnowledge, true).color
                      }
                      bgColor="var(--color-gray-100)"
                    />
                  </div>
                </>
              ) : /* Financial planning: soft skills + knowledge skills + financial planning */
              scores.greatEasternSoftSkills != null &&
                scores.greatEasternKnowledgeSkills != null &&
                scores.greatEasternFinancialPlanning != null ? (
                <>
                  <Circle
                    size={66}
                    strokeWidth={4}
                    value={scores.greatEasternSoftSkills}
                    color={getScoreRating(scores.greatEasternSoftSkills).color}
                    bgColor="var(--color-gray-100)"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Circle
                      size={52}
                      strokeWidth={4}
                      value={scores.greatEasternKnowledgeSkills}
                      color={
                        getScoreRating(scores.greatEasternKnowledgeSkills, true)
                          .color
                      }
                      bgColor="var(--color-gray-100)"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Circle
                      size={38}
                      strokeWidth={4}
                      value={scores.greatEasternFinancialPlanning}
                      color={
                        getScoreRating(
                          scores.greatEasternFinancialPlanning,
                          true,
                        ).color
                      }
                      bgColor="var(--color-gray-100)"
                    />
                  </div>
                </>
              ) : scores.salesTechnique != null ||
                scores.productKnowledge != null ? (
                /* Fallback to legacy 2-score display */
                <>
                  {scores.salesTechnique != null &&
                  scores.productKnowledge != null ? (
                    <>
                      <Circle
                        size={60}
                        strokeWidth={4}
                        value={scores.salesTechnique}
                        color={getScoreRating(scores.salesTechnique).color}
                        bgColor="var(--color-gray-100)"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Circle
                          size={48}
                          strokeWidth={4}
                          value={scores.productKnowledge}
                          color={
                            getScoreRating(scores.productKnowledge, true).color
                          }
                          bgColor="var(--color-gray-100)"
                        />
                      </div>
                    </>
                  ) : scores.salesTechnique != null ? (
                    <Circle
                      size={60}
                      strokeWidth={4}
                      value={scores.salesTechnique}
                      color={getScoreRating(scores.salesTechnique).color}
                      bgColor="var(--color-gray-100)"
                    />
                  ) : scores.productKnowledge != null ? (
                    <Circle
                      size={60}
                      strokeWidth={4}
                      value={scores.productKnowledge}
                      color={getScoreRating(scores.productKnowledge).color}
                      bgColor="var(--color-gray-100)"
                    />
                  ) : null}
                </>
              ) : overallScore != null ? (
                /* Fallback: single circle for overall score */
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={overallScore}
                  color={getScoreRating(overallScore).color}
                  bgColor="var(--color-gray-100)"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {(assessmentType === 'mtl-recruitment' ||
          assessmentType === 'mtl-prospect-practice') && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* single circle for MTL assessments */}
            <div className="relative">
              {scores.salesTechnique && (
                <Circle
                  value={scores.salesTechnique}
                  color={getScoreRating(scores.salesTechnique).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {(assessmentType === 'axa-ph-recruitment' ||
          assessmentType === 'axa-ph-objection-handling') && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for AXA PH - soft skills (outer) and knowledge skills (inner) */}
            <div className="relative">
              {scores.axaPhSoftSkills != null && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={scores.axaPhSoftSkills}
                  color={getScoreRating(scores.axaPhSoftSkills).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.axaPhKnowledgeSkills != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={48}
                    strokeWidth={4}
                    value={scores.axaPhKnowledgeSkills}
                    color={
                      getScoreRating(scores.axaPhKnowledgeSkills, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'kt-axa-recruitment' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for KT AXA - soft skills (outer) and knowledge skills (inner) */}
            <div className="relative">
              {scores.ktAxaSoftSkills != null && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={scores.ktAxaSoftSkills}
                  color={getScoreRating(scores.ktAxaSoftSkills).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.ktAxaKnowledgeSkills != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={48}
                    strokeWidth={4}
                    value={scores.ktAxaKnowledgeSkills}
                    color={
                      getScoreRating(scores.ktAxaKnowledgeSkills, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {(assessmentType === 'kt-axa-fna' ||
          assessmentType === 'kt-axa-wealthplus') && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for KT AXA FNA/WealthPlus - soft skills (outer), knowledge skills (middle), product knowledge (inner) */}
            <div className="relative">
              {scores.ktAxaSoftSkills != null && (
                <Circle
                  size={66}
                  strokeWidth={4}
                  value={scores.ktAxaSoftSkills}
                  color={getScoreRating(scores.ktAxaSoftSkills).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.ktAxaKnowledgeSkills != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={52}
                    strokeWidth={4}
                    value={scores.ktAxaKnowledgeSkills}
                    color={
                      getScoreRating(scores.ktAxaKnowledgeSkills, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              {scores.ktAxaProductKnowledge != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={38}
                    strokeWidth={4}
                    value={scores.ktAxaProductKnowledge}
                    color={
                      getScoreRating(scores.ktAxaProductKnowledge, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}

        {assessmentType === 'prudential-ph-fact-finding' && (
          <>
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>
            <div className="relative">
              {scores.prudentialPHFactFindingTechnique != null && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={scores.prudentialPHFactFindingTechnique}
                  color={
                    getScoreRating(scores.prudentialPHFactFindingTechnique)
                      .color
                  }
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.prudentialPHProductKnowledge != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={48}
                    strokeWidth={4}
                    value={scores.prudentialPHProductKnowledge}
                    color={
                      getScoreRating(scores.prudentialPHProductKnowledge, true)
                        .color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'aia-ko-opening-objection-call' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for AIA Korea - introduction (outer), objection handling (middle), needs exploration (inner) */}
            <div className="relative">
              {scores.aiaKoIntroduction != null && (
                <Circle
                  size={66}
                  strokeWidth={4}
                  value={scores.aiaKoIntroduction}
                  color={getScoreRating(scores.aiaKoIntroduction).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.aiaKoObjectionHandling != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={52}
                    strokeWidth={4}
                    value={scores.aiaKoObjectionHandling}
                    color={
                      getScoreRating(scores.aiaKoObjectionHandling, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              {scores.aiaKoNeedsExploration != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={38}
                    strokeWidth={4}
                    value={scores.aiaKoNeedsExploration}
                    color={
                      getScoreRating(scores.aiaKoNeedsExploration, true).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'aia-ko-product-pitch' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for AIA Korea - introduction (outer), objection handling (middle), needs exploration (inner) */}
            <div className="relative">
              {scores.aiaKoNeedsAnalysis != null && (
                <Circle
                  size={66}
                  strokeWidth={4}
                  value={scores.aiaKoNeedsAnalysis}
                  color={getScoreRating(scores.aiaKoNeedsAnalysis).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {scores.aiaKoProductPitch != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={52}
                    strokeWidth={4}
                    value={scores.aiaKoProductPitch}
                    color={getScoreRating(scores.aiaKoProductPitch, true).color}
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              {scores.aiaKoProductPitchObjectionHandling != null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={38}
                    strokeWidth={4}
                    value={scores.aiaKoProductPitchObjectionHandling}
                    color={
                      getScoreRating(
                        scores.aiaKoProductPitchObjectionHandling,
                        true,
                      ).color
                    }
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {assessmentType === 'aia-ko-end-to-end-outbound-call' && overallScore ? (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles for AIA Korea - introduction (outer), objection handling (middle), needs exploration (inner) */}
            <div className="relative">
              {scores.aiaKoE2EAssessment != null && (
                <Circle
                  size={66}
                  strokeWidth={4}
                  value={scores.aiaKoE2EAssessment}
                  color={getScoreRating(scores.aiaKoE2EAssessment).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        ) : <></>}
        {assessmentType === 'prudential-ph-appointment-setting' && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* single circle for appointment setting */}
            <div className="relative">
              <Circle
                value={overallScore || 0}
                color={getScoreRating(overallScore || 0).color}
                bgColor="var(--color-gray-100)"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        {(assessmentType === 'regular' || !assessmentType) && (
          <>
            {/* overall score */}
            <div className="text-right">
              <div className="flex flex-col text-sm font-medium text-gray-500">
                <span>{t('overallScore')}</span>
                <span className="text-[16px] font-bold text-[#161618]">
                  {t(getScoreRating(overallScore).rating)}
                </span>
              </div>
            </div>

            {/* nested circles */}
            <div className="relative">
              {outerRingScore && (
                <Circle
                  size={60}
                  strokeWidth={4}
                  value={outerRingScore}
                  color={getScoreRating(outerRingScore).color}
                  bgColor="var(--color-gray-100)"
                />
              )}
              {innerRingScore && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Circle
                    size={48}
                    strokeWidth={4}
                    value={innerRingScore}
                    color={getScoreRating(innerRingScore, true).color}
                    bgColor="var(--color-gray-100)"
                  />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] leading-[28px] font-[700]">
                  {overallScore}
                </span>
              </div>
            </div>
          </>
        )}
        <div className="flex items-center">
          <Link
            to={`/roleplay/${id}/assessment?fromPast=1`}
            className="ml-2 flex cursor-pointer items-center text-sm font-bold whitespace-nowrap text-[#1C7AEB] transition-all duration-200 ease-in-out hover:scale-[1.02] hover:opacity-80 active:scale-[0.98]"
          >
            {t('viewDetails')}
            <ChevronRightIcon className="ml-1" height={20} width={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
