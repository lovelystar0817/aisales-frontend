import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router';
import { withManageAuthenticationRequiredOptions } from '~/util/auth0';
import { apiManage, productsManageApi } from '~/util/api';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Dialog } from '~/components/Dialog';
import { EditProductModal } from '~/components/EditProductModal';
import { AddProductModal } from '~/components/AddProductModal';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { SquarePen } from 'lucide-react';
import { Pagination } from '~/components/Pagination';

interface Product {
  id: string;
  friendlyId: string;
  name: string;
  knowledgePrompt?: string;
  productType: 'own' | 'competitor';
  keyFeatures?: string[];
  featureHighlight?: {
    title: string;
    description: string;
  };
  salesTarget: 'individual' | 'corporate';
  createdAt: string;
  updatedAt: string;
  roleplayCount?: number;
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  files?: Array<{
    fileName: string;
    mimeType: string;
    size: number;
  }>;
  competitiveIntelligence?: {
    competitors: Array<{
      name: string;
      company: string;
      type: string;
      keyFeatures: string[];
      strengths: string[];
      limitations: string[];
      positioningStrategy: string;
    }>;
    source?: string;
  } | null;
}

interface RoleplayUsage {
  id: string;
  title: string;
}

interface ProductResponse {
  success: boolean;
  product: Product;
}

interface ProductUsageResponse {
  success: boolean;
  roleplays: RoleplayUsage[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function meta() {
  return [{ title: 'Hupo Sales AI | Product Details' }];
}

type TabType = 'overview' | 'used-in';

export default withAuthenticationRequired(function ProductDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageRowsPerPage, setUsageRowsPerPage] = useState(10);
  const [expandedCompetitors, setExpandedCompetitors] = useState<Set<number>>(
    new Set([]),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<File[]>([]);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editKeyFeatures, setEditKeyFeatures] = useState<string[]>([]);
  const [editingCompetitorIndex, setEditingCompetitorIndex] = useState<
    number | null
  >(null);
  const [editCompetitorType, setEditCompetitorType] = useState('');
  const [editCompetitorKeyFeatures, setEditCompetitorKeyFeatures] = useState<
    string[]
  >([]);
  const [editCompetitorStrengths, setEditCompetitorStrengths] = useState<
    string[]
  >([]);
  const [editCompetitorLimitations, setEditCompetitorLimitations] = useState<
    string[]
  >([]);
  const [
    editCompetitorPositioningStrategy,
    setEditCompetitorPositioningStrategy,
  ] = useState('');
  const [editCompetitorName, setEditCompetitorName] = useState('');
  const [editCompetitorProvider, setEditCompetitorProvider] = useState('');

  // Fetch product
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/products/${id}`)
          .get()
          .json<ProductResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Product Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id,
    retryDelay: 5000,
    retry: 3,
  });

  // Fetch usage data
  const { data: usageDataResponse, isLoading: usageLoading } = useQuery({
    queryKey: ['product-usage', id, usageCurrentPage, usageRowsPerPage],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/products/${id}/usage`)
          .query({
            page: usageCurrentPage,
            limit: usageRowsPerPage,
          })
          .get()
          .json<ProductUsageResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Product Usage Query] Failed:', error);
        throw error;
      }
    },
    enabled: !!id && activeTab === 'used-in',
    retryDelay: 5000,
    retry: 3,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const response = await apiManage()
          .url(`/manage/products/${productId}`)
          .delete()
          .json<{ success: boolean; error?: string }>();

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully!');
      navigate('/manage/products');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  // Update product summary mutation
  const updateSummaryMutation = useMutation({
    mutationFn: async (updateData: {
      featureHighlight?: { title: string; description: string };
      keyFeatures?: string[];
    }) => {
      try {
        const response = await apiManage()
          .url(`/manage/products/${id}`)
          .put(updateData)
          .json<ProductResponse>();

        return response;
      } catch (error: unknown) {
        console.error('[Update Product Summary] Failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['product', id], data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditingSummary(false);
      toast.success('Product summary updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update product summary');
    },
  });

  // Update competitor mutation
  const updateCompetitorMutation = useMutation({
    mutationFn: async ({
      competitorIndex,
      updateData,
    }: {
      competitorIndex: number;
      updateData: {
        name?: string;
        provider?: string;
        type?: string;
        keyFeatures?: string[];
        strengths?: string[];
        limitations?: string[];
        positioningStrategy?: string;
      };
    }) => {
      try {
        const response = await apiManage()
          .url(`/manage/products/${id}/competitors/${competitorIndex}`)
          .put(updateData)
          .json<{ success: boolean; competitor: any }>();

        return response;
      } catch (error: unknown) {
        console.error('[Update Competitor] Failed:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Update the product query cache with the updated competitor
      queryClient.setQueryData<ProductResponse>(['product', id], (old) => {
        if (!old?.product?.competitiveIntelligence) return old;

        const updatedCompetitors = [
          ...old.product.competitiveIntelligence.competitors,
        ];
        updatedCompetitors[variables.competitorIndex] = data.competitor;

        return {
          ...old,
          product: {
            ...old.product,
            competitiveIntelligence: {
              ...old.product.competitiveIntelligence,
              competitors: updatedCompetitors,
            },
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingCompetitorIndex(null);
      toast.success('Competitor updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update competitor');
    },
  });

  const product = productData?.product;
  const usageData = usageDataResponse?.roleplays || [];
  const pagination = usageDataResponse?.pagination;

  // Initialize edit state when product loads or edit mode is enabled
  const handleStartEdit = () => {
    if (product) {
      setEditTitle(product.featureHighlight?.title || '');
      setEditDescription(product.featureHighlight?.description || '');
      setEditKeyFeatures([...(product.keyFeatures || [])]);
      setIsEditingSummary(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingSummary(false);
    if (product) {
      setEditTitle(product.featureHighlight?.title || '');
      setEditDescription(product.featureHighlight?.description || '');
      setEditKeyFeatures([...(product.keyFeatures || [])]);
    }
  };

  const handleSaveEdit = () => {
    if (!product) return;

    // Filter out empty key features
    const validKeyFeatures = editKeyFeatures.filter((f) => f.trim() !== '');

    updateSummaryMutation.mutate({
      featureHighlight: {
        title: editTitle.trim(),
        description: editDescription.trim(),
      },
      keyFeatures: validKeyFeatures,
    });
  };

  const handleAddFeature = () => {
    setEditKeyFeatures([...editKeyFeatures, '']);
  };

  const handleUpdateFeature = (index: number, value: string) => {
    const updated = [...editKeyFeatures];
    updated[index] = value;
    setEditKeyFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setEditKeyFeatures(editKeyFeatures.filter((_, i) => i !== index));
  };

  // Competitor editing handlers
  const handleStartEditCompetitor = (index: number) => {
    if (!product?.competitiveIntelligence?.competitors[index]) return;

    const competitor = product.competitiveIntelligence.competitors[index];
    setEditingCompetitorIndex(index);
    setEditCompetitorName(competitor.name || '');
    setEditCompetitorProvider(competitor.company || '');
    setEditCompetitorType(competitor.type || '');
    setEditCompetitorKeyFeatures([...(competitor.keyFeatures || [])]);
    setEditCompetitorStrengths([...(competitor.strengths || [])]);
    setEditCompetitorLimitations([...(competitor.limitations || [])]);
    setEditCompetitorPositioningStrategy(competitor.positioningStrategy || '');
  };

  const handleCancelEditCompetitor = () => {
    setEditingCompetitorIndex(null);
  };

  const handleSaveEditCompetitor = () => {
    if (editingCompetitorIndex === null) return;

    const validKeyFeatures = editCompetitorKeyFeatures.filter(
      (f) => f.trim() !== '',
    );
    const validStrengths = editCompetitorStrengths.filter(
      (s) => s.trim() !== '',
    );
    const validLimitations = editCompetitorLimitations.filter(
      (l) => l.trim() !== '',
    );

    updateCompetitorMutation.mutate({
      competitorIndex: editingCompetitorIndex,
      updateData: {
        name: editCompetitorName.trim(),
        provider: editCompetitorProvider.trim(),
        type: editCompetitorType.trim(),
        keyFeatures: validKeyFeatures,
        strengths: validStrengths,
        limitations: validLimitations,
        positioningStrategy: editCompetitorPositioningStrategy.trim(),
      },
    });
  };

  const handleAddCompetitorFeature = (
    type: 'keyFeatures' | 'strengths' | 'limitations',
  ) => {
    if (type === 'keyFeatures') {
      setEditCompetitorKeyFeatures([...editCompetitorKeyFeatures, '']);
    } else if (type === 'strengths') {
      setEditCompetitorStrengths([...editCompetitorStrengths, '']);
    } else {
      setEditCompetitorLimitations([...editCompetitorLimitations, '']);
    }
  };

  const handleUpdateCompetitorFeature = (
    type: 'keyFeatures' | 'strengths' | 'limitations',
    index: number,
    value: string,
  ) => {
    if (type === 'keyFeatures') {
      const updated = [...editCompetitorKeyFeatures];
      updated[index] = value;
      setEditCompetitorKeyFeatures(updated);
    } else if (type === 'strengths') {
      const updated = [...editCompetitorStrengths];
      updated[index] = value;
      setEditCompetitorStrengths(updated);
    } else {
      const updated = [...editCompetitorLimitations];
      updated[index] = value;
      setEditCompetitorLimitations(updated);
    }
  };

  const handleRemoveCompetitorFeature = (
    type: 'keyFeatures' | 'strengths' | 'limitations',
    index: number,
  ) => {
    if (type === 'keyFeatures') {
      setEditCompetitorKeyFeatures(
        editCompetitorKeyFeatures.filter((_, i) => i !== index),
      );
    } else if (type === 'strengths') {
      setEditCompetitorStrengths(
        editCompetitorStrengths.filter((_, i) => i !== index),
      );
    } else {
      setEditCompetitorLimitations(
        editCompetitorLimitations.filter((_, i) => i !== index),
      );
    }
  };

  const handleFileDownload = async (fileIndex: number) => {
    if (!product) return;

    try {
      const response = await apiManage()
        .url(`/manage/products/${product.id}/files/${fileIndex}/download`)
        .get()
        .json<{ success: boolean; downloadUrl: string; fileName: string }>();

      if (response.success && response.downloadUrl) {
        // Open the presigned URL in a new tab to trigger download
        window.open(response.downloadUrl, '_blank');
      } else {
        toast.error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!product) return;

    try {
      await deleteMutation.mutateAsync(product.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      // Error is already handled by mutation's onError
      console.error('Error deleting product:', error);
    }
  };

  // Upload mutation for duplicate
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Product duplicated successfully!');
      setDuplicateModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Duplicate error:', error);

      // Skip toast for NAME_ALREADY_EXISTS - field-level error will be shown
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        return;
      }

      toast.error(error?.message || 'Failed to duplicate product');
    },
  });

  const handleDuplicate = async () => {
    if (!product || !product.files || product.files.length === 0) {
      setDuplicateModalOpen(true);
      return;
    }

    try {
      // Fetch and convert files to File objects
      const filePromises = product.files.map(async (fileInfo: any) => {
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

      setDuplicateFiles(validFiles);
      setDuplicateModalOpen(true);
    } catch (error) {
      console.error('Error preparing files for duplication:', error);
      toast.error('Failed to load product files');
      setDuplicateModalOpen(true);
    }
  };

  const handleDuplicateSubmit = async (data: {
    name?: string;
    files: File[];
    generateCompetitiveIntelligence: boolean;
    duplicateCompetitiveIntelligence: boolean;
    duplicateId?: string | null;
  }) => {
    await uploadMutation.mutateAsync(data);
  };

  // Client-side pagination fallback if backend doesn't provide pagination
  const paginatedUsage = pagination
    ? usageData
    : usageData.slice(
        (usageCurrentPage - 1) * usageRowsPerPage,
        usageCurrentPage * usageRowsPerPage,
      );
  const usageTotalPages = pagination
    ? pagination.totalPages
    : Math.ceil((usageData?.length || 0) / usageRowsPerPage);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Failed to load product</p>
          <button
            onClick={() => navigate('/manage/products')}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Link
          to="/manage/products"
          className="cursor-pointer text-blue-600 hover:underline"
        >
          Product
        </Link>
        <span>/</span>
        <span className="text-gray-900">Product detail</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Last updated
            {product.updatedBy ? ` by ${product.updatedBy.name}` : ''} on{' '}
            {product.updatedAt && formatDate(product.updatedAt)}
          </p>
        </div>
        <div className="flex gap-3">
          {(product.roleplayCount ?? 0) > 0 ? (
            <RadixTooltip.Provider delayDuration={300}>
              <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                  <button
                    disabled
                    className="w-[120px] cursor-not-allowed rounded-full border border-gray-300 px-6 py-2 text-sm text-red-500 opacity-50"
                  >
                    {t('common.delete')}
                  </button>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                  <RadixTooltip.Content
                    className="max-w-[300px] rounded-md border border-gray-200 bg-white p-3 text-xs shadow-md"
                    sideOffset={5}
                    side="bottom"
                    align="start"
                  >
                    <p className="text-sm leading-normal text-gray-600">
                      Products linked to a roleplay cannot be deleted. Reassign
                      the roleplays to another product to delete.
                    </p>
                    <RadixTooltip.Arrow className="fill-white" />
                  </RadixTooltip.Content>
                </RadixTooltip.Portal>
              </RadixTooltip.Root>
            </RadixTooltip.Provider>
          ) : (
            <button
              onClick={handleDelete}
              className="w-[120px] rounded-full border border-gray-300 px-6 py-2 text-sm text-red-500 hover:bg-gray-50"
            >
              {t('common.delete')}
            </button>
          )}
          <button
            onClick={handleDuplicate}
            className="w-[120px] rounded-full border border-gray-300 px-6 py-2 text-sm text-gray-900 hover:bg-gray-50"
          >
            {t('common.duplicate')}
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="w-[120px] rounded-full bg-orange-600 px-6 py-2 text-sm text-white hover:bg-orange-700"
          >
            {t('common.edit')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`relative pb-3 text-[15px] font-normal transition-colors ${
              activeTab === 'overview'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('used-in')}
            className={`relative pb-3 text-[15px] font-normal transition-colors ${
              activeTab === 'used-in'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Used in
            {activeTab === 'used-in' && (
              <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'overview' ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
            {/* Main Content */}
            <div className="space-y-4">
              {/* Product Summary */}
              <div className="rounded-lg bg-white">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Product summary
                  </h2>
                  {!isEditingSummary && (
                    <button
                      onClick={handleStartEdit}
                      className="mr-4 text-gray-400 hover:text-gray-600"
                    >
                      <SquarePen className="h-4 w-4" color="#58595A" />
                    </button>
                  )}
                  {isEditingSummary && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateSummaryMutation.isPending}
                        className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-1.5 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        Save
                        {updateSummaryMutation.isPending && (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {isEditingSummary ? (
                    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                      {/* One-liner product highlight */}
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          One-liner product highlight
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                          placeholder="Enter one-liner highlight"
                        />
                      </div>

                      {/* Summary */}
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Summary
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                          placeholder="Enter product summary"
                        />
                      </div>

                      {/* Key Features */}
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Key features
                        </label>
                        <div className="space-y-2">
                          {editKeyFeatures.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <textarea
                                value={feature}
                                onChange={(e) =>
                                  handleUpdateFeature(index, e.target.value)
                                }
                                rows={2}
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                placeholder="Enter feature description"
                              />
                              <button
                                onClick={() => handleRemoveFeature(index)}
                                className="mt-2 text-gray-400 hover:text-red-500"
                                type="button"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={handleAddFeature}
                            type="button"
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add feature
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 p-4">
                      {product.featureHighlight && (
                        <div className="mb-4 flex items-stretch gap-3">
                          <div className="w-[2px] shrink-0 rounded-sm bg-gray-200"></div>
                          <div className="flex-1">
                            {product.featureHighlight.title && (
                              <p className="text-sm font-medium text-orange-600">
                                {product.featureHighlight.title}
                              </p>
                            )}
                            {product.featureHighlight.description && (
                              <p className="mt-2 text-sm text-gray-600">
                                {product.featureHighlight.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Key Features */}
                      {product.keyFeatures && product.keyFeatures.length > 0 ? (
                        <ul className="space-y-2">
                          {product.keyFeatures.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-700"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No features specified yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Competitive Intelligence */}
              {product.competitiveIntelligence &&
                product.competitiveIntelligence.competitors.length > 0 && (
                  <div className="rounded-lg bg-white">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Competitive intelligence
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {product.competitiveIntelligence.competitors.map(
                        (competitor, index) => {
                          const isExpanded = expandedCompetitors.has(index);
                          const isEditing = editingCompetitorIndex === index;
                          return (
                            <div
                              key={index}
                              className="overflow-hidden rounded-lg border border-gray-200"
                            >
                              <div className="flex w-full items-center justify-between p-4 transition-colors">
                                <button
                                  onClick={() => {
                                    if (!isEditing) {
                                      const newExpanded = new Set(
                                        expandedCompetitors,
                                      );
                                      if (isExpanded) {
                                        newExpanded.delete(index);
                                      } else {
                                        newExpanded.add(index);
                                      }
                                      setExpandedCompetitors(newExpanded);
                                    }
                                  }}
                                  className="flex flex-1 items-center gap-3 text-left"
                                >
                                  {isExpanded ? (
                                    <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-400" />
                                  ) : (
                                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {competitor.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {competitor.company}
                                    </div>
                                  </div>
                                </button>
                                {!isEditing ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditCompetitor(index);
                                      if (!isExpanded) {
                                        setExpandedCompetitors(
                                          new Set(expandedCompetitors).add(
                                            index,
                                          ),
                                        );
                                      }
                                    }}
                                    className="shrink-0 text-gray-400 hover:text-gray-600"
                                  >
                                    <SquarePen
                                      className="h-4 w-4"
                                      color="#58595A"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex shrink-0 items-center gap-3">
                                    <button
                                      onClick={handleCancelEditCompetitor}
                                      className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleSaveEditCompetitor}
                                      disabled={
                                        updateCompetitorMutation.isPending
                                      }
                                      className="flex w-19 items-center justify-center rounded-full bg-orange-600 px-4 py-1.5 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
                                    >
                                      Save
                                      {updateCompetitorMutation.isPending && (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isExpanded && (
                                <div className="px-4 pt-4 pb-4">
                                  {isEditing ? (
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="flex flex-col">
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Name
                                        </label>
                                        <input
                                          type="text"
                                          value={editCompetitorName}
                                          onChange={(e) =>
                                            setEditCompetitorName(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                          placeholder="Enter name"
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Provider
                                        </label>
                                        <input
                                          type="text"
                                          value={editCompetitorProvider}
                                          onChange={(e) =>
                                            setEditCompetitorProvider(
                                              e.target.value,
                                            )
                                          }
                                          className="mr-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                          placeholder="Enter provider"
                                        />
                                      </div>

                                      {/* Type */}
                                      <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Type
                                        </label>
                                        <input
                                          type="text"
                                          value={editCompetitorType}
                                          onChange={(e) =>
                                            setEditCompetitorType(
                                              e.target.value,
                                            )
                                          }
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                          placeholder="Enter type"
                                        />
                                      </div>

                                      {/* Key Features */}
                                      <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Key features
                                        </label>
                                        <div className="space-y-2">
                                          {editCompetitorKeyFeatures.map(
                                            (feature, featureIndex) => (
                                              <div
                                                key={featureIndex}
                                                className="flex items-start gap-2"
                                              >
                                                <textarea
                                                  value={feature}
                                                  onChange={(e) =>
                                                    handleUpdateCompetitorFeature(
                                                      'keyFeatures',
                                                      featureIndex,
                                                      e.target.value,
                                                    )
                                                  }
                                                  rows={2}
                                                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                                  placeholder="Enter feature"
                                                />
                                                <button
                                                  onClick={() =>
                                                    handleRemoveCompetitorFeature(
                                                      'keyFeatures',
                                                      featureIndex,
                                                    )
                                                  }
                                                  className="mt-2 text-gray-400 hover:text-red-500"
                                                  type="button"
                                                >
                                                  <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M6 18L18 6M6 6l12 12"
                                                    />
                                                  </svg>
                                                </button>
                                              </div>
                                            ),
                                          )}
                                          <button
                                            onClick={() =>
                                              handleAddCompetitorFeature(
                                                'keyFeatures',
                                              )
                                            }
                                            type="button"
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                          >
                                            + Add feature
                                          </button>
                                        </div>
                                      </div>

                                      {/* Strengths */}
                                      <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Strengths
                                        </label>
                                        <div className="space-y-2">
                                          {editCompetitorStrengths.map(
                                            (strength, strengthIndex) => (
                                              <div
                                                key={strengthIndex}
                                                className="flex items-start gap-2"
                                              >
                                                <textarea
                                                  value={strength}
                                                  onChange={(e) =>
                                                    handleUpdateCompetitorFeature(
                                                      'strengths',
                                                      strengthIndex,
                                                      e.target.value,
                                                    )
                                                  }
                                                  rows={2}
                                                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                                  placeholder="Enter strength"
                                                />
                                                <button
                                                  onClick={() =>
                                                    handleRemoveCompetitorFeature(
                                                      'strengths',
                                                      strengthIndex,
                                                    )
                                                  }
                                                  className="mt-2 text-gray-400 hover:text-red-500"
                                                  type="button"
                                                >
                                                  <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M6 18L18 6M6 6l12 12"
                                                    />
                                                  </svg>
                                                </button>
                                              </div>
                                            ),
                                          )}
                                          <button
                                            onClick={() =>
                                              handleAddCompetitorFeature(
                                                'strengths',
                                              )
                                            }
                                            type="button"
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                          >
                                            + Add strength
                                          </button>
                                        </div>
                                      </div>

                                      {/* Limitations */}
                                      <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Limitations
                                        </label>
                                        <div className="space-y-2">
                                          {editCompetitorLimitations.map(
                                            (limitation, limitationIndex) => (
                                              <div
                                                key={limitationIndex}
                                                className="flex items-start gap-2"
                                              >
                                                <textarea
                                                  value={limitation}
                                                  onChange={(e) =>
                                                    handleUpdateCompetitorFeature(
                                                      'limitations',
                                                      limitationIndex,
                                                      e.target.value,
                                                    )
                                                  }
                                                  rows={2}
                                                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                                  placeholder="Enter limitation"
                                                />
                                                <button
                                                  onClick={() =>
                                                    handleRemoveCompetitorFeature(
                                                      'limitations',
                                                      limitationIndex,
                                                    )
                                                  }
                                                  className="mt-2 text-gray-400 hover:text-red-500"
                                                  type="button"
                                                >
                                                  <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M6 18L18 6M6 6l12 12"
                                                    />
                                                  </svg>
                                                </button>
                                              </div>
                                            ),
                                          )}
                                          <button
                                            onClick={() =>
                                              handleAddCompetitorFeature(
                                                'limitations',
                                              )
                                            }
                                            type="button"
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                          >
                                            + Add limitation
                                          </button>
                                        </div>
                                      </div>

                                      {/* Positioning Strategy */}
                                      <div className="col-span-2">
                                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                                          Positioning strategy
                                        </label>
                                        <textarea
                                          value={
                                            editCompetitorPositioningStrategy
                                          }
                                          onChange={(e) =>
                                            setEditCompetitorPositioningStrategy(
                                              e.target.value,
                                            )
                                          }
                                          rows={3}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                          placeholder="Enter positioning strategy"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-6">
                                      {/* Type */}
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-gray-700">
                                          Type
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {competitor.type}
                                        </div>
                                      </div>

                                      {/* Key Features */}
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-gray-700">
                                          Key features
                                        </div>
                                        <ul className="space-y-1">
                                          {competitor.keyFeatures.map(
                                            (feature, featureIndex) => (
                                              <li
                                                key={featureIndex}
                                                className="flex items-start gap-2 text-sm text-gray-600"
                                              >
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"></span>
                                                <span>{feature}</span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>

                                      {/* Strengths */}
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-gray-700">
                                          Strengths
                                        </div>
                                        <ul className="space-y-1">
                                          {competitor.strengths.map(
                                            (strength, strengthIndex) => (
                                              <li
                                                key={strengthIndex}
                                                className="flex items-start gap-2 text-sm text-gray-600"
                                              >
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"></span>
                                                <span>{strength}</span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>

                                      {/* Limitations */}
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-gray-700">
                                          Limitations
                                        </div>
                                        <ul className="space-y-1">
                                          {competitor.limitations.map(
                                            (limitation, limitationIndex) => (
                                              <li
                                                key={limitationIndex}
                                                className="flex items-start gap-2 text-sm text-gray-600"
                                              >
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400"></span>
                                                <span>{limitation}</span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>

                                      {/* Positioning Strategy */}
                                      <div className="col-span-2">
                                        <div className="mb-1 text-sm font-semibold text-gray-700">
                                          Positioning strategy
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {competitor.positioningStrategy}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Files Sidebar */}
            {product.files && product.files.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-white">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Files
                  </h3>
                  <div className="max-h-[600px] space-y-6 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {product.files.map((file, index) => (
                      <button
                        key={index}
                        // onClick={() => handleFileDownload(index)}
                        className="w-full bg-white text-sm transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <svg
                              className="h-4 w-4 shrink-0 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="truncate text-left text-gray-900">
                              {file.fileName}
                            </span>
                          </div>
                          {/* <svg
                            className="h-4 w-4 shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg> */}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Used In Tab */
          <div className="rounded-lg bg-white">
            <div>
              <div className="space-y-4 overflow-hidden rounded-2xl">
                {usageLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F6F8F8]">
                        <th className="rounded-xl px-6 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Roleplay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedUsage?.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-6 py-12 text-center">
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-900">
                                No roleplays yet
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Roleplays using this product will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsage?.map((roleplay: any) => (
                          <tr key={roleplay.id}>
                            <td className="px-6 py-4">
                              <Link
                                to={`/manage/scenario/${roleplay.id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {roleplay.title}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalItems > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.itemsPerPage}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  onPageChange={(page) => setUsageCurrentPage(page)}
                  onItemsPerPageChange={(itemsPerPage) =>
                    setUsageRowsPerPage(itemsPerPage)
                  }
                  itemLabel="Rows"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {product && (
        <EditProductModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            // Refetch product data to get updated files
            queryClient.invalidateQueries({ queryKey: ['product', id] });
          }}
          product={{
            id: product.id,
            name: product.name,
            files: product.files || [],
          }}
        />
      )}

      {/* Duplicate Product Modal */}
      {product && (
        <AddProductModal
          isOpen={duplicateModalOpen}
          onClose={() => {
            setDuplicateModalOpen(false);
            setDuplicateFiles([]);
          }}
          onSubmit={handleDuplicateSubmit}
          initialData={{
            name: product.name + ' Copy',
            files: duplicateFiles,
            generateCompetitiveIntelligence: false,
            duplicateCompetitiveIntelligence: !!product.competitiveIntelligence,
          }}
          duplicateId={product.id}
          hasCompetitiveIntelligence={!!product.competitiveIntelligence}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete product?"
        description="This will permanently remove the product. This action cannot be undone."
        confirmText="Delete"
        confirmButtonClassName="bg-red-600 data-[hover]:bg-red-700 data-[open]:bg-red-800"
      />
    </div>
  );
}, withManageAuthenticationRequiredOptions);
