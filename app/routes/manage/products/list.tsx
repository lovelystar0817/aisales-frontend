import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { useDebounce } from '~/hooks/useDebounce';
import { useNavigate } from 'react-router';
import { ActionDropdown } from '../settings/components/ActionDropdown';
import { apiManage, productsManageApi } from '~/util/api';
import { Pagination } from '~/components/Pagination';
import toast from 'react-hot-toast';
import { AddProductModal } from '~/components/AddProductModal';
import { EditProductModal } from '~/components/EditProductModal';
import { Dialog } from '~/components/Dialog';

interface Product {
  id: string;
  friendlyId: string;
  name: string;
  knowledgePrompt: string;
  productType: 'own' | 'competitor';
  keyFeatures: string[];
  salesTarget: 'individual' | 'corporate';
  createdAt: string;
  updatedAt: string;
  // Extended fields (may come from backend or computed)
  documentCount?: number;
  competitiveIntelligenceStatus?: 'available' | 'not-available';
  roleplayCount?: number;
  isNew?: boolean;
}

export type IngestionStatus =
  | 'pending'
  | 'processing'
  | 'parsed'
  | 'failed'
  | 'published'
  | 'aborted';

interface PendingIngestion {
  ingestionId: string;
  draftId: string;
  name?: string;
  fileCount: number;
  status: IngestionStatus;
  createdAt: string;
  errorMessage?: string;
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

async function deleteProduct(id: string): Promise<void> {
  try {
    const response = await apiManage()
      .url(`/manage/products/${id}`)
      .delete()
      .json<Promise<{ success: boolean; error?: string }>>();

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete product');
    }
  } catch (error: any) {
    // Extract error message from API response if available
    if (error?.json?.error) {
      throw new Error(error.json.error);
    }
    if (error?.message) {
      throw error;
    }
    throw new Error('Failed to delete product');
  }
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Products' }];
}

export default withAuthenticationRequired(function ProductManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<
    | {
        name?: string;
        errorMessage?: string;
        files?: File[];
        generateCompetitiveIntelligence?: boolean;
        duplicateCompetitiveIntelligence?: boolean;
      }
    | undefined
  >(undefined);
  const [duplicateProductId, setDuplicateProductId] = useState<string | null>(null);
  const [hasCompetitiveIntelligence, setHasCompetitiveIntelligence] = useState(false);
  const [isPendingExpanded, setIsPendingExpanded] = useState(true);
  const previousPendingCount = useRef<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', currentPage, rowsPerPage, debouncedSearch],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url('/manage/products')
          .query({
            page: currentPage,
            limit: rowsPerPage,
            ...(debouncedSearch && { search: debouncedSearch }),
          })
          .get()
          .json<Promise<ProductsResponse>>();

        return response;
      } catch (error: unknown) {
        console.error('[Products Query] Failed:', error);
        throw error;
      }
    },
    retryDelay: 5000,
    retry: 5,
  });

  // Query pending ingestions
  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['pending-ingestions'],
    queryFn: async () => {
      try {
        return await productsManageApi.getPendingIngestions();
      } catch (error: unknown) {
        console.error('[Pending Ingestions Query] Failed:', error);
        return { success: true, ingestions: [] };
      }
    },
  });

  const pendingIngestions = pendingData?.ingestions || [];

  // Auto-refresh pending items every 2 seconds when there are pending items
  useEffect(() => {
    if (pendingIngestions.length > 0) {
      const interval = setInterval(() => {
        refetchPending();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [pendingIngestions.length, refetchPending]);

  // Refresh products list when pending items complete
  useEffect(() => {
    // When pending count goes from > 0 to 0 (items completed), refresh the products
    if (previousPendingCount.current > 0 && pendingIngestions.length === 0) {
      console.log(
        '[Products] Pending items completed, refreshing products list',
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
    previousPendingCount.current = pendingIngestions.length;
  }, [pendingIngestions.length, queryClient]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      files: File[];
      generateCompetitiveIntelligence: boolean;
      duplicateCompetitiveIntelligence: boolean;
      duplicateId?: string | null;
    }) => {
      return await productsManageApi.importFiles({
        files: data.files,
        name: data.name,
        generateCompetitiveIntelligence: data.generateCompetitiveIntelligence,
        duplicateCompetitiveIntelligence: data.duplicateCompetitiveIntelligence,
        duplicateId: data.duplicateId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ingestions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product upload started!');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);

      // Skip toast for NAME_ALREADY_EXISTS - field-level error will be shown
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        return;
      }

      toast.error(error?.message || 'Failed to upload product');
    },
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newLimit: number) => {
    setRowsPerPage(newLimit);
    setCurrentPage(1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      // Error is already handled by mutation's onError
      console.error('Error deleting product:', error);
    }
  };

  const handleOpenModal = () => {
    setModalInitialData(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalInitialData(undefined);
    setDuplicateProductId(null);
    setHasCompetitiveIntelligence(false);
  };

  const handleModalSubmit = async (data: {
    name?: string;
    files: File[];
    generateCompetitiveIntelligence: boolean;
    duplicateCompetitiveIntelligence: boolean;
    duplicateId?: string | null;
  }) => {
    await uploadMutation.mutateAsync(data);
  };

  const handleRetry = (ingestion: PendingIngestion) => {
    setModalInitialData({
      name: ingestion.name,
      errorMessage: ingestion.errorMessage,
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = async (product: Product) => {
    // Fetch full product details including files
    try {
      const response = await apiManage()
        .url(`/manage/products/${product.id}`)
        .get()
        .json<{
          success: boolean;
          product: Product & {
            files?: Array<{ fileName: string; mimeType: string; size: number }>;
          };
        }>();

      if (response.success && response.product) {
        setProductToEdit({
          ...product,
          files: response.product.files,
        } as Product & {
          files?: Array<{ fileName: string; mimeType: string; size: number }>;
        });
        setEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to load product details');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    // Fetch full product details including files for duplication
    try {
      const response = await apiManage()
        .url(`/manage/products/${product.id}`)
        .get()
        .json<{
          success: boolean;
          product: Product & {
            files?: Array<{
              fileName: string;
              url: string;
              mimeType: string;
              size: number;
            }>;
            generateCompetitiveIntelligence?: boolean;
            competitiveIntelligenceStatus?: 'available' | 'not-available';
          };
        }>();

      if (response.success && response.product) {
        const productData = response.product;

        // Fetch and convert files to File objects
        const filePromises = (productData.files || []).map(async (fileInfo) => {
          try {
            const fileResponse = await fetch(fileInfo.url);
            const blob = await fileResponse.blob();
            return new File([blob], fileInfo.fileName, {
              type: fileInfo.mimeType,
            });
          } catch (error) {
            console.error(`Error fetching file ${fileInfo.fileName}:`, error);
            return null;
          }
        });

        const fetchedFiles = await Promise.all(filePromises);
        const validFiles = fetchedFiles.filter((f): f is File => f !== null);

        // Open modal with product data and files
        // If product has competitive intelligence, default to duplicating it
        // Use the original product's competitiveIntelligenceStatus from the list
        const hasCI = product.competitiveIntelligenceStatus === 'available';
        setModalInitialData({
          name: product.name + ' Copy',
          files: validFiles,
          generateCompetitiveIntelligence: false,
          duplicateCompetitiveIntelligence: hasCI,
        });
        setDuplicateProductId(product.id);
        setHasCompetitiveIntelligence(hasCI);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching product details for duplication:', error);
      toast.error('Failed to load product details');
    }
  };

  const getProductActions = (product: Product) => [
    {
      label: t('common.view'),
      onClick: () => navigate(`/manage/products/${product.id}`),
    },
    {
      label: t('common.edit'),
      onClick: () => handleEditProduct(product),
    },
    {
      label: t('common.duplicate'),
      onClick: () => handleDuplicateProduct(product),
    },
    {
      label: t('common.delete'),
      onClick: () => handleDeleteProduct(product),
      className: 'text-red-600',
      disabled: (product.roleplayCount ?? 0) > 0,
      tooltip:
        (product.roleplayCount ?? 0) > 0
          ? 'Products linked to a roleplay cannot be deleted. Reassign the roleplays to another product to delete.'
          : undefined,
    },
  ];

  const products = productsData?.products || [];

  const getStatusDisplay = (status: PendingIngestion['status']) => {
    if (status === 'failed') {
      return {
        text: 'Failed',
        className: 'text-red-700',
        icon: <ExclamationCircleIcon className="h-4 w-4 text-red-600" />,
      };
    }
    return {
      text: status === 'processing' ? 'Uploading' : 'Processing',
      className: 'text-blue-600',
      icon: (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      ),
    };
  };

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
          <p className="text-lg font-medium">Failed to load products</p>
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product</h1>
        <button
          onClick={handleOpenModal}
          className="flex items-center rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
        >
          + New product
        </button>
      </div>

      {/* Pending Section */}
      {pendingIngestions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => setIsPendingExpanded(!isPendingExpanded)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Pending</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {pendingIngestions.length}
              </span>
            </div>
            {isPendingExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {isPendingExpanded && (
            <div className="border-t border-gray-200">
              {pendingIngestions.map((ingestion) => {
                const statusDisplay = getStatusDisplay(ingestion.status);

                return (
                  <div
                    key={ingestion.ingestionId}
                    className="flex items-center justify-between border-b border-gray-200 px-6 py-4 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {ingestion.name || 'Unnamed Product'}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <DocumentIcon className="h-4 w-4" />
                          <span>
                            {ingestion.fileCount} document
                            {ingestion.fileCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      {ingestion.status === 'failed' &&
                        ingestion.errorMessage && (
                          <p className="mt-1 text-sm text-red-600">
                            {ingestion.errorMessage}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center gap-1.5 text-sm ${statusDisplay.className}`}
                      >
                        {statusDisplay.icon}
                        <span>{statusDisplay.text}</span>
                      </div>

                      {ingestion.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(ingestion)}
                          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-64 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="rounded-l-xl px-6 py-3 text-left text-sm font-medium text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                Documents
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                Competitive intelligence
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                Used in
              </th>
              <th className="rounded-r-xl px-6 py-3 text-right text-sm font-medium text-gray-900"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      No products found
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search'
                        : 'Import your first product to get started'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">
                        {product.name}
                      </span>
                      {product.isNew && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <DocumentIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {product.documentCount ?? 0} document
                        {(product.documentCount ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.competitiveIntelligenceStatus === 'available' ? (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <span>Generated</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-red-700">
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                        <span>Not available</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {product.roleplayCount ?? 0} roleplay
                    {(product.roleplayCount ?? 0) !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown actions={getProductActions(product)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {productsData && (
          <Pagination
            currentPage={productsData.pagination.currentPage}
            totalPages={productsData.pagination.totalPages}
            totalItems={productsData.pagination.totalProducts}
            itemsPerPage={rowsPerPage}
            hasNextPage={productsData.pagination.hasNextPage}
            hasPreviousPage={productsData.pagination.hasPreviousPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        initialData={modalInitialData}
        duplicateId={duplicateProductId}
        hasCompetitiveIntelligence={hasCompetitiveIntelligence}
      />

      {/* Edit Product Modal */}
      {productToEdit && (
        <EditProductModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setProductToEdit(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setProductToEdit(null);
          }}
          product={{
            id: productToEdit.id,
            name: productToEdit.name,
            files: (productToEdit as any).files || [],
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete product?"
        description="This will permanently remove the product. This action cannot be undone."
        confirmText="Delete"
        confirmButtonClassName="bg-red-600 data-[hover]:bg-red-700 data-[open]:bg-red-800"
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
