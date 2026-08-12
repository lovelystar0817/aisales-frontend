import React from 'react';
import { useTranslation } from 'react-i18next';
import { getScoreRating } from '~/util/scoreRating';
import { Circle } from '~/components/Circle';
import { FeedbackSkeleton } from '~/assessment/regular/FeedbackSkeleton';
import { useAssessmentContext } from '~/assessment/shared/AssessmentContext';

export default function HSBCCommunicationAndPresence() {
  const { t } = useTranslation();
  const { hsbcCommunicationAndPresenceData: data } = useAssessmentContext();

  if (!data) {
    return (
      <div className="rounded-2xl bg-white">
        <h2 className="mb-1 p-6 pb-0 text-[16px] font-bold">
          {t('assessment.communicationAndPresence')}
        </h2>
        <FeedbackSkeleton />
      </div>
    );
  }

  return (
    <section id="communication-and-presence" className="rounded-2xl bg-[#FFFFFF] p-4">
      <div className="space-y-4">
        <div className="relative flex items-center justify-between bg-white py-2">
          <div className="flex-1 pr-6">
            <h2 className="mb-1 text-[16px] font-bold">
              {t('assessment.communicationAndPresence')}
            </h2>
            <p className="text-[14px] text-[#58595A]">{data.description}</p>
          </div>
          <div className="flex flex-row items-center space-x-2">
            <p className="m-2 text-[14px] font-normal text-[#58595A]">
              {t('assessment.overallScore')}
            </p>
            <div className="relative">
              <Circle
                size={66}
                value={data.overallScore}
                color={getScoreRating(data.overallScore, true).color}
                bgColor="#E5E7EB"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[18px] font-bold">
                  {data.overallScore}
                  <span className="text-[8px] font-normal text-[#58595A]">
                    /{data.maxScore}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {data.sections?.map(
          ({ title, score, maxScore = 33, why, whatToImprove }: any) => (
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
                      {t('assessment.whatToImprove')}:
                    </strong>{' '}
                    {whatToImprove}
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
