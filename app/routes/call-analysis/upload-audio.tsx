import { useState, useRef, useEffect, useMemo } from 'react';
import type { DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import {
  enUS,
  id as idLocale,
  ms as msLocale,
  th as thLocale,
  vi as viLocale,
} from 'date-fns/locale';
import { apiProtected } from '~/util/api';
import { toast } from 'react-hot-toast';
import type { CallAnalysisStatus, CallAnalysisProduct } from './types';
import {
  SortDefaultIcon,
  SortDownIcon,
  SortUpIcon,
} from '../../../public/icons/icons';

interface CallAnalysisListItem {
  id: string;
  status: string;
  audioFileName: string;
  createdAt: string;
  completedAt?: string;
}

const DATE_LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  id: idLocale,
  ms: msLocale,
  th: thLocale,
  tl: enUS,
  vi: viLocale,
};

type SortColumn = 'analyzedOn' | 'file' | 'duration' | 'score';
type SortDirection = 'asc' | 'desc' | null;

interface CallAnalysisState {
  searchQuery: string;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
}

const SESSION_STORAGE_KEY = 'callAnalysisState';

// Product options for the dropdown
const PRODUCT_OPTIONS: { value: CallAnalysisProduct | ''; label: string }[] = [
  { value: '', label: 'TravelEasy' },
  { value: 'parecoveryplus', label: 'PARecovery Plus' },
  { value: 'dentiplus', label: 'DentiPlus' },
];

const saveStateToSessionStorage = (state: CallAnalysisState) => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to session storage:', error);
  }
};

const loadStateFromSessionStorage = (): Partial<CallAnalysisState> => {
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Failed to load state from session storage:', error);
    return {};
  }
};

export default function CallAnalysis() {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analyses, setAnalyses] = useState<CallAnalysisStatus[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [pollingIntervals, setPollingIntervals] = useState<
    Map<string, NodeJS.Timeout>
  >(new Map());
  const [selectedProduct, setSelectedProduct] = useState<CallAnalysisProduct | ''>('');

  // Initialize state from session storage
  const savedState = loadStateFromSessionStorage();
  const [searchQuery, setSearchQuery] = useState<string>(
    savedState.searchQuery || '',
  );
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(
    savedState.searchQuery || '',
  );
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(
    savedState.sortColumn || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    savedState.sortDirection || null,
  );

  // Load existing analyses on mount
  useEffect(() => {
    loadAnalyses();
    return () => {
      // Clear all polling intervals on unmount
      pollingIntervals.forEach((interval) => clearInterval(interval));
    };
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Save state to session storage whenever relevant state changes
  useEffect(() => {
    const state: CallAnalysisState = {
      searchQuery,
      sortColumn,
      sortDirection,
    };
    saveStateToSessionStorage(state);
  }, [searchQuery, sortColumn, sortDirection]);

  const loadAnalyses = async () => {
    try {
      setIsLoadingAnalyses(true);
      const response = await apiProtected()
        .url('/call-analysis')
        .query({ limit: 100, offset: 0 })
        .get()
        .json<{ analyses: CallAnalysisListItem[]; total: number }>();

      // Load full details for each analysis
      const results = await Promise.allSettled(
        response.analyses.map((item) =>
          apiProtected()
            .url(`/call-analysis/${item.id}/status`)
            .get()
            .json<CallAnalysisStatus>(),
        ),
      );

      // Filter out failed requests and only keep successful ones
      const fullAnalyses = results
        .filter((result): result is PromiseFulfilledResult<CallAnalysisStatus> =>
          result.status === 'fulfilled'
        )
        .map((result) => result.value);

      // Log failed requests for debugging
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`Failed to load ${failedCount} analyses`);
      }

      setAnalyses(fullAnalyses);

      // Start polling for incomplete analyses
      fullAnalyses.forEach((analysis) => {
        if (analysis.status !== 'completed' && analysis.status !== 'failed') {
          startPolling(analysis.id);
        }
      });
    } catch (error) {
      console.error('Failed to load analyses:', error);
      toast.error(t('callAnalysis.upload.toasts.loadFailed'));
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  const dateLocale = useMemo(() => {
    const languageCode = i18n.language?.split('-')[0] ?? 'en';
    return DATE_LOCALE_MAP[languageCode] ?? enUS;
  }, [i18n.language]);

  const startPolling = (analysisId: string) => {
    // Clear existing interval if any
    const existingInterval = pollingIntervals.get(analysisId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const status = await apiProtected()
          .url(`/call-analysis/${analysisId}/status`)
          .get()
          .json<CallAnalysisStatus>();

        setAnalyses((prev) =>
          prev.map((a) => (a.id === analysisId ? status : a)),
        );

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setPollingIntervals((prev) => {
            const newMap = new Map(prev);
            newMap.delete(analysisId);
            return newMap;
          });

          if (status.status === 'completed') {
            toast.success(t('callAnalysis.upload.toasts.analysisComplete'));
          } else if (status.status === 'failed') {
            // Show a generic error message to avoid exposing raw backend errors
            toast.error(t('callAnalysis.upload.toasts.analysisFailed', {
              error: t('callAnalysis.upload.toasts.unknownError'),
            }));
            // Log the actual error for debugging
            if (status.error?.message) {
              console.error('Analysis failed:', status.error.message);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    setPollingIntervals((prev) => new Map(prev).set(analysisId, interval));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'audio/mp3' || file.type === 'audio/mpeg') {
        if (file.size <= 30 * 1024 * 1024) {
          // 30MB limit
          setSelectedFile(file);
        } else {
          toast.error(t('callAnalysis.upload.toasts.fileTooLarge'));
        }
      } else {
        toast.error(t('callAnalysis.upload.toasts.invalidFileType'));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size <= 30 * 1024 * 1024) {
        // 30MB limit
        setSelectedFile(file);
      } else {
        toast.error(t('callAnalysis.upload.toasts.fileTooLarge'));
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyzeCall = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('audio', selectedFile, selectedFile.name);

      // Append product if not TravelEasy (empty string = TravelEasy for backward compatibility)
      if (selectedProduct) {
        formData.append('product', selectedProduct);
      }

      // Upload file using multipart/form-data
      const response = await apiProtected()
        .url('/call-analysis/upload')
        .body(formData)
        .post()
        .json<{ id: string; status: string; product?: string }>();

      toast.success(t('callAnalysis.upload.toasts.analysisQueued'));

      // Clear selected file
      setSelectedFile(null);

      // Clear the file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Start polling for this analysis
      startPolling(response.id);

      // Reload analyses to include the new one
      await loadAnalyses();
    } catch (error: any) {
      console.error('Upload error:', error);
      // Show user-friendly error message, not raw backend validation errors
      toast.error(t('callAnalysis.upload.toasts.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (analysis: CallAnalysisStatus) => {
    // Calculate duration from transcript if available
    if (analysis.transcript && analysis.transcript.length > 0) {
      const lastSegment = analysis.transcript[analysis.transcript.length - 1];
      const seconds = lastSegment.timestamp;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return '-';
  };

  const getStatusDisplay = (status: string) => {
    return t(`callAnalysis.upload.statuses.${status}`, {
      defaultValue: status,
    });
  };

  // Filter and sort analyses based on search query and sort settings
  const filteredAndSortedAnalyses = useMemo(() => {
    // First filter based on search query
    let result = analyses;
    if (debouncedSearchQuery.trim()) {
      result = analyses.filter((analysis) => {
        const fileName =
          analysis.audioFileName || t('callAnalysis.upload.unknownFile');
        return fileName
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());
      });
    }

    // Then sort if sorting is applied
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortColumn) {
          case 'analyzedOn':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'file':
            aValue = (
              a.audioFileName || t('callAnalysis.upload.unknownFile')
            ).toLowerCase();
            bValue = (
              b.audioFileName || t('callAnalysis.upload.unknownFile')
            ).toLowerCase();
            break;
          case 'duration':
            // Calculate duration for sorting
            const getDurationSeconds = (analysis: CallAnalysisStatus) => {
              if (analysis.transcript && analysis.transcript.length > 0) {
                return analysis.transcript[analysis.transcript.length - 1]
                  .timestamp;
              }
              return 0;
            };
            aValue = getDurationSeconds(a);
            bValue = getDurationSeconds(b);
            break;
          case 'score':
            aValue = a.overallScore ?? 0;
            bValue = b.overallScore ?? 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [analyses, debouncedSearchQuery, sortColumn, sortDirection, t]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle through: unsorted -> desc -> asc -> unsorted
      if (sortDirection === null) {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      // New column, start with desc
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    const iconClass = 'ml-1 h-5 w-5 flex-shrink-0';
    if (sortColumn !== column || sortDirection === null) {
      return (
        <SortDefaultIcon className={iconClass} style={{ minWidth: '1rem' }} />
      );
    }
    return sortDirection === 'desc' ? (
      <SortDownIcon className={iconClass} style={{ minWidth: '1rem' }} />
    ) : (
      <SortUpIcon className={iconClass} style={{ minWidth: '1rem' }} />
    );
  };

  return (
    <div className="min-w-full">
      <header className="mb-6 border-b border-[#E0E0E0]">
        <div className="container mx-auto flex h-[24px] items-center px-4">
          <h1 className="mb-8 text-[16px] font-bold text-[#000000]">
            {t('callAnalysis.upload.pageTitle')}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-18">
        {/* Upload Section */}
        <div className="mb-6">
          {/* Call Type and Product Dropdowns - Side by Side */}
          <div className="mb-6 flex gap-6">
            {/* Call Type (Fixed to Telesales) */}
            <div className="w-64">
              <h2 className="mb-4 text-[14px] font-semibold text-gray-700">{t('callAnalysis.upload.callType')}</h2>
              <select
                disabled
                value="telesales"
                className="block w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-[14px] text-gray-500 cursor-not-allowed"
              >
                <option value="telesales">{t('callAnalysis.upload.telesales')}</option>
              </select>
            </div>

            {/* Product Dropdown */}
            <div className="w-64">
              <h2 className="mb-4 text-[14px] font-semibold text-gray-700">{t('callAnalysis.upload.product')}</h2>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value as CallAnalysisProduct | '')}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-gray-900 cursor-pointer hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {PRODUCT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="mb-4 text-[18px] font-bold">
            {t('callAnalysis.upload.uploadTitle')}
          </h2>

          <div
            className={clsx(
              'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
              selectedFile && 'border-green-400 bg-green-50',
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAEDEF]">
                <ArrowUpTrayIcon className="h-6 w-6 text-gray-600" />
              </div>
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-700">
                    {t('callAnalysis.upload.selectedFile', {
                      name: selectedFile.name,
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('callAnalysis.upload.selectedFileSize', {
                      size: (selectedFile.size / 1024 / 1024).toFixed(2),
                    })}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      // Clear the file input value to allow selecting the same file again
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-sm text-[#F15A29] transition-opacity hover:opacity-80"
                  >
                    {t('callAnalysis.upload.removeFile')}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[17px] font-bold text-gray-700">
                    {t('callAnalysis.upload.dropPrompt')}{' '}
                    <button
                      onClick={handleBrowseClick}
                      className="text-[#1C7AEB] transition-opacity hover:opacity-80"
                    >
                      {t('callAnalysis.upload.browse')}
                    </button>
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('callAnalysis.upload.uploadHint')}
                  </p>
                </>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/mpeg"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex justify-center">
            <button
              onClick={handleAnalyzeCall}
              disabled={!selectedFile || isUploading}
              className={clsx(
                'mt-6 min-w-[180px] rounded-full px-8 py-3 font-medium transition-colors',
                selectedFile && !isUploading
                  ? 'bg-[#F15A29] text-white hover:bg-[#E04D1E]'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400',
              )}
            >
              {isUploading
                ? t('callAnalysis.upload.uploading')
                : t('callAnalysis.upload.analyzeButton')}
            </button>
          </div>
        </div>

        {/* Past Analyses Table */}
        <div>
          <h2 className="mb-4 text-[18px] font-bold">
            {t('callAnalysis.upload.callsAnalyzedTitle')}
          </h2>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative w-[30%] min-w-[200px]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('callAnalysis.upload.searchPlaceholder')}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-10 pl-10 text-[14px] text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {isLoadingAnalyses ? (
            <div className="flex justify-center py-8">
              <span className="text-gray-500">
                {t('callAnalysis.upload.loading')}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="rounded-lg bg-[#F6F8F8]">
                  <tr>
                    <th className="rounded-l-lg px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <button
                        onClick={() => handleSort('analyzedOn')}
                        className="flex items-center text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 focus:outline-none"
                      >
                        {t('callAnalysis.upload.table.analyzedOn')}
                        {getSortIcon('analyzedOn')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      {t('callAnalysis.upload.table.callInfo')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <button
                        onClick={() => handleSort('file')}
                        className="flex items-center text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 focus:outline-none"
                      >
                        {t('callAnalysis.upload.table.file')}
                        {getSortIcon('file')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <button
                        onClick={() => handleSort('duration')}
                        className="flex items-center text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 focus:outline-none"
                      >
                        {t('callAnalysis.upload.table.duration')}
                        {getSortIcon('duration')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      <button
                        onClick={() => handleSort('score')}
                        className="flex items-center text-left text-xs font-medium tracking-wider text-gray-500 uppercase hover:text-gray-700 focus:outline-none"
                      >
                        {t('callAnalysis.upload.table.score')}
                        {getSortIcon('score')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      {t('callAnalysis.upload.table.status')}
                    </th>
                    <th className="sticky right-0 rounded-r-lg bg-[#F6F8F8] px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      {t('callAnalysis.upload.table.action')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAndSortedAnalyses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {analyses.length === 0 || !debouncedSearchQuery.trim()
                          ? t('callAnalysis.upload.emptyState')
                          : t('callAnalysis.upload.noSearchResults')}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedAnalyses.map((analysis) => {
                      const fileName =
                        analysis.audioFileName ||
                        t('callAnalysis.upload.unknownFile');

                      // Get product display name
                      const productDisplayName = analysis.product === 'parecoveryplus'
                        ? 'PARecovery Plus'
                        : analysis.product === 'dentiplus'
                          ? 'DentiPlus'
                          : 'TravelEasy';

                      return (
                        <tr key={analysis.id}>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                            {format(
                              new Date(analysis.createdAt),
                              'd MMM yyyy',
                              {
                                locale: dateLocale,
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium">{productDisplayName}</span>
                              <span className="text-gray-500">{t('callAnalysis.upload.telesales')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={fileName}>
                              {fileName}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-900">
                            {formatDuration(analysis)}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                            {(() => {
                              // For MSIG assessments, check if mandatory criteria failed
                              if (analysis.msigAssessment) {
                                // Check hasMandatoryFailures flag or calculate from sections
                                const hasFailedMandatory = analysis.msigAssessment.hasMandatoryFailures ||
                                  Object.values(analysis.msigAssessment.sections || {}).some(
                                    (section) =>
                                      !section.notApplicable &&
                                      section.evaluations?.some((e) => e.mandatory && !e.pass)
                                  );
                                if (hasFailedMandatory) {
                                  return '-';
                                }
                                return analysis.msigAssessment.overallScore ? `${analysis.msigAssessment.overallScore}%` : '-';
                              }
                              return analysis.overallScore != null ? `${analysis.overallScore}%` : '-';
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={clsx(
                                  'rounded-full px-3 py-1 text-xs font-medium',
                                  analysis.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : analysis.status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-[#E8F1FD] text-gray-800',
                                )}
                              >
                                {getStatusDisplay(analysis.status)}
                              </span>
                              {analysis.new &&
                                analysis.status === 'completed' && (
                                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-400">
                                    New
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="sticky right-0 bg-white px-6 py-4 text-sm whitespace-nowrap">
                            {analysis.status === 'completed' ? (
                              <Link
                                to={`/call-analysis/assessment/${analysis.id}${analysis.new ? '?new=1' : ''}`}
                                className="inline-block rounded-full border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                              >
                                {t('common.view')}
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="cursor-not-allowed rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-gray-400"
                              >
                                {t('common.view')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
