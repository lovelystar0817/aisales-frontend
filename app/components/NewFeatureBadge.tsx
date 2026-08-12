import { useEffect, useState } from 'react';

interface NewFeatureBadgeProps {
  expirationDate?: Date | string;
  storageKey?: string;
  className?: string;
}

/**
 * A badge component that indicates a new feature.
 * It can be configured to expire after a certain date or be dismissed by the user.
 *
 * @param expirationDate - Optional date when the badge should no longer be shown
 * @param storageKey - Optional unique key for localStorage to track if user has seen this badge
 * @param className - Optional additional CSS classes
 */
export function NewFeatureBadge({
  expirationDate,
  storageKey = 'feature_badge_seen',
  className = '',
}: NewFeatureBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the badge should be shown based on expiration date and user dismissal
    const checkVisibility = () => {
      // If there's an expiration date and it's in the past, don't show the badge
      if (expirationDate) {
        const expDate =
          typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;

        if (expDate < new Date()) {
          return false;
        }
      }

      // Check if user has dismissed this badge before
      if (storageKey) {
        const hasSeenBadge = localStorage.getItem(storageKey) === 'true';
        return !hasSeenBadge;
      }

      return true;
    };

    setIsVisible(checkVisibility());
  }, [expirationDate, storageKey]);

  // Function to dismiss the badge
  // const dismissBadge = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   if (storageKey) {
  //     localStorage.setItem(storageKey, 'true');
  //   }
  //   setIsVisible(false);
  // };

  if (!isVisible) return null;

  return (
    <div
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}
      // onClick={dismissBadge}
      role="button"
      // title="Click to dismiss"
    >
      New
    </div>
  );
}
