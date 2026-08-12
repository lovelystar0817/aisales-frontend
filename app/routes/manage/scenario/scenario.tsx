import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '~/components/button';
import { ActionDropdown } from '../settings/components/ActionDropdown';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiManage } from '~/util/api';
import toast from 'react-hot-toast';
import {
  ScenarioModuleModal,
  type ScenarioFormData,
} from './components/ScenarioModuleModal';
import { Pagination } from '~/components/Pagination';
import { ScenarioCard } from './components/ScenarioCard';
import { ConfirmationModal } from '~/components/ConfirmationModal';
import { CustomDropdown } from '~/components/CustomDropdown';

type ModalMode = 'create' | 'view' | 'edit';

interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  persona: {
    id: string;
    name: string;
    image?: string;
    occupation?: string;
    age?: number;
  };
  scorecard: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
  };
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Scenario = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedModule, setSelectedModule] = useState<any>(
    searchParams.get('moduleId') ?? null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    null,
  );

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: ModalMode;
    data?: ScenarioFormData;
    duplicateId?: string | null;
    titleError?: string | null;
  }>({
    isOpen: new URLSearchParams(window.location.search).get('modal') === 'open',
    mode: 'create',
    data: undefined,
    duplicateId: null,
    titleError: null,
  });

  // Fetch modules using React Query
  const {
    data: modules,
    isLoading: isLoadingModules,
    error: modulesError,
  } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await apiManage()
        .url(`/manage/scenario/modules`)
        .get()
        .json<{ success: boolean; modules: any[] }>();

      if (!response.success) {
        throw new Error('Failed to fetch modules');
      }

      return response.modules;
    },
    staleTime: 30000,
  });

  // Fetch scenarios for selected module
  const {
    data: scenariosData,
    isLoading: isLoadingScenarios,
    error: scenariosError,
  } = useQuery({
    queryKey: [
      'scenarios',
      selectedModule?._id,
      searchTerm,
      productFilter,
      statusFilter,
      page,
      itemsPerPage,
    ],
    queryFn: async () => {
      if (!selectedModule?._id) return { scenarios: [], pagination: null };

      const response = await apiManage()
        .url(`/manage/scenario/scenarios/${selectedModule._id}`)
        .query({
          page,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          productId:
            productFilter && productFilter !== 'all'
              ? productFilter
              : undefined,
          status:
            statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        })
        .get()
        .json<{
          success: boolean;
          scenarios: RoleplayScenario[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        }>();

      if (!response.success) {
        throw new Error('Failed to fetch scenarios');
      }

      return response;
    },
    enabled: !!selectedModule?._id,
    staleTime: 30000,
  });

  const scenarios = scenariosData?.scenarios || [];
  const pagination = scenariosData?.pagination;

  // Fetch products for filter dropdown
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/products')
        .query({ page: 1, limit: 100 })
        .get()
        .json<{ success: boolean; products: any[] }>();
      return response.products || [];
    },
  });

  useEffect(() => {
    if (modules && modules.length > 0) {
      const moduleId = searchParams.get('moduleId');

      if (moduleId) {
        const found = modules.find((m: any) => m._id === moduleId);
        if (found) {
          setSelectedModule(found);
        }
      } else {
        // No moduleId in search params, default to first module
        setSelectedModule(modules[0]);
      }
    }
  }, [modules, searchParams.get('moduleId')]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, productFilter, statusFilter, selectedModule?._id]);

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      const response = await apiManage()
        .url('/manage/scenario/create-module')
        .post({
          title: data.title,
          description: data.description,
          scenarioSetup: data.scenarioSetup,
          objectives: data.objectives,
        })
        .json<{
          success: boolean;
          message: string;
          module: { _id: string; title: string };
        }>();

      return response;
    },
    onSuccess: async (response) => {
      toast.success('Scenario successfully created');

      // Update search params first - this will be picked up by useEffect after modules refetch
      setSearchParams({ moduleId: response.module._id });

      // Refetch modules - when this completes, the useEffect will run and set selectedModule
      await queryClient.refetchQueries({ queryKey: ['modules'] });

      setModalState({
        isOpen: false,
        mode: 'create',
        data: undefined,
        duplicateId: null,
        titleError: null,
      });
    },
    onError: (error: any) => {
      console.error('Error saving scenario:', error);

      // Handle NAME_ALREADY_EXISTS error - check both possible error structures
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        setModalState((prev) => ({
          ...prev,
          titleError:
            errorData.error ||
            'A scenario with this name already exists. Please choose a different name.',
        }));
        return;
      }

      toast.error(
        errorData?.error || 'Failed to save scenario. Please try again.',
      );
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      const response = await apiManage()
        .url(`/manage/scenario/modules/${data._id}`)
        .put({
          title: data.title,
          description: data.description,
          scenarioSetup: data.scenarioSetup,
          objectives: data.objectives,
        })
        .json<{
          success: boolean;
          message: string;
          module: any;
        }>();

      return response;
    },
    onSuccess: () => {
      toast.success('Scenario successfully updated');
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setModalState({
        isOpen: false,
        mode: 'create',
        data: undefined,
        duplicateId: null,
        titleError: null,
      });
    },
    onError: (error: any) => {
      console.error('Error updating scenario:', error);

      // Handle NAME_ALREADY_EXISTS error - check both possible error structures
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        setModalState((prev) => ({
          ...prev,
          titleError:
            errorData.error ||
            'A scenario with this name already exists. Please choose a different name.',
        }));
        return;
      }

      toast.error(
        errorData?.error || 'Failed to update scenario. Please try again.',
      );
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiManage()
        .url(`/manage/scenario/modules/${id}`)
        .delete()
        .json<{ success: boolean }>();

      if (!response.success) {
        throw new Error('Failed to delete scenario');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Scenario deleted successfully!');
      setSelectedModule(null);
      setIsDeleteModalOpen(false);
    },
  });

  // Delete roleplay scenario mutation
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiManage()
        .url(`/manage/scenario/scenarios/${id}`)
        .delete()
        .json<{ success: boolean }>();

      if (!response.success) {
        throw new Error('Failed to delete roleplay');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Roleplay deleted successfully!');
      setIsDeleteModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete roleplay');
    },
  });
  // Update roleplay scenario status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async (params: { scenarioId: string; isActive: boolean }) => {
      const response = await apiManage()
        .url(`/manage/scenario/${params.scenarioId}/update-status`)
        .post({
          isActive: params.isActive,
        })
        .json<{ success: boolean }>();

      if (!response.success) {
        throw new Error('Failed to update roleplay status');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Roleplay status updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update roleplay status');
    },
  });

  const handleModalSubmit = (data: ScenarioFormData) => {
    if (modalState.mode === 'create') {
      createModuleMutation.mutate(data);
    } else if (modalState.mode === 'edit') {
      updateModuleMutation.mutate(data);
    }
  };

  const handleModalClose = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      data: undefined,
      duplicateId: null,
      titleError: null,
    });
  };

  const deleteModule = async () => {
    if (!selectedModuleId) {
      return;
    }
    try {
      await deleteModuleMutation.mutateAsync(selectedModuleId);
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };

  const deleteScenario = async () => {
    if (!selectedScenarioId) return;
    try {
      await deleteScenarioMutation.mutateAsync(selectedScenarioId);
    } catch (error) {
      console.error('Error deleting roleplay:', error);
    }
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsDeleteModalOpen(true);
  };

  const handleChangeStatus = async (scenarioId: string, isActive: boolean) => {
    console.log(scenarioId, isActive);
    if (scenarioId) {
      await changeStatusMutation.mutateAsync({ scenarioId, isActive });
    }
  };

  const openViewModal = (module: any) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      data: module,
      titleError: null,
    });
  };

  const openEditModal = (module: any) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      data: module,
      titleError: null,
    });
  };

  const openDuplicateModal = (module: any) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      data: {
        ...module,
        title: module.title + ' Copy',
        objectives: module?.objectives
          ?.map((item: string) => `• ${item}`)
          .join('\n'),
      },
      duplicateId: module._id,
      titleError: null,
    });
  };

  const openCreateModal = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      data: undefined,
      duplicateId: null,
      titleError: null,
    });
  };

  const getModuleActions = (module: any) => [
    {
      label: 'View',
      onClick: () =>
        openViewModal({
          ...module,
          objectives: module?.objectives
            ?.map((item: string) => `• ${item}`)
            .join('\n'),
        }),
    },
    {
      label: 'Edit',
      onClick: () =>
        openEditModal({
          ...module,
          objectives: module?.objectives
            ?.map((item: string) => `• ${item}`)
            .join('\n'),
        }),
      disabled: module.roleplays > 0,
      tooltip:
        module.roleplays > 0
          ? 'Scenarios linked to a roleplay cannot be edited. Reassign the roleplays to another scenario to edit.'
          : '',
      tooltipClassName: 'right-0',
    },
    {
      label: 'Duplicate',
      onClick: () => openDuplicateModal(module),
    },
    {
      label: 'Delete',
      onClick: () => {
        setIsDeleteModalOpen(true);
        setSelectedModuleId(module._id);
      },
      disabled: module.roleplays > 0,
      className: 'text-red-600',
      tooltip:
        module.roleplays > 0
          ? 'Scenarios linked to a roleplay cannot be deleted. Reassign the roleplays to another scenario to delete.'
          : '',
      tooltipClassName: 'right-0',
    },
  ];

  const isModalLoading =
    createModuleMutation.isPending || updateModuleMutation.isPending;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">Scenario</h2>
          <Button
            variant="custom"
            onClick={openCreateModal}
            className="text-primary-500 hover:bg-primary-100 flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF0EB] py-3 text-sm"
          >
            <Plus size={16} />
            Create scenario
          </Button>
        </div>

        {/* Module List */}
        <div className="space-y-2">
          {isLoadingModules ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading scenarios...</div>
            </div>
          ) : modulesError ? (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-600">Failed to load scenarios</p>
            </div>
          ) : modules?.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No scenarios yet</p>
            </div>
          ) : (
            modules?.map((module: any) => (
              <div
                key={module._id}
                className={`relative cursor-pointer rounded-lg p-4 transition-colors ${
                  selectedModule?._id === module._id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedModule(module);
                  setSearchParams({ moduleId: module._id });
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {module.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {module.roleplays || 0} roleplay
                      {module.roleplays !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ActionDropdown actions={getModuleActions(module)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white">
        {selectedModule ? (
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-xl font-semibold">{selectedModule.title}</h1>
              <Button
                variant="primary"
                onClick={() =>
                  navigate(
                    `/manage/scenario/new?moduleId=${selectedModule._id}`,
                  )
                }
                size="lg"
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Create roleplay
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center gap-4">
              {/* Product Filter */}
              <CustomDropdown
                value={productFilter}
                onChange={setProductFilter}
                options={[
                  {
                    value: 'all',
                    label: 'All items',
                  },
                  {
                    value: 'no-product',
                    label: 'No product',
                  },
                  ...products.map((product: any) => ({
                    value: product.id || product._id,
                    label: product.name,
                  })),
                ]}
                onlyFirstRowDivider={true}
                placeholder="Product"
              />

              {/* Status Filter */}
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  {
                    value: 'all',
                    label: 'All items',
                  },
                  {
                    value: 'active',
                    label: 'Active',
                  },
                  {
                    value: 'inactive',
                    label: 'Inactive',
                  },
                ]}
                onlyFirstRowDivider={true}
                placeholder="Status"
              />

              {/* Search */}
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Roleplay Table */}
            {isLoadingScenarios ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-gray-500">
                  Loading roleplays...
                </div>
              </div>
            ) : scenariosError ? (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-600">Failed to load roleplays</p>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="rounded-lg p-12 text-center">
                <p className="mb-2 text-lg font-medium text-gray-900">
                  No roleplays yet
                </p>
                <p className="mb-6 text-sm text-gray-500">
                  Create your first roleplay for this scenario
                </p>
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(
                      `/manage/scenario/new?moduleId=${selectedModule._id}`,
                    )
                  }
                  size="lg"
                >
                  <Plus size={16} />
                  Create roleplay
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <ScenarioCard
                    scenario={scenario}
                    key={scenario.id}
                    handleChangeStatus={handleChangeStatus}
                    handleDeleteScenario={handleDeleteScenario}
                  />
                ))}
                {/* Pagination */}
                {scenarios.length > 0 && pagination && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    hasNextPage={pagination.hasNextPage}
                    hasPreviousPage={pagination.hasPreviousPage}
                    onPageChange={setPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setPage(1); // Reset to first page when changing items per page
                    }}
                    itemLabel="Rows"
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold">No roleplays yet</h2>
              <p className="mb-8 text-gray-600">
                Please create your first scenario to start creating your
                roleplays
              </p>
              <button
                onClick={openCreateModal}
                className="bg-primary-500 hover:bg-primary-600 mx-auto flex items-center gap-2 rounded-full px-6 py-3 font-medium text-white transition-colors"
              >
                <Plus size={20} />
                Create scenario
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onSubmit={selectedModuleId ? deleteModule : deleteScenario}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedScenarioId(null);
          setSelectedModuleId(null);
        }}
        title={selectedModuleId ? 'Delete scenario?' : 'Delete roleplay?'}
        description={
          selectedModuleId
            ? 'This will permanently remove the scenario. This action cannot be undone.'
            : 'This will permanently remove the roleplay. This action cannot be undone.'
        }
      />

      {/* Scenario Modal */}
      <ScenarioModuleModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        mode={modalState.mode}
        initialData={modalState.data}
        isLoading={isModalLoading}
        duplicateId={modalState.duplicateId}
        titleError={modalState.titleError}
      />
    </div>
  );
};

export default Scenario;
