import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle, Target, Lightbulb, TrendingUp, ClipboardList } from 'lucide-react';
import { useSalesActionTracking, type SalesAction, type DetectedAction, type ActionProgress } from '~/hooks/useSalesActionTracking';
import { useEffect, useState, useCallback } from 'react';

export type { ActionProgress, SalesAction, DetectedAction };

interface SalesActionTrackerProps {
  sessionId: string;
  onActionCompleted?: (action: DetectedAction) => void;
  className?: string;
  actionProgress: ActionProgress;
}

export default function SalesActionTracker({
  sessionId,
  onActionCompleted,
  className = '',
  actionProgress,
}: SalesActionTrackerProps) {
  const { t } = useTranslation();
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([]);
  
  const {
    isActionCompleted,
    getCompletedAction,
    getActionsByCategory,
  } = useSalesActionTracking({
    sessionId,
    enabled: false,
    onActionCompleted: (action) => {
      onActionCompleted?.(action);
      // Show animation for recently completed action
      setRecentlyCompleted((prev) => [...prev, action.actionId]);
      setTimeout(() => {
        setRecentlyCompleted(
          (prev) => prev.filter((id) => id !== action.actionId),
        );
      }, 3000);
    },
  });

  const customGetActionsByCategory = useCallback((category: SalesAction['category']) => {
    return actionProgress?.allActions.filter(action => action.category === category) || [];
  }, [actionProgress?.allActions]);

  const customIsActionCompleted = useCallback((actionId: string) => {
    return actionProgress?.completedActionIds.includes(actionId) || false;
  }, [actionProgress?.completedActionIds]);

  const customGetCompletedAction = useCallback((actionId: string) => {
    return actionProgress?.completedActions.find(a => a.actionId === actionId);
  }, [actionProgress?.completedActions]);

  if (!actionProgress) {
    return null;
  }

  const categories: { 
    key: SalesAction['category']; 
    label: string; 
    icon: React.ComponentType<any>;
    color: string;
  }[] = [
    { key: 'opening', label: 'Opening', icon: Target, color: 'blue' },
    { key: 'discovery', label: 'Discovery', icon: Lightbulb, color: 'yellow' },
    { key: 'presentation', label: 'Presentation', icon: TrendingUp, color: 'green' },
    { key: 'objection', label: 'Objection Handling', icon: Circle, color: 'orange' },
    { key: 'closing', label: 'Closing', icon: CheckCircle, color: 'purple' },
  ];

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-4 w-full">
            <div className="text-sm text-gray-500">
              {actionProgress.progressPercentage}% Complete
            </div>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full w-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${actionProgress.progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action List */}
      <div className="p-4 flex flex-col gap-4">
        {categories.flatMap(category => customGetActionsByCategory(category.key)).map(action => {
          const completed = customIsActionCompleted(action.id);
          const completedAction = customGetCompletedAction(action.id);
          const isRecent = recentlyCompleted.includes(action.id);
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start space-x-3 rounded-lg transition-colors ${
                completed 
                  ? 'bg-green-50 border border-green-200 p-2' 
                  : ''
              } ${isRecent ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}
            >
              <div className="mt-0.5">
                {completed ? (
                  <motion.div
                    initial={isRecent ? { scale: 0 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                  >
                    <CheckCircle className="size-4 text-green-600" />
                  </motion.div>
                ) : (
                  <Circle className="size-4 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h5 className={`text-sm font-medium ${
                  completed ? 'text-green-700 line-through' : 'text-gray-700'
                }`}>
                  {action.title}
                </h5>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                
                {completed && completedAction && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded"
                  >
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Detected:</span>
                      <span>"{completedAction.triggerText}"</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Helper component for desktop sidebar
export function SalesActionSidebar({ 
  sessionId, 
  onActionCompleted,
  className = '',
  actionProgress,
}: SalesActionTrackerProps) {
  return (
    <div className={`${className}`}>
      <SalesActionTracker
        sessionId={sessionId}
        actionProgress={actionProgress}
        onActionCompleted={onActionCompleted}
        className="h-full"
      />
    </div>
  );
}

// Helper component for mobile bottom sheet
export function SalesActionBottomSheet({
  sessionId,
  onActionCompleted,
  onClose,
  className = '',
  actionProgress,
}: Omit<SalesActionTrackerProps, 'isVisible'> & { onClose?: () => void }) {
  const { actionProgress: ownActionProgress } = useSalesActionTracking({
    sessionId,
    enabled: !actionProgress,
  });

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const finalActionProgress = actionProgress || ownActionProgress;
  if (!finalActionProgress) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`fixed inset-x-0 bottom-0 z-50 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Sales Action Tracker"
    >
      {/* Backdrop - purely visual, no interactions */}
      <div className="absolute inset-0 bg-black bg-opacity-25" />
      
      {/* Sheet */}
      <div className="relative bg-white rounded-t-lg shadow-xl max-h-[70vh]">
        {/* Handle with close functionality */}
        <div className="flex justify-center p-2">
          <button
            onClick={onClose}
            className="w-10 h-1 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close sales action tracker"
          />
        </div>
        
        <SalesActionTracker
          sessionId={sessionId}
          actionProgress={finalActionProgress}
          onActionCompleted={onActionCompleted}
          className="border-0 shadow-none rounded-none"
        />
      </div>
    </motion.div>
  );
} 