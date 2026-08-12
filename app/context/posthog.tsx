import type { PostHog } from 'posthog-js';
import { createContext, useContext } from 'react';
import { posthogInstance } from '~/posthog';

const PostHogContext = createContext<PostHog | undefined>(posthogInstance);

const PostHogProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  return (
    <PostHogContext.Provider value={posthogInstance}>
      {children}
    </PostHogContext.Provider>
  );
};

const usePostHog = () => {
  const ctx = useContext(PostHogContext);

  if (!ctx) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }

  return ctx;
};

export { PostHogProvider, usePostHog };
