import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useTitleBarStore } from '~/store/title-bar';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { apiManage } from '~/util/api';
import TraitsPopup from './components/TraitsPopup';
import toast from 'react-hot-toast';
import { PersonaAvatar } from './components/PersonaAvatar';
import { CustomDropdown } from '~/components/CustomDropdown';
import type { PersonaDetails } from '~/routes/app/roleplay/types';
import CustomRichTextArea from './components/CustomRichTextArea';
import { LanguageVoiceSelector } from './components/LanguageVoiceSelector';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useUnsavedChanges } from '~/hooks/useUnsavedChanges';
import { DuplicateInfoBanner } from '~/components/DuplicateInfoBanner';

interface PersonaEditData {
  success: boolean;
  persona: {
    id: string;
    friendlyId: string;
    name: string;
    age: number;
    gender: string;
    image: string;
    occupation: string;
    description: string;
    details: PersonaDetails;
    personalityDetails: any;
    voice: {
      _id: string;
      accent: string;
      language: string;
    };
    localizations?: Record<
      string,
      {
        voice?: {
          _id: string;
          name: string;
          language: string;
        };
      }
    >;
    supportingFields: Array<{ fieldName: string; value: string }>;
  };
}

export default function PersonaForm() {
  const titleBarStore = useTitleBarStore();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const generateButtonRef = useRef<HTMLButtonElement>(null);
  const perLanguageVoiceEnabled = useFeatureFlagEnabled(
    'self-serve_lang-voice-selector',
  );

  // Determine mode: edit, duplicate, or create
  const isEditMode = !!id;
  const isDuplicateMode = !!duplicateId;
  const isCreateMode = !isEditMode;

  const [showTraitModal, setShowTraitModal] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState('');
  const [personalityText, setPersonalityText] = useState('');
  const [languageVoices, setLanguageVoices] = useState<Record<string, string>>(
    {},
  );
  const [supportingFields, setSupportingFields] = useState([
    { id: 1, fieldName: '', value: '' },
  ]);
  const [personalityTrait, setPersonalityTrait] = useState('');
  const [decisionMakingStyle, setDecisionMakingStyle] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [accent, setAccent] = useState('');
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savedPersonaId, setSavedPersonaId] = useState<string | null>(null);

  // Show popup when trying to exit
  const { DialogComponent } = useUnsavedChanges({
    when: shouldBlockNavigation,
    entityType: 'persona',
  });

  // Fetch avatars
  const { data: avatars } = useQuery({
    queryKey: ['persona-avatars'],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url('/manage/persona/persona-avatars')
          .get()
          .json<any[]>();

        return response;
      } catch (error: unknown) {
        console.error('[SelectClient Query] Failed:', error);
        throw error;
      }
    },
    retryDelay: 5000,
    retry: 5,
  });

  // Fetch existing persona data (for edit mode)
  const {
    data: personaData,
    isLoading: isLoadingPersona,
    error: personaError,
  } = useQuery({
    queryKey: ['persona', id],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/persona/${id}`)
          .get()
          .json<PersonaEditData>();

        return response;
      } catch (error: unknown) {
        console.error('[Persona Edit Query] Failed:', error);
        throw error;
      }
    },
    enabled: isEditMode,
    retryDelay: 5000,
    retry: 3,
  });

  // Fetch duplicate persona data (for duplicate mode)
  const { data: duplicateData, isLoading: isDuplicateLoading } = useQuery({
    queryKey: ['persona-duplicate', duplicateId],
    queryFn: async () => {
      try {
        const response = await apiManage()
          .url(`/manage/persona/${duplicateId}`)
          .get()
          .json<any>();

        return response;
      } catch (error: unknown) {
        console.error('[Duplicate Persona Query] Failed:', error);
        toast.error('Failed to load persona for duplication');
        throw error;
      }
    },
    enabled: isDuplicateMode,
    retryDelay: 5000,
    retry: 3,
  });

  // Save/Update mutation
  const savePersonaMutation = useMutation({
    mutationFn: async (personaData: {
      name: string;
      age: string;
      gender: string;
      role: string;
      personalityTrait: string;
      decisionMakingStyle: string;
      communicationStyle: string;
      image: string | null;
      languageVoices?: Record<string, string>;
      accent?: string;
      supportingFields: Array<{ fieldName: string; value: string }>;
    }) => {
      // Convert age to number and validate
      const ageNumber = parseInt(personaData.age, 10);

      if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 100) {
        throw new Error(
          isEditMode
            ? t('manage.persona.errors.invalidAge')
            : 'Age must be a number between 18 and 100',
        );
      }

      // Filter out empty supporting fields
      const validSupportingFields = personaData.supportingFields.filter(
        (field) => field.fieldName && field.value,
      );

      const payload: Record<string, any> = {
        name: personaData.name.trim(),
        age: ageNumber,
        gender: personaData.gender,
        role: personaData.role.trim(),
        personalityTrait: personaData.personalityTrait.trim(),
        decisionMakingStyle: personaData.decisionMakingStyle.trim(),
        communicationStyle: personaData.communicationStyle.trim(),
        image: personaData.image,
        supportingFields: validSupportingFields,
      };

      if (personaData.languageVoices) {
        payload.languageVoices = personaData.languageVoices;
      } else if (personaData.accent) {
        payload.accent = personaData.accent;
        if (isCreateMode) {
          payload.targetLanguages = ['en'];
        }
      }

      // Use PUT for edit mode, POST for create mode
      const response = isEditMode
        ? await apiManage()
            .url(`/manage/persona/${id}`)
            .put(payload)
            .json<{
              success: boolean;
              message: string;
              persona: {
                id: string;
                friendlyId: string;
                name: string;
              };
            }>()
        : await apiManage()
            .url('/manage/persona/create')
            .post(payload)
            .json<{
              success: boolean;
              message: string;
              persona: {
                id: string;
                friendlyId: string;
                name: string;
              };
            }>();

      return response;
    },
    onSuccess: (data) => {
      setShouldBlockNavigation(false);
      if (isEditMode) {
        toast.success(t('manage.persona.success.personaUpdated'));
        navigate(`/manage/persona/${data.persona.id}`);
      } else {
        setSavedPersonaId(data.persona.id);
        toast.success('Persona created successfully!');
      }
    },
    onError: (error: any) => {
      console.error('Error saving persona:', error);
      console.log('Error structure:', {
        json: error.json,
        response: error.response,
        message: error.message,
        status: error.status,
      });

      // Handle NAME_ALREADY_EXISTS error - check both possible error structures
      const errorData = error.json || error.response?.data || error;
      if (errorData?.errorCode === 'NAME_ALREADY_EXISTS') {
        setNameError(
          errorData.error ||
            'A persona with this name already exists. Please choose a different name.',
        );
        return;
      }

      // Handle other specific error messages
      if (error.response?.data?.details) {
        toast.error(error.response.data.details);
      } else if (error.json?.error) {
        toast.error(error.json.error);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          isEditMode
            ? t('manage.persona.errors.updateFailed')
            : 'Failed to save persona. Please try again.',
        );
      }
    },
  });

  // Navigate after successful save (ensures shouldBlockNavigation has updated)
  useEffect(() => {
    if (savedPersonaId && !shouldBlockNavigation) {
      navigate('/manage/persona/' + savedPersonaId);
    }
  }, [savedPersonaId, shouldBlockNavigation, navigate]);

  // Populate form fields when duplicate data is loaded
  useEffect(() => {
    if (duplicateData?.persona) {
      const persona = duplicateData.persona;
      setName(persona.name + ' Copy');
      setGender(persona.gender);
      setAge(persona.age?.toString() || '');
      setRole(persona.occupation || '');
      setPersonalityTrait(persona.personalityDetails?.persona || '');
      setDecisionMakingStyle(
        persona.personalityDetails?.decisionMaking
          ?.map((item: string) => `• ${item}`)
          .join('\n') || '',
      );
      setCommunicationStyle(
        persona.personalityDetails?.communicationStyle
          ?.map((item: string) => `• ${item}`)
          .join('\n') || '',
      );

      // Handle avatar/image duplication
      if (persona.image) {
        const avatar = avatars?.find((a: any) => a.image === persona.image);
        if (avatar) {
          setSelectedImage(persona.image);
          setSelectedAvatarId(avatar?.id);
        } else {
          setGeneratedImage(persona.image);
        }
      }

      // Set voice/accent
      const voices: Record<string, string> = {};
      if (
        persona.localizations &&
        Object.keys(persona.localizations).length > 0
      ) {
        for (const [lang, localization] of Object.entries(
          persona.localizations as any,
        )) {
          if ((localization as any)?.voice?._id) {
            voices[lang] = (localization as any).voice._id;
          }
        }
      }
      // If no localizations but has a root voice, use it for English
      if (Object.keys(voices).length === 0 && persona.voice?._id) {
        voices['en'] = persona.voice._id;
      }
      setLanguageVoices(voices);

      // Load accent for fallback mode
      setAccent(persona.voice?.accent ?? 'british');

      // Deep copy supporting fields from details
      const fields: Array<{ id: number; fieldName: string; value: string }> =
        [];
      if (persona.details) {
        const details = persona.details;
        if (details.location)
          fields.push({
            id: Date.now() + 1,
            fieldName: 'location',
            value: details.location,
          });
        if (details.education)
          fields.push({
            id: Date.now() + 2,
            fieldName: 'education',
            value: details.education,
          });
        if (details.workHistory)
          fields.push({
            id: Date.now() + 3,
            fieldName: 'workHistory',
            value: details.workHistory,
          });
        if (details.financialSituation)
          fields.push({
            id: Date.now() + 4,
            fieldName: 'financialSituation',
            value: details.financialSituation,
          });
        if (details.companySizeAndSpend)
          fields.push({
            id: Date.now() + 5,
            fieldName: 'companySizeAndSpend',
            value: details.companySizeAndSpend,
          });
        if (details.keyPriorities && details.keyPriorities.length > 0) {
          fields.push({
            id: Date.now() + 6,
            fieldName: 'keyPriorities',
            value: details.keyPriorities
              .map((item: string) => `• ${item}`)
              .join('\n'),
          });
        }
      }

      if (fields.length > 0) {
        setSupportingFields(fields);
      }
    }
  }, [duplicateData, avatars]);

  // Populate form when edit data loads
  useEffect(() => {
    if (personaData?.persona) {
      const { persona } = personaData;

      setName(persona.name);
      setGender(persona.gender);
      setAge(persona.age?.toString());
      setRole(persona.occupation);

      // Load voice selections from localizations
      const voices: Record<string, string> = {};
      if (persona.localizations) {
        for (const [lang, localization] of Object.entries(
          persona.localizations,
        )) {
          if (localization.voice?._id) {
            voices[lang] = localization.voice._id;
          }
        }
      }
      // If no localizations but has a root voice, use it for English
      if (Object.keys(voices).length === 0 && persona.voice?._id) {
        voices['en'] = persona.voice._id;
      }
      setLanguageVoices(voices);

      // Load accent for fallback mode
      setAccent(persona.voice?.accent ?? 'british');

      setPersonalityTrait(persona.personalityDetails?.persona || '');

      if (persona.personalityDetails) {
        if (persona.personalityDetails.persona) {
          setPersonalityTrait(persona.personalityDetails.persona);
        }
        if (persona.personalityDetails.decisionMaking) {
          setDecisionMakingStyle(
            persona.personalityDetails.decisionMaking
              .map((item: string) => `• ${item}`)
              .join('\n'),
          );
        }
        if (persona.personalityDetails.communicationStyle) {
          setCommunicationStyle(
            persona.personalityDetails.communicationStyle
              .map((item: string) => `• ${item}`)
              .join('\n'),
          );
        }
      }

      const mapOldFieldOptions: any = {
        key_priorities: 'keyPriorities',
        financial_situation: 'financialSituation',
        location_citizenship: 'location',
        education: 'education',
        work_history: 'workHistory',
        company_size_spend: 'companySizeAndSpend',
      };

      const validFieldNames = [
        'keyPriorities',
        'financialSituation',
        'location',
        'education',
        'workHistory',
        'companySizeAndSpend',
      ];

      if (persona.details && Object.entries(persona.details).length > 0) {
        const mappedFields = Object.entries(persona.details)
          .filter(([key]) => key !== 'accent')
          .map(([key, value], index) => ({
            id: index + 1,
            fieldName: mapOldFieldOptions[key] || key,
            value:
              key === 'keyPriorities'
                ? value.map((item: string) => `• ${item}`).join('\n')
                : value,
          }))
          .filter((field) => validFieldNames.includes(field.fieldName));

        if (mappedFields.length > 0) {
          setSupportingFields(mappedFields);
        }
      }
    }
  }, [personaData]);

  // Populate avatar when edit data loads
  useEffect(() => {
    if (personaData?.persona && avatars) {
      const { persona } = personaData;
      const avatar = avatars.find((avatar) => avatar.image === persona.image);
      if (avatar) {
        setSelectedImage(persona.image);
        setSelectedAvatarId(avatar?.id);
      } else if (persona.image) {
        setGeneratedImage(persona.image);
      }
    }
  }, [personaData, avatars]);

  // Mutation for generating personality
  const generatePersonalityMutation = useMutation({
    mutationFn: async (traits: {
      personality: Array<{ value: string; label: string }>;
      buyer: Array<{ value: string; label: string }>;
      communication: Array<{ value: string; label: string }>;
    }) => {
      const response = await apiManage()
        .url('/manage/persona/generate-personality')
        .post({ traits })
        .json<{
          personalityTrait: string;
          decisionMakingStyle: string;
          communicationStyle: string;
        }>();

      return response;
    },
    onSuccess: (data) => {
      setPersonalityTrait(data.personalityTrait);
      setDecisionMakingStyle(data.decisionMakingStyle);
      setCommunicationStyle(data.communicationStyle);
      setShowTraitModal(false);
    },
    onError: (error) => {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.generatePersonalityFailed')
          : 'Failed to generate personality',
      );
      console.error('Failed to generate personality:', error);
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!gender) throw new Error('Please select a gender first');
      if (!age.trim()) throw new Error('Please enter an age first');
      if (!role.trim()) throw new Error('Please enter a role first');

      const location = supportingFields.find(
        (field) => field.fieldName === 'location',
      )?.value;

      if (!location) throw new Error('Please enter a location first');

      const ageNumber = parseInt(age, 10);
      if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 100) {
        throw new Error('Please enter a valid age (18-100)');
      }

      const response = await apiManage()
        .url('/manage/persona/generate-avatar')
        .post({ name, gender, age: ageNumber, role: role.trim(), location })
        .json<{ success: boolean; imageUrl: string }>();

      return response;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      setSelectedAvatarId(null);
      toast.success('Avatar generated successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error.message || 'Failed to generate avatar. Please try again.',
      );
    },
  });

  const generatePersonality = (traits: {
    personality: Array<{ value: string; label: string }>;
    buyer: Array<{ value: string; label: string }>;
    communication: Array<{ value: string; label: string }>;
  }) => {
    setShowTraitModal(false);
    generatePersonalityMutation.mutate(traits);
  };

  const accentOptions = isEditMode
    ? [
        { value: 'american', label: t('manage.persona.accentOptions.american') },
        { value: 'british', label: t('manage.persona.accentOptions.british') },
        {
          value: 'singaporean',
          label: t('manage.persona.accentOptions.singaporean'),
        },
      ]
    : [
        { value: 'american', label: 'American English' },
        { value: 'british', label: 'British English' },
        { value: 'singaporean', label: 'Singaporean English' },
      ];

  const fieldOptions = isEditMode
    ? [
        {
          value: 'keyPriorities',
          label: t('manage.persona.supportingFields.fieldOptions.keyPriorities'),
        },
        {
          value: 'financialSituation',
          label: t(
            'manage.persona.supportingFields.fieldOptions.financialSituation',
          ),
        },
        {
          value: 'location',
          label: t(
            'manage.persona.supportingFields.fieldOptions.locationCitizenship',
          ),
        },
        {
          value: 'education',
          label: t('manage.persona.supportingFields.fieldOptions.education'),
        },
        {
          value: 'workHistory',
          label: t('manage.persona.supportingFields.fieldOptions.workHistory'),
        },
        {
          value: 'companySizeAndSpend',
          label: t('manage.persona.supportingFields.fieldOptions.companySizeSpend'),
        },
      ]
    : [
        { value: 'keyPriorities', label: 'Key priorities' },
        { value: 'financialSituation', label: 'Financial situation' },
        { value: 'location', label: 'Location/Citizenship' },
        { value: 'education', label: 'Education' },
        { value: 'workHistory', label: 'Work history' },
        { value: 'companySizeAndSpend', label: 'Company size & spend' },
      ];

  const fieldPlaceholders: Record<string, string> = isEditMode
    ? {
        keyPriorities: t(
          'manage.persona.supportingFields.fieldPlaceholders.keyPriorities',
        ),
        financialSituation: t(
          'manage.persona.supportingFields.fieldPlaceholders.financialSituation',
        ),
        location: t(
          'manage.persona.supportingFields.fieldPlaceholders.locationCitizenship',
        ),
        education: t('manage.persona.supportingFields.fieldPlaceholders.education'),
        workHistory: t(
          'manage.persona.supportingFields.fieldPlaceholders.workHistory',
        ),
        companySizeAndSpend: t(
          'manage.persona.supportingFields.fieldPlaceholders.companySizeSpend',
        ),
      }
    : {
        keyPriorities: 'Main goals or needs that influence purchase decision',
        financialSituation: 'Income/assets/budget level',
        location: 'Country/region & citizenship',
        education: 'Highest education or training',
        workHistory: 'Key roles & industries',
        companySizeAndSpend: 'Organization scale, budget, and spend level',
      };

  // Helper function to get available options for a specific field
  const getAvailableOptions = (currentFieldId: number) => {
    const selectedFieldNames = supportingFields
      .filter((field) => field.id !== currentFieldId && field.fieldName)
      .map((field) => field.fieldName);

    return fieldOptions.filter(
      (option) => !selectedFieldNames.includes(option.value),
    );
  };

  const addSupportingField = () => {
    setSupportingFields([
      ...supportingFields,
      { id: Date.now(), fieldName: '', value: '' },
    ]);
  };

  const removeSupportingField = (id: number) => {
    setSupportingFields(supportingFields.filter((field) => field.id !== id));
  };

  const updateSupportingField = (
    id: number,
    key: 'fieldName' | 'value',
    value: string,
  ) => {
    setSupportingFields(
      supportingFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field,
      ),
    );
  };

  const handleGenerateAvatar = () => {
    generateAvatarMutation.mutate();
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.nameRequired')
          : 'Please enter a name',
      );
      return;
    }

    const ageNumber = parseInt(age, 10);
    if (!age.trim() || isNaN(ageNumber) || ageNumber < 18 || ageNumber > 100) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.invalidAge')
          : 'Please enter a valid age (18-100)',
      );
      return;
    }

    if (!gender) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.genderRequired')
          : 'Please select a gender',
      );
      return;
    }

    if (!role.trim()) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.roleRequired')
          : 'Please enter a role',
      );
      return;
    }

    if (!personalityTrait.trim()) {
      toast.error('Please add a personality trait');
      return;
    }

    if (!decisionMakingStyle.trim()) {
      toast.error('Please add a decision making style');
      return;
    }

    if (!communicationStyle.trim()) {
      toast.error('Please add a communication style');
      return;
    }

    if (perLanguageVoiceEnabled) {
      if (!languageVoices.en) {
        toast.error(
          isEditMode
            ? t(
                'manage.persona.errors.englishVoiceRequired',
                'Please select an English voice',
              )
            : 'Please select an English voice',
        );
        return;
      }
    } else {
      if (!accent) {
        toast.error(
          isEditMode
            ? t('manage.persona.errors.accentRequired')
            : 'Please select an accent',
        );
        return;
      }
    }

    const hasValidSupportingField = supportingFields.some(
      (field) => field.fieldName && field.value,
    );

    if (!hasValidSupportingField) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.supportingFieldRequired')
          : 'Please add at least one supporting field',
      );
      return;
    }

    if (!selectedImage && !generatedImage) {
      toast.error(
        isEditMode
          ? t('manage.persona.errors.imageRequired')
          : 'Please select a persona image',
      );
      return;
    }

    savePersonaMutation.mutate({
      name,
      age,
      gender,
      role,
      personalityTrait,
      decisionMakingStyle,
      communicationStyle,
      image: generatedImage ?? selectedImage,
      ...(perLanguageVoiceEnabled ? { languageVoices } : { accent }),
      supportingFields,
    });
  };

  // Store the handler in a ref so it's always current
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const title = isEditMode
      ? t('persona.edit', 'Edit persona')
      : isDuplicateMode
        ? t('persona.duplicate', 'Duplicate persona')
        : t('persona.create', 'Create persona');
    titleBarStore.setTitle(title);

    // Create button factory function that accesses the ref
    const createButton = () => (
      <button
        onClick={() => handleSaveRef.current()}
        disabled={savePersonaMutation.isPending}
        className="bg-primary rounded-full px-6 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {savePersonaMutation.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isEditMode
              ? t('manage.persona.buttons.updating')
              : 'Saving...'}
          </span>
        ) : isEditMode ? (
          t('manage.persona.buttons.update')
        ) : (
          'Save'
        )}
      </button>
    );

    titleBarStore.setAction(createButton(), () => {});

    return () => {
      titleBarStore.reset();
    };
  }, [
    titleBarStore.setAction,
    titleBarStore.setTitle,
    savePersonaMutation.isPending,
    isEditMode,
    isDuplicateMode,
  ]);

  console.log({
    name,
    age,
    gender,
    role,
    personalityText,
    image: selectedImage,
    ...(perLanguageVoiceEnabled ? { languageVoices } : { accent }),
    supportingFields,
  });

  // Show loading state for edit mode
  if (isEditMode && isLoadingPersona) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show error state for edit mode
  if (isEditMode && (personaError || !personaData)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">
            {t('manage.persona.errors.loadFailed')}
          </p>
          <button
            onClick={() => navigate('/manage/persona')}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            {t('manage.persona.buttons.backToPersonas')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-50 max-w-6xl rounded-lg bg-white">
      <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DuplicateInfoBanner
            show={isDuplicateMode}
            translationKey="manage.persona.duplicateNotice"
            defaultMessage="Duplicated persona is not affecting or linked to any roleplay yet."
            t={t}
          />
          <div className="max-w-[600px] space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                {t('manage.persona.name')}
              </label>
              <input
                type="text"
                placeholder={t('manage.persona.placeholders.name')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                className={`focus:ring-0.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  nameError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'focus:ring-primary-500 border-gray-300 focus:border-blue-500'
                }`}
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                {t('manage.persona.gender')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{t('manage.persona.male')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{t('manage.persona.female')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                {t('manage.persona.age')}
              </label>
              <input
                type="text"
                placeholder={t('manage.persona.placeholders.age')}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="focus:ring-primary-500 focus:ring-0.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900">
                {t('manage.persona.occupation')}
              </label>
              <input
                type="text"
                placeholder={t('manage.persona.placeholders.role')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="focus:ring-primary-500 focus:ring-0.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {perLanguageVoiceEnabled ? (
              <div className="border-t border-gray-200 pt-6">
                <label className="mb-1 block text-lg font-semibold text-gray-900">
                  {t('manage.persona.voicePerLanguage', 'Voice per Language')}
                </label>
                <p className="mb-4 text-sm text-gray-600">
                  {t(
                    'manage.persona.voicePerLanguageDescription',
                    'Select a voice for each language the persona may speak. English is required.',
                  )}
                </p>
                <LanguageVoiceSelector
                  gender={gender}
                  selectedVoices={languageVoices}
                  onChange={setLanguageVoices}
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  {t('manage.persona.englishAccent')}
                </label>
                <CustomDropdown
                  value={accent}
                  onChange={setAccent}
                  options={accentOptions}
                  placeholder={t('manage.persona.placeholders.accent')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('manage.persona.englishAccentNote')}
                </p>
              </div>
            )}
            <div className="border-t border-gray-200 pt-6">
              <label className="mb-1 block text-lg font-semibold text-gray-900">
                {t('manage.persona.personality')}
              </label>
              <p className="mb-3 text-sm text-gray-600">
                {t('manage.persona.personalityDescription')}
              </p>
              <button
                ref={generateButtonRef}
                onClick={() => setShowTraitModal(true)}
                disabled={generatePersonalityMutation.isPending}
                className="text-primary-500 mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#FFF0EB] px-4 py-1 text-sm hover:bg-[#FFF0EB]/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatePersonalityMutation.isPending
                  ? t('manage.persona.buttons.generating')
                  : t('manage.persona.generateByTraits')}
              </button>
              {generatePersonalityMutation.isPending ? (
                <div className="mb-[10.5px] flex h-[310px] w-full max-w-[550px] flex-col items-center justify-center rounded-lg border border-gray-200">
                  <Loader2 className="mt-4 h-6 w-6 animate-spin text-blue-500" />
                  <p className="mt-2 text-sm text-gray-500">
                    {t('manage.persona.craftingPersonality')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Personality trait
                    </label>
                    <CustomRichTextArea
                      value={personalityTrait}
                      onChange={setPersonalityTrait}
                      placeholder="Example:&#10;Generally friendly in tone, approachable and willing to engage, but they don't have much patience for small talk. They want to get to the point quickly and expect clear, structured answers."
                      minHeight="100px"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Decision making style
                    </label>
                    <CustomRichTextArea
                      value={decisionMakingStyle}
                      onChange={setDecisionMakingStyle}
                      placeholder="Example:&#10;• Price-sensitive: They're focused on cost and will challenge pricing.&#10;• Data-driven: They expect numbers, facts, and proof points before making a decision."
                      minHeight="100px"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Communication style
                    </label>
                    <CustomRichTextArea
                      value={communicationStyle}
                      onChange={setCommunicationStyle}
                      placeholder="Example:&#10;• Impatient: They don't like long explanations and may interrupt if things drag.&#10;• Straight to the point: Prefers concise responses with concrete examples rather than abstract benefits or stories."
                      minHeight="100px"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="max-w-[700px] border-t border-gray-200 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {t('manage.persona.supportingInfo')}
            </h3>
            <div className="space-y-4">
              {supportingFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="grid grid-cols-[1fr_2fr_auto] gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900">
                        {t('manage.persona.supportingFields.fieldName')}
                      </label>
                      <CustomDropdown
                        value={field.fieldName}
                        onChange={(value) =>
                          updateSupportingField(field.id, 'fieldName', value)
                        }
                        options={getAvailableOptions(field.id)}
                        placeholder={t('manage.persona.placeholders.fieldName')}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-900">
                        {t('manage.persona.supportingFields.value')}
                      </label>
                      {['keyPriorities', 'financialSituation'].includes(
                        field.fieldName,
                      ) ? (
                        <CustomRichTextArea
                          value={field.value}
                          onChange={(value) =>
                            updateSupportingField(field.id, 'value', value)
                          }
                          placeholder={fieldPlaceholders[field.fieldName]}
                          minHeight="38px"
                          className="h-[38px] py-2"
                        />
                      ) : (
                        <textarea
                          value={field.value}
                          onChange={(e) =>
                            updateSupportingField(
                              field.id,
                              'value',
                              e.target.value,
                            )
                          }
                          placeholder={
                            field.fieldName
                              ? fieldPlaceholders[field.fieldName]
                              : ''
                          }
                          className="focus:ring-primary-500 focus:ring-0.5 h-[38px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                      )}
                    </div>
                    {supportingFields.length > 1 && (
                      <div className="flex items-end pb-2">
                        <button
                          onClick={() => removeSupportingField(field.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-500 text-gray-500 hover:bg-gray-100"
                        >
                          <span className="text-md font-semibold">−</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={addSupportingField}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600"
              >
                <span className="mt-[-2px] text-xl">+</span>
                {t('manage.persona.buttons.addNewField')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-l border-gray-200 pl-6">
          <PersonaAvatar
            key={`${generatedImage || selectedAvatarId}-${Date.now()}`}
            avatars={avatars}
            selectedAvatarId={selectedAvatarId}
            generatedImage={generatedImage}
            onSelectAvatar={(id: string, image: string) => {
              setSelectedAvatarId(id);
              setSelectedImage(image);
              setGeneratedImage(null);
            }}
            isImageGenerating={generateAvatarMutation.isPending}
            handleGenerateAvatar={handleGenerateAvatar}
          />
        </div>
      </div>

      {showTraitModal && (
        <TraitsPopup
          onClose={() => setShowTraitModal(false)}
          onGenerate={generatePersonality}
        />
      )}

      {/* Unsaved changes dialog */}
      <DialogComponent />
    </div>
  );
}
