import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from '@react-router/dev/routes';

export default [
  // Guest routes under /guest prefix - at top level, no Auth0 wrapper
  ...prefix('/guest', [
    route(':companyFriendlyId/auth', 'routes/guest/auth.tsx', { id: 'guest-company-auth' }),
    route('auth', 'routes/guest/auth.tsx', { id: 'guest-auth' }),
  ]),

  // Unauthenticated routes for PDF generation
  route(
    'call-analysis/assessment/:id/print',
    'routes/call-analysis/assessment-print.tsx',
  ),

  // User routes under / prefix
  ...prefix('/', [
    layout('routes/app.tsx', [
      layout('layouts/sidebar.tsx', { id: 'main' }, [
        index('routes/app/home.tsx'),
      ]),

      route('auth', 'routes/app/auth.tsx'),
      route('auth/callback', 'routes/app/auth/callback.tsx'),
      route('auth/inactive', 'routes/app/auth/inactive.tsx'),
      route('auth/error', 'routes/app/auth/error.tsx'),
      route(':lang/auth', 'routes/app/lang-auth.tsx'),
      route('logout', 'routes/app/logout.tsx'),

      ...prefix('practices', [
        layout('layouts/sidebar.tsx', { id: 'sessions' }, [
          route('past', 'routes/app/practices/past.tsx'),
        ]),
      ]),

      layout('layouts/assessment.tsx', [
        route(
          'roleplay/:sessionId/assessment',
          'routes/app/roleplay/assessment.tsx',
        ),
      ]),

      layout('layouts/roleplay.tsx', [
        route('roleplay/:sessionId', 'routes/app/roleplay/session.tsx'),
      ]),

      layout('layouts/sidebar.tsx', [
        route('call-analysis', 'routes/call-analysis/upload-audio.tsx'),
      ]),

      route(
        'call-analysis/assessment/:id',
        'routes/call-analysis/assessment.tsx',
      ),
      route(
        'call-analysis/transcript/:id',
        'routes/call-analysis/transcript.tsx',
      ),

      // Language-specific routes
      route(':lang/:slug', 'routes/app/lang-slug.tsx'),

      // Must be at the end of app routes
      route(':slug', 'routes/app/slug.tsx'),

      // Health check routes
      route('health/elevenlabs', 'routes/app/health/elevenlabs.tsx'),

      route('guest/logout', 'routes/app/guest/logout.tsx'),
    ]),
  ]),

  // Admin routes under /manage prefix
  ...prefix('/manage', [
    layout('routes/manage.tsx', [
      // Routes with sidebar
      layout('layouts/manage-sidebar.tsx', { id: 'manage-sidebar' }, [
        index('routes/manage/dashboard.tsx', { id: 'manage-index' }),
        route('dashboard', 'routes/manage/dashboard.tsx'),
        route('users', 'routes/manage/users.tsx'),
        route('settings', 'routes/manage/settings/settings.tsx'),
        route('call-analysis', 'routes/manage/call-analysis.tsx'),
        route('users/:userId', 'routes/manage/user-details.tsx'),

        // Superadmin-only routes
        layout('layouts/superadmin-protected.tsx', { id: 'superadmin-protected' }, [
          route('products/:id', 'routes/manage/products/details.tsx'),
          route('products', 'routes/manage/products/list.tsx'),
          route('persona/:id', 'routes/manage/persona/personaDetails.tsx'),
          route('persona', 'routes/manage/persona/persona.tsx'),
          route('scorecard/:id', 'routes/manage/scorecard/scorecardDetails.tsx'),
          route('scorecard', 'routes/manage/scorecard/scorecard.tsx'),
          route('scenario', 'routes/manage/scenario/scenario.tsx'),
          route(
            'scenario/:scenarioId',
            'routes/manage/scenario/scenarioDetails.tsx',
          ),
        ]),
      ]),

      route('leaderboard', 'routes/manage/leaderboard.tsx'),

      // Routes without sidebar
      route('auth', 'routes/manage/auth.tsx'),
      route('auth/callback', 'routes/manage/auth/callback.tsx'),
      route('auth/inactive', 'routes/manage/auth/inactive.tsx'),
      route('logout', 'routes/manage/logout.tsx'),
      layout('layouts/manage-assessment.tsx', { id: 'manage-assessment' }, [
        route(
          'sessions/:sessionId/assessment',
          'routes/manage/session-assessment.tsx',
        ),
      ]),
      route(
        'call-analysis/:id',
        'routes/manage/call-analysis-assessment.tsx',
      ),

      // Superadmin-only routes without sidebar (create/edit forms)
      layout('layouts/superadmin-protected.tsx', { id: 'superadmin-protected-selfserve' }, [
        layout('layouts/manage-selfserve.tsx', { id: 'manage-selfserve' }, [
          route('persona/new', 'routes/manage/persona/create.tsx'),
          route('persona/:id/edit', 'routes/manage/persona/edit.tsx'),
          route('scorecard/new', 'routes/manage/scorecard/create.tsx'),
          route('scorecard/:id/edit', 'routes/manage/scorecard/edit.tsx'),
          route('scenario/new', 'routes/manage/scenario/create.tsx'),
          route('scenario/:scenarioId/edit', 'routes/manage/scenario/edit.tsx'),
        ]),
      ]),
    ]),
  ]),

  // 404 route - must be the very last route
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
