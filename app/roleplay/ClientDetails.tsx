import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '~/context/language';
import type { Persona } from '~/routes/app/roleplay/types';

interface BblFinancialProfile {
  profileData?: {
    aum?: string;
    demographicProfile?: string;
    behaviorProfile?: string;
    workHistory?: string;
    numberOfKids?: number;
    liquidityNeeds?: string;
    riskAppetite?: string;
    investmentFrequency?: string;
    keyLifestyleExpenditure?: string;
    discPersonality?: string;
  };
  educationGoal?: any;
  retirementGoal?: any;
  legacyGoal?: any;
}

interface HsbcFinancialProfile {
  demographicProfile: string;
  annualIncome: string;
  hsbcTier: string;
  liquidityNeeds: string;
  keyLifestyleExpenditures: string;
}

interface GreatEasternFinancialProfile {
  liquidityNeeds: string;
  lifestyleExpenditures: string;
}

interface ClientDetailsProps {
  readonly persona: Persona & {
    bblFinancialProfile?: BblFinancialProfile;
    hsbcFinancialProfile?: HsbcFinancialProfile;
    greatEasternFinancialProfile?: GreatEasternFinancialProfile;
    isCustom?: boolean;
  };
  readonly productId: string;
  readonly assessmentType?: string;
  readonly shouldShowField?: (fieldName: string) => boolean;
  readonly shouldShowPersonalityField?: (fieldName: string) => boolean;
}

export function ClientDetails({
  persona,
  productId,
  assessmentType,
  shouldShowField = () => true,
  shouldShowPersonalityField = () => true,
}: ClientDetailsProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const isBbl = persona.bblFinancialProfile?.profileData;
  const isHsbc = persona.hsbcFinancialProfile;
  const isGreatEastern = persona.greatEasternFinancialProfile;
  const isRegular = !isBbl && !isHsbc && !isGreatEastern;

  console.log({ persona });
  return (
    <TabGroup className="px-4">
      <TabList className="mt-2 mb-2 flex gap-8 border-b border-gray-200">
        <Tab
          className={({ selected }) =>
            [
              'cursor-pointer py-2 font-medium outline-none',
              selected ? 'border-b-2 border-black text-black' : 'text-gray-500',
            ].join(' ')
          }
        >
          {t('roleplay.tabs.profile')}
        </Tab>
        <Tab
          className={({ selected }) =>
            [
              'cursor-pointer py-2 font-medium outline-none',
              selected ? 'border-b-2 border-black text-black' : 'text-gray-500',
            ].join(' ')
          }
        >
          {t('roleplay.tabs.personality')}
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          {/* BBL Profile */}
          {isBbl && persona.bblFinancialProfile?.profileData && (
            <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm">
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.demographicProfile) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.demographic')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData
                      .demographicProfile || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                (shouldShowField('occupation') && persona.occupation)) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.occupation')}
                  </p>
                  <p className="text-gray-500">
                    {shouldShowField('occupation') ? persona.occupation : '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.aum) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.aum')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.aum || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.numberOfKids !==
                  undefined) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.numberOfKids')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.numberOfKids ??
                      '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.behaviorProfile) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.behavior')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.behaviorProfile ||
                      '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.workHistory) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.workHistory')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.workHistory || '-'}
                  </p>
                </div>
              )}
              {shouldShowField('financialSituation') &&
                (!persona.isCustom || persona.details.financialSituation) && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.financialSituation')}
                    </p>
                    <p className="whitespace-pre-line text-gray-500">
                      {shouldShowField('financialSituation')
                        ? persona.details.financialSituation
                        : '-'}
                    </p>
                  </div>
                )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.liquidityNeeds) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.liquidityNeeds')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.liquidityNeeds ||
                      '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData.riskAppetite) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.riskAppetite')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.riskAppetite ||
                      '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData
                  .investmentFrequency) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.investmentFrequency')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData
                      .investmentFrequency || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.bblFinancialProfile.profileData
                  .keyLifestyleExpenditure) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.keyLifestyleExpenditure')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData
                      .keyLifestyleExpenditure || '-'}
                  </p>
                </div>
              )}
              {shouldShowField('keyPriorities') &&
                (!persona.isCustom ||
                  (persona.details.keyPriorities &&
                    (persona.details.keyPriorities?.length ?? 0) > 0)) && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.personalPriorities')}
                    </p>
                    <p className="text-gray-500">
                      {shouldShowField('keyPriorities')
                        ? persona.details.keyPriorities.join(', ')
                        : '-'}
                    </p>
                  </div>
                )}
            </div>
          )}
          {/* HSBC Profile */}
          {isHsbc && persona.hsbcFinancialProfile && (
            <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm">
              {(!persona.isCustom ||
                persona.hsbcFinancialProfile.demographicProfile) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.demographic')}
                  </p>
                  <p className="text-gray-500">
                    {persona.hsbcFinancialProfile.demographicProfile || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom || persona.occupation) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.occupation')}
                  </p>
                  <p className="text-gray-500">{persona.occupation || '-'}</p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.hsbcFinancialProfile.annualIncome) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.annualIncome')}
                  </p>
                  <p className="text-gray-500">
                    {persona.hsbcFinancialProfile.annualIncome || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom || persona.hsbcFinancialProfile.hsbcTier) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.hsbcTier')}
                  </p>
                  <p className="text-gray-500">
                    {persona.hsbcFinancialProfile.hsbcTier || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom || persona.details.location) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.location')}
                  </p>
                  <p className="text-gray-500">
                    {persona.details.location || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom || persona.details.financialSituation) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.financialSituation')}
                  </p>
                  <p className="whitespace-pre-line text-gray-500">
                    {persona.details.financialSituation ? (
                      <ReactMarkdown
                        components={{
                          ul: ({ children }) => (
                            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-gray-700">
                              {children}
                            </li>
                          ),
                        }}
                      >
                        {persona.details.financialSituation}
                      </ReactMarkdown>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.hsbcFinancialProfile.liquidityNeeds) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.liquidityNeeds')}
                  </p>
                  <p className="text-gray-500">
                    {persona.hsbcFinancialProfile.liquidityNeeds || '-'}
                  </p>
                </div>
              )}
              {(!persona.isCustom ||
                persona.hsbcFinancialProfile.keyLifestyleExpenditures) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.keyLifestyleExpenditure')}
                  </p>
                  <ReactMarkdown
                    components={{
                      ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm text-gray-700">{children}</li>
                      ),
                    }}
                  >
                    {persona.hsbcFinancialProfile.keyLifestyleExpenditures ||
                      '-'}
                  </ReactMarkdown>
                </div>
              )}
              {(!persona.isCustom || persona.details.keyPriorities) && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.keyPriorities')}
                  </p>
                  <p className="text-gray-500">
                    {persona.details.keyPriorities
                      ? persona.details.keyPriorities.map(
                          (priority, pIndex) => (
                            <ReactMarkdown
                              key={pIndex}
                              components={{
                                ul: ({ children }) => (
                                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-sm text-gray-700">
                                    {children}
                                  </li>
                                ),
                              }}
                            >
                              {priority}
                            </ReactMarkdown>
                          ),
                        )
                      : '-'}
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Great Eastern Profile */}
          {isGreatEastern && persona.greatEasternFinancialProfile && (
            <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm">
              {shouldShowField('gender') && persona.gender && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.gender')}
                  </p>
                  <p className="text-gray-500">
                    {persona.gender === 'male'
                      ? t('manage.persona.male')
                      : t('manage.persona.female')}
                  </p>
                </div>
              )}
              {shouldShowField('occupation') && persona.occupation && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.occupation')}
                  </p>
                  <p className="text-gray-500">{persona.occupation}</p>
                </div>
              )}
              {shouldShowField('location') && persona.details.location && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.location')}
                  </p>
                  <p className="text-gray-500">{persona.details.location}</p>
                </div>
              )}
              {shouldShowField('financialSituation') &&
                persona.details.financialSituation && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.financialSituation')}
                    </p>
                    <p className="text-gray-500">
                      {persona.annualIncome === null
                        ? persona.details.financialSituation
                        : t('practice.clientDetails.annualIncomeFormat', {
                            currency: persona.currency ?? '$',
                            amount: persona.annualIncome,
                            situation: persona.details.financialSituation,
                          })}
                    </p>
                  </div>
                )}
              {persona.greatEasternFinancialProfile.liquidityNeeds && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.liquidityNeeds')}
                  </p>
                  <p className="text-gray-500">
                    {persona.greatEasternFinancialProfile.liquidityNeeds}
                  </p>
                </div>
              )}
              {persona.greatEasternFinancialProfile.lifestyleExpenditures && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.keyLifestyleExpenditure')}
                  </p>
                  <p className="text-gray-500">
                    {persona.greatEasternFinancialProfile.lifestyleExpenditures}
                  </p>
                </div>
              )}
              {shouldShowField('keyPriorities') &&
                persona.details.keyPriorities &&
                persona.details.keyPriorities.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.keyPriorities')}
                    </p>
                    <ul className="ml-5 list-disc text-gray-500">
                      {persona.details.keyPriorities.map((priority, index) => (
                        <li key={index}>{priority}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {!persona.isCustom &&
                shouldShowField('productKnowledge') &&
                persona.details.productKnowledge && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.productKnowledge')}
                    </p>
                    <p className="text-gray-500">
                      {persona.details.productKnowledge}
                    </p>
                  </div>
                )}
            </div>
          )}
          {/* Standard Profile */}
          {isRegular && (
            <div className="mt-6 mb-8 grid grid-cols-1 gap-6 text-sm">
              {shouldShowField('gender') && persona.gender && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.gender')}
                  </p>
                  <p className="text-gray-500">
                    {persona.gender === 'male'
                      ? t('manage.persona.male')
                      : t('manage.persona.female')}
                  </p>
                </div>
              )}
              {shouldShowField('demographics') &&
                persona.details.demographics && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">Demographics</p>
                    <p className="text-gray-500">
                      {persona.details.demographics}
                    </p>
                  </div>
                )}
              {shouldShowField('occupation') && persona.occupation && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.occupation')}
                  </p>
                  <p className="text-gray-500">{persona.occupation}</p>
                </div>
              )}
              {shouldShowField('location') && persona.details.location && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.location')}
                  </p>
                  <p className="text-gray-500">{persona.details.location}</p>
                </div>
              )}
              {shouldShowField('companyProfile') &&
                persona.details.companyProfile && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      Company Profile
                    </p>
                    <p className="text-gray-500">
                      {persona.details.companyProfile}
                    </p>
                  </div>
                )}
              {shouldShowField('projectContext') &&
                persona.details.projectContext && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      Project Context
                    </p>
                    <p className="text-gray-500">
                      {persona.details.projectContext}
                    </p>
                  </div>
                )}
              {shouldShowField('annualBudget') &&
                persona.details.annualBudget && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      Annual IT Budget
                    </p>
                    <p className="text-gray-500">
                      {persona.details.annualBudget}
                    </p>
                  </div>
                )}
              {shouldShowField('competitorLandscape') &&
                persona.details.competitorLandscape && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      Competitor Landscape
                    </p>
                    <p className="text-gray-500">
                      {persona.details.competitorLandscape}
                    </p>
                  </div>
                )}
              {shouldShowField('education') && persona.details.education && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.education')}
                  </p>
                  <p className="text-gray-500">{persona.details.education}</p>
                </div>
              )}
              {shouldShowField('financialSituation') &&
                persona.details.financialSituation && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {productId === 'grab-for-business'
                        ? t('practice.clientDetails.companySize')
                        : t('roleplay.fields.financialSituation')}
                    </p>
                    <p className="whitespace-pre-line text-gray-500">
                      {productId === 'grab-for-business' || persona.annualIncome == null
                        ? persona.details.financialSituation
                        : t(persona.friendlyId.includes('prudential-ph') ? 'practice.clientDetails.monthlyIncomeFormat' : 'practice.clientDetails.annualIncomeFormat', {
                            currency: persona.currency ?? '$',
                            amount:
                              language === 'ko'
                                ? Math.floor(persona.annualIncome / 10000)
                                : persona.friendlyId.includes('prudential-ph')
                                  ? persona.annualIncome.toLocaleString()
                                  : persona.annualIncome,
                            situation: persona.details.financialSituation,
                          })}
                    </p>
                  </div>
                )}
              {shouldShowField('keyPriorities') &&
                persona.details.keyPriorities &&
                persona.details.keyPriorities.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.keyPriorities')}
                    </p>
                    <ul className="ml-5 list-disc text-gray-500">
                      {persona.details.keyPriorities.map((priority, index) => (
                        <li key={index}>{priority}</li>
                      ))}
                    </ul>
                  </div>
                )}
              {!persona.isCustom &&
                shouldShowField('productKnowledge') &&
                persona.details.productKnowledge && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('roleplay.fields.productKnowledge')}
                    </p>
                    <p className="text-gray-500">
                      {shouldShowField('productKnowledge')
                        ? persona.details.productKnowledge
                        : '-'}
                    </p>
                  </div>
                )}
              {shouldShowField('workHistory') &&
                persona.details.workHistory && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('practice.clientDetails.workHistory')}
                    </p>
                    <p className="text-gray-500">
                      {shouldShowField('workHistory')
                        ? persona.details.workHistory
                        : '-'}
                    </p>
                  </div>
                )}
              {shouldShowField('liquidityNeeds') &&
                persona.details.liquidityNeeds && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('practice.clientDetails.liquidityNeeds')}
                    </p>
                    <p className="text-gray-500">
                      {shouldShowField('liquidityNeeds')
                        ? persona.details.liquidityNeeds
                        : '-'}
                    </p>
                  </div>
                )}
              {shouldShowField('companySizeAndSpend') &&
                persona.details.companySizeAndSpend && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {t('practice.clientDetails.companySizeAndSpend')}
                    </p>
                    <p className="text-gray-500">
                      {shouldShowField('companySizeAndSpend')
                        ? persona.details.companySizeAndSpend
                        : '-'}
                    </p>
                  </div>
                )}
            </div>
          )}
        </TabPanel>
        <TabPanel>
          <div className="mt-3 mb-8 flex flex-col gap-6 text-sm">
            {shouldShowPersonalityField('persona') && (
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {t('practice.clientDetails.personality')}
                </p>
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => (
                      <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm text-gray-700">{children}</li>
                    ),
                  }}
                >
                  {persona.personalityDetails?.persona.replace(/^.*? - /, '')}
                </ReactMarkdown>
              </div>
            )}
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {t('roleplay.fields.communicationStyle')}
                </p>
                {shouldShowPersonalityField('communicationStyle') ? (
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {persona.personalityDetails?.communicationStyle.map(
                      (item, idx) => (
                        <li className="text-sm text-gray-700" key={idx}>
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">-</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {t('roleplay.fields.decisionMaking')}
                </p>
                {shouldShowPersonalityField('decisionMaking') ? (
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {persona.personalityDetails?.decisionMaking.map(
                      (item, idx) => (
                        <li className="text-sm text-gray-700" key={idx}>
                          {item}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">-</p>
                )}
              </div>
              {persona.bblFinancialProfile?.profileData?.discPersonality && (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {t('roleplay.fields.discPersonality')}
                  </p>
                  <p className="text-gray-500">
                    {persona.bblFinancialProfile.profileData.discPersonality ||
                      '-'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
