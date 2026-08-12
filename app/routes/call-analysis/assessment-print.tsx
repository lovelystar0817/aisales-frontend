import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { apiProtected, api } from '~/util/api';
import { useAuthStore } from '~/store/auth';
import type { CallAnalysisStatus, MSIGSection } from './types';
import {
  Circle,
  getScoreMarking,
  getScoreColor,
  ScorecardSectionPrint,
} from './components';

// Section order with weights for MSIG print view
const MSIG_SECTION_ORDER = [
  { key: 'introduction', weight: '5%' },
  { key: 'presentation', weight: '40%' },
  { key: 'communication', weight: '10%' },
  { key: 'salesConfirmation', weight: '20%' },
  { key: 'mandatoryDisclosure', weight: '20%' },
  { key: 'closure', weight: '5%' },
];

// Section title mapping for print (inline since we can't use hooks in non-component context)
const SECTION_TITLES: Record<string, string> = {
  introduction: 'Introduction',
  presentation: 'Presentation',
  communication: 'Communication skills',
  salesConfirmation: 'Sales Confirmation',
  mandatoryDisclosure: 'Mandatory Statements',
  closure: 'Closure',
};

// MSIG Section print component
function MSIGSectionPrint({ section, title }: { section: MSIGSection; title: string }) {
  const passedEvaluations = section.evaluations.filter((e) => e.pass);
  const failedEvaluations = section.evaluations.filter((e) => !e.pass);
  const passedCount = section.notApplicable ? 0 : passedEvaluations.length;
  const totalCount = section.evaluations.length;
  // Only show pink background for failed mandatory if section is NOT "not applicable"
  const hasFailedMandatory = !section.notApplicable && failedEvaluations.some((e) => e.mandatory);
  const percentage = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;

  return (
    <div
      style={{
        border: `1px solid ${hasFailedMandatory ? '#E60D00' : '#E5E7EB'}`,
        borderRadius: '8px',
        backgroundColor: hasFailedMandatory ? '#FFECEB' : 'white',
        marginBottom: '16px',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#161618' }}>{title}</span>
          {section.notApplicable && (
            <span
              style={{
                fontSize: '11px',
                color: '#6B7280',
                backgroundColor: '#F3F4F6',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              Not Applicable
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#161618' }}>
            {passedCount}/{totalCount}
          </span>
          {/* Progress Bar */}
          <div style={{ width: '80px', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px' }}>
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: '#3B82F6',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div style={{ padding: '12px 16px' }}>
        {section.notApplicable ? (
          // Not applicable - show Criteria heading with grayed out circle icons
          <>
            {section.notApplicableReason && (
              <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#6B7280', marginBottom: '16px' }}>
                {section.notApplicableReason}
              </p>
            )}
            <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#6B7280' }}>
              Criteria
            </h5>
            {section.evaluations.map((evaluation, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #D1D5DB',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{evaluation.criteriaText}</span>
              </div>
            ))}
          </>
        ) : (
          // Normal section - group by To improve / Completed
          <>
            {/* To improve section */}
            {failedEvaluations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#161618' }}>
                  To improve
                </h5>
                {failedEvaluations.map((evaluation, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700 }}>✕</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        {evaluation.criteriaText}
                      </span>
                      {evaluation.mandatory && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#DC2626',
                            backgroundColor: '#FFD9D6',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            marginLeft: '8px',
                          }}
                        >
                          Mandatory
                        </span>
                      )}
                      {evaluation.evidence && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            fontStyle: 'italic',
                            margin: '4px 0 0 0',
                            paddingLeft: '12px',
                            borderLeft: '2px solid #D1D5DB',
                          }}
                        >
                          {evaluation.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed section */}
            {passedEvaluations.length > 0 && (
              <div>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#161618' }}>
                  Completed
                </h5>
                {passedEvaluations.map((evaluation, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: '2px solid #16A34A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>✓</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      {evaluation.criteriaText}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Tier calculation based on score for print view
// X ≥ 95%: Excellent, 90-94%: Good, 85-89%: Pass, <85%: Fail
const getTierFromScorePrint = (score: number): { tier: string; bg: string; text: string } => {
  if (score >= 95) {
    return { tier: 'Excellent', bg: '#DCFCE7', text: '#166534' };
  } else if (score >= 90) {
    return { tier: 'Good', bg: '#DBEAFE', text: '#1E40AF' };
  } else if (score >= 85) {
    return { tier: 'Pass', bg: '#FEF3C7', text: '#92400E' };
  } else {
    return { tier: 'Fail', bg: '#FEE2E2', text: '#991B1B' };
  }
};

// MSIG Assessment Print View component
function MSIGAssessmentPrintView({ analysis }: { analysis: CallAnalysisStatus }) {
  const { t } = useTranslation();
  const msigAssessment = analysis.msigAssessment!;
  const completedAt = analysis.completedAt || analysis.createdAt;
  const formattedDate = format(new Date(completedAt), 'd MMM yyyy, h:mm a');

  const hasFailedMandatory =
    msigAssessment.hasMandatoryFailures ||
    Object.values(msigAssessment.sections || {}).some(
      (section) =>
        !section.notApplicable &&
        section.evaluations?.some((e) => e.mandatory && !e.pass),
    );

  // Calculate tier from score
  const tierInfo = getTierFromScorePrint(msigAssessment.overallScore);

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#EFEFEF',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#EFEFEF',
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logos/Hupo_Logotype_Orange(noR).svg"
              alt="Hupo"
              style={{ height: '20px' }}
            />
            {analysis.companyLogo?.url && (
              <img
                src={analysis.companyLogo.url}
                alt="Company Logo"
                style={{
                  height: analysis.companyLogo.height || '20px',
                  marginLeft: '8px',
                }}
              />
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {t('callAnalysis.assessment.callAssessmentTitle')}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {t('callAnalysis.assessment.analyzedOn')} {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ backgroundColor: '#FFFFFF', margin: '0', padding: '24px' }}>
        {/* Score and Tier Section */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
          {/* Left Column - Score */}
          <div
            style={{ flex: '0 0 30%', minWidth: '200px', marginLeft: '24px' }}
          >
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                marginBottom: '24px',
              }}
            >
              <Circle
                size={100}
                strokeWidth={8}
                value={hasFailedMandatory ? 0 : msigAssessment.overallScore}
                color="#3B82F6"
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {hasFailedMandatory ? '-' : `${msigAssessment.overallScore}%`}
              </div>
            </div>

            {/* Tier Result */}
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  color: '#58595A',
                }}
              >
                {t('callAnalysis.assessment.result')}
              </p>
              <p className="text-[16px] font-bold text-[#161618]">
                {hasFailedMandatory
                  ? t('callAnalysis.msig.notAvailable', 'Not available')
                  : tierInfo.tier}
              </p>
              {hasFailedMandatory && (
                <p className="text-[14px] text-red-600">
                  {t(
                    'callAnalysis.msig.resultUnavailable',
                    'Result unavailable: Mandatory criteria not met.',
                  )}
                </p>
              )}
            </div>

            {/* Section Scores */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {MSIG_SECTION_ORDER.map(({ key }) => {
                const section = msigAssessment.sections[key];
                if (!section) return null;
                const sectionTitle = SECTION_TITLES[key] || key;

                // Use weighted score if available, otherwise use pass/fail count
                const hasWeightedScore =
                  section.score !== undefined && section.maxScore !== undefined;
                const passedCount = section.evaluations.filter(
                  (e) => e.pass,
                ).length;
                const totalCount = section.evaluations.length;

                return (
                  <div key={key}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <div
                        style={{
                          width: '4px',
                          height: '16px',
                          borderRadius: '9999px',
                          backgroundColor: '#D9DDE0',
                        }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#58595A',
                        }}
                      >
                        {sectionTitle}
                      </p>
                    </div>
                    <p
                      style={{
                        margin: '0 0 0 12px',
                        fontSize: '14px',
                        color: '#161618',
                      }}
                    >
                      {section.notApplicable ? (
                        '-'
                      ) : hasWeightedScore ? (
                        <>
                          <span style={{ fontWeight: 600 }}>
                            {section.score}
                          </span>
                          <span style={{ margin: '0 4px' }}>/</span>
                          <span style={{ fontWeight: 200 }}>
                            {section.maxScore}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600 }}>{passedCount}</span>
                          <span style={{ margin: '0 4px' }}>/</span>
                          <span style={{ fontWeight: 200 }}>{totalCount}</span>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Failure Warning */}
            {/* {msigAssessment.hasMandatoryFailures && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#991B1B',
                    fontWeight: 500,
                  }}
                >
                  {t('callAnalysis.msig.mandatoryFailureWarning')}
                </p>
              </div>
            )} */}
          </div>

          {/* Right Column - File and Summary */}
          <div style={{ flex: 1 }}>
            {/* File Info */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    minWidth: '80px',
                  }}
                >
                  {t('callAnalysis.assessment.file')}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#161618',
                    fontWeight: 500,
                  }}
                >
                  {analysis.audioFileName ||
                    t('callAnalysis.assessment.unknownFile')}
                </span>
              </div>
              <div
                style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    minWidth: '80px',
                  }}
                >
                  {t('callAnalysis.upload.callType', 'Call type')}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#161618',
                    fontWeight: 500,
                  }}
                >
                  {t('callAnalysis.upload.telesales', 'Telesales')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    minWidth: '80px',
                  }}
                >
                  {t('callAnalysis.upload.product', 'Product')}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#161618',
                    fontWeight: 500,
                  }}
                >
                  {analysis.product === 'parecoveryplus'
                    ? 'PARecovery Plus'
                    : analysis.product === 'dentiplus'
                      ? 'DentiPlus'
                      : 'TravelEasy'}
                </span>
              </div>
            </div>

            <div
              style={{ borderTop: '1px solid #E5E7EB', marginBottom: '24px' }}
            />

            {/* Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {t('callAnalysis.assessment.summary')}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#58595A',
                  lineHeight: '1.6',
                }}
              >
                {msigAssessment.summary}
              </p>
            </div>

            {/* Suggested Next Steps */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {t('callAnalysis.assessment.suggestedNextSteps')}
              </h3>
              <div>
                {msigAssessment.suggestedNextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#000000',
                        marginRight: '8px',
                        marginTop: '8px',
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#58595A',
                        lineHeight: '1.6',
                      }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sections Breakdown */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ height: '24px' }}>&nbsp;</div>
          <h3
            style={{
              marginBottom: '24px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#161618',
            }}
          >
            {t('callAnalysis.assessment.scorecardBreakdown')}
          </h3>

          {MSIG_SECTION_ORDER.map(({ key }) => {
            const section = msigAssessment.sections[key];
            if (!section) return null;

            return (
              <MSIGSectionPrint
                key={key}
                section={section}
                title={SECTION_TITLES[key] || key}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Check if this is a PDF generation request
function isPDFRequest(): {
  isPDF: boolean;
  userEmail?: string;
  userId?: string;
  companyId?: string;
  companyFriendlyId?: string;
} {
  if (typeof window === 'undefined') return { isPDF: false };

  // Check for PDF mode via URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isPDFMode = urlParams.get('pdf') === 'true';
  const userId = urlParams.get('userId');
  const companyId = urlParams.get('companyId');
  const companyFriendlyId = urlParams.get('companyFriendlyId');

  // Also check if the page path includes 'print' (fallback)
  const isPrintPath = window.location.pathname.includes('/print');

  // Check if there's no current auth (common for PDF generation)
  const currentAuth = useAuthStore.getState().getToken();
  const noAuth = !currentAuth;

  const isPDF = isPDFMode || (isPrintPath && noAuth) || !!companyFriendlyId;

  return {
    isPDF,
    userId: userId || undefined,
    companyId: companyId || undefined,
    userEmail: '',
    companyFriendlyId: companyFriendlyId || undefined,
  };
}

export default function CallAnalysisAssessmentPrint() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState<CallAnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isPDF, setIsPDF] = useState(false);

  useEffect(() => {
    const pdfInfo = isPDFRequest();
    setIsPDF(pdfInfo.isPDF);

    if (pdfInfo.isPDF && pdfInfo.userEmail) {
      setUserEmail(pdfInfo.userEmail);
    }

    if (id) {
      loadAnalysis(id, pdfInfo.isPDF, pdfInfo.companyFriendlyId);
      if (!pdfInfo.isPDF) {
        loadUserInfo();
      }
    }
  }, [id]);

  const loadUserInfo = async () => {
    try {
      const userInfo = await apiProtected()
        .url('/users/me')
        .get()
        .json<{ email: string }>();
      setUserEmail(userInfo.email);
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const createGuestAuth = async (companyFriendlyId: string) => {
    try {
      const guestResponse = await api()
        .url(`/auth/guest/${companyFriendlyId}`)
        .post({
          name: 'PDF Export User',
          email: 'pdf-guest@hupo.co', // Reuse same user
        })
        .json<{ token: string; user: any }>();

      return guestResponse.token;
    } catch (error) {
      console.error('Failed to create guest auth:', error);
      throw error;
    }
  };

  const loadAnalysis = async (
    analysisId: string,
    isPDFMode: boolean = false,
    companyFriendlyId?: string,
  ) => {
    try {
      setIsLoading(true);

      let status: CallAnalysisStatus;

      if (isPDFMode && companyFriendlyId) {
        // For PDF mode, create a guest token using company friendlyId
        const guestToken = await createGuestAuth(companyFriendlyId);
        status = await api()
          .url(`/call-analysis/${analysisId}/status`)
          .auth(`Bearer ${guestToken}`)
          .get()
          .json<CallAnalysisStatus>();
      } else {
        // Normal authenticated request
        status = await apiProtected()
          .url(`/call-analysis/${analysisId}/status`)
          .get()
          .json<CallAnalysisStatus>();
      }

      setAnalysis(status);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {t('callAnalysis.assessment.loading')}
      </div>
    );
  }

  // Check if assessment data is available (either 3-axis or MSIG format)
  const isMSIGProduct = analysis?.product === 'parecoveryplus' || analysis?.product === 'dentiplus';
  const hasAssessmentData = isMSIGProduct ? analysis?.msigAssessment : analysis?.assessment;

  if (!analysis || !hasAssessmentData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {t('callAnalysis.assessment.notReady')}
      </div>
    );
  }

  // For MSIG products, render the MSIG print view
  if (isMSIGProduct && analysis.msigAssessment) {
    return <MSIGAssessmentPrintView analysis={analysis} />;
  }

  // At this point, we know it's a TravelEasy product with 3-axis assessment
  if (!analysis.assessment) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {t('callAnalysis.assessment.notReady')}
      </div>
    );
  }

  const overallScore = analysis.overallScore ?? 0;
  const completedAt = analysis.completedAt || analysis.createdAt;
  const formattedDate = format(new Date(completedAt), 'd MMM yyyy, h:mm a');

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#EFEFEF',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        id="header"
        style={{
          backgroundColor: '#EFEFEF',
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logos/Hupo_Logotype_Orange(noR).svg"
              alt={t('common.hupoIcon')}
              style={{ height: '20px' }}
            />
            {analysis.companyLogo?.url && (
              <img
                src={analysis.companyLogo.url}
                alt="Company Logo"
                style={{
                  height: analysis.companyLogo.height || '20px',
                  marginLeft: '8px',
                }}
              />
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700 }}>
            {t('callAnalysis.assessment.callAssessmentTitle')}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{userEmail}</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              {t('callAnalysis.assessment.analyzedOn')} {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          margin: '0',
          padding: '24px',
        }}
      >
        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
          {/* Left Column */}
          <div
            style={{ flex: '0 0 30%', minWidth: '200px', marginLeft: '24px' }}
          >
            {/* Ring Score */}
            <div
              style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                marginBottom: '24px',
              }}
            >
              <Circle
                size={100}
                strokeWidth={8}
                value={overallScore}
                color={getScoreColor(overallScore)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {overallScore}%
              </div>
            </div>

            {/* Result */}
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  color: '#6B7280',
                }}
              >
                {t('overallScore')}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {getScoreMarking(overallScore, t)}
              </p>
            </div>

            {/* Three Subscores */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '16px',
                      borderRadius: '9999px',
                      backgroundColor: '#D1D5DB',
                    }}
                  />
                  <p style={{ margin: 0, fontSize: '14px', color: '#58595A' }}>
                    {t('callAnalysis.assessment.sections.mandatory')}
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 0 12px',
                    fontSize: '14px',
                    color: '#161618',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {analysis.assessment.mandatory.reduce(
                      (sum, c) => sum + c.score * c.weight,
                      0,
                    )}
                  </span>
                  <span style={{ margin: '0 4px' }}>/</span>
                  <span style={{ fontWeight: 200 }}>
                    {analysis.assessment.mandatory.reduce(
                      (sum, c) => sum + c.maxScore * c.weight,
                      0,
                    )}
                  </span>
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '16px',
                      borderRadius: '9999px',
                      backgroundColor: '#D1D5DB',
                    }}
                  />
                  <p style={{ margin: 0, fontSize: '14px', color: '#58595A' }}>
                    {t('callAnalysis.assessment.sections.softSkills')}
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 0 12px',
                    fontSize: '14px',
                    color: '#161618',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {analysis.assessment.softSkills.reduce(
                      (sum, c) => sum + c.score * c.weight,
                      0,
                    )}
                  </span>
                  <span style={{ margin: '0 4px' }}>/</span>
                  <span style={{ fontWeight: 200 }}>
                    {analysis.assessment.softSkills.reduce(
                      (sum, c) => sum + c.maxScore * c.weight,
                      0,
                    )}
                  </span>
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '16px',
                      borderRadius: '9999px',
                      backgroundColor: '#D1D5DB',
                    }}
                  />
                  <p style={{ margin: 0, fontSize: '14px', color: '#58595A' }}>
                    {t('callAnalysis.assessment.sections.knowledgeApplication')}
                  </p>
                </div>
                <p
                  style={{
                    margin: '0 0 0 12px',
                    fontSize: '14px',
                    color: '#161618',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {analysis.assessment.knowledgeApplication.reduce(
                      (sum, c) => sum + c.score * c.weight,
                      0,
                    )}
                  </span>
                  <span style={{ margin: '0 4px' }}>/</span>
                  <span style={{ fontWeight: 200 }}>
                    {analysis.assessment.knowledgeApplication.reduce(
                      (sum, c) => sum + c.maxScore * c.weight,
                      0,
                    )}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ flex: 1 }}>
            {/* File Name */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    minWidth: '80px',
                  }}
                >
                  {t('callAnalysis.assessment.file')}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#161618',
                    fontWeight: 500,
                  }}
                >
                  {analysis.audioFileName ||
                    t('callAnalysis.assessment.unknownFile')}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {t('callAnalysis.assessment.summary')}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#58595A',
                  lineHeight: '1.6',
                }}
              >
                {analysis.assessment.summary}
              </p>
            </div>

            {/* Suggested Next Steps */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#161618',
                }}
              >
                {t('callAnalysis.assessment.suggestedNextSteps')}
              </h3>
              <div>
                {analysis.assessment.suggestedNextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#000000',
                        marginRight: '8px',
                        marginTop: '8px',
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#58595A',
                        lineHeight: '1.6',
                      }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        {/* <div
          style={{
            height: '1px',
            backgroundColor: '#E5E7EB',
            margin: '32px 0',
          }}
        /> */}

        {/* Scorecard Breakdown */}
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              marginLeft: '16px',
              marginRight: '16px',
            }}
          >
            {/* This is a top margin, adding it as normal css style will be ignored by pdf rendering */}
            <div style={{ height: '24px' }}>&nbsp;</div>
            <h3
              style={{
                marginBottom: '24px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#161618',
              }}
            >
              {t('callAnalysis.assessment.scorecardBreakdown')}
            </h3>
            <ScorecardSectionPrint
              title={t('callAnalysis.assessment.sections.mandatory')}
              criteria={analysis.assessment.mandatory}
            />
            <div style={{ height: '24px' }}>&nbsp;</div>
          </div>

          <div
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              marginLeft: '16px',
              marginRight: '16px',
            }}
          >
            <div style={{ height: '24px' }}>&nbsp;</div>
            <ScorecardSectionPrint
              title={t('callAnalysis.assessment.sections.softSkills')}
              criteria={analysis.assessment.softSkills}
            />
            <div style={{ height: '24px' }}>&nbsp;</div>
          </div>

          <div
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              marginLeft: '16px',
              marginRight: '16px',
            }}
          >
            <div style={{ height: '24px' }}>&nbsp;</div>
            <ScorecardSectionPrint
              title={t('callAnalysis.assessment.sections.knowledgeApplication')}
              criteria={analysis.assessment.knowledgeApplication}
            />
            <div style={{ height: '24px' }}>&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  );
}
