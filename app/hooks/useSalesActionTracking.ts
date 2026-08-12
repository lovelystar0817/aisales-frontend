import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiProtected } from '~/util/api';
import type { CallType } from '~/routes/app/roleplay/types';

export interface SalesAction {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  patterns: string[];
  priority: number;
  category: 'opening' | 'discovery' | 'presentation' | 'objection' | 'closing';
}

export interface CompletedAction {
  actionId: string;
  completedAt: string;
  confidence: number;
  detectionMethod: 'keyword' | 'pattern' | 'ai';
  triggerText: string;
  messageId?: string;
}

export interface DetectedAction {
  actionId: string;
  title: string;
  confidence: number;
  triggerText: string;
  detectionMethod: 'keyword' | 'pattern' | 'ai';
}

export interface ActionProgress {
  allActions: SalesAction[];
  completedActions: CompletedAction[];
  completedActionIds: string[];
  progressPercentage: number;
  callType: CallType;
}

export interface UseSalesActionTrackingOptions {
  sessionId: string;
  enabled?: boolean;
  onActionCompleted?: (action: DetectedAction) => void;
}

export function useSalesActionTracking({
  sessionId,
  enabled = true,
  onActionCompleted,
}: UseSalesActionTrackingOptions) {
  const queryClient = useQueryClient();
  const [suggestedActions, setSuggestedActions] = useState<SalesAction[]>([]);
  const processingRef = useRef(false);
  const lastProcessedMessageRef = useRef<string>('');

  // Fetch action progress using React Query
  const {
    data: actionProgress,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['salesActions', 'progress', sessionId],
    queryFn: async () => {
      const response = await apiProtected()
        .url(`/sessions/${sessionId}/action-progress`)
        .get()
        .json<{ success: boolean; data: ActionProgress }>();
      
      if (!response.success) {
        throw new Error('Failed to fetch action progress');
      }
      
      return response.data;
    },
    enabled: enabled && !!sessionId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch suggested actions using React Query
  const { data: suggestedActionsData } = useQuery({
    queryKey: ['salesActions', 'suggestions', sessionId],
    queryFn: async () => {
      const response = await apiProtected()
        .url(`/sessions/${sessionId}/action-suggestions`)
        .query({ limit: '3' })
        .get()
        .json<{ success: boolean; data: { suggestedActions: SalesAction[] } }>();
      
      if (!response.success) {
        throw new Error('Failed to fetch suggested actions');
      }
      
      return response.data;
    },
    enabled: enabled && !!sessionId,
    staleTime: 30000, // Reduce stale time to ensure faster updates
  });

  // Update suggested actions when data changes
  useEffect(() => {
    if (suggestedActionsData?.suggestedActions) {
      console.log('Updating suggested actions:', suggestedActionsData.suggestedActions);
      setSuggestedActions(suggestedActionsData.suggestedActions);
    }
  }, [suggestedActionsData]);

  // Mutation for detecting actions
  const { mutate: detectActions } = useMutation({
    mutationFn: async ({ message, messageId }: { message: string; messageId?: string }) => {
      return apiProtected()
        .url(`/sessions/${sessionId}/detect-actions`)
        .post({
          message: {
            role: 'user',
            content: message,
          },
          messageId,
        })
        .json<{
          success: boolean;
          detectedActions: DetectedAction[];
          progressPercentage: number;
          newActionsCount: number;
        }>();
    },
    onSuccess: (result) => {
      if (result.success && result.newActionsCount > 0) {
        // Invalidate and refetch action progress
        queryClient.invalidateQueries({
          queryKey: ['salesActions', 'progress', sessionId]
        });

        // Invalidate suggested actions so they refresh with updated data
        queryClient.invalidateQueries({
          queryKey: ['salesActions', 'suggestions', sessionId]
        });

        // Notify about completed actions
        result.detectedActions.forEach((action: DetectedAction) => {
          onActionCompleted?.(action);
        });
      }
    },
    onError: (error) => {
      console.error('Error detecting actions:', error);
    }
  });

  // Process user message for action detection
  const processUserMessage = useCallback(async (message: string, messageId?: string) => {
    if (!enabled || !sessionId || processingRef.current) return;

    // Filter out meaningless messages
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage === '...' || trimmedMessage.length < 3) {
      console.log('[Sales Action Tracking] Skipping message - too short or meaningless:', trimmedMessage);
      return;
    }

    // Avoid processing the same message multiple times
    const messageKey = `${trimmedMessage}-${messageId || Date.now()}`;
    if (lastProcessedMessageRef.current === messageKey) return;
    
    processingRef.current = true;
    lastProcessedMessageRef.current = messageKey;

    try {
      detectActions({ message: trimmedMessage, messageId });
    } finally {
      processingRef.current = false;
    }
  }, [sessionId, enabled, detectActions]);

  // Fetch action progress function
  const fetchActionProgress = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['salesActions', 'progress', sessionId]
    });
  }, [queryClient, sessionId]);

  // Get actions by category
  const getActionsByCategory = useCallback((category: SalesAction['category']) => {
    if (!actionProgress) return [];
    return actionProgress.allActions.filter(action => action.category === category);
  }, [actionProgress]);

  // Check if action is completed
  const isActionCompleted = useCallback((actionId: string) => {
    return actionProgress?.completedActionIds.includes(actionId) || false;
  }, [actionProgress]);

  // Get completed action details
  const getCompletedAction = useCallback((actionId: string) => {
    return actionProgress?.completedActions.find(a => a.actionId === actionId);
  }, [actionProgress]);

  // Get next action to focus on
  const getNextAction = useCallback(() => {
    if (!actionProgress) return null;
    
    const pendingActions = actionProgress.allActions.filter(
      action => !actionProgress.completedActionIds.includes(action.id)
    );
    
    return pendingActions.sort((a, b) => a.priority - b.priority)[0] || null;
  }, [actionProgress]);

  // Get progress by category
  const getProgressByCategory = useCallback(() => {
    if (!actionProgress) return {};

    const categories: SalesAction['category'][] = ['opening', 'discovery', 'presentation', 'objection', 'closing'];
    const progress: Record<string, { completed: number; total: number; percentage: number }> = {};

    categories.forEach(category => {
      const categoryActions = actionProgress.allActions.filter(a => a.category === category);
      const completedInCategory = categoryActions.filter(a => 
        actionProgress.completedActionIds.includes(a.id)
      );
      
      progress[category] = {
        completed: completedInCategory.length,
        total: categoryActions.length,
        percentage: categoryActions.length > 0 ? Math.round((completedInCategory.length / categoryActions.length) * 100) : 0,
      };
    });

    return progress;
  }, [actionProgress]);

  return {
    // State
    actionProgress,
    isLoading,
    error: error?.message || null,
    suggestedActions,
    
    // Actions
    processUserMessage,
    fetchActionProgress,
    
    // Helpers
    getActionsByCategory,
    isActionCompleted,
    getCompletedAction,
    getNextAction,
    getProgressByCategory,
  };
} 