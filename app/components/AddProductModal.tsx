import {
  CloseButton,
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useRef, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useUnsavedChanges } from '~/hooks/useUnsavedChanges';
import { DuplicateInfoBanner } from './DuplicateInfoBanner';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    files: File[];
    generateCompetitiveIntelligence: boolean;
    duplicateCompetitiveIntelligence: boolean;
    duplicateId?: string | null;
  }) => Promise<void>;
  initialData?: {
    name?: string;
    errorMessage?: string;
    files?: File[];
    generateCompetitiveIntelligence?: boolean;
    duplicateCompetitiveIntelligence?: boolean;
  };
  duplicateId?: string | null;
  hasCompetitiveIntelligence?: boolean;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

export function AddProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  duplicateId,
  hasCompetitiveIntelligence = false,
}: AddProductModalProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [files, setFiles] = useState<File[]>(initialData?.files || []);
  const [generateCompetitiveIntelligence, setGenerateCompetitiveIntelligence] =
    useState(initialData?.generateCompetitiveIntelligence || false);
  const [
    duplicateCompetitiveIntelligence,
    setDuplicateCompetitiveIntelligence,
  ] = useState(initialData?.duplicateCompetitiveIntelligence || false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    Array<{
      name: string;
      status: 'uploading' | 'success' | 'error';
      error?: string;
      progress?: number;
    }>
  >([]);
  const [uploadPhase, setUploadPhase] = useState<
    'idle' | 'preparing' | 'uploading' | 'processing' | 'complete'
  >('idle');
  const [error, setError] = useState<string | null>(
    initialData?.errorMessage || null,
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Block route navigation when there are unsaved changes
  const { DialogComponent } = useUnsavedChanges({
    when: shouldBlockNavigation && isOpen,
    entityType: 'product',
  });

  // Update state when modal opens with initialData
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '');
      setFiles(initialData.files || []);
      setGenerateCompetitiveIntelligence(
        initialData.generateCompetitiveIntelligence || false,
      );
      setDuplicateCompetitiveIntelligence(
        initialData.duplicateCompetitiveIntelligence || false,
      );
      setError(initialData.errorMessage || null);
    }
  }, [isOpen, initialData]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only .docx and .pdf files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 50MB.`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const filesArray = Array.from(newFiles);
      const validFiles: File[] = [];

      // Check total count
      if (files.length + filesArray.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      // Validate each file
      for (const file of filesArray) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        setError(null);
      }
    },
    [files.length],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFiles],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadPhase('preparing');

    // Initialize upload status for each file
    setUploadingFiles(
      files.map((file) => ({
        name: file.name,
        status: 'uploading',
        progress: 0,
      })),
    );

    try {
      // Phase 1: Preparing (getting presigned URLs)
      setUploadPhase('preparing');
      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief delay for UX

      // Phase 2: Uploading files
      setUploadPhase('uploading');

      const submitData = {
        name: name.trim() || '',
        files,
        generateCompetitiveIntelligence,
        duplicateCompetitiveIntelligence,
        duplicateId,
      };

      await onSubmit(submitData);

      // Phase 3: Processing
      setUploadPhase('processing');

      // Mark all as success
      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'success', progress: 100 })),
      );

      setUploadPhase('complete');
      setShouldBlockNavigation(false);

      // Reset form and close
      setTimeout(() => {
        resetAndClose();
      }, 800);
    } catch (err: any) {
      console.error('Upload error:', err);

      // Handle NAME_ALREADY_EXISTS error - check both possible error structures
      const errorData = err.json || err.response?.data || err;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        setNameError(
          errorData.error ||
            'A product with this name already exists. Please choose a different name.',
        );
        setUploadPhase('idle');
        setIsSubmitting(false);
        return;
      }

      const errorMessage =
        errorData?.error || err?.message || 'Failed to upload product';
      setError(errorMessage);

      // Mark all as error
      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', error: errorMessage })),
      );
      setUploadPhase('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = useCallback(() => {
    setName('');
    setFiles([]);
    setGenerateCompetitiveIntelligence(false);
    setDuplicateCompetitiveIntelligence(false);
    setError(null);
    setNameError(null);
    setUploadingFiles([]);
    setUploadPhase('idle');
    setShouldBlockNavigation(false);
    setShowUnsavedDialog(false);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;

    if (shouldBlockNavigation) {
      // Show the unsaved changes dialog
      setShowUnsavedDialog(true);
    } else {
      // No unsaved changes, close immediately
      resetAndClose();
    }
  }, [isSubmitting, shouldBlockNavigation, resetAndClose]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    setShouldBlockNavigation(false);
    // Close the modal
    setTimeout(() => {
      resetAndClose();
    }, 0);
  }, [resetAndClose]);

  const handleKeepEditing = useCallback(() => {
    setShowUnsavedDialog(false);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShouldBlockNavigation(true);
      setShowUnsavedDialog(false);
    }
  }, [isOpen]);

  return (
    <HeadlessDialog
      open={isOpen}
      as="div"
      className="relative z-[999] focus:outline-none"
      onClose={handleClose}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-2xl rounded-xl bg-white shadow-xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <DialogTitle as="h3" className="text-xl font-bold text-gray-900">
                Add product
              </DialogTitle>
              <CloseButton
                disabled={isSubmitting}
                className="disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </CloseButton>
            </div>

            {/* Body */}
            <div className="space-y-6 px-6 py-6">
              <DuplicateInfoBanner
                show={!!duplicateId}
                translationKey="manage.products.duplicateNotice"
                defaultMessage="Duplicated product is not affecting or linked to any roleplay yet."
                t={t}
              />
              {/* Product Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Product name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError(null);
                  }}
                  disabled={isSubmitting}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 ${
                    nameError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  }`}
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-600">{nameError}</p>
                )}
              </div>

              {/* Product Files */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Product files
                </label>

                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={isSubmitting ? undefined : handleBrowseClick}
                  className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-900">
                      Drop your product file here or{' '}
                      <span className="font-medium text-blue-600">Browse</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Upload .docx, .pdf (max 50 MB)
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Upload information related to the product. Max 5 files.
                </p>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileInputChange}
                  disabled={isSubmitting}
                  className="hidden"
                />

                {/* Files List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => {
                      const uploadStatus = uploadingFiles.find(
                        (f) => f.name === file.name,
                      );

                      return (
                        <div
                          key={`${file.name}-${index}`}
                          className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                            uploadStatus?.status === 'error'
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-1 items-center gap-2">
                            {uploadStatus?.status === 'uploading' && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            )}
                            <span
                              className={`text-sm ${
                                uploadStatus?.status === 'error'
                                  ? 'text-red-700'
                                  : 'text-gray-900'
                              }`}
                            >
                              {file.name}
                            </span>
                          </div>

                          {!isSubmitting && (
                            <button
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-red-600"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}

                          {uploadStatus?.status === 'uploading' && (
                            <ArrowPathIcon className="ml-2 h-4 w-4 animate-spin text-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Progress Indicator */}
                {uploadPhase !== 'idle' && uploadPhase !== 'complete' && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {uploadPhase === 'preparing' && 'Preparing upload...'}
                          {uploadPhase === 'uploading' &&
                            'Uploading files to cloud storage...'}
                          {uploadPhase === 'processing' &&
                            'Processing files...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Indicator */}
                {uploadPhase === 'complete' && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-green-700">
                        Upload successful!
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {uploadingFiles.some((f) => f.status === 'error') && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-red-700">
                        {uploadingFiles.find((f) => f.status === 'error')
                          ?.error || 'Failed to upload product'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Competitive Intelligence */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-900">
                  {t('roleplay.competitiveIntelligence.title')}
                </label>

                {duplicateId && hasCompetitiveIntelligence ? (
                  <>
                    {/* No competitive intelligence */}
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="competitiveIntelligence"
                        checked={
                          !generateCompetitiveIntelligence &&
                          !duplicateCompetitiveIntelligence
                        }
                        onChange={() => {
                          setGenerateCompetitiveIntelligence(false);
                          setDuplicateCompetitiveIntelligence(false);
                        }}
                        disabled={isSubmitting}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-900">
                        {t('roleplay.competitiveIntelligence.options.none')}
                      </span>
                    </label>

                    {/* Duplicate competitor summaries */}
                    <div className="flex flex-col gap-0.5">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="competitiveIntelligence"
                          checked={duplicateCompetitiveIntelligence}
                          onChange={() => {
                            setGenerateCompetitiveIntelligence(false);
                            setDuplicateCompetitiveIntelligence(true);
                          }}
                          disabled={isSubmitting}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-900">
                          {t(
                            'roleplay.competitiveIntelligence.options.duplicate',
                          )}
                        </span>
                      </label>
                      <div className="pl-6">
                        <p className="text-sm text-gray-600">
                          {t(
                            'roleplay.competitiveIntelligence.options.duplicateDescription',
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Generate competitor summaries */}
                    <div className="flex flex-col gap-0.5">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="competitiveIntelligence"
                          checked={generateCompetitiveIntelligence}
                          onChange={() => {
                            setGenerateCompetitiveIntelligence(true);
                            setDuplicateCompetitiveIntelligence(false);
                          }}
                          disabled={isSubmitting}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-900">
                          {t(
                            'roleplay.competitiveIntelligence.options.generate',
                          )}
                        </span>
                      </label>
                      <div className="pl-6">
                        <p className="text-sm text-gray-600">
                          {t(
                            'roleplay.competitiveIntelligence.options.generateDescription',
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Generate competitor summaries - checkbox for non-duplicate or no CI */}
                    <div className="flex flex-col gap-0.5">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={generateCompetitiveIntelligence}
                          onChange={(e) => {
                            setGenerateCompetitiveIntelligence(
                              e.target.checked,
                            );
                            setDuplicateCompetitiveIntelligence(false);
                          }}
                          disabled={isSubmitting}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-900">
                          {t(
                            'roleplay.competitiveIntelligence.options.generate',
                          )}
                        </span>
                      </label>
                      <div className="pl-6">
                        <p className="text-sm text-gray-600">
                          {t(
                            'roleplay.competitiveIntelligence.options.generateDescription',
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* General Error */}
              {error && !uploadingFiles.some((f) => f.status === 'error') && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || files.length === 0}
                className="rounded-full bg-orange-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>

      {/* Route navigation blocking dialog */}
      <DialogComponent />

      {/* Modal close unsaved changes dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        entityType="product"
        onGoBack={handleDiscardChanges}
        onKeepEditing={handleKeepEditing}
      />
    </HeadlessDialog>
  );
}
