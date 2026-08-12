import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import SurveyDonut from '../../SurveyDonut';
import type { SurveyResponse } from '~/util/api';

interface PostPracticeSurveyProps {
  surveyData?: SurveyResponse;
  isLoading: boolean;
  error?: Error | null;
  surveyPage: number;
  onPageChange: (page: number) => void;
}

export default function PostPracticeSurvey({
  surveyData,
  isLoading,
  error,
  surveyPage,
  onPageChange,
}: PostPracticeSurveyProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('manage.dashboard.postPracticeSurvey.title')}
        </h2>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('manage.dashboard.postPracticeSurvey.title')}
        </h2>
        <div className="text-sm text-red-600">{t('common.unexpectedError')}</div>
      </div>
    );
  }

  if (!surveyData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('manage.dashboard.postPracticeSurvey.title')}
        </h2>
        <div className="text-sm text-gray-500">{t('manage.dashboard.noData')}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t('manage.dashboard.postPracticeSurvey.title')}
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[450px_1fr]">
        {/* Chart + legend */}
        <div>
          <p className="text-gray-900 text-sm mb-6">
            {surveyData.question || t('manage.dashboard.postPracticeSurvey.question')}
          </p>
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <SurveyDonut
                yesPercent={surveyData.summary.yesPercent}
                totalResponses={surveyData.summary.total}
                emptyText={t('manage.dashboard.postPracticeSurvey.empty')}
              />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 rounded-full" style={{ backgroundColor: '#1C7AEB' }}></div>
                  <div className="text-sm text-gray-900 font-medium">{t('manage.dashboard.postPracticeSurvey.yes')}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {surveyData.summary.yesPercent}% <span className="text-sm font-normal text-gray-500">({surveyData.summary.yes} responses)</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
                  <div className="text-sm text-gray-900 font-medium">{t('manage.dashboard.postPracticeSurvey.no')}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {surveyData.summary.noPercent}% <span className="text-sm font-normal text-gray-500">({surveyData.summary.no} responses)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 flex flex-col">
          <div className="overflow-y-auto" style={{ height: 320 }}>
            <table className="w-full table-fixed">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="w-[25%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                    {t('manage.dashboard.postPracticeSurvey.user')}
                  </th>
                  <th className="w-[10%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                    {t('manage.dashboard.postPracticeSurvey.answer')}
                  </th>
                  <th className="w-[40%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                    {t('manage.dashboard.postPracticeSurvey.reason')}
                  </th>
                  <th className="w-[25%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                    {t('manage.dashboard.postPracticeSurvey.dateSubmitted')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {surveyData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center" style={{ height: 280 }}>
                      <div className="text-base font-medium text-gray-900">
                        {t('manage.dashboard.postPracticeSurvey.empty')}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {t('manage.dashboard.postPracticeSurvey.emptyHint')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  surveyData.entries.map((e, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-3 text-sm text-gray-900 align-top break-words">{e.user}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 align-top">{e.answer}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 align-top break-words">{e.reason}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 align-top">
                        {dayjs(e.createdAt).format('D MMM YYYY, HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            {(() => {
              const from = (surveyData.pagination.currentPage - 1) * surveyData.pagination.limit + 1;
              const to = Math.min(
                surveyData.pagination.currentPage * surveyData.pagination.limit,
                surveyData.pagination.total,
              );
              return (
                <div className="text-sm text-gray-600">
                  {t('manage.dashboard.postPracticeSurvey.showing', { from, to, total: surveyData.pagination.total })}
                </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <select
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  value={surveyData.pagination.currentPage}
                  onChange={(e) => onPageChange(Number(e.target.value))}
                >
                  {Array.from({ length: surveyData.pagination.totalPages || 1 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span>
                  {t('manage.dashboard.postPracticeSurvey.ofPage', { totalPages: surveyData.pagination.totalPages || 1 })}
                </span>
              </div>
              <button
                className="rounded-md border px-2 py-1 text-gray-600 disabled:opacity-50"
                onClick={() => onPageChange(Math.max(1, surveyPage - 1))}
                disabled={!surveyData.pagination.hasPrevPage}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                className="rounded-md border px-2 py-1 text-gray-600 disabled:opacity-50"
                onClick={() => onPageChange(Math.min(surveyData.pagination.totalPages || 1, surveyPage + 1))}
                disabled={!surveyData.pagination.hasNextPage}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
