import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import type { SalesTechniquesParams } from '~/assessment/types';
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
      <div className="text-sm text-gray-700">
        {passed}/{total}
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

interface AIAKOAssessmentSectionProps {
  type:
    | 'introduction'
    | 'objectionHandling'
    | 'needsExploration'
    | 'needsAnalysis'
    | 'productPitch';
  data: SalesTechniquesParams | null | undefined;
  sectionId: string;
}

export function AIAKOAssessmentSection({
  type,
  data,
  sectionId,
}: AIAKOAssessmentSectionProps) {
  const { t } = useTranslation();

  const translationMap = {
    introduction: 'assessment.introduction',
    objectionHandling: 'assessment.objectionHandling',
    needsExploration: 'assessment.needsHealthExploration',
    needsAnalysis: 'assessment.needsAnalysis',
    productPitch: 'assessment.productPitch',
  };

  const translationKey = translationMap[type];

  const getProgressBarColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const { color } = getScoreRating(percentage);
    return color;
  };

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t(translationKey)}
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
            <h2 className="text-[16px] font-bold">{t(translationKey)}</h2>
            <ProgressBar
              passed={data.overallScore}
              total={data.maxScore || 100}
              color={getProgressBarColor(
                data.overallScore,
                data.maxScore || 100,
              )}
            />
          </div>
          {data.description && (
            <p className="mt-2 text-[14px] text-[#58595A]">
              {data.description}
            </p>
          )}
        </div>
        {data.sections?.map(
          ({ title, score, maxScore = 20, why, suggestion }: any) => (
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
                  {score}
                  <span className="font-normal text-[#58595A]">
                    / {maxScore}
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
