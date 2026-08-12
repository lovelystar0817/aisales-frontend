# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development server (port 5361)
npm run dev

# Type checking - run before committing
npm run typecheck

# Build for production
npm run build

# Run production build locally
npm run start
```

## Architecture Overview

This is an AI-powered sales training platform built with React Router v7, featuring real-time voice roleplay sessions and assessments.

### Core Technology Stack
- **React Router v7** - Full-stack React framework (SSR disabled)
- **TypeScript** - Strict mode with path alias `~/*` → `./app/*`
- **Tailwind CSS v4** - Styling
- **Zustand** - Client state management with persistence
- **TanStack Query** - Server state management
- **Auth0** - Authentication
- **ElevenLabs** - AI voice synthesis
- **LiveKit** - Real-time audio/video

### Project Structure

```
app/
├── routes/         # File-based routing components
├── layouts/        # Shared layout components (sidebar, roleplay, assessment)
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── store/          # Zustand stores (auth, UI state)
├── util/           # Utilities (API client, constants)
├── i18n/           # Internationalization (EN, ID, MS)
├── context/        # React contexts (PostHog, language)
├── roleplay/       # Roleplay feature components
├── assessment/     # Assessment feature components
└── practice/       # Practice session components
```

## Implementation Best Practices

### 1 — Before Coding

- **BP-1 (MUST)** Understand the existing codebase patterns before making changes
- **BP-2 (SHOULD)** For complex features, draft an approach that aligns with current architecture
- **BP-3 (SHOULD)** Consider multi-language support from the start

### 2 — While Coding

- **C-1 (MUST)** Follow existing naming conventions and patterns
  ```ts
  // API utilities use wretch
  import { apiProtected } from "~/util/api";
  
  // State management uses Zustand
  import { useAuthStore } from "~/store/auth";
  ```

- **C-2 (MUST)** Use TypeScript strict mode and maintain type safety
  ```ts
  interface ButtonProps {
    size?: 'sm' | 'md' | 'lg';  // Use literal types
    children: React.ReactNode;
  }
  ```

- **C-3 (MUST)** Use path aliases consistently
  ```ts
  import { Component } from "~/components/Component";  // ✅ Good
  import { Component } from "../components/Component"; // ❌ Bad
  ```

- **C-4 (SHOULD)** Prefer functional components with hooks
- **C-5 (SHOULD)** Use `clsx` for conditional classes
- **C-6 (MUST)** Handle authentication with `apiProtected()` wrapper
- **C-7 (SHOULD NOT)** Add comments except for complex business logic

### 3 — API Integration

- **A-1 (MUST)** Use `apiProtected()` for authenticated endpoints
- **A-2 (MUST)** Include language headers in API calls
- **A-3 (SHOULD)** Handle errors with appropriate user feedback
- **A-4 (MUST)** Follow the existing API response typing patterns

### 4 — State Management

- **S-1 (MUST)** Use Zustand for client state that needs persistence
- **S-2 (MUST)** Use TanStack Query for server state
- **S-3 (SHOULD)** Keep stores focused and single-purpose
- **S-4 (MUST)** Clear sensitive data on logout

### 5 — Routing & Navigation

- **R-1 (MUST)** Follow file-based routing conventions
- **R-2 (MUST)** Support language prefixes in routes (`/:lang/*`)
- **R-3 (SHOULD)** Use appropriate layouts from `app/layouts/`
- **R-4 (MUST)** Handle authentication redirects properly

### 6 — UI Components

- **U-1 (MUST)** Use Tailwind CSS v4 for styling
- **U-2 (SHOULD)** Create reusable components for repeated UI patterns
- **U-3 (MUST)** Support responsive design
- **U-4 (SHOULD)** Use Heroicons for icons

### 7 — Internationalization

- **I-1 (MUST)** Use i18next for all user-facing text
- **I-2 (MUST)** Support EN, ID, and MS languages
- **I-3 (SHOULD)** Test UI with different language lengths

### 8 — Code Quality

- **Q-1 (MUST)** Run `npm run typecheck` before committing
- **Q-2 (MUST)** Ensure no TypeScript errors
- **Q-3 (SHOULD)** Keep components focused and testable
- **Q-4 (MUST)** Handle loading and error states properly

### 9 — Git Workflow

- **G-1 (SHOULD)** Use descriptive commit messages
- **G-2 (SHOULD)** Prefix commits with type (feat:, fix:, chore:, etc.)
- **G-3 (MUST)** Keep commits focused on single changes

## Key Architectural Patterns

1. **API Client**: Uses `wretch` with automatic auth headers via `apiProtected()` helper
2. **Routing**: File-based routing with nested layouts
3. **State Management**: 
   - Zustand for client state (auth, UI)
   - TanStack Query for server state
   - Persistent auth tokens in localStorage
4. **Error Handling**: Global error boundaries with i18n support
5. **Multi-language**: Supports EN, ID, MS with route prefixes (`/:lang/*`)

## Critical Development Notes

1. **Environment Variables**: Required `.env` file (see `.env.example`)
2. **Port Configuration**: Dev server runs on port 5361 (configured in `vite.config.ts`)
3. **Authentication Flow**: Auth0 callback at `/auth/callback`, tokens stored in Zustand
4. **Type Safety**: Always run `npm run typecheck` before committing
5. **No Test Framework**: Project currently lacks unit/integration tests

## Important Routes

- `/` - Home page with sidebar layout
- `/auth/*` - Authentication flow
- `/practices/past` - Past practice sessions
- `/roleplay/:sessionId` - Active roleplay session
- `/roleplay/:sessionId/assessment` - Post-session assessment
- `/health/elevenlabs` - Service health check

## API Integration Pattern

```typescript
// Protected API calls example
import { apiProtected } from "~/util/api";

const response = await apiProtected()
  .url("/endpoint")
  .get()
  .json();
```

## Common Tasks

When modifying roleplay or assessment features:
1. Check `app/roleplay/` and `app/assessment/` for feature-specific components
2. API calls use `apiProtected()` from `~/util/api`
3. State updates go through Zustand stores in `app/store/`
4. UI components should follow existing Tailwind patterns

When adding new routes:
1. Create route file in `app/routes/`
2. Use appropriate layout from `app/layouts/`
3. Handle multi-language support with `/:lang/` prefix
4. Add proper TypeScript types

## Deployment

- Docker-ready with multi-stage Dockerfile
- Production build includes Sentry source maps
- Uses Caddy server for production serving

## Code Style Guidelines

1. **Imports**: Order imports as external deps, then internal with path aliases
2. **Types**: Define interfaces over types when possible
3. **Components**: Export named functions, not default exports
4. **Hooks**: Prefix custom hooks with "use"
5. **Constants**: Use UPPER_SNAKE_CASE for constants
6. **File naming**: Use kebab-case for files, PascalCase for components

## Performance Considerations

1. Use React.memo for expensive components
2. Implement proper loading states
3. Handle errors gracefully with user-friendly messages
4. Optimize bundle size with dynamic imports where appropriate

## Security Notes

1. Never commit `.env` files
2. Always use `apiProtected()` for authenticated endpoints
3. Validate user input on both client and server
4. Clear sensitive data from stores on logout
5. Use Auth0 for all authentication flows