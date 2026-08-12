import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import '../posthog';
import '../sentry';
import { queryClient } from '../util/react-query';
import { PostHogProvider } from '../context/posthog';
import { LanguageProvider } from '../context/language';

interface SharedLayoutProps {
  children: React.ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <PostHogProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}