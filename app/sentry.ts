import * as Sentry from '@sentry/react';
import { isProduction } from './util/environment';

Sentry.init({
  dsn: 'https://9654841275c0ab762387bf347f8de051@o4507293794893824.ingest.de.sentry.io/4509326890762320',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 0.1,
  tracePropagationTargets: [
    /^https:\/\/train\.hupo\.co/,
    /^https:\/\/trainapi\.hupo\.co/,
  ],
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  enabled: isProduction(),
});
