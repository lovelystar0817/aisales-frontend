import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  manageCallAnalysisApi,
  type ManageCallAnalysisResponse,
  formatDate,
} from '~/util/api';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useDebounce } from '~/hooks/useDebounce';
import { MultiselectDropdown } from './settings/components/MultiselectDropdown';
import {
  SortDefaultIcon,
  SortDownIcon,
  SortUpIcon,
} from '../../../public/icons/icons';

type SortBy = 'createdAt' | 'overallScore';
type SortOrder = 'asc' | 'desc';

const formatDuration = (seconds: number | null) => {
  if (seconds == null) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PRODUCT_DISPLAY: Record<string, string> = {
  traveleasy: 'TravelEasy',
  parecoveryplus: 'PARecovery Plus',
  dentiplus: 'DentiPlus',
};

export function meta() {
  return [{ title: 'Hupo Sales AI | Call Analysis' }];
}

export default withAuthenticationRequired(function CallAnalysisPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string[] | undefined>(
    undefined,
  );
  const [callTypeFilter, setCallTypeFilter] = useState<string[] | undefined>(
    undefined,
  );
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: SortBy) => {
    const iconClass = 'h-4 w-4 text-gray-400';
    if (sortBy !== column) {
      return <SortDefaultIcon className={iconClass} />;
    }
    return sortOrder === 'desc' ? (
      <SortDownIcon className={iconClass} />
    ) : (
      <SortUpIcon className={iconClass} />
    );
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, productFilter, callTypeFilter]);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ManageCallAnalysisResponse>({
    queryKey: [
      'manage-call-analysis',
      currentPage,
      rowsPerPage,
      debouncedSearchTerm,
      productFilter,
      callTypeFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () => {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: rowsPerPage,
        status: 'completed',
        sortBy,
        sortOrder,
      };

      if (debouncedSearchTerm?.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (productFilter) {
        params.product = productFilter.join(',');
      }
      if (callTypeFilter) {
        params.callType = callTypeFilter.join(',');
      }

      return manageCallAnalysisApi.getAnalyses(params);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Failed to load call analyses</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600">No data available</div>
      </div>
    );
  }

  const { analyses, pagination } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('manage.callAnalysis.title', 'Call Analysis')}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-4">
          <MultiselectDropdown
            options={[
              { id: 'telesales', name: 'Telesales' },
            ]}
            selectedValues={callTypeFilter}
            onChange={setCallTypeFilter}
            placeholder="All call types"
            allOptionLabel="All call types"
            minWidth="min-w-40"
          />

          <MultiselectDropdown
            options={[
              { id: 'traveleasy', name: 'TravelEasy' },
              { id: 'parecoveryplus', name: 'PARecovery Plus' },
              { id: 'dentiplus', name: 'DentiPlus' },
            ]}
            selectedValues={productFilter}
            onChange={setProductFilter}
            placeholder="All products"
            allOptionLabel="All products"
            minWidth="min-w-40"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t(
              'manage.callAnalysis.searchPlaceholder',
              'Search by file name or uploader...',
            )}
            className="w-64 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="w-[12%] cursor-pointer rounded-l-lg px-6 py-3 text-left text-sm font-medium text-gray-900 select-none"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  {t('manage.callAnalysis.analyzedOn', 'Analyzed on')}
                  {renderSortIcon('createdAt')}
                </div>
              </th>
              <th className="w-[14%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.callAnalysis.productType', 'Product & call type')}
              </th>
              <th className="w-[24%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.callAnalysis.file', 'File')}
              </th>
              <th className="w-[10%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.callAnalysis.duration', 'Duration')}
              </th>
              <th
                className="w-[10%] cursor-pointer px-6 py-3 text-left text-sm font-medium text-gray-900 select-none"
                onClick={() => handleSort('overallScore')}
              >
                <div className="flex items-center gap-1">
                  {t('manage.callAnalysis.score', 'Score')}
                  {renderSortIcon('overallScore')}
                </div>
              </th>
              <th className="w-[18%] px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.callAnalysis.uploadedBy', 'Uploaded by')}
              </th>
              <th className="w-[12%] rounded-r-lg px-6 py-3 text-left text-sm font-medium text-gray-900">
                {t('manage.callAnalysis.action', 'Action')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {analyses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {t(
                      'manage.callAnalysis.noResults',
                      'No call analysis found',
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {t(
                      'manage.callAnalysis.noResultsHint',
                      'Try adjusting your search or filters to see more results.',
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              analyses.map((analysis) => (
                <tr
                  key={analysis.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                    {formatDate(analysis.analyzedOn)}
                  </td>
                  <td className="px-6 py-4 align-top text-sm whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {PRODUCT_DISPLAY[analysis.product] || analysis.product}
                    </div>
                    <div className="text-gray-500">Telesales</div>
                  </td>
                  <td
                    className="max-w-[200px] truncate px-6 py-4 align-top text-sm text-gray-900"
                    title={analysis.fileName}
                  >
                    {analysis.fileName || '-'}
                  </td>
                  <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                    {formatDuration(analysis.duration)}
                  </td>
                  <td className="px-6 py-4 align-top text-sm whitespace-nowrap text-gray-900">
                    {analysis.score !== null && analysis.score !== undefined
                      ? `${analysis.score}%`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {analysis.uploadedBy?.name || '-'}
                      </div>
                      {analysis.uploadedBy?.email && (
                        <div className="text-sm text-gray-500">
                          {analysis.uploadedBy.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm whitespace-nowrap">
                    <Link
                      to={`/manage/call-analysis/${analysis.id}`}
                      className="inline-block rounded-full border border-gray-300 px-4 py-1.5 text-center text-sm text-gray-600 hover:text-gray-800 hover:underline"
                    >
                      {t('manage.callAnalysis.view', 'View')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            {t('manage.pagination.rowsPerPage')}
          </span>
          <select
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-700">
            {t('manage.pagination.showing', {
              from: (pagination.currentPage - 1) * pagination.limit + 1,
              to: Math.min(
                pagination.currentPage * pagination.limit,
                pagination.total,
              ),
              total: pagination.total,
            })}
          </span>
        </div>

        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-x-2">
            <span className="text-sm text-gray-700">
              {t('manage.pagination.page')}
            </span>
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
            >
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">
              {t('manage.pagination.of', { totalPages: pagination.totalPages })}
            </span>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() =>
                setCurrentPage(Math.max(1, pagination.currentPage - 1))
              }
              disabled={!pagination.hasPrevPage}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentPage(
                  Math.min(pagination.totalPages, pagination.currentPage + 1),
                )
              }
              disabled={!pagination.hasNextPage}
              className="rounded p-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, withManageAuthenticationRequiredOptions);
