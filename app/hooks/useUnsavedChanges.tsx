import { useEffect, useState, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router';
import { UnsavedChangesDialog } from '~/components/UnsavedChangesDialog';

interface UseUnsavedChangesOptions {
  when: boolean;
  entityType: 'persona' | 'scorecard' | 'scenario' | 'product' | 'module';
}

/**
 * Simple hook to show a confirmation dialog when trying to exit a create/edit flow.
 *
 * @param when - Boolean to enable/disable the blocker (e.g., set to false after saving)
 * @param entityType - Type of entity being edited (persona, scorecard, scenario, product)
 *
 * @returns A component to render the unsaved changes dialog
 */
export function useUnsavedChanges({
  when,
  entityType,
}: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const blockerRef = useRef<{ proceed: () => void; reset: () => void } | null>(
    null,
  );

  // Block navigation when enabled
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  // Store blocker reference
  useEffect(() => {
    if (blocker.state === 'blocked') {
      blockerRef.current = {
        proceed: blocker.proceed,
        reset: blocker.reset,
      };
      setShowDialog(true);
    }
  }, [blocker]);

  const handleGoBack = useCallback(() => {
    setShowDialog(false);
    // Proceed with navigation
    if (blockerRef.current) {
      blockerRef.current.proceed();
      blockerRef.current = null;
    }
  }, []);

  const handleKeepEditing = useCallback(() => {
    setShowDialog(false);
    // Reset/cancel the navigation
    if (blockerRef.current) {
      blockerRef.current.reset();
      blockerRef.current = null;
    }
  }, []);

  // Component to render the dialog
  const DialogComponent = () => (
    <UnsavedChangesDialog
      isOpen={showDialog}
      entityType={entityType}
      onGoBack={handleGoBack}
      onKeepEditing={handleKeepEditing}
    />
  );

  return {
    DialogComponent,
  };
}
