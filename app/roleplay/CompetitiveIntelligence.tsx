import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import type { Competitor } from '~/routes/app/roleplay/types';

interface CompetitiveIntelligenceProps {
  competitors: Competitor[];
}

export function CompetitiveIntelligence({
  competitors,
}: CompetitiveIntelligenceProps) {
  const { t } = useTranslation();
  
  return (
    <div className="py-4 space-y-4 px-4">
      {competitors.map((competitor, idx) => (
        <Disclosure
          key={competitor.name}
          as="div"
          defaultOpen={idx === 0}
          className="rounded-xl border border-gray-200 bg-white"
        >
          {({ open }) => (
            <>
              <DisclosureButton className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">
                    {competitor.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {competitor.company}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </div>
              </DisclosureButton>
              
              <DisclosurePanel className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Type */}
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('roleplay.competitiveIntelligence.type')}: </span>
                    <span className="text-sm text-gray-600">{competitor.type}</span>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-900">
                      {t('roleplay.competitiveIntelligence.keyFeatures')}
                    </h4>
                    <ul className="space-y-1">
                      {competitor.keyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <span className="mr-2 text-gray-400">•</span>
                          {typeof feature === 'string' ? feature : feature.title}
                          {typeof feature === 'object' && feature.children?.length > 0 && (
                            <ul className="ml-4 pt-1 list-disc space-y-1">
                              {feature.children.map((child, j) => (
                                <li key={j} className="text-sm text-gray-600">{child}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strengths and Limitations */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Strengths */}
                    <div className="rounded-lg bg-green-50 p-3">
                      <div className="mb-2 flex items-center">
                        <span className="mr-2 text-green-600">✓</span>
                        <h4 className="text-sm font-bold text-green-800">
                          {t('roleplay.competitiveIntelligence.strengths')}
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        {competitor.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start text-sm text-green-700">
                            <span className="mr-2 text-green-500">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Limitations */}
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="mb-2 flex items-center">
                        <span className="mr-2 text-red-600">⚠</span>
                        <h4 className="text-sm font-bold text-red-800">
                          {t('roleplay.competitiveIntelligence.limitations')}
                        </h4>
                      </div>
                      <ul className="space-y-1">
                        {competitor.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start text-sm text-red-700">
                            <span className="mr-2 text-red-500">•</span>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Positioning Strategy */}
                  <div className="rounded-lg bg-purple-50 p-3">
                    <div className="mb-2 flex items-center">
                      <span className="mr-2 text-purple-600">⚡</span>
                      <h4 className="text-sm font-bold text-purple-800">
                        {t('roleplay.competitiveIntelligence.positioningStrategy')}
                      </h4>
                    </div>
                    <p className="text-sm text-purple-700 leading-relaxed">
                      {competitor.positioningStrategy}
                    </p>
                  </div>
                </div>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
}
