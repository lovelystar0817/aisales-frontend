import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTitleBarStore } from '~/store/title-bar';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiManage } from '~/util/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { cn } from '~/util/utils';
import CustomRichTextArea from '../persona/components/CustomRichTextArea';
import { useUnsavedChanges } from '~/hooks/useUnsavedChanges';
import { DuplicateInfoBanner } from '~/components/DuplicateInfoBanner';

// Predefined criteria for Product Knowledge section
const PRODUCT_KNOWLEDGE_CRITERIA = [
  {
    title: 'Product pitch',
    description:
      'Scores proficiency in explaining product information. You will be asked to select a product when creating new roleplays.',
  },
  {
    title: 'Competitor differentiation',
    description:
      'Scores proficiency in differentiating your product against competitors. You will be asked to select a product when creating new roleplays, and we will search the internet to surface relevant competitor information.',
  },
];

const PREDEFINED_SECTIONS = [
  { value: 'custom', label: 'Custom section' },
  {
    value: 'product-knowledge',
    label: 'Product Knowledge',
  },
  // { value: 'communication-presence', label: 'Communication & presence' },
];

export default function ScorecardForm() {
  const titleBarStore = useTitleBarStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const queryClient = useQueryClient();

  // Determine mode: edit, duplicate, or create
  const isEditMode = !!id;
  const isDuplicateMode = !!duplicateId;

  const [name, setName] = useState('');
  const [sections, setSections] = useState([
    {
      id: 1,
      name: 'Section 1',
      type: 'custom',
      criteria: [{ id: 1, title: '', description: '', enabled: false }],
    },
  ]);
  const [selectedSectionId, setSelectedSectionId] = useState(1);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savedScorecardId, setSavedScorecardId] = useState<string | null>(null);

  // Show popup when trying to exit
  const { DialogComponent } = useUnsavedChanges({
    when: shouldBlockNavigation,
    entityType: 'scorecard',
  });

  // Navigate after successful save (ensures shouldBlockNavigation has updated)
  useEffect(() => {
    if (savedScorecardId && !shouldBlockNavigation) {
      navigate('/manage/scorecard/' + savedScorecardId);
    }
  }, [savedScorecardId, shouldBlockNavigation, navigate]);

  // Fetch existing scorecard data (for edit mode)
  const {
    data: scorecardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scorecard-edit', id],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/scorecard/${id}`)
          .get()
          .json<{
            success: boolean;
            scorecard: {
              id: string;
              name: string;
              sections: Array<{
                id: string;
                name: string;
                sectionType?: string;
                criteria: Array<{
                  id: string;
                  title: string;
                  description: string;
                  enabled?: boolean;
                }>;
              }>;
            };
          }>();
        return response.scorecard;
      } catch (error: unknown) {
        console.error('[Scorecard Query] Failed:', error);
        throw error;
      }
    },
    enabled: isEditMode,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch duplicate scorecard data (for duplicate mode)
  const { data: duplicateData } = useQuery({
    queryKey: ['scorecard-duplicate', duplicateId],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/scorecard/${duplicateId}`)
          .get()
          .json<any>();

        return response;
      } catch (error: unknown) {
        console.error('[Duplicate Scorecard Query] Failed:', error);
        toast.error('Failed to load scorecard for duplication');
        throw error;
      }
    },
    enabled: isDuplicateMode,
    retryDelay: 5000,
    retry: 3,
  });

  // Populate form fields when duplicate data is loaded
  useEffect(() => {
    if (duplicateData?.scorecard) {
      const scorecard = duplicateData.scorecard;
      setName(scorecard.name + ' Copy');

      // Deep copy sections and criteria
      if (scorecard.sections && scorecard.sections.length > 0) {
        const duplicatedSections = scorecard.sections.map(
          (section: any, index: number) => {
            const sectionType = section.sectionType || 'custom';
            let criteria;

            if (sectionType === 'product-knowledge') {
              // For product knowledge, include all predefined criteria and set enabled state
              const savedCriteriaTitles =
                section.criteria?.map((c: any) => c.title) || [];
              criteria = PRODUCT_KNOWLEDGE_CRITERIA.map(
                (predefinedCriteria, cIndex) => ({
                  id: Date.now() + index * 1000 + cIndex,
                  title: predefinedCriteria.title,
                  description: predefinedCriteria.description,
                  enabled: savedCriteriaTitles.includes(
                    predefinedCriteria.title,
                  ),
                }),
              );
            } else {
              // For custom sections, copy criteria as-is
              criteria = section.criteria?.map(
                (criteria: any, cIndex: number) => ({
                  id: Date.now() + index * 1000 + cIndex,
                  title: criteria.title || '',
                  description: criteria.description || '',
                  enabled:
                    criteria.enabled !== undefined ? criteria.enabled : false,
                }),
              ) || [
                {
                  id: Date.now() + index * 1000,
                  title: '',
                  description: '',
                  enabled: false,
                },
              ];
            }

            return {
              id: Date.now() + index,
              name: section.name,
              type: sectionType,
              criteria,
            };
          },
        );

        setSections(duplicatedSections);
        setSelectedSectionId(duplicatedSections[0].id);
      }
    }
  }, [duplicateData]);

  // Populate form with existing data (for edit mode)
  useEffect(() => {
    if (scorecardData) {
      setName(scorecardData.name);

      const transformedSections = scorecardData.sections.map(
        (section: any, index: number) => ({
          id: Date.now() + index,
          name: section.name,
          type: section.sectionType || 'custom',
          criteria:
            section.sectionType === 'product-knowledge'
              ? PRODUCT_KNOWLEDGE_CRITERIA.map((criterion, cIndex: number) => ({
                  id: Date.now() + index * 1000 + cIndex,
                  title: criterion.title,
                  description: criterion.description,
                  enabled: section.criteria.some(
                    (c: any) => c.title === criterion.title,
                  ),
                }))
              : section.criteria.map((criterion: any, cIndex: number) => ({
                  id: Date.now() + index * 1000 + cIndex,
                  title: criterion.title,
                  description: criterion.description,
                  enabled:
                    section.sectionType === 'product-knowledge' ? true : false,
                })),
        }),
      );

      setSections(transformedSections);
      if (transformedSections.length > 0) {
        setSelectedSectionId(transformedSections[0].id);
      }
    }
  }, [scorecardData]);

  // Save/Update mutation
  const saveScorecardMutation = useMutation({
    mutationFn: async (scorecardData: {
      name: string;
      sections: Array<{
        name: string;
        criteria: Array<{ title: string; description: string }>;
        type?: string;
      }>;
    }) => {
      if (!scorecardData.name.trim()) {
        throw new Error('Scorecard name is required');
      }

      const validSections = scorecardData.sections.filter(
        (section) =>
          section.name.trim() && section.criteria.some((c) => c.title.trim()),
      );

      if (validSections.length === 0) {
        throw new Error('At least one section with criteria is required');
      }

      // Use PUT for edit mode, POST for create mode
      const response = isEditMode
        ? await apiManage()
            .url(`/manage/scorecard/${id}`)
            .put({
              name: scorecardData.name.trim(),
              sections: validSections.map((section) => ({
                name: section.name.trim(),
                sectionType: section.type,
                criteria: section.criteria.filter((c) => c.title.trim()),
              })),
            })
            .json<{
              success: boolean;
              message: string;
              scorecard: { id: string; name: string };
            }>()
        : await apiManage()
            .url('/manage/scorecard/create')
            .post({
              name: scorecardData.name.trim(),
              sections: validSections.map((section) => ({
                name: section.name.trim(),
                criteria: section.criteria.filter((c) => c.title.trim()),
                sectionType: section.type,
              })),
            })
            .json<{
              success: boolean;
              message: string;
              scorecard: { id: string; name: string };
            }>();

      return response;
    },
    onSuccess: (data: any) => {
      setShouldBlockNavigation(false);
      if (isEditMode) {
        toast.success('Scorecard successfully updated');
        queryClient.invalidateQueries({ queryKey: ['scorecard', id] });
        queryClient.invalidateQueries({ queryKey: ['scorecard-edit', id] });
        navigate('/manage/scorecard/' + data.scorecard.id);
      } else {
        setSavedScorecardId(data.scorecard.id);
        queryClient.invalidateQueries({ queryKey: ['scorecards'] });
        toast.success('Scorecard successfully created');
      }
    },
    onError: (error: any) => {
      console.error('Error saving scorecard:', error);

      // Handle NAME_ALREADY_EXISTS error - check both possible error structures
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        setNameError(
          errorData.error ||
            'A scorecard with this name already exists. Please choose a different name.',
        );
        return;
      }

      if (error.response?.data?.details) {
        toast.error(error.response.data.details);
      } else if (error.json?.error) {
        toast.error(error.json.error);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          isEditMode
            ? 'Failed to update scorecard. Please try again.'
            : 'Failed to save scorecard. Please try again.',
        );
      }
    },
  });

  // Get available section options (disable already used non-custom sections)
  const getAvailableSectionOptions = () => {
    const usedTypes = sections
      .filter((s) => s.type !== 'custom')
      .map((s) => s.type);

    return PREDEFINED_SECTIONS.map((option) => ({
      ...option,
      disabled: option.value !== 'custom' && usedTypes.includes(option.value),
    }));
  };

  const addSection = (sectionType: string) => {
    const sectionLabel =
      PREDEFINED_SECTIONS.find((s) => s.value === sectionType)?.label || '';

    let criteria;
    if (sectionType === 'product-knowledge') {
      // For product knowledge, add predefined criteria with enabled state
      criteria = PRODUCT_KNOWLEDGE_CRITERIA.map((criteria, index) => ({
        id: Date.now() + index,
        title: criteria.title,
        description: criteria.description,
        enabled: index === 0, // First one enabled by default
      }));
    } else {
      criteria = [
        { id: Date.now(), title: '', description: '', enabled: false },
      ];
    }

    const newSection = {
      id: Date.now(),
      name: sectionType === 'custom' ? '' : sectionLabel,
      type: sectionType,
      criteria,
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    setShowSectionDropdown(false);
  };

  const removeSection = (sectionId: number) => {
    if (sections.length === 1) {
      toast.error('You must have at least one section');
      return;
    }
    const newSections = sections.filter((s) => s.id !== sectionId);
    setSections(newSections);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(newSections[0].id);
    }
  };

  const updateSection = (sectionId: number, name: string) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, name } : s)));
  };

  const addCriteria = (sectionId: number) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              criteria: [
                ...s.criteria,
                { id: Date.now(), title: '', description: '', enabled: false },
              ],
            }
          : s,
      ),
    );
  };

  const removeCriteria = (sectionId: number, criteriaId: number) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              criteria: s.criteria.filter((c) => c.id !== criteriaId),
            }
          : s,
      ),
    );
  };

  const updateCriteria = (
    sectionId: number,
    criteriaId: number,
    field: 'title' | 'description' | 'enabled',
    value: string | boolean,
  ) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              criteria: s.criteria.map((c) =>
                c.id === criteriaId ? { ...c, [field]: value } : c,
              ),
            }
          : s,
      ),
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a scorecard name');
      return;
    }

    const hasValidSection = sections.some(
      (section) =>
        section.name.trim() &&
        section.criteria.some(
          (c) =>
            c.title.trim() &&
            (section.type !== 'product-knowledge' || c.enabled),
        ),
    );

    if (!hasValidSection) {
      toast.error('Please add at least one section with criteria');
      return;
    }

    // Additional validation for edit mode
    if (
      isEditMode &&
      sections.some(
        (s) =>
          s.type === 'product-knowledge' && !s.criteria.some((c) => c.enabled),
      )
    ) {
      toast.error(
        'Please enabled at least one criteria for Product Knowledge section',
      );
      return;
    }

    saveScorecardMutation.mutate({
      name,
      sections: sections.map((s) => ({
        name: s.name,
        type: s.type,
        criteria: s.criteria.filter(
          (c) =>
            c.title.trim() && (s.type !== 'product-knowledge' || c.enabled),
        ),
      })),
    });
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSectionDropdown(false);
      }
    };

    if (showSectionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSectionDropdown]);

  useEffect(() => {
    const title = isEditMode
      ? 'Edit scorecard'
      : isDuplicateMode
        ? 'Duplicate scorecard'
        : 'Create scorecard';
    titleBarStore.setTitle(title);

    const createButton = () => (
      <button
        onClick={() => handleSaveRef.current()}
        disabled={saveScorecardMutation.isPending}
        className="bg-primary rounded-full px-6 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveScorecardMutation.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </span>
        ) : (
          'Save'
        )}
      </button>
    );

    titleBarStore.setAction(createButton(), () => {});

    return () => {
      titleBarStore.reset();
    };
  }, [saveScorecardMutation.isPending, isEditMode, isDuplicateMode]);

  // Show loading state while fetching data (edit mode only)
  if (isEditMode && isLoading) {
    return (
      <div className="mx-auto mb-50 max-w-4xl rounded-lg bg-white p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show error state if query failed (edit mode only)
  if (isEditMode && error) {
    return (
      <div className="mx-auto mb-50 max-w-4xl rounded-lg bg-white p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-red-600">
            <p className="text-lg font-medium">Failed to load scorecard</p>
            <p className="mt-2 text-sm">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
          <button
            onClick={() => navigate('/manage/scorecard')}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Back to Scorecards
          </button>
        </div>
      </div>
    );
  }

  // Show error if no data (edit mode only, defensive check)
  if (isEditMode && !scorecardData) {
    return (
      <div className="mx-auto mb-50 max-w-4xl rounded-lg bg-white p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-gray-600">
            <p className="text-lg font-medium">Scorecard not found</p>
          </div>
          <button
            onClick={() => navigate('/manage/scorecard')}
            className="mt-4 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Back to Scorecards
          </button>
        </div>
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const availableSectionOptions = getAvailableSectionOptions();

  return (
    <div className="mx-auto mb-50 max-w-4xl rounded-lg bg-white">
      <div className="p-8">
        <DuplicateInfoBanner
          show={isDuplicateMode}
          translationKey="manage.scorecard.duplicateNotice"
          defaultMessage="Duplicated scorecard is not affecting or linked to any roleplay yet."
          t={t}
        />
        <div className={`${isDuplicateMode ? 'my-6' : 'mb-6'} w-full border-b border-gray-200 pb-6`}>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Name
          </label>
          <input
            type="text"
            placeholder="E.g. Discovery Call Scorecard"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            className={`focus:ring-0.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
              nameError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-primary-500'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
          {!nameError && (
            <p className="mt-1 text-xs text-gray-500">
              This is the scorecard name that will be displayed to users.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <div className="border-r border-gray-200 pr-6">
            <h3 className="text-md mb-4 font-semibold text-gray-900">
              Sections
            </h3>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedSectionId === section.id
                      ? 'bg-gray-100 font-medium text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {section.name || 'Untitled section'}
                </button>
              ))}
              <button
                onClick={() => setShowSectionDropdown(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                <span className="text-lg">+</span>
                Add new section
              </button>
              {showSectionDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  {availableSectionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        addSection(option.value);
                      }}
                      disabled={option.disabled}
                      className={cn(
                        'block w-full px-3 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSection && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {selectedSection.type === 'product-knowledge' ? (
                    <label className="text-md mb-2 block font-semibold text-gray-900">
                      Product knowledge
                    </label>
                  ) : (
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Section name
                    </label>
                  )}
                  {selectedSection.type !== 'product-knowledge' && (
                    <input
                      type="text"
                      placeholder="Section 1"
                      value={selectedSection.name}
                      onChange={(e) =>
                        updateSection(selectedSection.id, e.target.value)
                      }
                      disabled={selectedSection.type !== 'custom'}
                      className="focus:ring-0.5 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  )}
                </div>
                {sections.length > 1 && (
                  <button
                    onClick={() => removeSection(selectedSection.id)}
                    className={`mt-${selectedSection.type === 'product-knowledge' ? '0' : '7'} ml-4 text-sm text-red-600 hover:text-red-700`}
                  >
                    Remove section
                  </button>
                )}
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold text-gray-900">
                  Criteria
                </h4>
                <div className="space-y-4">
                  {selectedSection.type === 'product-knowledge' ? (
                    selectedSection.criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="flex items-start gap-4 rounded-lg"
                      >
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={criterion.enabled}
                            onChange={(e) =>
                              updateCriteria(
                                selectedSection.id,
                                criterion.id,
                                'enabled',
                                e.target.checked,
                              )
                            }
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                        <div className="flex-1">
                          <h5 className="mb-1 text-sm font-semibold text-gray-900">
                            {criterion.title}
                          </h5>
                          <p className="text-sm text-gray-600">
                            {criterion.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {selectedSection.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="space-y-3 rounded-lg"
                        >
                          <div className="grid grid-cols-[2fr_3fr_auto] items-start">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-900">
                                Title
                              </label>
                              <input
                                type="text"
                                placeholder="E.g. Objection handling"
                                value={criterion.title}
                                onChange={(e) =>
                                  updateCriteria(
                                    selectedSection.id,
                                    criterion.id,
                                    'title',
                                    e.target.value,
                                  )
                                }
                                className="focus:ring-0.5 focus:ring-primary-500 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label className="mb-2 block text-sm font-medium text-gray-900">
                                Description
                              </label>
                              <CustomRichTextArea
                                value={criterion.description}
                                onChange={(value) =>
                                  updateCriteria(
                                    selectedSection.id,
                                    criterion.id,
                                    'description',
                                    value,
                                  )
                                }
                                placeholder={
                                  'Describe how this criteria should be demonstrated (e.g. acknowledges concerns, responds calmly, and redirects with confidence).'
                                }
                                minHeight="100px"
                                className="rounded-lg py-2"
                              />
                            </div>
                            {selectedSection.criteria.length > 1 && (
                              <div className="mt-9 flex items-end">
                                <button
                                  onClick={() =>
                                    removeCriteria(
                                      selectedSection.id,
                                      criterion.id,
                                    )
                                  }
                                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-500 text-gray-500 hover:bg-gray-100"
                                >
                                  <span className="text-md font-semibold">
                                    −
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addCriteria(selectedSection.id)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <span className="text-lg">+</span>
                        Add new criteria
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes dialog */}
      <DialogComponent />
    </div>
  );
}
