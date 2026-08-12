import clsx from 'clsx';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { apiProtected } from '~/util/api';
import { ThumbsUpIcon, WarningIcon, XIcon, ChatBubbleIcon } from '../../../public/icons/icons';
import { getScoreMarking, getScoreColor } from './components';
import type {
  AssessmentCriteria,
  CallAnalysisStatus,
  CallOverview,
} from './types';
import { CallAnalysisFeedbackModal } from './CallAnalysisFeedbackModal';
import { MSIGAssessmentView } from './MSIGAssessmentView';
import { useQueryClient } from '@tanstack/react-query';

// Header Component
function CallAnalysisHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClose = () => {
    navigate('/call-analysis');
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EAEDEF] bg-white px-4 py-4 md:px-8">
      <div className="flex items-center gap-4">
        <img
          src="/logos/Hupo_Icon_Orange.svg"
          alt={t('common.hupoIcon')}
          className="size-7"
        />
        <h1 className="text-[16px] font-bold text-gray-900">
          {t('callAnalysis.header.title')}
        </h1>
      </div>
      <button
        onClick={handleClose}
        className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
      >
        <XIcon className="size-7" />
      </button>
    </header>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  overview: CallOverview;
}

function OverviewTab({ overview }: OverviewTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Key Takeaways */}
      <div>
        <h3 className="mb-3 text-[16px] font-bold text-[#161618]">
          {t('callAnalysis.overview.keyTakeaways')}
        </h3>
        <ul className="list-disc space-y-0.5 pl-5">
          {overview.keyTakeaways.map((takeaway, idx) => (
            <li key={idx} className="text-[14px] text-[#58595A]">
              {takeaway}
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-gray-200" />

      {/* Call Health & Risk Assessment */}
      <div>
        <h3 className="mb-4 text-[16px] font-bold text-[#161618]">
          {t('callAnalysis.overview.callHealthRisk')}
        </h3>

        {/* Positive Signals and Risks - Horizontal Layout */}
        <div className="flex gap-4">
          {/* Positive Customer Signals */}
          <div className="flex-1 rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-[14px] font-semibold text-[#161618]">
              <div className="flex flex-row items-center gap-2">
                <ThumbsUpIcon />
                {t('callAnalysis.overview.positiveSignals')}
              </div>
            </h4>
            <ul className="list-disc space-y-0.5 pl-5">
              {overview.callHealth.positiveSignals.map((signal, idx) => (
                <li key={idx} className="text-[14px] text-[#58595A]">
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks Observed */}
          <div className="flex-1 rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-[14px] font-semibold text-[#161618]">
              <div className="flex flex-row items-center gap-2">
                <WarningIcon />
                {t('callAnalysis.overview.risksObserved')}
              </div>
            </h4>
            <ul className="list-disc space-y-0.5 pl-5">
              {overview.callHealth.risksObserved.map((risk, idx) => (
                <li key={idx} className="text-[14px] text-[#58595A]">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4">
          <h4 className="mb-3 text-[14px] font-semibold text-[#161618]">
            {t('callAnalysis.overview.recommendations')}
          </h4>
          <ul className="list-disc space-y-0.5 pl-5">
            {overview.callHealth.recommendations.map((recommendation, idx) => (
              <li key={idx} className="text-[14px] text-[#58595A]">
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Actionable Next Steps */}
      <div>
        <h3 className="mb-4 text-[16px] font-bold text-[#161618]">
          {t('callAnalysis.overview.actionableNextSteps')}
        </h3>

        {/* Key Actions */}
        <div className="mb-4">
          <h4 className="mb-3 text-[14px] font-semibold text-[#161618]">
            {t('callAnalysis.overview.keyActions')}
          </h4>
          <ul className="list-disc space-y-0.5 pl-5">
            {overview.actionableNextSteps.keyActions.map((action, idx) => (
              <li key={idx} className="text-[14px] text-[#58595A]">
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Call Prep */}
        <div>
          <h4 className="mb-3 text-[14px] font-semibold text-[#161618]">
            {t('callAnalysis.overview.nextCall')}
          </h4>
          <p className="text-[14px] text-[#58595A]">
            {overview.actionableNextSteps.nextCall}
          </p>
        </div>
      </div>
    </div>
  );
}

// Scorecard Section Component
interface ScorecardSectionProps {
  title: string;
  criteria: AssessmentCriteria[];
}

function ScorecardSection({ title, criteria }: ScorecardSectionProps) {
  const totalScore = criteria.reduce(
    (sum, c) => sum + c.score * (c.weight || 1),
    0,
  );
  const totalMaxScore = criteria.reduce(
    (sum, c) => sum + c.maxScore * (c.weight || 1),
    0,
  );
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
        <h4 className="text-[14px] font-semibold text-[#161618]">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-[#161618]">
            {totalScore}/{totalMaxScore}
          </span>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
          >
            <div className="mb-2 flex justify-between">
              <span className="text-[14px] font-semibold text-[#58595A]">
                {item.criteria}
              </span>
              <span className="text-[14px] font-bold text-[#161618]">
                {item.score * (item.weight || 1)}/
                {item.maxScore * (item.weight || 1)}
              </span>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 w-1 flex-shrink-0 rounded-full bg-gray-300" />
              <p className="text-[14px] font-normal text-[#58595A]">
                {item.evaluation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CallAnalysisAssessment() {
  const { id } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<CallAnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment'>(
    'assessment',
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const showTranscript = searchParams.get('transcript') === 'true';
  const isNewAnalysis = searchParams.get('new') === '1';
  const [showFeedbackModal, setShowFeedbackModal] = useState(true);
  const [dontShowFeedbackModalOnceSent, setDontShowFeedbackModalOnceSent] =
    useState(false);

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    }
  }, [id]);

  // Mark analysis as viewed when new=1 query param is present
  useEffect(() => {
    if (id && isNewAnalysis) {
      markAsViewed(id);
    }
  }, [id, isNewAnalysis]);

  const loadAnalysis = async (analysisId: string) => {
    try {
      setIsLoading(true);
      const status = await apiProtected()
        .url(`/call-analysis/${analysisId}/status`)
        .get()
        .json<CallAnalysisStatus>();

      setAnalysis(status);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      toast.error(t('callAnalysis.assessment.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const markAsViewed = async (analysisId: string) => {
    try {
      await apiProtected()
        .url(`/call-analysis/${analysisId}/mark-viewed`)
        .patch()
        .res();
      // Invalidate the new analyses count query to update the sidebar badge
      queryClient.invalidateQueries({ queryKey: ['newCallAnalysesCount'] });
    } catch (error) {
      console.error('Failed to mark analysis as viewed:', error);
    }
  };

  const getFileName = () => {
    return analysis?.audioFileName ?? t('callAnalysis.assessment.unknownFile');
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const overallScore = analysis?.overallScore ?? 0;

  const handleViewTranscript = () => {
    setSearchParams({ transcript: 'true' });
  };

  const handleReturnToAssessment = () => {
    setSearchParams({});
  };

  const handleDownloadAssessment = async () => {
    if (!id || isDownloading) return;

    try {
      setIsDownloading(true);
      const response = await apiProtected()
        .url('/call-analysis/report')
        .query({ analysisId: id })
        .get()
        .blob();

      // Create download link
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = `call-assessment-${id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download assessment:', error);
      toast.error(t('callAnalysis.assessment.failedToDownload'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-500">
          {t('callAnalysis.assessment.loading')}
        </span>
      </div>
    );
  }

  // Check if assessment data is available (either 3-axis or MSIG format)
  const isMSIGProduct = analysis?.product === 'parecoveryplus' || analysis?.product === 'dentiplus';
  const hasAssessmentData = isMSIGProduct ? analysis?.msigAssessment : analysis?.assessment;

  if (!analysis || !hasAssessmentData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-500">
          {t('callAnalysis.assessment.notReady')}
        </span>
      </div>
    );
  }

  // Show transcript view if requested
  if (showTranscript) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#F6F8F8]">
        <CallAnalysisHeader />

        {/* Main Content */}
        <main className="w-full flex-1 py-6">
          <div className="mx-auto max-w-4xl px-4">
            {/* Back to assessment button */}
            <div
              onClick={handleReturnToAssessment}
              className="flex max-w-max cursor-pointer items-center space-x-2 py-2 text-gray-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="#58595A"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-8-8m0 0l8-8m-8 8h20"
                />
              </svg>
              <span className="text-sm font-medium">
                {t('assessment.returnToAssessment')}
              </span>
            </div>

            {/* Content */}
            <div className="mt-4 min-h-[calc(100vh-120px)] rounded-2xl bg-white p-6">
              <div>
                {analysis.transcript?.map((segment, index) => (
                  <div
                    key={`msg-${index}`}
                    className="mb-4 border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="mb-2">
                      <span className="text-base font-medium text-gray-900">
                        {segment.role === 'agent'
                          ? t('callAnalysis.assessment.agent')
                          : t('callAnalysis.assessment.customer')}
                      </span>
                      <span className="text-base font-normal text-gray-500">
                        {' '}
                        {formatTimestamp(segment.timestamp)}
                      </span>
                    </div>
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-500">
                      {segment.content}
                    </p>
                  </div>
                ))}

                {!analysis.transcript || analysis.transcript.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">
                      {t('callAnalysis.assessment.emptyTranscript')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F6F8F8]">
      <CallAnalysisHeader />

      {/* Main Content */}
      <main className="w-full flex-1 py-6">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex gap-6">
            {/* Left Section - Metadata */}
            <div className="w-1/4">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="space-y-6">
                  {/* Call Type */}
                  <div>
                    <p className="text-[14px] font-normal text-[#58595A]">
                      {t('callAnalysis.upload.callType')}
                    </p>
                    <p className="mt-1 text-[14px] font-normal text-[#161618]">
                      {t('callAnalysis.upload.telesales')}
                    </p>
                  </div>

                  {/* Product */}
                  <div>
                    <p className="text-[14px] font-normal text-[#58595A]">
                      {t('callAnalysis.upload.product')}
                    </p>
                    <p className="mt-1 text-[14px] font-normal text-[#161618]">
                      {analysis.product === 'parecoveryplus'
                        ? 'PARecovery Plus'
                        : analysis.product === 'dentiplus'
                          ? 'DentiPlus'
                          : 'TravelEasy'}
                    </p>
                  </div>

                  {/* File */}
                  <div>
                    <p className="text-[14px] font-normal text-[#58595A]">
                      {t('callAnalysis.assessment.file')}
                    </p>
                    <p
                      className="mt-1 text-[14px] font-normal break-words text-[#161618]"
                      title={getFileName()}
                    >
                      {getFileName()}
                    </p>
                  </div>

                  {/* Analyzed On */}
                  <div>
                    <p className="text-[14px] font-normal text-[#58595A]">
                      {t('callAnalysis.assessment.analyzedOn')}
                    </p>
                    <p className="mt-1 text-[14px] font-normal text-[#161618]">
                      {format(
                        new Date(analysis.completedAt || analysis.createdAt),
                        'd MMM yyyy, h.mm a',
                      )}
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadAssessment}
                    disabled={isDownloading}
                    className={clsx(
                      'focus-visible:outline-primary-500 mb-4 inline-flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-full px-3.5 py-2.5 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2',
                      isDownloading
                        ? 'cursor-not-allowed bg-gray-400 text-white'
                        : 'bg-primary-500/10 text-primary-500 hover:bg-primary-500/20',
                    )}
                  >
                    {isDownloading
                      ? t('callAnalysis.assessment.downloadingPdf')
                      : t('callAnalysis.assessment.downloadAssessment')}
                  </button>

                  <button
                    onClick={handleViewTranscript}
                    className="mt-2 block w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-center text-[14px] font-normal text-gray-700 transition hover:bg-gray-50"
                  >
                    {t('assessment.viewTranscript')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section - Main Content */}
            <div className="flex-1">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex w-full rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={clsx(
                        'flex-1 rounded-md px-4 py-2 text-center text-[14px] transition-all duration-200',
                        activeTab === 'overview'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900',
                      )}
                    >
                      {t('callAnalysis.assessment.tabs.overview')}
                    </button>
                    <button
                      onClick={() => setActiveTab('assessment')}
                      className={clsx(
                        'flex-1 rounded-md px-4 py-2 text-center text-[14px] transition-all duration-200',
                        activeTab === 'assessment'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900',
                      )}
                    >
                      {t('callAnalysis.assessment.tabs.assessment')}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' ? (
                  analysis.overview ? (
                    <OverviewTab overview={analysis.overview} />
                  ) : (
                    <div className="py-8">
                      <p className="text-gray-500">
                        {t('callAnalysis.assessment.overviewNotAvailable')}
                      </p>
                    </div>
                  )
                ) : isMSIGProduct && analysis.msigAssessment ? (
                  <MSIGAssessmentView assessment={analysis.msigAssessment} />
                ) : analysis.assessment ? (
                  <div className="space-y-8">
                    {/* Score Section */}
                    <div className="flex items-start gap-6">
                      {/* Ring Score */}
                      <div className="relative flex h-24 w-24 items-center justify-center">
                        {/* Background ring */}
                        <svg
                          className="absolute h-full w-full -rotate-90 transform"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-200"
                          />
                          {/* Progress ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - parseFloat(overallScore.toString()) / 100)}`}
                            className="text-blue-600 transition-all duration-300"
                            strokeLinecap="round"
                          />
                        </svg>
                        {/* Score text */}
                        <div className="absolute text-[18px] font-bold text-gray-900">
                          {overallScore}%
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col">
                        {/* Result */}
                        <div className="mb-4">
                          <p className="text-[14px] font-normal text-[#58595A]">
                            {t('callAnalysis.assessment.result')}
                          </p>
                          <p className="text-[16px] font-bold text-[#161618]">
                            {getScoreMarking(
                              parseFloat(overallScore.toString()),
                              t,
                            )}
                          </p>
                        </div>

                        {/* Score breakdown columns */}
                        <div className="flex w-full justify-between gap-6">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-4 w-1 rounded-full bg-gray-300"></div>
                              <p className="text-[14px] font-normal text-[#58595A]">
                                {t(
                                  'callAnalysis.assessment.sections.mandatory',
                                )}
                              </p>
                            </div>
                            <p className="text-left text-[14px] font-bold text-[#161618]">
                              {analysis.assessment.mandatory.reduce(
                                (sum, c) => sum + c.score * c.weight,
                                0,
                              )}
                              /
                              {analysis.assessment.mandatory.reduce(
                                (sum, c) => sum + c.maxScore * c.weight,
                                0,
                              )}
                            </p>
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-4 w-1 rounded-full bg-gray-300"></div>
                              <p className="text-[14px] font-normal text-[#58595A]">
                                {t(
                                  'callAnalysis.assessment.sections.softSkills',
                                )}
                              </p>
                            </div>
                            <p className="text-left text-[14px] font-bold text-[#161618]">
                              {analysis.assessment.softSkills.reduce(
                                (sum, c) => sum + c.score * c.weight,
                                0,
                              )}
                              /
                              {analysis.assessment.softSkills.reduce(
                                (sum, c) => sum + c.maxScore * c.weight,
                                0,
                              )}
                            </p>
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <div className="h-4 w-1 rounded-full bg-gray-300"></div>
                              <p className="text-[14px] font-normal text-[#58595A]">
                                {t(
                                  'callAnalysis.assessment.sections.knowledgeApplication',
                                )}
                              </p>
                            </div>
                            <p className="text-left text-[14px] font-bold text-[#161618]">
                              {analysis.assessment.knowledgeApplication.reduce(
                                (sum, c) => sum + c.score * c.weight,
                                0,
                              )}
                              /
                              {analysis.assessment.knowledgeApplication.reduce(
                                (sum, c) => sum + c.maxScore * c.weight,
                                0,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="mb-8 border-gray-200" />

                    {/* Summary Section */}
                    <div>
                      <h3 className="mb-3 text-[16px] font-bold text-[#161618]">
                        {t('callAnalysis.assessment.summary')}
                      </h3>
                      <p className="text-[14px] text-[#58595A]">
                        {analysis.assessment.summary}
                      </p>

                      <h3 className="mt-6 mb-3 text-[16px] font-bold text-[#161618]">
                        {t('callAnalysis.assessment.suggestedNextSteps')}
                      </h3>
                      <ul className="list-disc space-y-1 pl-5">
                        {analysis.assessment.suggestedNextSteps.map(
                          (step, idx) => (
                            <li
                              key={idx}
                              className="text-[14px] text-[#58595A]"
                            >
                              {step}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <hr className="mb-8 border-gray-200" />

                    {/* Scorecard Breakdown Section */}
                    <div>
                      <h3 className="mb-4 text-[16px] font-bold text-[#161618]">
                        {t('callAnalysis.assessment.scorecardBreakdown')}
                      </h3>

                      <div className="space-y-6">
                        <ScorecardSection
                          title={t(
                            'callAnalysis.assessment.sections.mandatory',
                          )}
                          criteria={analysis.assessment.mandatory}
                        />

                        <ScorecardSection
                          title={t(
                            'callAnalysis.assessment.sections.softSkills',
                          )}
                          criteria={analysis.assessment.softSkills}
                        />

                        <ScorecardSection
                          title={t(
                            'callAnalysis.assessment.sections.knowledgeApplication',
                          )}
                          criteria={analysis.assessment.knowledgeApplication}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      {isNewAnalysis && !dontShowFeedbackModalOnceSent && id && (
        <>
          {showFeedbackModal && (
            <CallAnalysisFeedbackModal
              analysisId={id}
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
  );
}
