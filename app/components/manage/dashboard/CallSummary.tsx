import { Fragment, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CallAnalysisSummaryResponse } from '~/util/api';

const PRODUCT_DISPLAY: Record<string, string> = {
  traveleasy: 'TravelEasy',
  parecoveryplus: 'PARecovery Plus',
  dentiplus: 'DentiPlus',
};

interface CallSummaryProps {
  data: CallAnalysisSummaryResponse;
}

export default function CallSummary({ data }: CallSummaryProps) {
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
        {t('manage.dashboard.callSummary.title', 'Call summary')}
      </h2>
      <div className="flex items-start gap-4">
        <div className="grid min-w-[200px] grid-cols-1 divide-y divide-gray-200">
          <div className="pb-4">
            <p className="mb-1 text-sm text-gray-600">
              {t('manage.dashboard.callSummary.totalUploaded', 'Total calls uploaded')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {data.totals.totalUploaded}
            </p>
          </div>
          <div className="py-4">
            <p className="mb-1 text-sm text-gray-600">
              {t('manage.dashboard.callSummary.totalAnalysed', 'Total calls analysed')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {data.totals.totalAnalysed}
            </p>
          </div>
          <div className="pt-4">
            <p className="mb-1 text-sm text-gray-600">
              {t('manage.dashboard.callSummary.averageScore', 'Average score')}
            </p>
            <p className="text-xl font-bold text-gray-900">
              {data.totals.averageScore != null ? `${data.totals.averageScore}%` : '-'}
            </p>
          </div>
        </div>

        <div className="max-h-[400px] flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="rounded-l-lg"></th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.callSummary.type', 'Type')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.callSummary.totalCallsUploaded', 'Total calls uploaded')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.callSummary.totalCallsAnalysed', 'Total calls analysed')}
                </th>
                <th className="rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                  {t('manage.dashboard.callSummary.avgScore', 'Average score')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.byProduct.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-sm text-gray-500">
                      {t('manage.dashboard.callSummary.noData', 'No call analysis data yet')}
                    </div>
                  </td>
                </tr>
              ) : (
                data.byProduct.map((product, index) => {
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
                            Telesales
                          </div>
                          <div className="text-gray-500">
                            {PRODUCT_DISPLAY[product.product] || product.product}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                          {product.totalUploaded}
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                          {product.totalAnalysed}
                        </td>
                        <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                          {product.averageScore != null ? `${product.averageScore}%` : '-'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <>
                          {product.bands.map((band, bandIndex) => (
                            <tr
                              key={`${index}-${bandIndex}`}
                              className="bg-gray-50 hover:bg-gray-100"
                            >
                              <td></td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {band.level}:&nbsp;&nbsp;{band.label}
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                -
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {band.count}
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {band.averageScore != null ? `${band.averageScore}%` : '-'}
                              </td>
                            </tr>
                          ))}
                          {product.noResultCount != null && product.noResultCount > 0 && (
                            <tr className="bg-gray-50 hover:bg-gray-100">
                              <td></td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                <div className="group relative flex items-center gap-1.5">
                                  {t('manage.dashboard.callSummary.noResult', 'No result')}
                                  <Info className="size-4 text-gray-400" />
                                  <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-max max-w-sm whitespace-normal rounded-lg bg-white p-3 text-sm font-normal text-gray-600 shadow-lg ring-1 ring-gray-200 group-hover:block">
                                    {t(
                                      'manage.dashboard.callSummary.noResultTooltip',
                                      'Sessions where results are not awarded because mandatory criteria were not completed.',
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                -
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                {product.noResultCount}
                              </td>
                              <td className="px-6 py-3 text-sm whitespace-nowrap text-gray-900">
                                -
                              </td>
                            </tr>
                          )}
                        </>
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
