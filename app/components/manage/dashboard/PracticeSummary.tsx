import { Fragment, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '~/util/api';
import type { DashboardSummary } from '~/util/api';

interface PracticeSummaryProps {
  practiceSummary: DashboardSummary['practiceSummary'];
  practiceDetails: any[];
}

export default function PracticeSummary({
  practiceSummary,
  practiceDetails,
}: PracticeSummaryProps) {
  console.log('---practiceSummary', practiceSummary);
  console.log('---practiceDetails', practiceDetails);
  const { t } = useTranslation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t('manage.dashboard.practiceSummary.title')}
      </h2>
      <div className="flex items-start gap-4">
        <div className="grid min-w-[200px] grid-cols-1 divide-y divide-gray-200">
          <div className="pb-4">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm text-gray-600">
                {t('manage.dashboard.practiceSummary.totalCompleted')}
              </p>
              <RadixTooltip.Provider delayDuration={300}>
                <RadixTooltip.Root>
                  <RadixTooltip.Trigger asChild>
                    <div className="cursor-help">
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </RadixTooltip.Trigger>
                  <RadixTooltip.Portal>
                    <RadixTooltip.Content
                      className="max-w-[300px] rounded-md border border-gray-200 bg-white p-3 text-xs shadow-md"
                      sideOffset={5}
                      side="bottom"
                      align="start"
                    >
                      <p className="text-sm leading-normal text-gray-600">
                        {t(
                          'manage.dashboard.practiceSummary.totalCompletedTooltip',
                        )}
                      </p>
                      <RadixTooltip.Arrow className="fill-white" />
                    </RadixTooltip.Content>
                  </RadixTooltip.Portal>
                </RadixTooltip.Root>
              </RadixTooltip.Provider>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {practiceSummary.finishedPractices}
            </p>
          </div>
          <div className="py-4">
            <p className="mb-1 text-sm text-gray-600">
              {t('manage.dashboard.practiceSummary.avgDuration')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatDuration(practiceSummary.averageDurationSeconds || 0)}
            </p>
          </div>
          <div className="pt-4">
            <p className="mb-1 text-sm text-gray-600">
              {t('manage.dashboard.practiceSummary.overallAvgScore')}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xl font-bold text-gray-900">
                {practiceSummary.overallAverageScore ?? '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[400px] flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="rounded-l-lg"></th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.practiceTable.type')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.practiceTable.total')}
                </th>
                <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.practiceTable.avgScore')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {practiceDetails.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="text-gray-500">
                      <div className="text-sm">
                        {t('manage.common.noPracticeData')}
                      </div>
                      <div className="mt-1 text-xs">
                        {t('manage.common.noPracticeDataHint')}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                practiceDetails.map((practice: any, index: number) => {
                  const isExpanded = expandedRows.has(index);
                  return (
                    <Fragment key={index}>
                      <tr
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleRow(index)}
                      >
                        <td className="w-6 py-3 pr-0 pl-6 align-top">
                          <ChevronDown
                            className={`mt-1 size-4 shrink-0 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-pre-line">
                          <div className="font-medium text-gray-900">
                            {practice.type}
                          </div>
                          {practice.productName && (
                            <div className="text-gray-500">
                              {practice.productName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                          {practice.totalPractices}
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                          {practice.averageScore ?? '-'}
                        </td>
                      </tr>
                      {isExpanded &&
                        practice.breakdown.map(
                          (item: any, itemIndex: number) => (
                            <tr
                              key={`${index}-${itemIndex}`}
                              className="bg-gray-50 hover:bg-gray-100"
                            >
                              <td></td>
                              <td className="px-6 py-3 text-sm whitespace-pre-line text-gray-900">
                                <div className="flex items-center">
                                  {item.level === 'N/A' && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span>{item.grade}</span>
                                        <RadixTooltip.Provider
                                          delayDuration={300}
                                        >
                                          <RadixTooltip.Root>
                                            <RadixTooltip.Trigger asChild>
                                              <div className="cursor-help">
                                                <Info className="h-4 w-4 text-gray-400" />
                                              </div>
                                            </RadixTooltip.Trigger>
                                            <RadixTooltip.Portal>
                                              <RadixTooltip.Content
                                                className="max-w-[300px] rounded-md border border-gray-200 bg-white p-3 text-xs shadow-md"
                                                sideOffset={5}
                                                side="bottom"
                                                align="start"
                                              >
                                                <p className="text-sm leading-normal text-gray-600">
                                                  {t(
                                                    'manage.common.notAwardedTooltip',
                                                  )}
                                                </p>
                                                <RadixTooltip.Arrow className="fill-white" />
                                              </RadixTooltip.Content>
                                            </RadixTooltip.Portal>
                                          </RadixTooltip.Root>
                                        </RadixTooltip.Provider>
                                      </div>
                                    </>
                                  )}
                                  {item.level !== 'N/A' && (
                                    <>
                                      {item.level}:
                                      <span
                                        className="ml-2 rounded-xl px-2 py-0.5 text-xs font-medium"
                                        style={{
                                          backgroundColor: item.backgroundColor,
                                          color: item.textColor,
                                        }}
                                      >
                                        {item.grade}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {item.totalPractices}
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {item.averageScore ?? '-'}
                              </td>
                            </tr>
                          ),
                        )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
