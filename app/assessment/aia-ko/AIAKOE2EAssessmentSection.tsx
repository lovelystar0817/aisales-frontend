import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import type { AIAKOE2ESection } from '~/assessment/types';
import { getScoreRating } from '~/util/scoreRating';

const ProgressBar = ({
  passed,
  total,
  color,
}: {
  passed: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? (passed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-bold text-[#161618]">
        {passed.toFixed(0)} <span className="font-normal text-[#58595A]">/ {total === 99 ? 100 : total}</span>
      </div>
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const E2E_SECTION_TITLE_KEYS = [
  'assessment.aiaKoE2E.introduction',
  'assessment.aiaKoE2E.needsAnalysis',
  'assessment.aiaKoE2E.productPitch',
  'assessment.aiaKoE2E.objectionHandling',
  'assessment.aiaKoE2E.closing',
  'assessment.aiaKoE2E.other',
];

interface AIAKOE2EAssessmentSectionProps {
  section: AIAKOE2ESection | null | undefined;
  sectionId: string;
  sectionIndex: number;
}

export function AIAKOE2EAssessmentSection({
  section,
  sectionId,
  sectionIndex,
}: AIAKOE2EAssessmentSectionProps) {
  const { t } = useTranslation();
  const sectionTitleKey = E2E_SECTION_TITLE_KEYS[sectionIndex];

  const getProgressBarColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const { color } = getScoreRating(percentage);
    return color;
  };

  if (!section) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t(sectionTitleKey)}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  return (
    <section id={sectionId} className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="space-y-4">
        <div className="relative bg-white py-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">
              {t(sectionTitleKey)}
            </h2>
            <ProgressBar
              passed={section.score}
              total={section.maxScore}
              color={getProgressBarColor(section.score, section.maxScore)}
            />
          </div>
        </div>
        {section.criteria?.map(
          ({ title, score, maxScore, why, suggestion }) => (
            <div
              key={title}
              className="rounded-[12px] border border-[#D9DDE0] p-4"
            >
              <div className="flex items-center justify-between bg-white py-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-[14px] font-semibold text-[#161618]">
                    {title}
                  </h4>
                </div>
                <div className="text-[14px] font-bold text-[#161618]">
                  {score.toFixed(0)}{' '}
                  <span className="font-normal text-[#58595A]">
                    / {maxScore.toFixed(0)}
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
                    {why}
                  </div>
                </li>
                <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                  <span className="mr-2 text-[#58595A]">•</span>
                  <div>
                    <strong className="font-bold">
                      {t('assessment.suggestion')}:
                    </strong>{' '}
                    {suggestion}
                  </div>
                </li>
              </ul>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
