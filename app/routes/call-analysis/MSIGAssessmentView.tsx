import { useTranslation } from 'react-i18next';
import { Circle } from 'lucide-react';
import { CorrectIcon, IncorrectIcon } from '../../../public/icons/icons';
import type { MSIGAssessment, MSIGSection as MSIGSectionType } from './types';

// Section order with weights for display
const SECTION_ORDER = [
  { key: 'introduction', weight: '5%' },
  { key: 'presentation', weight: '40%' },
  { key: 'communication', weight: '10%' },
  { key: 'salesConfirmation', weight: '20%' },
  { key: 'mandatoryDisclosure', weight: '20%' },
  { key: 'closure', weight: '5%' },
];

// Tier calculation based on score
// X ≥ 95%: Excellent, 90-94%: Good, 85-89%: Pass, <85%: Fail
const getTierFromScore = (score: number): { tier: string; color: string; bgColor: string } => {
  if (score >= 95) {
    return { tier: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' };
  } else if (score >= 90) {
    return { tier: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-100' };
  } else if (score >= 85) {
    return { tier: 'Pass', color: 'text-amber-700', bgColor: 'bg-amber-100' };
  } else {
    return { tier: 'Fail', color: 'text-red-700', bgColor: 'bg-red-100' };
  }
};

// Progress bar component
const ProgressBar = ({ passed, total }: { passed: number; total: number }) => {
  const percentage = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700">
        {passed}/{total}
      </div>
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Checklist item component
const ChecklistItem = ({
  text,
  isCompleted,
  isMandatory = false,
  evidence,
  notApplicable = false,
}: {
  text: string;
  isCompleted: boolean;
  isMandatory?: boolean;
  evidence?: string;
  notApplicable?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <li className="flex items-start gap-2">
      <span className="pt-[2px]">
        {notApplicable ? (
          <Circle className="h-5 w-5 text-gray-400" />
        ) : isCompleted ? (
          <CorrectIcon className="h-5 w-5 text-green-500" />
        ) : (
          <IncorrectIcon className="h-5 w-5 text-red-500" />
        )}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`mt-[2px] text-sm ${notApplicable ? 'text-gray-400' : 'text-gray-700'}`}>
            {text}
          </span>
        </div>
        {isMandatory && !notApplicable && (
          <div className="mt-1">
            <span
              className="inline-block rounded-full px-2 py-1 text-xs text-red-600"
              style={{ backgroundColor: '#FFD9D6' }}
            >
              {t('assessment.standings.mandatory')}
            </span>
          </div>
        )}
        {evidence && !notApplicable && (
          <blockquote className="mt-2 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-500">
            {evidence}
          </blockquote>
        )}
      </div>
    </li>
  );
};

// Section component (matching MSIGSection from roleplay)
interface SectionProps {
  section: MSIGSectionType;
  title: string;
}

const Section = ({ section, title }: SectionProps) => {
  const { t } = useTranslation();

  // Handle not applicable sections
  if (section.notApplicable) {
    const allCriteria = section.evaluations || [];

    return (
      <div className="rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-800">{title}</h4>
            <span className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {t('assessment.notApplicable', 'Not Applicable')}
            </span>
          </div>
          <ProgressBar passed={0} total={allCriteria.length} />
        </div>

        <div className="border-t border-gray-200 p-4">
          {allCriteria.length > 0 && (
            <div>
              <h5 className="mb-2 text-sm font-semibold text-gray-500">
                {t('practice.standings.criteria')}
              </h5>
              <ul className="space-y-2">
                {allCriteria.map((item, index) => (
                  <ChecklistItem
                    key={index}
                    text={item.criteriaText}
                    isCompleted={false}
                    isMandatory={item.mandatory}
                    evidence=""
                    notApplicable={true}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate section metrics
  const passedCriteria = section.evaluations.filter((c) => c.pass);
  const failedCriteria = section.evaluations.filter((c) => !c.pass);
  const totalCriteria = section.evaluations.length;

  // Determine if any failed criteria are mandatory
  const hasFailedMandatory = failedCriteria.some((c) => c.mandatory);

  // Create lists for completed and to improve
  const completed = passedCriteria.map((c) => ({
    text: c.criteriaText,
    isMandatory: c.mandatory,
    evidence: c.evidence,
  }));

  const toImprove = failedCriteria.map((c) => ({
    text: c.criteriaText,
    isMandatory: c.mandatory,
    evidence: c.evidence,
  }));

  return (
    <div
      className="rounded-lg border border-gray-200"
      style={{
        backgroundColor: hasFailedMandatory ? '#FFECEB' : 'white',
        borderColor: hasFailedMandatory ? '#E60D00' : undefined,
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        </div>
        <ProgressBar passed={passedCriteria.length} total={totalCriteria} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <ul className="space-y-3">
          {toImprove.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.toImprove')}
              </h5>
              <ul className="space-y-2">
                {toImprove.map((item, index) => (
                  <ChecklistItem
                    key={index}
                    text={item.text}
                    isCompleted={false}
                    isMandatory={item.isMandatory}
                    evidence={item.evidence}
                  />
                ))}
              </ul>
            </li>
          )}

          {completed.length > 0 && (
            <li>
              <h5 className="mb-2 text-sm font-semibold text-gray-800">
                {t('assessment.completed')}
              </h5>
              <ul className="space-y-2">
                {completed.map((item, index) => (
                  <ChecklistItem
                    key={index}
                    text={item.text}
                    isCompleted
                    isMandatory={item.isMandatory}
                  />
                ))}
              </ul>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

interface MSIGAssessmentViewProps {
  assessment: MSIGAssessment;
}

export function MSIGAssessmentView({ assessment }: MSIGAssessmentViewProps) {
  const { t } = useTranslation();

  // Check for mandatory failures
  const hasFailedMandatory = Object.values(assessment.sections).some(
    (section) =>
      !section.notApplicable &&
      section.evaluations?.some((criteria) => criteria.mandatory && !criteria.pass),
  );

  // Calculate tier from score
  const tierInfo = getTierFromScore(assessment.overallScore);

  // Calculate section scores for the header grid
  const getSectionScore = (key: string) => {
    const section = assessment.sections[key];
    if (!section) return { passed: 0, total: 0 };
    if (section.notApplicable) return { passed: 0, total: section.evaluations.length, notApplicable: true };
    const passed = section.evaluations.filter((e) => e.pass).length;
    return { passed, total: section.evaluations.length };
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Score Header Section */}
      <div className="flex items-start gap-6">
        {/* Ring Score */}
        <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
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
            {!hasFailedMandatory && (
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - assessment.overallScore / 100)}`}
                className="text-blue-600 transition-all duration-300"
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute text-[18px] font-bold text-gray-900">
            {hasFailedMandatory ? '-' : `${assessment.overallScore}%`}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Result / Tier */}
          <div className="mb-4">
            <p className="text-[14px] font-normal text-[#58595A]">
              {t('callAnalysis.assessment.result')}
            </p>
            <p className="text-[16px] font-bold text-[#161618]">
              {hasFailedMandatory ? t('callAnalysis.msig.notAvailable', 'Not available') : tierInfo.tier}
            </p>
            {hasFailedMandatory && (
              <p className="text-[14px] text-red-600">
                {t('callAnalysis.msig.resultUnavailable', 'Result unavailable: Mandatory criteria not met.')}
              </p>
            )}
          </div>

          {/* Section Scores Grid - 3 columns, 2 rows */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 rounded-lg p-4">
            {SECTION_ORDER.map(({ key }) => {
              const score = getSectionScore(key);
              const sectionTitle = t(`callAnalysis.msig.sections.${key}`);
              return (
                <div key={key} className="flex items-start gap-2">
                  <div className="mt-1 h-4 w-1 flex-shrink-0 rounded-full bg-[#D9DDE0]" />
                  <div>
                    <p className="text-[14px] font-normal text-[#58595A]">
                      {sectionTitle}
                    </p>
                    <p className="text-[14px] font-bold text-[#161618]">
                      {score.notApplicable ? '-' : `${score.passed}/${score.total}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* Overview Section - matching roleplay MSIGOverview */}
      <section className="rounded-2xl p-4">
        <h3 className="mb-2 text-[16px] font-semibold">
          {t('assessment.summary')}
        </h3>
        <p className="mb-4 text-[14px] text-[#58595A]">
          {assessment.summary}
        </p>

        <h3 className="mb-2 text-[16px] font-semibold">
          {t('callAnalysis.assessment.suggestedNextSteps', 'Suggested next steps')}
        </h3>
        <div className="space-y-2">
          {assessment.suggestedNextSteps?.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[14px] text-[#58595A]">•</span>
              <span className="text-[14px] text-[#58595A]">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sales Technique Section - matching roleplay MSIGSalesTechnique */}
      <section className="space-y-4 rounded-2xl p-4">
        <div className="flex-1">
          <h2 className="mb-1 text-[16px] font-bold">
            {t('callAnalysis.assessment.scorecardBreakdown', 'Scorecard breakdown')}
          </h2>
        </div>

        {SECTION_ORDER.map(({ key }) => {
          const section = assessment.sections[key];
          if (!section) return null;

          const sectionTitle = t(`callAnalysis.msig.sections.${key}`);

          return (
            <Section
              key={key}
              section={section}
              title={sectionTitle}
            />
          );
        })}
      </section>
    </div>
  );
}
