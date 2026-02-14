# TestCraft

A full-stack test case management platform built with Nuxt 3, designed for QA teams to organize, execute, and track software testing across projects and organizations.

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3 + Nitro server)
- **UI:** Nuxt UI v3 + Tailwind CSS v4
- **Database:** PostgreSQL 16 + Prisma ORM
- **Auth:** Custom JWT (bcryptjs + jsonwebtoken)
- **State:** Pinia
- **Validation:** Zod
- **Testing:** Vitest (unit) + Playwright (e2e)

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Docker** and **Docker Compose** (for PostgreSQL)

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd testcraft
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed. The defaults work for local development:

```
DATABASE_URL="postgresql://testcraft:testcraft@localhost:5432/testcraft?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"
```

For production, generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port 5432.

### 4. Run database migrations and seed

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply migrations
npm run db:seed        # Populate with demo data
```

### 5. Start the dev server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 6. Log in with demo credentials

After seeding, you can log in with:

| Email | Password | Role |
|-------|----------|------|
| `admin@testcraft.dev` | `password123` | Admin |
| `sarah@example.com` | `password123` | Organization Manager |
| `mike@example.com` | `password123` | QA Engineer |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:unit` | Run unit tests once |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:all` | Run all tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:reset` | Reset database (destructive) |
| `npm run db:push` | Push schema changes without migration |

## Project Structure

```
testcraft/
├── assets/css/          # Global styles (Tailwind + Nuxt UI imports)
├── components/          # Reusable Vue components
│   ├── app/             #   Sidebar, TopBar, OrgSwitcher
│   ├── dashboard/       #   StatsCard, RecentActivity
│   └── test/            #   StatusBadge, StepBuilder, GherkinEditor, RunExecutor
├── composables/         # API abstraction layer (useAuth, useTestCase, etc.)
├── layouts/             # Page layouts (default, auth)
├── middleware/           # Route guards (auth)
├── pages/               # File-based routing (16 pages)
│   ├── auth/            #   Login, Register
│   ├── organizations/   #   Org list, org detail
│   └── projects/        #   Project detail, test plans/suites/cases/runs
├── plugins/             # Nuxt plugins
├── prisma/              # Database schema, migrations, seed
├── server/              # Nitro API server
│   ├── api/             #   55 REST endpoints
│   └── utils/           #   db, auth, activity helpers
├── stores/              # Pinia stores (auth, organization, project)
├── tests/               # Unit and e2e tests
├── types/               # TypeScript type definitions
└── docs/                # Additional documentation
```

## Features

- **Multi-tenant organizations** with configurable member limits
- **Role-based access control** (Organization Manager, Project Manager, Product Owner, QA Engineer, Developer)
- **Test plans** for organizing testing scope and schedules
- **Test suites** for grouping test cases by feature or risk level
- **Test cases** with step-based or Gherkin syntax support
- **Test runs** with status tracking (Pass, Fail, Blocked, Skipped)
- **Debug flags** on test cases for quick triage
- **Comments** on test cases and test runs
- **Activity logging** for audit trails
- **Dashboard** with project statistics
- **Dark mode** support

## API Overview

All endpoints are under `/api/`. Key resource groups:

- `/api/auth/*` -- Register, login, logout, current user
- `/api/organizations/*` -- CRUD, members, RBAC permissions
- `/api/projects/*` -- CRUD, stats, nested test resources
- `/api/test-plans/*` -- CRUD, link/unlink test cases
- `/api/test-suites/*` -- CRUD, link/unlink test cases
- `/api/test-cases/*` -- CRUD, debug flag, comments, runs
- `/api/test-runs/*` -- CRUD, status updates
- `/api/comments/*` -- Create, delete
- `/api/activity` -- Activity log queries

See [docs/API.md](docs/API.md) for the full endpoint reference.

## Database

The schema includes 16 models: User, Organization, OrganizationMember, RbacPermission, Project, ProjectMember, TestPlan, TestSuite, TestCase, TestPlanCase, TestSuiteCase, TestRun, Attachment, Comment, and ActivityLog.

All primary keys use CUIDs. Cascading deletes flow from Organization down through Projects to all test resources.

To explore the database visually:

```bash
npm run db:studio
```

## Additional Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) -- Technical architecture and design patterns
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) -- Developer setup guide with troubleshooting
- [docs/API.md](docs/API.md) -- API endpoint reference
- [docs/PHASE1_SUMMARY.md](docs/PHASE1_SUMMARY.md) -- Phase 1 completion report
