# TestCraft Developer Setup Guide

Version: 1.0 (Phase 1)

---

## Prerequisites

Ensure the following tools are installed before proceeding:

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| **Node.js** | 18.x or higher | JavaScript runtime |
| **npm** | 9.x or higher | Package manager (comes with Node.js) |
| **Docker** | 20.x or higher | PostgreSQL database container |
| **Docker Compose** | 2.x or higher | Container orchestration |
| **Git** | 2.x or higher | Version control |

Verify installations:

```bash
node --version    # v18.x+
npm --version     # 9.x+
docker --version  # 20.x+
git --version     # 2.x+
```

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd testcraft
```

### 2. Install Dependencies

```bash
npm install
```

This also runs `nuxt prepare` via the `postinstall` script, which generates the `.nuxt` directory and TypeScript configuration.

### 3. Configure Environment

Copy the environment template:

```bash
cp .env.example .env
```

The `.env` file contains:

```bash
# PostgreSQL Database URL for local development
DATABASE_URL="postgresql://testcraft:testcraft@localhost:5432/testcraft?schema=public"

# JWT Secret for authentication (generate a secure random string for production)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Application configuration
NODE_ENV="development"
```

For local development, the defaults work out of the box with the Docker Compose setup.

For production, generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start the Database

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

This creates a PostgreSQL 16 (Alpine) container with:
- **User:** testcraft
- **Password:** testcraft
- **Database:** testcraft
- **Port:** 5432

Verify the database is running:

```bash
docker compose ps
```

Wait for the health check to pass (status: "healthy").

### 5. Run Database Migrations

Generate the Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

If this is a fresh database, `db:migrate` will create all tables from the schema.

### 6. Seed the Database (Optional)

Populate the database with demo data:

```bash
npm run db:seed
```

This creates:

| Entity | Details |
|--------|---------|
| **Admin user** | admin@testcraft.io / Admin123! |
| **QA Engineer** | qa@testcraft.io / QATest123! |
| **Developer** | dev@testcraft.io / DevTest123! |
| **Organization** | "TestCraft Demo Org" |
| **Project** | "Demo Project" |
| **Test Plan** | "Sprint 1 Test Plan" |
| **Test Suites** | Smoke, Regression, API |
| **Test Cases** | 5 test cases (3 step-based, 2 Gherkin) |
| **Test Runs** | 5 sample runs with various statuses |
| **RBAC Permissions** | Full default permission matrix |
| **Activity Logs** | 4 sample log entries |

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Database Management

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Regenerate Prisma client from schema |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:push` | Push schema changes without creating a migration (prototyping only) |
| `npm run db:seed` | Run the seed script |
| `npm run db:studio` | Open Prisma Studio (visual database browser) at http://localhost:5555 |
| `npm run db:reset` | Reset the database (drops all data, re-applies migrations, re-seeds) |

### Making Schema Changes

1. Edit `prisma/schema.prisma` with your changes.
2. Run `npm run db:migrate` and provide a migration name.
3. Run `npm run db:generate` to update the Prisma client.
4. The migration SQL file is created in `prisma/migrations/`.

### Viewing the Database

Use Prisma Studio for a visual interface:

```bash
npm run db:studio
```

Or connect directly via psql:

```bash
docker compose exec db psql -U testcraft -d testcraft
```

---

## Running Tests

### Unit Tests (Vitest)

```bash
npx vitest run          # Run once
npx vitest              # Run in watch mode
```

Configuration: `vitest.config.ts`

- Environment: `nuxt` (with `happy-dom`)
- Test files: `tests/unit/**/*.test.ts`
- Setup: `tests/unit/setup.ts` (mocks localStorage)

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

Configuration: `playwright.config.ts`

- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:3000`
- Test files: `tests/e2e/**/*.spec.ts`
- Auto-starts dev server if not running

Install Playwright browsers on first run:

```bash
npx playwright install
```

---

## Project Structure Walkthrough

### How a Request Flows Through the System

Consider a request to create a new test case:

1. **User** clicks "Create Test Case" on the frontend.
2. **Page** (`pages/projects/[id]/test-cases/new.vue`) collects form data and calls `useTestCase().createTestCase(data)`.
3. **Composable** (`composables/useTestCase.ts`) sends a POST request via `$fetch('/api/test-cases', { method: 'POST', body: data })`.
4. **API Route** (`server/api/test-cases/index.post.ts`) handles the request:
   - Authenticates the user via `requireAuth(event)`.
   - Validates the request body with a Zod schema.
   - Checks organization membership.
   - Verifies the project's test case limit.
   - Creates the record in PostgreSQL via Prisma.
   - Logs the activity via `logActivity()`.
   - Returns the created test case (201).
5. **Composable** receives the response and returns it to the page.
6. **Page** updates the UI to show the new test case.

---

## Adding New Features

### Adding a New API Endpoint

1. Create a file in `server/api/` following the naming convention:
   - `resource.get.ts` for GET
   - `resource.post.ts` for POST
   - `[id].put.ts` for PUT with a parameter
   - `[id].delete.ts` for DELETE with a parameter
2. Follow the standard handler structure:

```typescript
import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const mySchema = z.object({
  name: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = mySchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Authorization checks...
  // Business logic...

  await logActivity(user.id, 'CREATED', 'MyEntity', entity.id, { name: result.data.name })

  setResponseStatus(event, 201)
  return entity
})
```

### Adding a New Composable

1. Create `composables/useMyFeature.ts`.
2. Follow the pattern of wrapping `$fetch()` calls with error handling:

```typescript
import type { MyType } from '~/types'

export const useMyFeature = () => {
  async function getItems(): Promise<MyType[]> {
    try {
      return await $fetch<MyType[]>('/api/my-feature')
    } catch {
      return []
    }
  }

  async function createItem(data: CreateMyTypeInput): Promise<MyType | null> {
    try {
      return await $fetch<MyType>('/api/my-feature', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  return {
    getItems,
    createItem,
  }
}
```

### Adding a New Page

1. Create a `.vue` file in `pages/` following Nuxt's file-based routing conventions.
2. Use the appropriate layout by specifying it in the page:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const { getItems } = useMyFeature()
const items = ref([])

onMounted(async () => {
  items.value = await getItems()
})
</script>

<template>
  <div>
    <!-- Page content -->
  </div>
</template>
```

### Adding a New Pinia Store

1. Create `stores/myFeature.ts`:

```typescript
import { defineStore } from 'pinia'
import type { MyType } from '~/types'

interface MyState {
  items: MyType[]
  loading: boolean
}

export const useMyFeatureStore = defineStore('myFeature', {
  state: (): MyState => ({
    items: [],
    loading: false,
  }),

  getters: {
    itemCount: (state): number => state.items.length,
  },

  actions: {
    async fetchItems(): Promise<void> {
      this.loading = true
      try {
        this.items = await $fetch<MyType[]>('/api/my-feature')
      } catch {
        this.items = []
      } finally {
        this.loading = false
      }
    },
  },
})
```

### Adding a New Database Model

1. Define the model in `prisma/schema.prisma`.
2. Add any required enums.
3. Run `npm run db:migrate` to create and apply the migration.
4. Run `npm run db:generate` to update the Prisma client types.
5. Add the corresponding TypeScript interfaces in `types/index.ts`.

### Adding a New Component

1. Create the component in `components/`:
   - `components/app/` -- Application-wide components (sidebar, topbar, etc.)
   - `components/test/` -- Test management components
   - `components/dashboard/` -- Dashboard components
   - Create new subdirectories for new feature areas
2. Components are auto-imported by Nuxt based on their directory path. For example, `components/test/StatusBadge.vue` is available as `<TestStatusBadge />`.

---

## Coding Conventions

### General

- **TypeScript** is used throughout. Avoid `any` types.
- **Zod** is used for all server-side input validation; do not use manual validation.
- **Prisma** is the sole data access layer; do not write raw SQL.
- **Activity logging** is required for all create, update, and delete operations.

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files (pages, components) | PascalCase for components, kebab-case for routes | `StatusBadge.vue`, `test-cases.get.ts` |
| TypeScript interfaces | PascalCase | `TestCase`, `CreateTestPlanInput` |
| API routes | kebab-case with HTTP method suffix | `test-cases.post.ts`, `[id].get.ts` |
| Database models | PascalCase (Prisma convention) | `TestPlan`, `OrganizationMember` |
| Enums | UPPER_SNAKE_CASE values | `STEP_BASED`, `ORGANIZATION_MANAGER` |
| Composables | `use` prefix, camelCase | `useTestCase`, `useAuth` |
| Stores | camelCase, `useXxxStore` factory | `useAuthStore`, `useProjectStore` |

### API Design Conventions

- All endpoints require authentication except login, register, and logout.
- List endpoints return paginated responses.
- Create endpoints return 201 with the created resource.
- Delete endpoints return `{ message: "...deleted successfully" }`.
- Error responses use `statusCode` and `statusMessage`.
- All routes verify organization membership before allowing access.

### Frontend Conventions

- Use `$fetch()` for API calls (not `useFetch` -- composables handle caching).
- Composables return `null` or empty arrays on error; they do not throw.
- Pinia stores handle global reactive state; composables handle API calls.
- Use the `middleware: 'auth'` page meta for protected routes.

---

## Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nuxt dev` | Start development server with hot reload |
| `build` | `nuxt build` | Build for production |
| `preview` | `nuxt preview` | Preview production build locally |
| `generate` | `nuxt generate` | Generate static site |
| `postinstall` | `nuxt prepare` | Generate .nuxt directory and types |
| `test:e2e` | `playwright test` | Run Playwright E2E tests |
| `db:generate` | `prisma generate` | Generate Prisma client |
| `db:migrate` | `prisma migrate dev` | Create and apply migrations |
| `db:migrate:deploy` | `prisma migrate deploy` | Apply migrations (production) |
| `db:seed` | `prisma db seed` | Seed the database |
| `db:studio` | `prisma studio` | Open visual database browser |
| `db:reset` | `prisma migrate reset` | Reset database (destructive) |
| `db:push` | `prisma db push` | Push schema changes (no migration) |

---

## Troubleshooting

### Database Connection Issues

**Symptom:** `Error: Can't reach database server`

1. Verify Docker is running: `docker compose ps`
2. Check if the port is in use: `lsof -i :5432`
3. Restart the database: `docker compose restart db`
4. Verify `DATABASE_URL` in `.env` matches Docker Compose settings.

### Prisma Client Not Found

**Symptom:** `Error: @prisma/client did not initialize`

```bash
npm run db:generate
```

### Migration Conflicts

**Symptom:** `Error: The migration is not in sync`

For development only:

```bash
npm run db:reset   # WARNING: Drops all data
```

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE :::3000`

Find and kill the process using port 3000:

```bash
lsof -ti :3000 | xargs kill -9
```

### TypeScript Errors After Schema Change

After modifying `prisma/schema.prisma`:

```bash
npm run db:generate   # Regenerate Prisma client types
npm run postinstall   # Regenerate Nuxt types
```
