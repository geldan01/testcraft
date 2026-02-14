# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TestCraft is a test case management application built with Nuxt 3, Nuxt UI v3, and PostgreSQL via Prisma ORM. It uses custom JWT authentication (not Supabase), Pinia for state management, and Tailwind CSS v4 with CSS-first configuration.

## Commands

### Development
```bash
docker compose up -d          # Start PostgreSQL 16
npm run db:migrate             # Apply Prisma migrations
npm run db:seed                # Seed demo data (admin@testcraft.io / Admin123!, qa@testcraft.io / QATest123!, dev@testcraft.io / DevTest123!)
npm run dev                    # Start dev server at http://localhost:3000
```

### Testing
```bash
npm test                       # Vitest in watch mode
npm run test:unit              # Vitest single run
npm run test:e2e               # Playwright e2e tests (auto-starts dev server with SSR disabled)
npx playwright test auth       # Run specific e2e test file
npx playwright test -g "name"  # Run e2e test by name
npm test -- tests/unit/server/api/auth.test.ts  # Run single unit test file
```

### Database
```bash
npm run db:generate            # Regenerate Prisma client after schema changes
npm run db:migrate             # Create + apply migration (interactive, names the migration)
npm run db:studio              # Visual database browser
npm run db:reset               # Drop and recreate database (destructive)
```

### Build
```bash
npm run build                  # Production build
npm run preview                # Preview production build
```

## Architecture

### Request Flow
Browser → Nuxt pages (file-based routing) → composables (`useTestCase`, `useTestRun`, etc.) → `$fetch()` with JWT via `auth-fetch.ts` plugin → Nitro server API handlers → Prisma → PostgreSQL

### Layers

**Pages & Components** (`pages/`, `components/`): Vue SFCs with Nuxt UI v3 components. Protected pages use `definePageMeta({ middleware: 'auth' })`. Components are organized by domain: `app/` (Sidebar, TopBar), `test/` (GherkinEditor, StepBuilder, RunExecutor), `dashboard/`, `attachment/`.

**Composables** (`composables/`): API abstraction layer. Each composable wraps `$fetch()` calls and returns data or null on error. These are the primary way components interact with the backend.

**Pinia Stores** (`stores/`): Three stores — `auth` (user/token with cookie persistence), `organization`, `project`. Auth store persists token in `auth_token` cookie (7-day expiry).

**Server API** (`server/api/`): 60+ REST endpoints using Nitro's file-based routing. All protected routes call `requireAuth(event)` from `server/utils/auth.ts`. Request validation uses Zod. Activity logging via `server/utils/activity.ts`.

**Database** (`prisma/schema.prisma`): 16 models with CUID primary keys, cascading deletes from Organization down. Key enums: `TestType` (STEP_BASED | GHERKIN), `TestRunStatus` (NOT_RUN | IN_PROGRESS | PASS | FAIL | BLOCKED | SKIPPED).

### Auth Flow
1. Login → `/api/auth/login` → returns JWT + user
2. Token stored in `auth_token` cookie + Pinia auth store
3. `plugins/auth-fetch.ts` intercepts all `$fetch()` calls to attach `Authorization: Bearer <token>`
4. `middleware/auth.ts` guards protected routes, rehydrates user from token if needed
5. Server extracts user via `getUserFromEvent(event)` or `requireAuth(event)`

### Test Run Lifecycle
`POST /api/test-runs/start` (sets IN_PROGRESS + executedAt) → `PUT /api/test-runs/:id/complete` (sets final status + duration)

## Testing Patterns

### Unit Tests (Vitest)
- Location: `tests/unit/`
- Setup file (`tests/unit/setup.ts`) mocks H3 server auto-imports (`defineEventHandler`, `readBody`, `getRouterParam`, `createError`, etc.) as globals
- Override mocks per-test with `vi.stubGlobal()`
- Server API handlers are tested by importing the handler and calling it directly with mocked H3 utilities and Prisma

### E2E Tests (Playwright)
- Location: `tests/e2e/`
- Custom test fixture (`tests/e2e/fixtures/index.ts`) handles authentication — logs in via API and injects cookie before each test
- Default user is `qa`; change with `test.use({ userKey: 'admin' })`
- Page Object pattern: `tests/e2e/pages/` (17 page objects), `tests/e2e/components/` (5 component objects)
- Mock API helper: `tests/e2e/helpers/mock-api.ts`
- Dev server auto-starts with `NUXT_SSR=false`

## Critical Gotchas

### Nuxt UI v3 CSS Imports
`assets/css/main.css` MUST have both imports in order:
```css
@import "tailwindcss";
@import "@nuxt/ui";
```
Without `@import "@nuxt/ui"`, all Nuxt UI CSS variables (`--ui-bg`, `--ui-color`, `--ui-border`) are empty, breaking dark mode and component styling for every Nuxt UI component.

### USelect Empty String Values
Reka UI's `<SelectItem>` throws if given an empty string `''` as a value. This error corrupts Vue's component tree and blocks page navigation. Use `'all'` as a sentinel value instead and check `!== 'all'`.

### Tailwind CSS v4
Uses CSS-first configuration (`@import` and `@theme` in CSS). There is no `tailwind.config.js` file.

### No Linter Configured
No ESLint or Prettier configuration exists. Follow existing code style and patterns.

## Environment Variables

See `.env.example`. Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret (defaults to dev value in `nuxt.config.ts`)
- `NUXT_SSR` — Set to `false` to disable SSR (used by e2e tests)
- `STORAGE_PROVIDER` — File storage backend (default: `local`)
