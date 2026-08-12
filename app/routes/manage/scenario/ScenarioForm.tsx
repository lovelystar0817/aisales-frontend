import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTitleBarStore } from '~/store/title-bar';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { cn } from '~/util/utils';
import { Button } from '~/components/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiManage } from '~/util/api';
import { queryClient } from '~/util/react-query';
import { ScenarioPreview } from './components/ScenarioPreview';
import { RoleplayOverview } from './components/RoleplayOverview';
import { RoleplaySetupForm } from './components/RoleplaySetupForm';
import { StepIndicator } from './components/StepIndicator';
import { useUnsavedChanges } from '~/hooks/useUnsavedChanges';

interface ScenarioPreview {
  title: string;
  description: string;
  primaryObjection: string;
}

interface RoleplayFormData {
  moduleId: string;
  personaId: string;
  scorecardId: string;
  productId: string;
}

const STEPS = [
  { number: 1, label: 'Roleplay setup' },
  { number: 2, label: 'Scenario refinement' },
];

export default function ScenarioForm() {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [searchParams] = useSearchParams();
  const titleBarStore = useTitleBarStore();

  // Determine mode
  const isEditMode = !!scenarioId;
  const isCreateMode = !isEditMode;

  const [roleplayForm, setRoleplayForm] = useState<RoleplayFormData>({
    moduleId: searchParams.get('moduleId') || '',
    personaId: '',
    scorecardId: '',
    productId: '',
  });

  const [roleplayStep, setRoleplayStep] = useState(1);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [scenarioPreview, setScenarioPreview] =
    useState<ScenarioPreview | null>(null);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);
  const [savedModuleId, setSavedModuleId] = useState<string | null>(null);
  const [hasLoadedScenario, setHasLoadedScenario] = useState(false);

  // Show popup when trying to exit
  const { DialogComponent } = useUnsavedChanges({
    when: shouldBlockNavigation,
    entityType: 'scenario',
  });

  // Navigate after successful save (ensures shouldBlockNavigation has updated)
  useEffect(() => {
    if (savedModuleId && !shouldBlockNavigation) {
      navigate('/manage/scenario?moduleId=' + savedModuleId);
    }
  }, [savedModuleId, shouldBlockNavigation, navigate]);

  // Fetch existing scenario (for edit mode)
  const {
    data: existingScenario,
    isLoading: isLoadingScenario,
    error: scenarioError,
  } = useQuery({
    queryKey: ['scenario', scenarioId],
    queryFn: async () => {
      const response = await apiManage()
        .url(`/manage/scenario/edit/${scenarioId}`)
        .get()
        .json<{
          success: boolean;
          scenario: {
            id: string;
            module: string;
            persona: string;
            scorecard: string;
            product?: string;
            scenarioDetails: {
              salesGoal: string;
              salesDescription: string;
              mainObjection: string;
            };
            isActive: boolean;
          };
        }>();

      if (!response.success) {
        throw new Error('Failed to load scenario');
      }
      return response.scenario;
    },
    enabled: isEditMode,
    staleTime: 0,
  });

  // Fetch all required data with consistent configuration
  const queryConfig = {
    staleTime: 5 * 60 * 1000,
    retry: 2,
  };

  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/scenario/modules')
        .get()
        .json<{ success: boolean; modules: any[] }>();
      return response.modules || [];
    },
    ...queryConfig,
  });

  const { data: personas = [], isLoading: isLoadingPersonas } = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/persona/list')
        .query({ page: 1, limit: 100 })
        .get()
        .json<{ success: boolean; personas: any[] }>();
      return response.personas || [];
    },
    ...queryConfig,
  });

  const { data: scorecards = [], isLoading: isLoadingScorecards } = useQuery({
    queryKey: ['scorecards'],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/scorecard')
        .query({ page: 1, limit: 100 })
        .get()
        .json<{ success: boolean; scorecards: any[] }>();
      return response.scorecards || [];
    },
    ...queryConfig,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiManage()
        .url('/manage/products')
        .query({ page: 1, limit: 100 })
        .get()
        .json<{ success: boolean; products: any[] }>();
      return response.products || [];
    },
    ...queryConfig,
  });

  // Load existing scenario data into form (for edit mode)
  useEffect(() => {
    if (existingScenario && !hasLoadedScenario) {
      setRoleplayForm({
        moduleId: existingScenario.module,
        personaId: existingScenario.persona,
        scorecardId: existingScenario.scorecard,
        productId: existingScenario.product || '',
      });
      setScenarioPreview({
        title: existingScenario.scenarioDetails.salesGoal,
        description: existingScenario.scenarioDetails.salesDescription,
        primaryObjection: existingScenario.scenarioDetails.mainObjection,
      });
      setIsActive(existingScenario.isActive);
      setHasLoadedScenario(true);
    }
  }, [existingScenario, hasLoadedScenario]);

  // Helper function to find selected items
  const getSelectedItem = (items: any[], id: string) => {
    return items.find((item) => item.id === id || item._id === id);
  };

  const selectedModule = getSelectedItem(modules, roleplayForm.moduleId);
  const selectedPersona = getSelectedItem(personas, roleplayForm.personaId);
  const selectedScorecard = getSelectedItem(
    scorecards,
    roleplayForm.scorecardId,
  );
  const selectedProduct = getSelectedItem(products, roleplayForm.productId);

  // Initial preview/regenerate preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiManage()
        .url('/manage/scenario/preview-scenario')
        .post(roleplayForm)
        .json<{ success: boolean; preview: ScenarioPreview }>();

      if (!response.success) {
        throw new Error('Failed to generate preview');
      }
      return response.preview;
    },
    onSuccess: (data) => {
      setScenarioPreview(data);
      if (isEditMode) {
        toast.success('Preview regenerated successfully!');
      }
    },
    onError: () =>
      toast.error(
        isEditMode
          ? 'Failed to regenerate preview'
          : 'Failed to generate scenario preview',
      ),
  });

  // Refinement mutation
  const refineMutation = useMutation({
    mutationFn: async (prompt: string) => {
      if (!scenarioPreview) {
        throw new Error('No scenario preview to refine');
      }

      const response = await apiManage()
        .url('/manage/scenario/refine-scenario')
        .post({
          initialPreview: scenarioPreview,
          refinementPrompt: prompt,
        })
        .json<{ success: boolean; preview: ScenarioPreview }>();

      if (!response.success) {
        throw new Error('Failed to refine scenario');
      }
      return response.preview;
    },
    onSuccess: (data) => {
      setScenarioPreview(data);
      setRefinementPrompt('');
      toast.success('Scenario refined successfully!');
    },
    onError: () => toast.error('Failed to refine scenario'),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!scenarioPreview) {
        throw new Error('No scenario preview to save');
      }

      // Use PUT for edit mode, POST for create mode
      const response = isEditMode
        ? await apiManage()
            .url(`/manage/scenario/update-scenario/${scenarioId}`)
            .put({
              moduleId: roleplayForm.moduleId,
              personaId: roleplayForm.personaId,
              scorecardId: roleplayForm.scorecardId,
              productId: roleplayForm.productId || undefined,
              scenarioPreview,
              isActive: isActive ? true : false,
            })
            .json<{
              success: boolean;
              scenario?: { id: string };
              error?: string;
            }>()
        : await apiManage()
            .url('/manage/scenario/create-scenario')
            .post({
              moduleId: roleplayForm.moduleId,
              personaId: roleplayForm.personaId,
              scorecardId: roleplayForm.scorecardId,
              productId: roleplayForm.productId || undefined,
              scenarioPreview,
              isActive: isActive ? true : false,
            })
            .json<{
              success: boolean;
              scenario?: { id: string };
              error?: string;
            }>();

      if (!response.success) {
        throw new Error(
          response.error ||
            (isEditMode
              ? 'Failed to update scenario'
              : 'Failed to create scenario'),
        );
      }
      return response.scenario;
    },
    onSuccess: (data) => {
      setShouldBlockNavigation(false);
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });

      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['scenario', scenarioId] });
        toast.success('Roleplay updated successfully!');
        navigate('/manage/scenario?moduleId=' + roleplayForm.moduleId || '');
      } else {
        setSavedModuleId(roleplayForm.moduleId);
        toast.success('Roleplay created successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          (isEditMode
            ? 'Failed to update roleplay'
            : 'Failed to create roleplay'),
      );
    },
  });

  // Generate initial preview when moving to step 2 (create mode only)
  useEffect(() => {
    if (
      isCreateMode &&
      roleplayStep === 2 &&
      roleplayForm.moduleId &&
      !scenarioPreview &&
      !previewMutation.isPending
    ) {
      previewMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleplayStep, roleplayForm.moduleId, scenarioPreview, isCreateMode]);

  // Update form field
  const updateField = (field: keyof RoleplayFormData, value: string) => {
    setRoleplayForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!roleplayForm.moduleId) {
      toast.error('Please select a scenario');
      return;
    }
    setRoleplayStep(2);
  };

  const handleSave = () => {
    if (!scenarioPreview) {
      toast.error('No scenario preview available');
      return;
    }
    saveMutation.mutate();
  };

  const handleRefine = () => {
    if (!refinementPrompt.trim()) {
      toast.error('Please enter a refinement prompt');
      return;
    }
    refineMutation.mutate(refinementPrompt);
  };

  const handleBack = () => {
    if (roleplayStep === 1) {
      navigate(-1);
    } else {
      setRoleplayStep(1);
      if (isCreateMode) {
        setScenarioPreview(null);
      }
      setRefinementPrompt('');
    }
  };

  // Title bar setup with step indicators
  useEffect(() => {
    titleBarStore.setTitle(isEditMode ? 'Edit roleplay' : 'Create roleplay');
    titleBarStore.setAction(
      <StepIndicator currentStep={roleplayStep} steps={STEPS} />,
      () => {},
    );
    return () => titleBarStore.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleplayStep, isEditMode]);

  const isLoading =
    isLoadingModules ||
    isLoadingPersonas ||
    isLoadingScorecards ||
    isLoadingProducts ||
    (isEditMode && isLoadingScenario);

  // Render loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  // Render error state (edit mode only)
  if (isEditMode && scenarioError) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl bg-red-50 p-6 text-center">
          <p className="text-red-600">
            Failed to load scenario. Please try again.
          </p>
          <Button
            variant="custom"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mx-auto mb-50',
        roleplayStep === 1 ? 'max-w-[600px]' : 'max-w-[1060px]',
      )}
    >
      {roleplayStep === 1 ? (
        <RoleplaySetupForm
          roleplayForm={roleplayForm}
          modules={modules}
          personas={personas}
          scorecards={scorecards}
          products={products}
          onFieldChange={updateField}
          onCancel={handleBack}
          onNext={handleNext}
        />
      ) : (
        <div className="flex gap-6">
          <RoleplayOverview
            selectedPersona={selectedPersona}
            selectedModule={selectedModule}
            selectedScorecard={selectedScorecard}
            selectedProduct={selectedProduct}
            personaId={roleplayForm.personaId}
            scorecardId={roleplayForm.scorecardId}
          />
          <ScenarioPreview
            scenarioPreview={scenarioPreview}
            refinementPrompt={refinementPrompt}
            isActive={isActive}
            isGenerating={previewMutation.isPending}
            isRefining={refineMutation.isPending}
            isSaving={saveMutation.isPending}
            onRefinementPromptChange={setRefinementPrompt}
            onRefine={handleRefine}
            onActiveToggle={setIsActive}
            onBack={handleBack}
            onSave={handleSave}
            saveButtonText={isEditMode ? 'Update' : 'Save'}
          />
        </div>
      )}

      {/* Unsaved changes dialog */}
      <DialogComponent />
    </div>
  );
}
