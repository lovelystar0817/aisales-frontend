import posthog from 'posthog-js';
import { getEnvironment, isProduction } from '~/util/environment';

const environment = getEnvironment();

// Check if we're in a test environment and provide a mock
const isTest =
  import.meta.env?.MODE === 'test' ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

const isProd = isProduction();

console.log('posthog ::: environment', environment);
console.log('posthog ::: isProduction', isProduction());

export const posthogInstance =
  typeof window !== 'undefined' && !isTest
    ? posthog.init(import.meta.env.VITE_POSTHOG_TOKEN || 'test-token', {
        name: 'AI Sales',
        person_profiles: 'identified_only',
        api_host: 'https://us.i.posthog.com',
        opt_out_capturing_persistence_type: 'localStorage',
        debug: !isProd, // Enable debug for dev, staging, and feature branches
        disable_session_recording: !isProd, // Disable session recording for dev, staging, and feature branches
        opt_out_capturing_by_default: !isProd, // Only capture in production
      })
    : undefined;
