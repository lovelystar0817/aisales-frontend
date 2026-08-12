import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function PrudentialPHAppointmentSettingClientVerification() {
  const { t } = useTranslation();
  const { prudentialPHAppointmentSettingData: data } = useAssessmentContext();

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t('assessment.clientVerification')}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  const section = data.sections.find(
    (s) => s.title.toLowerCase().includes('client verification') ||
           s.title.toLowerCase().includes('verification'),
  );

  if (!section) {
    return null;
  }

  return (
    <section
      id="client-verification"
      className="rounded-2xl bg-white p-4"
    >

      {section.why && section.suggestion ? (
        <div className="space-y-4">
          <div className="relative flex items-center justify-between bg-white py-2">
            <div className="flex-1 pr-6">
              <h2 className="mb-1 text-[16px] font-bold">
                {t('assessment.clientVerification')}
              </h2>
            </div>
            <div className="flex flex-row items-center justify-center gap-2">
              <div>
                <span className="font-bold">
                  {section.score * 2}{' '}
                  <span className="font-normal text-[#58595A]">
                    / {section.maxScore * 2}
                  </span>
                </span>
              </div>
              <div className="h-2 w-[100px] overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${(section.score / section.maxScore) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-[12px] border border-[#D9DDE0] p-4"
          >
            <div className="flex items-center justify-between bg-white py-2">
              <div className="flex items-center space-x-2">
                <h4 className="text-[14px] font-semibold text-[#161618]">
                  {section.title}
                </h4>
              </div>
              <div className="text-[14px] font-bold text-[#161618]">
                {section.score * 2}{' '}
                <span className="font-normal text-[#58595A]">
                  / {section.maxScore * 2}
                </span>
              </div>
            </div>
            <div className="my-2 border-t border-[#D9DDE0]" />
            <ul className="space-y-2 pl-2">
              <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                <span className="mr-2 text-[#58595A]">•</span>
                <div>
                  <strong className="font-bold">
                    {t('assessment.why')}:
                  </strong>{' '}
                  {section.why}
                </div>
              </li>
              <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                <span className="mr-2 text-[#58595A]">•</span>
                <div>
                  <strong className="font-bold">
                    {t('assessment.suggestion')}:
                  </strong>{' '}
                  {section.suggestion}
                </div>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}

    </section>
  );
}
