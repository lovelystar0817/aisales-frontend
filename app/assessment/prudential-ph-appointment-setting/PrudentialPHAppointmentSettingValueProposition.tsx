import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function PrudentialPHAppointmentSettingValueProposition() {
  const { t } = useTranslation();
  const { prudentialPHAppointmentSettingData: data } = useAssessmentContext();

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t('assessment.valueProposition')}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  const section = data.sections.find(
    (s) => s.title.toLowerCase().includes('value proposition') ||
           s.title.toLowerCase().includes('value'),
  );

  if (!section) {
    return null;
  }

  return (
    <section
      id="value-proposition"
      className="rounded-2xl bg-white p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-[#161618]">
          {section.title}
        </h3>
        {section.isMandatory ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              section.passed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {section.passed
              ? t('assessment.standings.completed')
              : t('assessment.standings.notCompleted')}
          </span>
        ) : (
          <span className="text-[14px] font-semibold text-[#58595A]">
            {section.score}/{section.maxScore}
          </span>
        )}
      </div>

      {!section.isMandatory && section.maxScore > 0 && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{
              width: `${(section.score / section.maxScore) * 100}%`,
            }}
          />
        </div>
      )}

      <p className="mb-3 text-[14px] text-[#58595A]">{section.feedback}</p>

      {section.strengths?.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 text-[13px] font-semibold text-green-700">
            {t('assessment.strengths')}
          </h4>
          <ul className="ml-4 list-disc text-[13px] text-[#3c4043]">
            {section.strengths.map((s: string, i: number) => (
              <li key={i} className="mb-1">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.improvements?.length > 0 && (
        <div>
          <h4 className="mb-1 text-[13px] font-semibold text-red-700">
            {t('assessment.toImprove')}
          </h4>
          <ul className="ml-4 list-disc text-[13px] text-[#3c4043]">
            {section.improvements.map((imp: string, i: number) => (
              <li key={i} className="mb-1">
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
