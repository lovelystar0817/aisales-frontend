import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';

import type { StandingConfiguration } from '~/types/standings';
import { getBadgeIcon, type ScoringType } from '~/util/standingsBadge';
import { cn } from '~/util/utils';

interface StandingsLadderProps {
  configuration: StandingConfiguration | null;
}

export const StandingsLadder: React.FC<StandingsLadderProps> = ({
  configuration,
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Legacy fallback tiers (used when no configuration is available)
  const legacyStandings = [
    {
      name: t('practice.standings.salesNovice', 'Sales Novice'),
      icon: '/icons/newbie-sales-badge.png',
    },
    {
      name: t('practice.standings.skilledAdvisor', 'Skilled Advisor'),
      icon: '/icons/intermediate-sales-badge.png',
    },
    {
      name: t('practice.standings.strategicConsultant', 'Strategic Consultant'),
      icon: '/icons/expert-sales-badge.png',
    },
  ];

  let currentCriteriaIndex = 1;
  let mobileCurrentCriteriaIndex = 1;

  return (
    <div className="mb-8">
      {/* Header */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t('practice.standings.standingsLadder', 'Standings Ladder')}
      </h2>
      <p className="mb-2 text-sm text-gray-600">
        {t(
          'practice.standings.ladderDescription',
          'Unlock higher standings by meeting the specific criteria for each level, with your standing evaluated separately for each scenario. Achieve these milestones to advance and demonstrate your growing expertise.',
        )}
      </p>
      <p className="mb-6 text-sm font-medium text-gray-900">
        {t(
          'practice.standings.mandatoryNote',
          'Important: All mandatory criteria must be completed to receive a standing.',
        )}
      </p>

      {/* Dynamic configuration-based ladder */}
      {configuration ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              {(configuration.type === 'score-based' ||
                configuration.type === 'manulife-score-based') &&
              configuration.sharedCriteria ? (
                /* Score-based (shared criteria for all tiers) */
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="w-1/3 px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('practice.standings.standing', 'Standing')}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('practice.standings.criteria', 'Criteria')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      {/* Left column – all tiers with badges */}
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-6">
                          {configuration.tiers.map((tier, index) => (
                            <div
                              key={tier.name}
                              className="flex items-center gap-3"
                            >
                              {getBadgeIcon(
                                index + 1,
                                configuration?.type || 'tier-based',
                                'h-8 w-8',
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {tier.name}
                                </div>
                                {tier.scoreRange && (
                                  <div className="text-sm text-gray-500">
                                    {tier.scoreRange}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Right column – shared criteria */}
                      <td className="px-6 py-4">
                        <div className="space-y-4">
                          {configuration.sharedCriteria.map(
                            (criterion, idx) => {
                              const startingIndex = currentCriteriaIndex;
                              currentCriteriaIndex +=
                                criterion?.details?.length ?? 0;

                              return (
                                <CriterionBlock
                                  key={idx}
                                  criterion={criterion}
                                  type={configuration.type}
                                  startingIndex={startingIndex}
                                />
                              );
                            },
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Tier-based (each tier has its own criteria) */
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="w-1/3 px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('practice.standings.standing', 'Standing')}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                      >
                        {t('practice.standings.criteria', 'Criteria')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {configuration.tiers.map((tier, index) => (
                      <tr key={tier.name}>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-3">
                            {getBadgeIcon(
                              index + 1,
                              configuration?.type || 'tier-based',
                              'h-8 w-8',
                            )}
                            <span className="font-medium text-gray-900">
                              {tier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-4">
                            {tier.criteria.map((criterion, idx) => (
                              <CriterionBlock key={idx} criterion={criterion} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Mobile view */}
          <div className="md:hidden">
            {(configuration.type === 'score-based' ||
              configuration.type === 'manulife-score-based') &&
            configuration.sharedCriteria ? (
              /* Score-based mobile */
              <div className="rounded-xl border border-gray-200 bg-white">
                {/* Badges */}
                <div className="border-b border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    {t('practice.standings.standings', 'Standings')}
                  </h3>
                  <div className="space-y-3">
                    {configuration.tiers.map((tier, index) => (
                      <div key={tier.name} className="flex items-center gap-3">
                        {getBadgeIcon(
                          index + 1,
                          configuration?.type || 'tier-based',
                          'h-6 w-6',
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tier.name}
                          </div>
                          {tier.scoreRange && (
                            <div className="text-xs text-gray-500">
                              {tier.scoreRange}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared criteria */}
                <div className="p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    {t('practice.standings.criteria', 'Criteria')}
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    {configuration.sharedCriteria.map((criterion, idx) => {
                      const startingIndex = mobileCurrentCriteriaIndex;
                      mobileCurrentCriteriaIndex +=
                        criterion?.details?.length ?? 0;

                      return (
                        <CriterionBlock
                          key={idx}
                          criterion={criterion}
                          type={configuration.type}
                          startingIndex={startingIndex}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Tier-based mobile */
              <Tab.Group
                selectedIndex={selectedIndex}
                onChange={setSelectedIndex}
              >
                <Tab.List className="no-scrollbar flex space-x-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
                  {configuration.tiers.map((tier, index) => (
                    <Tab
                      key={tier.name}
                      className={({ selected }) =>
                        `focus:ring-opacity-60 flex flex-shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm leading-5 font-medium whitespace-nowrap focus:ring-2 focus:ring-white focus:outline-none ${
                          selected
                            ? 'bg-white shadow'
                            : 'text-gray-700 hover:bg-white/[0.6]'
                        }`
                      }
                    >
                      {getBadgeIcon(
                        index + 1,
                        configuration?.type || 'tier-based',
                        'h-5 w-5',
                      )}
                      {tier.name}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                  {configuration.tiers.map((tier) => (
                    <Tab.Panel
                      key={tier.name}
                      className="rounded-xl bg-white p-3 focus:outline-none"
                    >
                      <div className="space-y-3 text-base text-gray-700">
                        {tier.criteria.map((criterion, idx) => (
                          <CriterionBlock key={idx} criterion={criterion} />
                        ))}
                      </div>
                    </Tab.Panel>
                  ))}
                </Tab.Panels>
              </Tab.Group>
            )}
          </div>
        </>
      ) : (
        /* Legacy hard-coded ladder (no configuration) */
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <LegacyLadderDesktop standings={legacyStandings} t={t} />
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <LegacyLadderMobile standings={legacyStandings} t={t} />
          </div>
        </>
      )}
    </div>
  );
};

// Helper components

interface CriterionBlockProps {
  criterion: any;
  type?: ScoringType;
  startingIndex?: number;
}

/** Render a single criterion (title, description, details, sub-criteria…). */
const CriterionBlock: React.FC<CriterionBlockProps> = ({
  criterion,
  type,
  startingIndex,
}) => (
  <div>
    <p className="font-medium">
      {criterion.title}
      {criterion.scoreRange && (
        <span className="ml-1 text-gray-500">{criterion.scoreRange}</span>
      )}
    </p>
    {criterion.description && (
      <p className="mt-1 text-sm text-gray-600">{criterion.description}</p>
    )}

    {type === 'manulife-score-based' &&
    criterion.details &&
    criterion.details.length > 1 ? (
      <ol
        className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600"
        start={startingIndex}
      >
        {criterion.details.map((detail: string, idx: number) => (
          <li key={idx}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                ol: ({ children }) => (
                  <ol className="mt-1 list-decimal space-y-1 pl-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {detail}
            </ReactMarkdown>
          </li>
        ))}
      </ol>
    ) : criterion.details && criterion.details.length > 1 ? (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
        {criterion.details.map((detail: string, idx: number) => (
          <li key={idx}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                ul: ({ children }) => (
                  <ul className="mt-1 list-disc space-y-1 pl-4">{children}</ul>
                ),
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {detail}
            </ReactMarkdown>
          </li>
        ))}
      </ul>
    ) : null}

    {criterion.details && criterion.details.length === 1 && (
      <div className="mt-2 text-sm text-gray-600">
        <ReactMarkdown
          components={{
            p: ({ children }) => <span>{children}</span>,
            ul: ({ children }) => (
              <ul className="mt-1 list-disc space-y-1 pl-4">{children}</ul>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
          }}
        >
          {criterion.details[0]}
        </ReactMarkdown>
      </div>
    )}

    {criterion.subCriteria && (
      <ul
        className={cn(
          'mt-4 space-y-2 text-sm text-gray-600',
          criterion.details && criterion.details.length > 1 && 'pl-5',
        )}
      >
        {criterion.subCriteria.map((sub: any, idx: number) => (
          <li key={idx} className="mb-4">
            <strong>{sub.title}</strong> {sub.description}
            {sub.items && (
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {sub.items.map((item: string, itemIdx: number) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

interface LegacyProps {
  standings: { name: string; icon: string }[];
  t: any;
}

const LegacyLadderDesktop: React.FC<LegacyProps> = ({ standings, t }) => (
  <div className="overflow-hidden rounded-lg border border-gray-200">
    {/* Markup kept identical to original for safety */}
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="w-1/3 px-6 py-3 text-left text-sm font-semibold text-gray-900"
          >
            {t('practice.standings.standing', 'Standing')}
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
          >
            {t('practice.standings.criteria', 'Criteria')}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        <tr>
          <td className="px-6 py-4 align-top">…</td>
          <td className="px-6 py-4">…</td>
        </tr>
      </tbody>
    </table>
  </div>
);

const LegacyLadderMobile: React.FC<LegacyProps> = ({ standings, t }) => (
  <Tab.Group>
    <Tab.List className="no-scrollbar flex space-x-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
      {standings.map((standing) => (
        <Tab
          key={standing.name}
          className={({ selected }) =>
            `focus:ring-opacity-60 flex flex-shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm leading-5 font-medium whitespace-nowrap focus:ring-2 focus:ring-white focus:outline-none ${
              selected
                ? 'bg-white shadow'
                : 'text-gray-700 hover:bg-white/[0.6]'
            }`
          }
        >
          <img
            src={standing.icon}
            className="h-5 w-5"
            alt={`${standing.name} badge`}
          />
          {standing.name}
        </Tab>
      ))}
    </Tab.List>
  </Tab.Group>
);
