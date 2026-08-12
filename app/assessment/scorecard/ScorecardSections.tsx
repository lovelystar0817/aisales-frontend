import { getScoreRating } from '~/util/scoreRating';
import { useTranslation } from 'react-i18next';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { ClockIcon } from 'lucide-react';
import {
  CorrectIcon,
  WarningIcon,
  IncorrectIcon,
} from '../../../public/icons/icons';
import type { ScorecardSection } from '../types';

export default function ScorecardSections({
  sections,
}: {
  sections: ScorecardSection[];
}) {
  const { t } = useTranslation();

  if (!sections) {
    return (
      <div className="rounded-2xl bg-white">
        <FeedbackSkeleton />
      </div>
    );
  }

  return (
    <section id="sales-technique" className="">
      {sections.map((data: any, index: number) => {
        return (
          <div
            key={'scorecard-section-' + index}
            className="mb-6 space-y-4 rounded-2xl bg-[#FFFFFF] p-4"
            id={'scorecard-section-' + index}
          >
            <div className="relative flex items-center justify-between bg-white">
              <div className="flex-1 pr-6">
                <h2 className="text-[16px] font-bold">{data.name}</h2>
                <p className="text-[14px] text-[#58595A]">{data.description}</p>
              </div>
              {data?.isGenerating ? (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-600">
                    {t('assessment.generating', 'Generating')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-row items-center space-x-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {data.overallScore}
                      </span>{' '}
                      / 100
                    </div>
                    <div className="h-2 w-20 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300`}
                        style={{
                          width: `${(data.overallScore / data.maxScore) * 100}%`,
                          backgroundColor: getScoreRating(data.overallScore)
                            .color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {data.criteria?.map(
              ({
                title,
                score,
                maxScore,
                reason,
                suggestion,
                strengths,
                toImprove,
              }: any) => {
                const hasDetailedFormat =
                  strengths?.length > 0 || toImprove?.length > 0;

                return (
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
                      {hasDetailedFormat ? (
                        <>
                          {strengths?.map((strength: string, i: number) => (
                            <li
                              key={'strength-' + i}
                              className="flex items-start text-[14px] font-normal text-[#58595A]"
                            >
                              <span>
                                <CorrectIcon
                                  style={{ width: 16, height: 20 }}
                                />
                              </span>
                              <div className="ml-2">{strength}</div>
                            </li>
                          ))}
                          {toImprove?.map((bullet: any, i: number) => (
                            <li
                              key={'toImprove-' + i}
                              className="flex items-start text-[14px] font-normal text-[#58595A]"
                            >
                              <span>
                                {bullet.status === 'error' ? (
                                  <IncorrectIcon
                                    style={{ width: 16, height: 20 }}
                                  />
                                ) : (
                                  <WarningIcon
                                    style={{ width: 16, height: 20 }}
                                  />
                                )}
                              </span>
                              <div className="ml-2">
                                {bullet.text}
                                {bullet.correction && (
                                  <div className="mt-1 flex items-start">
                                    <span
                                      className="mt-1 inline-block h-8 w-1 rounded-full"
                                      style={{ backgroundColor: '#C7CBCE' }}
                                    />
                                    <span className="ml-2">
                                      {bullet.correction}
                                    </span>
                                  </div>
                                )}
                                {bullet.example && (
                                  <div className="mt-1 flex items-start">
                                    <span
                                      className="mt-1 inline-block h-8 w-1 rounded-full"
                                      style={{ backgroundColor: '#C7CBCE' }}
                                    />
                                    <span className="ml-2">
                                      <strong>
                                        {t('assessment.example')}:
                                      </strong>{' '}
                                      "{bullet.example}"
                                    </span>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </>
                      ) : (
                        <>
                          <li className="flex items-start text-[14px] font-normal text-[#58595A]">
                            <span className="mr-2 text-[#58595A]">•</span>
                            <div>
                              <strong className="font-bold">
                                {t('assessment.why')}:
                              </strong>{' '}
                              {reason}
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
                        </>
                      )}
                    </ul>
                  </div>
                );
              },
            )}
          </div>
        );
      })}
    </section>
  );
}
