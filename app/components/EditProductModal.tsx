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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsManageApi } from '~/util/api';
import { useUnsavedChanges } from '~/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: {
    id: string;
    name: string;
    files?: Array<{
      fileName: string;
      mimeType: string;
      size: number;
    }>;
  };
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

export function EditProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: EditProductModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product.name || '');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<
    'idle' | 'preparing' | 'uploading' | 'processing' | 'complete'
  >('idle');
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Block route navigation when modal is open
  const { DialogComponent } = useUnsavedChanges({
    when: shouldBlockNavigation && isOpen,
    entityType: 'product',
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      filesToAdd: File[];
      filesToRemove: number[];
    }) => {
      setUploadPhase('preparing');
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setUploadPhase('uploading');
      const result = await productsManageApi.updateProduct({
        productId: product.id,
        name: data.name,
        filesToAdd: data.filesToAdd,
        filesToRemove: data.filesToRemove,
      });
      
      setUploadPhase('processing');
      return result;
    },
    onSuccess: () => {
      setUploadPhase('complete');
      setShouldBlockNavigation(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Product updated successfully!');
      // Reset form and close
      setTimeout(() => {
        setName(product.name || '');
        setNewFiles([]);
        setFilesToRemove(new Set());
        setUploadPhase('idle');
        onClose();
        onSuccess?.();
      }, 800);
    },
    onError: (err: any) => {
      console.error('Update error:', err);
      const errorMessage =
        err?.message || err?.json?.error || 'Failed to update product';
      setError(errorMessage);
      setUploadPhase('idle');
      toast.error(errorMessage);
    },
  });

  // Reset state when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      setName(product.name || '');
      setNewFiles([]);
      setFilesToRemove(new Set());
      setError(null);
      setUploadPhase('idle');
      setShouldBlockNavigation(true);
      setShowUnsavedDialog(false);
    }
  }, [isOpen, product]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only .docx and .pdf files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 50MB.`;
    }
    return null;
  };

  const existingFiles = product.files || [];
  const visibleExistingFiles = existingFiles.filter(
    (_, index) => !filesToRemove.has(index),
  );
  const totalFiles = visibleExistingFiles.length + newFiles.length;

  const handleFiles = useCallback(
    (newFilesList: FileList | File[]) => {
      const filesArray = Array.from(newFilesList);
      const validFiles: File[] = [];

      // Check total count
      if (totalFiles + filesArray.length > MAX_FILES) {
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
        setNewFiles((prev) => [...prev, ...validFiles]);
        setError(null);
      }
    },
    [totalFiles],
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

  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeExistingFile = useCallback((index: number) => {
    setFilesToRemove((prev) => new Set(prev).add(index));
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (name.trim() === '') {
      setError('Product name is required');
      return;
    }

    if (totalFiles === 0) {
      setError('At least one file is required');
      return;
    }

    setError(null);

    updateProductMutation.mutate({
      name: name.trim(),
      filesToAdd: newFiles,
      filesToRemove: Array.from(filesToRemove),
    });
  };

  const resetAndClose = useCallback(() => {
    setName(product.name || '');
    setNewFiles([]);
    setFilesToRemove(new Set());
    setError(null);
    setUploadPhase('idle');
    setShouldBlockNavigation(false);
    setShowUnsavedDialog(false);
    onClose();
  }, [onClose, product.name]);

  const handleClose = useCallback(() => {
    if (updateProductMutation.isPending) return;

    if (shouldBlockNavigation) {
      // Show the unsaved changes dialog
      setShowUnsavedDialog(true);
    } else {
      // No unsaved changes, close immediately
      resetAndClose();
    }
  }, [updateProductMutation.isPending, shouldBlockNavigation, resetAndClose]);

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
                Edit product
              </DialogTitle>
              <CloseButton
                disabled={updateProductMutation.isPending}
                className="disabled:opacity-50"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </CloseButton>
            </div>

            {/* Body */}
            <div className="space-y-6 px-6 py-6">
              {/* Product Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Product name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={updateProductMutation.isPending}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
                />
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
                  onClick={
                    updateProductMutation.isPending
                      ? undefined
                      : handleBrowseClick
                  }
                  className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'
                  } ${updateProductMutation.isPending ? 'cursor-not-allowed opacity-50' : ''}`}
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
                  disabled={updateProductMutation.isPending}
                  className="hidden"
                />

                {/* Existing Files List */}
                {visibleExistingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {existingFiles.map((file, index) => {
                      if (filesToRemove.has(index)) return null;

                      return (
                        <div
                          key={`existing-${index}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                        >
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {file.fileName}
                            </span>
                          </div>

                          {!updateProductMutation.isPending && (
                            <button
                              onClick={() => removeExistingFile(index)}
                              className="text-gray-400 hover:text-red-600"
                              type="button"
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* New Files List */}
                {newFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {newFiles.map((file, index) => (
                      <div
                        key={`new-${file.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                      >
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-sm text-gray-900">
                            {file.name}
                          </span>
                          <span className="text-xs text-blue-600">(new)</span>
                        </div>

                        {!updateProductMutation.isPending && (
                          <button
                            onClick={() => removeNewFile(index)}
                            className="text-gray-400 hover:text-red-600"
                            type="button"
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
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress Indicator */}
                {uploadPhase !== 'idle' && uploadPhase !== 'complete' && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          {uploadPhase === 'preparing' && 'Preparing update...'}
                          {uploadPhase === 'uploading' && 'Uploading files to cloud storage...'}
                          {uploadPhase === 'processing' && 'Processing changes...'}
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
                        Update successful!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* General Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={
                  updateProductMutation.isPending ||
                  name.trim() === '' ||
                  totalFiles === 0
                }
                className="rounded-full bg-orange-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateProductMutation.isPending ? 'Saving...' : 'Save'}
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
