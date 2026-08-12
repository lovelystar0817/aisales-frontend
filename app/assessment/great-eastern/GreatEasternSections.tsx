import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';
import type {
  GreatEasternSection,
  GreatEasternCriterion,
} from '~/assessment/types';

export default function GreatEasternSections() {
  const { t } = useTranslation();
  const { greatEasternAssessmentData: data } = useAssessmentContext();

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t('assessment.assessment')}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {data.sections.map((section: GreatEasternSection, index: number) => {
        const sectionPercentage = Math.round(
          (section.score / section.maxScore) * 100,
        );

        const hasCriteria = section.criteria && section.criteria.length > 0;

        return (
          <div
            key={index}
            id={`section-${index}`}
            className="rounded-2xl bg-white p-4"
          >
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#161618]">
                  {section.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#161618]">
                    {sectionPercentage}
                  </span>
                  <span className="text-[14px] font-normal text-[#58595A]">
                    / 100
                  </span>
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${sectionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Inner cards for criteria */}
              {hasCriteria ? (
                section.criteria.map(
                  (criterion: GreatEasternCriterion, idx: number) => {
                    // Calculate criterion max, ensuring total adds up to 100
                    const baseMaxScore = Math.floor(100 / section.criteria.length);
                    const isFirstCriterion = idx === 0;
                    // Give the first criterion the remainder to make total = 100
                    const criterionMaxScore = isFirstCriterion
                      ? 100 - baseMaxScore * (section.criteria.length - 1)
                      : baseMaxScore;
                    // Scale criterion score proportionally
                    const criterionDisplayScore = Math.round(
                      (criterion.score / criterion.maxScore) * criterionMaxScore,
                    );

                    return (
                      <div
                        key={idx}
                        className="rounded-[12px] border border-[#D9DDE0] p-4"
                      >
                        <div className="flex items-center justify-between py-2">
                          <h4 className="text-[14px] font-semibold text-[#161618]">
                            {criterion.title}
                          </h4>
                          <div className="text-[14px] font-bold text-[#161618]">
                            {criterionDisplayScore}
                            <span className="font-normal text-[#58595A]">
                              {' '}
                              / {criterionMaxScore}
                            </span>
                          </div>
                        </div>
                        <div className="my-2 border-t border-[#D9DDE0]" />
                        <ul className="space-y-2 pl-2">
                          <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                            <span className="mr-2 text-[#58595A]">•</span>
                            <div>
                              <strong className="font-bold">
                                {t('assessment.why', 'Why')}:
                              </strong>{' '}
                              {criterion.why || criterion.feedback}
                            </div>
                          </li>
                          {criterion.suggestion && (
                            <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                              <span className="mr-2 text-[#58595A]">•</span>
                              <div>
                                <strong className="font-bold">
                                  {t('assessment.suggestion', 'Suggestion')}:
                                </strong>{' '}
                                {criterion.suggestion}
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  },
                )
              ) : (
                /* Single inner card using section-level data */
                <div className="rounded-[12px] border border-[#D9DDE0] p-4">
                  <div className="flex items-center justify-between py-2">
                    <h4 className="text-[14px] font-semibold text-[#161618]">
                      {section.title}
                    </h4>
                    <div className="text-[14px] font-bold text-[#161618]">
                      {sectionPercentage}
                      <span className="font-normal text-[#58595A]">
                        {' '}
                        / 100
                      </span>
                    </div>
                  </div>
                  <div className="my-2 border-t border-[#D9DDE0]" />
                  <ul className="space-y-2 pl-2">
                    <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                      <span className="mr-2 text-[#58595A]">•</span>
                      <div>
                        <strong className="font-bold">
                          {t('assessment.why', 'Why')}:
                        </strong>{' '}
                        {section.why || section.feedback}
                      </div>
                    </li>
                    {section.suggestion && (
                      <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                        <span className="mr-2 text-[#58595A]">•</span>
                        <div>
                          <strong className="font-bold">
                            {t('assessment.suggestion', 'Suggestion')}:
                          </strong>{' '}
                          {section.suggestion}
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
