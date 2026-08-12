import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { ExtendedSession } from '~/assessment/types';
import { StandingsModal } from '~/components/StandingsModal';
import {
  ScorecardModal,
  type ScorecardSection,
} from '~/components/ScorecardModal';
import type { Session } from '../routes/app/roleplay/types';
import { laerFrameworks } from '~/data/laer-framework';

export default function RoleplayDetailsSection({
  session,
}: {
  session: ExtendedSession | Session | null | undefined;
}) {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);

  // Helper function to safely get array from translation
  const getTranslationArray = (key: string): string[] => {
    const result = t(key, { returnObjects: true });
    if (Array.isArray(result)) {
      return result.filter((item): item is string => typeof item === 'string');
    }
    return [];
  };

  const title = session
    ? t('sessions.sessionTitle', {
        module: session.module.title,
        persona: session.persona?.name || t('sessions.theClient'),
      })
    : t('common.loading');
  const description =
    session?.scenario?.scenarioDetails?.salesDescription ??
    session?.persona?.details?.salesDescription ??
    t('sessions.loadingSessionDetails');

  const objectives =
    session?.roleplay?.objectives && session.roleplay.objectives.length > 0
      ? session.roleplay.objectives
      : [t('sessions.loadingObjectives')];

  const objection =
    session?.scenario?.scenarioDetails?.mainObjection ??
    session?.persona?.details?.mainObjection ??
    t('sessions.defaultObjection');

  const framework = session?.framework;
  const callCriteria = session?.product?.callCriteria;
  const isPrudential = session?.assessmentType === 'prudential';
  const isMSIGTelesales =
    session?.module.friendlyId === 'telesales' &&
    session?.assessmentType === 'msig';
  const isMSIGProductPositioning =
    session?.module.friendlyId === 'product-positioning' &&
    session?.assessmentType === 'msig-3f';
  const isManulife = session?.assessmentType === 'manulife';
  const isManulifeGoalReady = session?.assessmentType === 'manulife-goalready';
  const isBBL = session?.assessmentType === 'bbl';
  const isHSBC = session?.assessmentType === 'hsbc';
  const isGrabMex = session?.assessmentType === 'grab-mex';
  const isPrudentialObjectionHandling =
    session?.assessmentType === 'prudential-objection-handling';
  const isPrudentialPHAppointmentSetting =
    session?.assessmentType === 'prudential-ph-appointment-setting';
  const isAXAPHRecruitment = session?.assessmentType === 'axa-ph-recruitment';
  const isAXAPHObjectionHandling =
    session?.assessmentType === 'axa-ph-objection-handling';
  const isAXAPHFNA =
    session?.module?.friendlyId === 'axa-ph-financial-needs-analysis';
  const isKTAXA = session?.assessmentType === 'kt-axa-recruitment';
  const isKTAXAFNA = session?.assessmentType === 'kt-axa-fna';
  const isKTAXAWealthplus = session?.assessmentType === 'kt-axa-wealthplus';
  const isMSIGTravelEasy = session?.assessmentType === 'msig-travel-easy';
  const isPrudentialPHFactFinding =
    session?.assessmentType === 'prudential-ph-fact-finding';
  const isGreatEastern = session?.assessmentType === 'great-eastern';

  const hasSalesCallCriteria =
    isPrudential ||
    isMSIGTelesales ||
    isMSIGProductPositioning ||
    isManulife ||
    isMSIGTravelEasy;
  const hasHSBCScorecard = isHSBC;
  const hasPrudentialObjectionHandlingScorecard = isPrudentialObjectionHandling;
  const hasPrudentialPHAppointmentSettingScorecard =
    isPrudentialPHAppointmentSetting && framework;
  const hasAXAPHScorecard =
    (isAXAPHRecruitment || isAXAPHObjectionHandling) && framework;
  const hasAXAPHFNAScorecard = isAXAPHFNA && framework;
  const hasKTAXAScorecard = isKTAXA && framework;
  const hasKTAXAFNAScorecard = isKTAXAFNA;
  const hasKTAXAWealthplusScorecard = isKTAXAWealthplus && framework;
  const hasManulifeGoalReadyScorecard = isManulifeGoalReady;
  const hasMSIGTravelEasyScorecard = false; // Using callCriteria display instead
  const hasPrudentialPHFactFindingScorecard =
    isPrudentialPHFactFinding && framework;
  const hasGreatEasternScorecard =
    isGreatEastern &&
    (framework != null || session?.scenario?.scorecard != null);
  const hasStandardFramework =
    !hasSalesCallCriteria &&
    !hasHSBCScorecard &&
    !hasPrudentialObjectionHandlingScorecard &&
    !hasPrudentialPHAppointmentSettingScorecard &&
    !hasAXAPHScorecard &&
    !hasAXAPHFNAScorecard &&
    !hasKTAXAScorecard &&
    !hasKTAXAFNAScorecard &&
    !hasKTAXAWealthplusScorecard &&
    !hasManulifeGoalReadyScorecard &&
    !hasMSIGTravelEasyScorecard &&
    !hasPrudentialPHFactFindingScorecard &&
    !hasGreatEasternScorecard &&
    framework;
  const hasBBLPortfolioReviewTrigger =
    isBBL && !!session?.persona?.meta?.bblPortfolioReviewTrigger;
  const scorecards = session?.scenario?.scorecard?.sections;

  // Get localized LAER framework for Grab MEX
  const softSkillsFramework = useMemo(() => {
    if (!isGrabMex) return null;
    const currentLanguage = i18n.language || 'en';
    return laerFrameworks[currentLanguage] || laerFrameworks.en;
  }, [isGrabMex, i18n.language]);

  // Convert framework to ScorecardSection format for AXA PH
  const axaphScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasAXAPHScorecard || !framework?.parts) return [];
    return framework.parts.map((part, index) => ({
      id: `section-${index}`,
      title: part.title,
      content: [
        {
          title: part.title,
          items: part.items,
        },
      ],
    }));
  }, [hasAXAPHScorecard, framework]);

  // Convert framework to ScorecardSection format for AXA PH FNA
  const axaphFNAScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasAXAPHFNAScorecard || !framework?.parts) return [];
    return framework.parts.map((part, index) => ({
      id: `section-${index}`,
      title: part.title,
      content: [
        {
          title: part.title,
          items: part.items,
        },
      ],
    }));
  }, [hasAXAPHFNAScorecard, framework]);

  // Convert framework to ScorecardSection format for Prudential PH Fact Finding
  const prudentialPHFactFindingScorecardSections: ScorecardSection[] =
    useMemo(() => {
      if (!hasPrudentialPHFactFindingScorecard || !framework?.parts) return [];
      return framework.parts.map((part, index) => ({
        id: `section-${index}`,
        title: part.title,
        content: [
          {
            title: part.title,
            items: part.items,
          },
        ],
      }));
    }, [hasPrudentialPHFactFindingScorecard, framework]);

  // KT AXA Recruitment scorecard sections
  const ktAxaScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasKTAXAScorecard) return [];
    return [
      {
        id: 'soft-skills',
        title: t('assessment.softSkills'),
        content: [
          {
            title: t(
              'assessment.ktAxaRecruitment.criteria.communicationSkills',
            ),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.communicationSkills',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaRecruitment.criteria.relationshipBuilding',
            ),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.relationshipBuilding',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaRecruitment.criteria.adaptability'),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.adaptability',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaRecruitment.criteria.customerOrientation',
            ),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.customerOrientation',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'knowledge-skills',
        title: t('assessment.knowledgeSkills'),
        content: [
          {
            title: t('assessment.ktAxaRecruitment.criteria.factFinding'),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.factFinding',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaRecruitment.criteria.problemSolving'),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.problemSolving',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaRecruitment.criteria.salesNegotiationSkills',
            ),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.salesNegotiationSkills',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaRecruitment.criteria.complianceRegulations',
            ),
            description: t(
              'assessment.ktAxaRecruitment.descriptions.complianceRegulations',
            ),
            items: [],
          },
        ],
      },
    ];
  }, [hasKTAXAScorecard, t]);

  // KT AXA FNA scorecard sections
  const ktAxaFNAScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasKTAXAFNAScorecard) return [];
    return [
      {
        id: 'soft-skills',
        title: t('assessment.softSkills'),
        content: [
          {
            title: t('assessment.ktAxaFna.criteria.communicationSkills'),
            description: t(
              'assessment.ktAxaFna.descriptions.communicationSkills',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.relationshipBuilding'),
            description: t(
              'assessment.ktAxaFna.descriptions.relationshipBuilding',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.adaptability'),
            description: t('assessment.ktAxaFna.descriptions.adaptability'),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.customerOrientation'),
            description: t(
              'assessment.ktAxaFna.descriptions.customerOrientation',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'knowledge-skills',
        title: t('assessment.knowledgeSkills'),
        content: [
          {
            title: t('assessment.ktAxaFna.criteria.factFinding'),
            description: t('assessment.ktAxaFna.descriptions.factFinding'),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.problemSolving'),
            description: t('assessment.ktAxaFna.descriptions.problemSolving'),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.salesNegotiationSkills'),
            description: t(
              'assessment.ktAxaFna.descriptions.salesNegotiationSkills',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaFna.criteria.complianceRegulations'),
            description: t(
              'assessment.ktAxaFna.descriptions.complianceRegulations',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'product-knowledge',
        title: t('assessment.productKnowledge'),
        content: [
          {
            title: t('assessment.ktAxaFna.criteria.productPitch'),
            description: t('assessment.ktAxaFna.descriptions.productPitch'),
            items: [],
          },
        ],
      },
    ];
  }, [hasKTAXAFNAScorecard, t]);

  // MSIG Travel Easy scorecard sections
  const msigTravelEasyScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasMSIGTravelEasyScorecard) return [];
    return [
      {
        id: 'soft-skills',
        title: t('assessment.softSkills'),
        content: [
          {
            title:
              t('assessment.msigTravelEasy.criteria.communicationSkills') ||
              'Communication Skills',
            description:
              t('assessment.msigTravelEasy.descriptions.communicationSkills') ||
              'Clear and respectful communication using language that is easy to understand and not overly technical',
            items: [],
          },
          {
            title:
              t('assessment.msigTravelEasy.criteria.relationshipBuilding') ||
              'Relationship Building',
            description:
              t(
                'assessment.msigTravelEasy.descriptions.relationshipBuilding',
              ) ||
              'Building and maintaining rapport with customers while demonstrating patience when dealing with demanding high-networth clients',
            items: [],
          },
          {
            title:
              t('assessment.msigTravelEasy.criteria.adaptability') ||
              'Adaptability',
            description:
              t('assessment.msigTravelEasy.descriptions.adaptability') ||
              'Flexibility in adapting to and understanding customer concerns',
            items: [],
          },
          {
            title:
              t('assessment.msigTravelEasy.criteria.customerOrientation') ||
              'Customer Orientation',
            description:
              t('assessment.msigTravelEasy.descriptions.customerOrientation') ||
              'Focus on delivering customer satisfaction and excellent service',
            items: [],
          },
        ],
      },
      {
        id: 'knowledge-skills',
        title: t('assessment.knowledgeSkills'),
        content: [
          {
            title:
              t('assessment.msigTravelEasy.criteria.factFinding') ||
              'Fact Finding',
            description:
              t('assessment.msigTravelEasy.descriptions.factFinding') ||
              'Gathering all required customer information including: Name, Age, Occupation, Annual Income, and Financial Objectives',
            items: [],
          },
          {
            title:
              t('assessment.msigTravelEasy.criteria.problemSolving') ||
              'Problem-Solving',
            description:
              t('assessment.msigTravelEasy.descriptions.problemSolving') ||
              'Ability to identify customer issues and provide effective solutions',
            items: [],
          },
          {
            title:
              t('assessment.msigTravelEasy.criteria.salesNegotiationSkills') ||
              'Sales & Negotiation Skills',
            description:
              t(
                'assessment.msigTravelEasy.descriptions.salesNegotiationSkills',
              ) ||
              'Ability to close deals and negotiate effectively with highly knowledgeable clients',
            items: [],
          },
        ],
      },
      {
        id: 'product-knowledge',
        title: t('assessment.productKnowledge'),
        content: [
          {
            title:
              t('assessment.msigTravelEasy.criteria.productPitch') ||
              'Product Pitch',
            description:
              t('assessment.msigTravelEasy.descriptions.productPitch') ||
              "Demonstrating understanding of product features and benefits while providing solutions aligned with the customer's profile",
            items: [],
          },
        ],
      },
    ];
  }, [hasMSIGTravelEasyScorecard, t]);

  // KT AXA WealthPlus scorecard sections
  const ktAxaWealthplusScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasKTAXAWealthplusScorecard) return [];
    return [
      {
        id: 'soft-skills',
        title: t('assessment.softSkills'),
        content: [
          {
            title: t('assessment.ktAxaWealthplus.criteria.communicationSkills'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.communicationSkills',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaWealthplus.criteria.relationshipBuilding',
            ),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.relationshipBuilding',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaWealthplus.criteria.adaptability'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.adaptability',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaWealthplus.criteria.customerOrientation'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.customerOrientation',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'knowledge-skills',
        title: t('assessment.knowledgeSkills'),
        content: [
          {
            title: t('assessment.ktAxaWealthplus.criteria.factFinding'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.factFinding',
            ),
            items: [],
          },
          {
            title: t('assessment.ktAxaWealthplus.criteria.problemSolving'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.problemSolving',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaWealthplus.criteria.salesNegotiationSkills',
            ),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.salesNegotiationSkills',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.ktAxaWealthplus.criteria.complianceRegulations',
            ),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.complianceRegulations',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'product-knowledge',
        title: t('assessment.productKnowledge'),
        content: [
          {
            title: t('assessment.ktAxaWealthplus.criteria.productKnowledge'),
            description: t(
              'assessment.ktAxaWealthplus.descriptions.productKnowledge',
            ),
            items: [],
          },
        ],
      },
    ];
  }, [hasKTAXAWealthplusScorecard, t]);

  // Manulife GoalReady scorecard sections
  const manulifeGoalReadyScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasManulifeGoalReadyScorecard) return [];
    return [
      {
        id: 'sales-negotiation-skills',
        title: t('assessment.manulifeGoalReady.criteria.salesNegotiationSkills'),
        content: [
          {
            title: t('assessment.manulifeGoalReady.criteria.salesNegotiationSkills'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.salesNegotiationSkills',
            ),
          },
        ],
      },
      {
        id: 'soft-skills',
        title: t('assessment.softSkills'),
        content: [
          {
            title: t('assessment.manulifeGoalReady.criteria.communicationSkills'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.communicationSkills',
            ),
          },
          {
            title: t('assessment.manulifeGoalReady.criteria.relationshipBuilding'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.relationshipBuilding',
            ),
          },
          {
            title: t('assessment.manulifeGoalReady.criteria.adaptability'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.adaptability',
            ),
          },
          {
            title: t('assessment.manulifeGoalReady.criteria.customerOrientation'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.customerOrientation',
            ),
          },
        ],
      },
      {
        id: 'product-knowledge',
        title: t('assessment.productKnowledge'),
        content: [
          {
            title: t('assessment.manulifeGoalReady.criteria.productPitch'),
            items: getTranslationArray(
              'assessment.manulifeGoalReady.descriptions.productPitch',
            ),
          },
        ],
      },
    ];
  }, [hasManulifeGoalReadyScorecard, t]);

  // Prudential Objection Handling scorecard sections
  const prudentialOHScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasPrudentialObjectionHandlingScorecard) return [];
    return [
      {
        id: 'sales-technique',
        title: 'Sales Technique (3F Model)',
        content: [
          {
            title: 'Feel',
            description:
              "Acknowledge the customer's concern with genuine empathy and understanding",
            items: [
              "Actively listen and acknowledge the customer's emotions and concerns",
              'Use empathetic language that shows understanding of their perspective',
              'Validate their feelings without being dismissive',
              'Demonstrate genuine care for their situation and challenges',
            ],
          },
          {
            title: 'Felt',
            description:
              'Share a relatable story of someone who had the same concern',
            items: [
              'Share relevant stories or examples of others in similar situations',
              "Use examples that are credible and relatable to the customer's circumstances",
              "Build trust by showing you've helped others with comparable challenges",
              "Use appropriate social proof to normalize the customer's concerns",
            ],
          },
          {
            title: 'Found',
            description:
              'Connect the story to demonstrate value and resolution',
            items: [
              'Present clear solutions that directly address the concerns identified',
              'Explain the positive outcomes and benefits others achieved',
              'Build confidence in your proposed approach with specific results',
              'Make the solution feel achievable and relevant to their situation',
            ],
          },
        ],
      },
      {
        id: 'objection-handling',
        title: 'Objection Handling (LAPR Framework)',
        content: [
          {
            title: 'Listen',
            description:
              'Give your full attention and let the customer express their concern completely',
            items: [
              'Allow the customer to finish speaking before responding',
              'Pay attention to both verbal and non-verbal cues',
              'Take mental notes of the key concerns being raised',
              'Show patience and avoid interrupting',
            ],
          },
          {
            title: 'Acknowledge',
            description:
              "Validate the customer's feelings and show genuine understanding",
            items: [
              'Use empathetic language: "I understand how you feel..."',
              'Avoid dismissing or minimizing their concerns',
              'Show that you take their objection seriously',
              'Build rapport through genuine acknowledgment',
            ],
          },
          {
            title: 'Probe',
            description:
              'Ask thoughtful questions to understand the root cause of the objection',
            items: [
              'Use open-ended questions to explore deeper concerns',
              'Clarify any ambiguous points in their objection',
              'Understand their priorities and what matters most to them',
              'Uncover the real reason behind the stated objection',
            ],
          },
          {
            title: 'Reframe',
            description:
              'Present a different perspective that addresses their concern while highlighting value',
            items: [
              'Connect your response to their specific situation',
              'Offer relevant examples or success stories',
              'Show how the solution addresses their underlying need',
              'Guide them toward seeing the value without being pushy',
            ],
          },
        ],
      },
    ];
  }, [hasPrudentialObjectionHandlingScorecard]);

  // Prudential PH Appointment Setting scorecard sections
  const prudentialPHAppointmentSettingScorecardSections: ScorecardSection[] =
    useMemo(() => {
      if (!hasPrudentialPHAppointmentSettingScorecard || !framework?.parts)
        return [];
      return framework.parts.map((part, index) => ({
        id: `section-${index}`,
        title: part.title,
        content: [
          {
            title: part.title,
            items: part.items,
          },
        ],
      }));
    }, [hasPrudentialPHAppointmentSettingScorecard, framework]);

  // HSBC scorecard sections
  const hsbcScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasHSBCScorecard) return [];
    return [
      {
        id: 'relationship-management',
        title: t('assessment.relationshipManagement'),
        content: [
          {
            title: t(
              'assessment.hsbcScorecard.relationshipManagement.clientCentricFraming.title',
            ),
            description: t(
              'assessment.hsbcScorecard.relationshipManagement.clientCentricFraming.description',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.hsbcScorecard.relationshipManagement.clarityAndStructure.title',
            ),
            description: t(
              'assessment.hsbcScorecard.relationshipManagement.clarityAndStructure.description',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.hsbcScorecard.relationshipManagement.suitabilityAndCompliance.title',
            ),
            description: t(
              'assessment.hsbcScorecard.relationshipManagement.suitabilityAndCompliance.description',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.hsbcScorecard.relationshipManagement.gravitasAndDelivery.title',
            ),
            description: t(
              'assessment.hsbcScorecard.relationshipManagement.gravitasAndDelivery.description',
            ),
            items: [],
          },
          {
            title: t(
              'assessment.hsbcScorecard.relationshipManagement.engagementAndRapport.title',
            ),
            description: t(
              'assessment.hsbcScorecard.relationshipManagement.engagementAndRapport.description',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'process-adherence',
        title: t('assessment.processAdherence'),
        content: [
          {
            title: t(
              'assessment.hsbcScorecard.processAdherence.greeting.title',
            ),
            description: t(
              'assessment.hsbcScorecard.processAdherence.greeting.description',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.processAdherence.greeting.items',
            ),
          },
          {
            title: t(
              'assessment.hsbcScorecard.processAdherence.introduction.title',
            ),
            description: t(
              'assessment.hsbcScorecard.processAdherence.introduction.description',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.processAdherence.introduction.items',
            ),
          },
          {
            title: t(
              'assessment.hsbcScorecard.processAdherence.clientUpdate.title',
            ),
            description: t(
              'assessment.hsbcScorecard.processAdherence.clientUpdate.description',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.processAdherence.clientUpdate.items',
            ),
          },
          {
            title: t('assessment.hsbcScorecard.processAdherence.notes.title'),
            items: getTranslationArray(
              'assessment.hsbcScorecard.processAdherence.notes.items',
            ),
          },
          {
            title: t(
              'assessment.hsbcScorecard.processAdherence.callToAction.title',
            ),
            description: t(
              'assessment.hsbcScorecard.processAdherence.callToAction.description',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.processAdherence.callToAction.items',
            ),
          },
          {
            title: t('assessment.hsbcScorecard.processAdherence.bonus.title'),
            description: t(
              'assessment.hsbcScorecard.processAdherence.bonus.description',
            ),
            items: [],
          },
        ],
      },
      {
        id: 'hsbc-representation',
        title: t('assessment.hsbcRepresentation'),
        content: [
          {
            title: t(
              'assessment.hsbcScorecard.hsbcRepresentation.accuracy.title',
            ),
            description: t(
              'assessment.hsbcScorecard.hsbcRepresentation.accuracy.description',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.hsbcRepresentation.accuracy.items',
            ),
          },
        ],
      },
      {
        id: 'communication-and-presence',
        title: t('assessment.communicationAndPresence'),
        content: [
          {
            title: t(
              'assessment.hsbcScorecard.communicationAndPresence.toneOfVoice.title',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.communicationAndPresence.toneOfVoice.items',
            ),
          },
          {
            title: t(
              'assessment.hsbcScorecard.communicationAndPresence.dictionAndClarity.title',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.communicationAndPresence.dictionAndClarity.items',
            ),
          },
          {
            title: t(
              'assessment.hsbcScorecard.communicationAndPresence.engagementAndListening.title',
            ),
            items: getTranslationArray(
              'assessment.hsbcScorecard.communicationAndPresence.engagementAndListening.items',
            ),
          },
        ],
      },
    ];
  }, [hasHSBCScorecard, t]);

  // Great Eastern scorecard sections
  const greatEasternScorecardSections: ScorecardSection[] = useMemo(() => {
    if (!hasGreatEasternScorecard) return [];
    // Use framework parts if available, otherwise use scenario scorecard
    if (framework?.parts) {
      return framework.parts.map((part, index) => ({
        id: `section-${index}`,
        title: part.title,
        content: [
          {
            title: part.title,
            items: part.items,
          },
        ],
      }));
    }
    if (session?.scenario?.scorecard?.sections) {
      return session.scenario.scorecard.sections.map((section) => ({
        id: section._id,
        title: section.name,
        content: section.criteria.map((criterion) => ({
          title: criterion.title,
          description: criterion.description,
          items: [],
        })),
      }));
    }
    return [];
  }, [hasGreatEasternScorecard, framework, session?.scenario?.scorecard]);

  // Convert custom scorecard to ScorecardSection format
  const scorecardSections: ScorecardSection[] = useMemo(() => {
    if (!scorecards?.length) return [];
    return scorecards.map((section) => ({
      id: section._id,
      title: section.name,
      content: section.criteria.map((criterion) => ({
        title: criterion.title,
        description: criterion.description,
        items: [],
      })),
    }));
  }, [scorecards]);

  // Get scorecard config based on assessment type
  const scorecardConfig = useMemo(() => {
    if (hasHSBCScorecard) {
      return {
        title: t('roleplay.scorecard'),
        description: t('roleplay.scorecardModalDescription'),
        sections: hsbcScorecardSections,
      };
    }
    if (hasPrudentialObjectionHandlingScorecard) {
      return {
        title: t('roleplay.scorecard'),
        description: t(
          'roleplay.prudentialObjectionHandlingScorecardDescription',
        ),
        sections: prudentialOHScorecardSections,
      };
    }
    if (hasPrudentialPHAppointmentSettingScorecard) {
      return {
        title: framework?.title,
        description: framework?.description,
        sections: prudentialPHAppointmentSettingScorecardSections,
      };
    }
    if (hasAXAPHScorecard) {
      return {
        title: framework?.title,
        description: framework?.description,
        sections: axaphScorecardSections,
      };
    }
    if (hasAXAPHFNAScorecard) {
      return {
        title: framework?.title,
        description: framework?.description,
        sections: axaphFNAScorecardSections,
      };
    }
    if (hasKTAXAScorecard) {
      return {
        title: framework?.title,
        description: framework?.description,
        sections: ktAxaScorecardSections,
      };
    }
    if (hasKTAXAFNAScorecard) {
      return {
        title: t('assessment.ktAxaFna.scorecardTitle'),
        description: t('roleplay.scorecardDescription'),
        sections: ktAxaFNAScorecardSections,
      };
    }
    if (hasKTAXAWealthplusScorecard) {
      return {
        title: t('assessment.ktAxaWealthplus.scorecardTitle'),
        description: t('roleplay.scorecardDescription'),
        sections: ktAxaWealthplusScorecardSections,
      };
    }
    if (hasManulifeGoalReadyScorecard) {
      return {
        title: t('assessment.manulifeGoalReady.scorecardTitle'),
        description: t('roleplay.scorecardDescriptionAlternative'),
        sections: manulifeGoalReadyScorecardSections,
      };
    }
    if (hasMSIGTravelEasyScorecard) {
      return {
        title:
          t('assessment.msigTravelEasy.scorecardTitle') ||
          framework?.title ||
          'TravelEasy Assessment',
        description:
          t('roleplay.scorecardDescription') || framework?.description,
        sections: msigTravelEasyScorecardSections,
      };
    }
    if (hasPrudentialPHFactFindingScorecard) {
      return {
        title: framework?.title,
        description: framework?.description,
        sections: prudentialPHFactFindingScorecardSections,
      };
    }
    if (hasGreatEasternScorecard) {
      return {
        title: framework?.title || session?.module?.title,
        description: framework?.description,
        sections: greatEasternScorecardSections,
      };
    }
    if (scorecards?.length) {
      return {
        title: t('roleplay.scorecard'),
        description: t('roleplay.scorecardModalDescription'),
        sections: scorecardSections,
      };
    }
    return null;
  }, [
    hasHSBCScorecard,
    hasPrudentialObjectionHandlingScorecard,
    hasPrudentialPHAppointmentSettingScorecard,
    hasAXAPHScorecard,
    hasAXAPHFNAScorecard,
    hasKTAXAScorecard,
    hasKTAXAFNAScorecard,
    hasKTAXAWealthplusScorecard,
    hasManulifeGoalReadyScorecard,
    hasMSIGTravelEasyScorecard,
    hasPrudentialPHFactFindingScorecard,
    hasGreatEasternScorecard,
    scorecards,
    t,
    framework,
    session?.module?.title,
    hsbcScorecardSections,
    prudentialOHScorecardSections,
    prudentialPHAppointmentSettingScorecardSections,
    axaphScorecardSections,
    axaphFNAScorecardSections,
    ktAxaScorecardSections,
    ktAxaFNAScorecardSections,
    ktAxaWealthplusScorecardSections,
    manulifeGoalReadyScorecardSections,
    msigTravelEasyScorecardSections,
    prudentialPHFactFindingScorecardSections,
    greatEasternScorecardSections,
    scorecardSections,
  ]);

  return (
    <div className="mb-20">
      <div>
        <h2 className="mb-2 text-xs tracking-wider text-gray-500 uppercase">
          {t('roleplay.practiceDetails')}
        </h2>
        <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
        <p className="mb-4 text-sm text-gray-700">{description}</p>
        {hasBBLPortfolioReviewTrigger && (
          <div className="mb-4">
            <div className="mb-1 text-sm font-semibold text-gray-900">
              {t('roleplay.portfolioReviewTrigger')}
            </div>
            <div className="text-sm text-gray-700">
              {session?.persona?.meta?.bblPortfolioReviewTrigger as string}
            </div>
          </div>
        )}
        <div className="mb-4">
          <div className="mb-1 text-sm font-semibold text-gray-900">
            {t('roleplay.practiceObjectives')}
          </div>
          <ul className="list-disc text-sm whitespace-pre-line text-gray-700">
            {Array.isArray(objectives)
              ? objectives
                  ?.map((item: string) =>
                    objectives && objectives?.length > 1 ? `• ${item}` : item,
                  )
                  ?.join('\n ')
              : objectives}
          </ul>
        </div>
        <div className="mb-4">
          <div className="mb-1 text-sm font-semibold text-gray-900">
            {t('roleplay.mainObjection')}
          </div>
          <blockquote className="border-l-2 border-gray-300 pl-3 text-sm text-gray-700 italic">
            {objection}
          </blockquote>
        </div>
      </div>

      {hasSalesCallCriteria && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.callCriteria')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {callCriteria?.title}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {callCriteria?.description}
          </div>

          {callCriteria?.markdown ? (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => (
                    <h1 className="mb-2 text-lg font-bold text-gray-900">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-md mb-2 font-bold text-gray-900">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-1 text-sm font-bold text-gray-900">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 text-sm text-gray-700">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc text-sm text-gray-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal text-sm text-gray-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">
                      {children}
                    </strong>
                  ),
                }}
              >
                {callCriteria.markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <ol className="ml-6 list-decimal text-sm text-gray-700">
              {callCriteria?.criteria?.map((criteria, index) => (
                <li key={index}>{criteria}</li>
              ))}
            </ol>
          )}
          <button
            onClick={() => setIsStandingsModalOpen(true)}
            className="mt-2 text-sm font-bold text-blue-600 hover:underline"
          >
            {t('practice.learnAboutStandingsAndCriteria')}
          </button>
        </div>
      )}

      {hasHSBCScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {session?.module?.title || 'Client upgrade'}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.relationshipManagement')}</li>
            <li>{t('assessment.processAdherence')}</li>
            <li>{t('assessment.hsbcRepresentation')}</li>
            <li>{t('assessment.communicationAndPresence')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasAXAPHScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {framework?.title}
          </div>
          {framework?.description && (
            <div className="mb-2 text-sm text-gray-700">
              {framework.description}
            </div>
          )}
          <ul className="ml-5 list-disc text-sm text-gray-700">
            {framework?.parts?.map((part, index) => (
              <li key={index}>{part.title}</li>
            ))}
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasAXAPHFNAScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {framework?.title}
          </div>
          {framework?.description && (
            <div className="mb-2 text-sm text-gray-700">
              {framework.description}
            </div>
          )}
          <ul className="ml-5 list-disc text-sm text-gray-700">
            {framework?.parts?.map((part, index) => (
              <li key={index}>{part.title}</li>
            ))}
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasKTAXAScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.salesTechnique')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {framework?.title}
          </div>
          {framework?.description && (
            <div className="mb-2 text-sm text-gray-700">
              {framework.description}
            </div>
          )}
          <ul className="ml-5 list-disc text-sm text-gray-700">
            {framework?.parts?.map((part, index) => (
              <li key={index}>{part.title}</li>
            ))}
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasKTAXAFNAScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {t('assessment.ktAxaFna.scorecardTitle')}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.softSkills')}</li>
            <li>{t('assessment.knowledgeSkills')}</li>
            <li>{t('assessment.productKnowledge')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasKTAXAWealthplusScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {t('assessment.ktAxaWealthplus.scorecardTitle')}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.softSkills')}</li>
            <li>{t('assessment.knowledgeSkills')}</li>
            <li>{t('assessment.productKnowledge')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasManulifeGoalReadyScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {t('assessment.manulifeGoalReady.scorecardTitle')}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.salesNegotiationSkills')}</li>
            <li>{t('assessment.softSkills')}</li>
            <li>{t('assessment.productKnowledge')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasMSIGTravelEasyScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {t('assessment.msigTravelEasy.scorecardTitle') ||
              framework?.title ||
              'TravelEasy Assessment'}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription') || framework?.description}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.softSkills')}</li>
            <li>{t('assessment.knowledgeSkills')}</li>
            <li>{t('assessment.productKnowledge')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasPrudentialObjectionHandlingScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {session?.module?.title || 'Objection Handling'}
          </div>
          <div className="mb-2 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-700">
            <li>{t('assessment.salesTechnique')}</li>
            <li>{t('assessment.objectionHandling')}</li>
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {(hasPrudentialPHFactFindingScorecard ||
        hasPrudentialPHAppointmentSettingScorecard) && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {framework?.title || session?.module?.title}
          </div>
          {framework?.description && (
            <div className="mb-2 text-sm text-gray-700">
              {framework.description}
            </div>
          )}
          <ul className="ml-5 list-disc text-sm text-gray-700">
            {framework?.parts?.map((part, index) => (
              <li key={index}>{part.title}</li>
            ))}
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {hasGreatEasternScorecard && (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
            {t('roleplay.scorecard')}
          </div>
          <div className="text-md mb-1 font-bold text-gray-900">
            {framework?.title || session?.module?.title}
          </div>
          {framework?.description && (
            <div className="mb-2 text-sm text-gray-700">
              {framework.description}
            </div>
          )}
          <ul className="ml-5 list-disc text-sm text-gray-700">
            {framework?.parts?.map((part, index) => (
              <li key={index}>{part.title}</li>
            )) ||
              session?.scenario?.scorecard?.sections?.map((section, index) => (
                <li key={index}>{section.name}</li>
              ))}
          </ul>
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      )}

      {scorecards && scorecards?.length > 0 ? (
        <div className="my-6 border-t border-[#D9DDE0]">
          <div className="text-md mt-6 font-bold text-gray-900">
            {t('roleplay.scorecard')}
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {t('roleplay.scorecardDescription')}
          </div>
          {session.scenario?.scorecard?.sections?.map(
            (scorecardSection, index) => (
              <div key={index} className="text-sm text-gray-700">
                {index + 1}. {scorecardSection.name}
              </div>
            ),
          )}
          <div className="mt-2 text-sm text-gray-700">
            {t('roleplay.scorecardFooter')}{' '}
            <button
              onClick={() => setIsScorecardModalOpen(true)}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {t('roleplay.viewDetail')}
            </button>
          </div>
        </div>
      ) : hasStandardFramework ? (
        <div>
          <div className="my-4 border-t border-[#D9DDE0]" />
          {isBBL && (
            <>
              <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
                {t('roleplay.advisoryTechnique')}
              </div>
            </>
          )}
          {!isBBL && (
            <>
              <div className="mb-4 text-xs tracking-wider text-gray-500 uppercase">
                {t('roleplay.salesTechnique')}
              </div>
              <div className="text-md mb-1 font-bold text-gray-900">
                {framework?.title}
              </div>
              {framework?.description && (
                <div className="mb-3 text-sm text-gray-700">
                  {framework.description}
                </div>
              )}
            </>
          )}
          {framework?.link && (
            <a
              href={framework.link}
              className="mb-3 text-sm text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {framework.linkText || t('roleplay.viewDetails')}
            </a>
          )}
          {framework?.parts && (
            <div className="mt-4">
              {framework.parts.map((part, index) => (
                <div
                  key={index}
                  className="mb-3 overflow-hidden rounded-lg border border-[#D9DDE0]"
                >
                  <button
                    onClick={() => {
                      setExpandedSections((prev) => {
                        if (prev.includes(index)) {
                          return prev.filter((i) => i !== index);
                        } else {
                          return [...prev, index];
                        }
                      });
                    }}
                    className="flex w-full items-center p-3 text-left focus:outline-none"
                  >
                    <svg
                      className={`mr-2 h-5 w-5 text-gray-500 transition-transform ${expandedSections.includes(index) ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span className="text-sm font-semibold">{part.title}</span>
                  </button>
                  {expandedSections.includes(index) && (
                    <div className="pr-4 pb-3">
                      <ul className="list-disc pl-8">
                        {part.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="mb-2 text-sm text-gray-700"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <StandingsModal
        isOpen={isStandingsModalOpen}
        onClose={() => setIsStandingsModalOpen(false)}
        moduleId={session?.module?._id}
        productId={session?.product?._id}
      />

      {scorecardConfig && (
        <ScorecardModal
          isOpen={isScorecardModalOpen}
          onClose={() => setIsScorecardModalOpen(false)}
          title={scorecardConfig.title}
          description={scorecardConfig.description}
          sections={scorecardConfig.sections}
        />
      )}
    </div>
  );
}
