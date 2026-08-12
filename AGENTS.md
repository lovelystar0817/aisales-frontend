# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Source code: routes, components, layouts, hooks, store, i18n, util, assets.
  - File-based routes live under `app/routes/` (e.g., `app/routes/app/index.tsx`).
- `public/` — Static assets served as-is.
- `build/` — Production output (`client/` assets, `server/` entry).
- `docs/` — Project docs and notes.
- Aliases: import app modules via `~/` (e.g., `import Button from '~/components/Button'`).

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server with HMR (Vite on port 5361).
- `npm run build` — Build for production using React Router + Vite.
- `npm start` — Serve the built app (`build/server/index.js`).
- `npm run typecheck` — Generate React Router types and run TypeScript in `--noEmit` mode.

Examples:
- First run: `npm i && cp .env.example .env` (fill values), then `npm run dev`.
- Docker: `docker build -t aisales-frontend . && docker run -p 3000:3000 aisales-frontend`.

## Coding Style & Naming Conventions
- Language: TypeScript, strict mode.
- Formatting: Prettier (single quotes, semicolons); Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Indentation: 2 spaces. Components/Layouts: PascalCase; hooks: `useThing`; utilities: camelCase.
- Routes: colocate loaders/actions with route components in `app/routes/*`.
- Imports: prefer `~/...` alias for modules in `app/`.

## Testing Guidelines
- No test runner is configured yet. For new tests, prefer Vitest + React Testing Library.
- Place tests next to code: `Button.test.tsx`, `useThing.test.ts`.
- Until tests are added, use `npm run typecheck` and manual flows; include repro steps in PRs.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commit style when possible (`feat(scope): message`, `fix: message`). Keep subjects imperative and under ~72 chars.
- PRs: include a clear description, linked issues, screenshots for UI changes, and testing notes. Keep changes focused and small.

## Security & Configuration Tips
- Env vars (`.env`): `VITE_API_BASE_URL`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_POSTHOG_TOKEN`.
- Do not commit secrets. Sentry/PostHog are enabled via Vite plugins; verify DSNs/tokens via env.
- SPA mode (`react-router.config.ts: ssr=false`); verify client-only assumptions when adding features.

