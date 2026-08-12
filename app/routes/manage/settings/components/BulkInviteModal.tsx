import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import {
  manageUsersApi,
  type BulkImport,
  type BulkImportsResponse,
  type BulkInvitePrecheckResponse,
} from '~/util/api';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

export function BulkInviteModal({ isOpen, onClose }: BulkInviteModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [backendError, setBackendError] = useState<string>('');
  const [precheckResult, setPrecheckResult] = useState<BulkInvitePrecheckResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const rowsPerPage = 5;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setValidationError('');
      setBackendError('');
      setPrecheckResult(null);
      setCurrentPage(1);
    }
  }, [isOpen]);

  const { data: importsData, refetch: refetchImports } = useQuery<BulkImportsResponse>({
    queryKey: ['bulk-invite-history', currentPage, rowsPerPage],
    queryFn: () =>
      manageUsersApi.getBulkInviteHistory({
        page: currentPage,
        limit: rowsPerPage,
      }),
    enabled: isOpen,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false,
    retry: false, // Don't retry on errors to avoid showing multiple error toasts
  });

  const precheckMutation = useMutation({
    mutationFn: async (file: File) => {
      return await manageUsersApi.precheckBulkInvite(file);
    },
    onSuccess: (data) => {
      setPrecheckResult(data);
      setBackendError('');
    },
    onError: (error: any) => {
      // Check if error has details array with "Invalid template" message
      if (error?.json?.details && Array.isArray(error.json.details)) {
        const hasInvalidTemplate = error.json.details.some((detail: string) =>
          detail.includes('Invalid template')
        );

        if (hasInvalidTemplate) {
          setBackendError(t('manage.settings.bulkInvite.wrongTemplate', 'Please use the right template'));
          setPrecheckResult(null);
          return;
        }
      }

      // Check if error is "too many rows"
      if (error?.json?.error && (error.json.error.includes('Too many rows') || error.json.error.includes('Maximum 1000 rows allowed'))) {
        setBackendError(t('manage.settings.bulkInvite.maxUsersExceeded', 'Max 1000 users only in one upload'));
        setPrecheckResult(null);
        return;
      }

      // Otherwise use the error message from response
      const errorMessage = error?.json?.error || error?.message || t('manage.settings.bulkInvite.precheckError', 'Failed to validate file');
      setBackendError(errorMessage);
      setPrecheckResult(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      return await manageUsersApi.importBulkInvite(file);
    },
    onSuccess: () => {
      setSelectedFile(null);
      setPrecheckResult(null);
      setBackendError('');
      queryClient.invalidateQueries({ queryKey: ['bulk-invite-history'] });
      queryClient.invalidateQueries({ queryKey: ['manage-users'] });
      refetchImports();
      toast.success(
        t(
          'manage.settings.bulkInvite.importSuccess',
          "We're importing your file. Results will appear here and we'll send a notification once done!",
        ),
      );
    },
    onError: (error: any) => {
      const errorMessage = error?.json?.error || error?.message || t('manage.settings.bulkInvite.importError', 'Failed to import file');
      setBackendError(errorMessage);
    },
  });

  const validateFile = (file: File): string => {
    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return t(
        'manage.settings.bulkInvite.invalidExtension',
        'Please upload an .xls or .xlsx file.',
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return t(
        'manage.settings.bulkInvite.fileTooLarge',
        'File size must be less than 3MB',
      );
    }

    return '';
  };

  const handleFileSelect = (file: File) => {
    setValidationError('');
    setBackendError('');
    setPrecheckResult(null);

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    // Auto-run precheck
    precheckMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPrecheckResult(null);
    setBackendError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    if (selectedFile && precheckResult?.success) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDownloadErrorReport = async (importId: string, fileName: string) => {
    try {
      const blob = await manageUsersApi.downloadErrorReport(importId);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename: error-report-{original-filename}-{timestamp}.xlsx
      const timestamp = new Date().toISOString().split('T')[0];
      const baseFileName = fileName.replace(/\.(xlsx?|xls)$/i, '');
      link.download = `error-report-${baseFileName}-${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        t('manage.settings.bulkInvite.downloadError', 'Failed to download error report')
      );
    }
  };

  const getStatusIcon = (status: BulkImport['status'], sentCount?: number) => {
    if (status === 'processing') {
      return (
        <div className="flex items-center gap-1 text-xs" style={{ color: '#58595A' }}>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-l-gray-300"></div>
          <span className="text-xs">{t('manage.settings.bulkInvite.processingFile', 'Processing your file')}</span>
        </div>
      );
    }

    if (status === 'completed') {
      return (
        <div className="flex items-center gap-1 text-xs">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <span style={{ color: '#58595A' }}>
            {t('manage.settings.bulkInvite.usersInvited', '{{count}} users invited', { count: sentCount || 0 })}
          </span>
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="flex items-center gap-1 text-xs">
          <XCircleIcon className="h-5 w-5 text-red-600" />
          <span style={{ color: '#58595A' }}>
            {t('manage.settings.bulkInvite.failed', 'Failed')}
          </span>
        </div>
      );
    }

    return null;
  };

  const isProcessing = precheckMutation.isPending || importMutation.isPending;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 py-3 px-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('manage.settings.bulkInvite.title', 'Import users')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Description */}
          <p className="text-sm text-gray-600">
            {t(
              'manage.settings.bulkInvite.description',
              'Invite multiple users at once by uploading an Excel file using the provided template.',
            )}{' '}
            <a
              href="/hupo-invite-20260210.xlsx"
              download
              className="text-blue-600 hover:underline"
            >
              {t('manage.settings.bulkInvite.downloadTemplate', 'Download template')}
            </a>
          </p>

          {/* File Upload Area */}
          <div
            className={clsx(
              'rounded-lg border-2 border-dashed p-8 text-center transition-colors bg-white',
              isDragging || backendError ? 'border-orange-500' : 'border-gray-300',
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!selectedFile && !isProcessing ? (
              <>
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  <ArrowUpTrayIcon className="h-4 w-4 text-gray-600" />
                </div>
                <p className="mt-2 text-sm text-gray-600 font-bold">
                  {t('manage.settings.bulkInvite.dropFile', 'Drop your file here or')}{' '}
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="text-blue-600 hover:underline"
                  >
                    {t('manage.settings.bulkInvite.browse', 'Browse')}
                  </button>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t(
                    'manage.settings.bulkInvite.uploadHint',
                    'Upload .xls, .xlsx (max. 1000 users in one upload)',
                  )}
                </p>
              </>
            ) : isProcessing ? (
              <>
                <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-300 border-t-orange-600"></div>
                <p className="mt-4 text-sm font-medium text-gray-900">
                  {selectedFile?.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {precheckMutation.isPending
                    ? t('manage.settings.bulkInvite.validating', 'Validating...')
                    : t('manage.settings.bulkInvite.importing', 'Importing...')}
                </p>
              </>
            ) : selectedFile ? (
              <>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#EAEDEF' }}>
                    <DocumentIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="mt-2 text-sm hover:underline"
                  style={{ color: '#E60D00' }}
                >
                  {t('manage.settings.bulkInvite.remove', 'Remove')}
                </button>
              </>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <p className="text-xs text-red-600 -mt-3">{validationError}</p>
          )}

          {/* Backend Error */}
          {backendError && (
            <p className="text-xs text-red-600 -mt-3">{backendError}</p>
          )}

          {/* Import Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleImportClick}
              disabled={!precheckResult || precheckResult.summary.validCount === 0 || isProcessing || !!backendError}
              className={clsx(
                "rounded-full px-10 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none",
                !precheckResult || precheckResult.summary.validCount === 0 || isProcessing || !!backendError
                  ? "cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              )}
              style={
                !precheckResult || precheckResult.summary.validCount === 0 || isProcessing || !!backendError
                  ? { backgroundColor: '#EAEDEF', color: '#ADB1B4' }
                  : {}
              }
            >
              {importMutation.isPending
                ? t('manage.settings.bulkInvite.importing', 'Importing...')
                : t('manage.settings.bulkInvite.importUsers', 'Import users')}
            </button>
          </div>

          {/* Recent Imports */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-gray-900">
              {t('manage.settings.bulkInvite.recentImports', 'Recent imports')}
            </h3>

            {importsData?.history && importsData.history.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border border-gray-300">
                  <table className="w-full border-collapse">
                    <tbody>
                      {importsData.history.map((importItem) => (
                        <tr key={importItem.id} className="border-b border-gray-200 last:border-b-0">
                          <td className="w-1/3 py-4 px-4 text-xs break-words align-top" style={{ color: '#58595A' }}>
                            {importItem.fileName}
                          </td>
                          <td className="w-1/3 py-4 px-4 text-xs align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getStatusIcon(importItem.status, importItem.sentCount)}
                                {importItem.status === 'completed' && (importItem.failedCount + importItem.invalidCount) > 0 && (
                                  <div className="flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                    <span className="text-xs" style={{ color: '#58595A' }}>
                                      {t('manage.settings.bulkInvite.failedCount',
                                        '{{failed}} failed',
                                        { failed: (importItem.failedCount + importItem.invalidCount) }
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {importItem.status === 'completed' && (importItem.failedCount + importItem.invalidCount) > 0 && (
                                <div>
                                  <button
                                    onClick={() => handleDownloadErrorReport(importItem.id, importItem.fileName)}
                                    className="text-blue-600 font-medium hover:underline"
                                  >
                                    {t('manage.settings.bulkInvite.downloadErrorReport', 'Download error report')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="w-1/3 py-4 px-4 text-xs break-words align-top" style={{ color: '#58595A' }}>
                            {t('manage.settings.bulkInvite.uploadedBy', 'Uploaded by {{name}}, {{date}}', {
                              name: importItem.uploadedBy,
                              date: new Date(importItem.uploadedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).replace(',', ', '),
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {t('manage.settings.bulkInvite.showing', 'Showing {{from}}-{{to}} of {{total}}', {
                      from: (importsData.pagination.currentPage - 1) * rowsPerPage + 1,
                      to: Math.min(
                        importsData.pagination.currentPage * rowsPerPage,
                        importsData.pagination.total,
                      ),
                      total: importsData.pagination.total,
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    <select
                      value={currentPage}
                      onChange={(e) => handlePageChange(Number(e.target.value))}
                      className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {Array.from({ length: importsData.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <option key={page} value={page}>
                          {page}
                        </option>
                      ))}
                    </select>

                    <span className="text-gray-700">
                      {t('manage.settings.bulkInvite.ofPage', 'of {{total}} page', {
                        total: importsData.pagination.totalPages,
                      })}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
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
                          handlePageChange(
                            Math.min(importsData.pagination.totalPages, currentPage + 1),
                          )
                        }
                        disabled={currentPage >= importsData.pagination.totalPages}
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
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">
                  {t(
                    'manage.settings.bulkInvite.noImports',
                    'No imports yet. Your recent imports will show up here.',
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
