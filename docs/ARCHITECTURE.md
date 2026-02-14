# TestCraft Architecture Overview

Version: 1.0 (Phase 1)

---

## High-Level Architecture

```
+-----------------------------------------------------------+
|                        Browser                            |
|                                                           |
|  +------------+    +-----------+    +------------------+  |
|  | Vue Pages  | -> | Composable| -> | Pinia Store      |  |
|  | (.vue)     |    | (useXxx)  |    | (defineStore)    |  |
|  +------------+    +-----------+    +------------------+  |
|       |                  |                 |              |
|       +------------------+-----------------+              |
|                          |                                |
|                    $fetch / useFetch                      |
+--------------------------|--------------------------------+
                           |
                    HTTP (REST API)
                           |
+--------------------------|--------------------------------+
|                   Nuxt 3 Server (Nitro)                   |
|                          |                                |
|  +---------------------------------------------------+   |
|  |              Server API Routes                     |   |
|  |  /api/auth/*   /api/organizations/*   /api/...     |   |
|  +---------------------------------------------------+   |
|       |              |                |                   |
|  +---------+   +-----------+   +-----------+              |
|  | Auth    |   | Activity  |   | Zod       |              |
|  | Utils   |   | Logger    |   | Validation|              |
|  +---------+   +-----------+   +-----------+              |
|       |              |                                    |
|  +---------------------------------------------------+   |
|  |             Prisma ORM (Type-Safe)                 |   |
|  +---------------------------------------------------+   |
|                          |                                |
+--------------------------|----- --------------------------+
                           |
                    PostgreSQL 16
                  (Docker Container)
```

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Nuxt 3 | ^3.15.0 | Full-stack Vue 3 framework with SSR and file-based routing |
| **UI Library** | Nuxt UI | ^4.3.0 | Pre-built component library with Tailwind integration |
| **Styling** | Tailwind CSS | ^4.1.18 | Utility-first CSS framework |
| **State Management** | Pinia | ^3.0.4 | Vue 3 official state management |
| **Forms** | FormKit | ^1.7.2 | Form handling and validation |
| **Utilities** | VueUse | ^14.2.1 | Collection of Vue composition utilities |
| **Database** | PostgreSQL | 16 (Alpine) | Relational database |
| **ORM** | Prisma | ^6.19.2 | Type-safe database client with migrations |
| **Authentication** | jsonwebtoken + bcryptjs | ^9.0.3 / ^3.0.3 | JWT token generation and password hashing |
| **Validation** | Zod | ^4.3.6 | Runtime schema validation for API inputs |
| **Unit Testing** | Vitest | ^3.2.4 | Unit test runner |
| **E2E Testing** | Playwright | ^1.50.0 | End-to-end browser testing |
| **Language** | TypeScript | ^5.7.0 | Static type checking |

---

## Directory Structure

```
testcraft/
|-- .env                          # Environment variables (gitignored)
|-- .env.example                  # Environment variable template
|-- docker-compose.yml            # PostgreSQL container definition
|-- nuxt.config.ts                # Nuxt configuration
|-- package.json                  # Dependencies and scripts
|-- tsconfig.json                 # TypeScript configuration
|-- vitest.config.ts              # Vitest unit test configuration
|-- playwright.config.ts          # Playwright E2E test configuration
|
|-- prisma/
|   |-- schema.prisma             # Database schema (models, enums, relations)
|   |-- seed.ts                   # Database seed script with demo data
|
|-- server/
|   |-- utils/
|   |   |-- db.ts                 # Prisma client singleton
|   |   |-- auth.ts               # JWT authentication helpers
|   |   |-- activity.ts           # Activity log helper
|   |
|   |-- api/
|       |-- auth/
|       |   |-- register.post.ts  # User registration
|       |   |-- login.post.ts     # User login
|       |   |-- me.get.ts         # Current user profile
|       |   |-- logout.post.ts    # User logout (stateless)
|       |
|       |-- organizations/
|       |   |-- index.get.ts      # List user's organizations
|       |   |-- index.post.ts     # Create organization
|       |   |-- [id].get.ts       # Get organization details
|       |   |-- [id].put.ts       # Update organization
|       |   |-- [id]/
|       |       |-- members.get.ts     # List members
|       |       |-- members.post.ts    # Invite member
|       |       |-- members/
|       |       |   |-- [memberId].put.ts    # Update member role
|       |       |   |-- [memberId].delete.ts # Remove member
|       |       |-- rbac.get.ts        # Get RBAC permissions
|       |       |-- rbac.put.ts        # Bulk update RBAC
|       |       |-- rbac/
|       |       |   |-- [permissionId].put.ts # Toggle single permission
|       |       |-- projects.get.ts    # List org projects
|       |       |-- projects.post.ts   # Create project in org
|       |
|       |-- projects/
|       |   |-- index.post.ts     # Create project (with orgId in body)
|       |   |-- [id].get.ts       # Get project
|       |   |-- [id].put.ts       # Update project
|       |   |-- [id].delete.ts    # Delete project
|       |   |-- [id]/
|       |       |-- test-plans.get.ts   # List project test plans
|       |       |-- test-plans.post.ts  # Create test plan
|       |       |-- test-suites.get.ts  # List project test suites
|       |       |-- test-suites.post.ts # Create test suite
|       |       |-- test-cases.get.ts   # List project test cases
|       |       |-- test-runs.get.ts    # List project test runs
|       |       |-- stats.get.ts        # Project dashboard stats
|       |
|       |-- test-plans/
|       |   |-- index.post.ts     # Create test plan (with projectId)
|       |   |-- [id].get.ts       # Get test plan with linked cases
|       |   |-- [id].put.ts       # Update test plan
|       |   |-- [id].delete.ts    # Delete test plan
|       |   |-- [id]/
|       |       |-- test-cases.post.ts        # Link case to plan
|       |       |-- test-cases/
|       |           |-- [caseId].delete.ts    # Unlink case from plan
|       |
|       |-- test-suites/
|       |   |-- index.post.ts     # Create test suite (with projectId)
|       |   |-- [id].get.ts       # Get test suite with linked cases
|       |   |-- [id].put.ts       # Update test suite
|       |   |-- [id].delete.ts    # Delete test suite
|       |   |-- [id]/
|       |       |-- test-cases.post.ts        # Link case to suite
|       |       |-- test-cases/
|       |           |-- [caseId].delete.ts    # Unlink case from suite
|       |
|       |-- test-cases/
|       |   |-- index.post.ts     # Create test case
|       |   |-- [id].get.ts       # Get test case (full detail)
|       |   |-- [id].put.ts       # Update test case
|       |   |-- [id].delete.ts    # Delete test case
|       |   |-- [id]/
|       |       |-- debug-flag.put.ts   # Toggle debug flag
|       |       |-- comments.get.ts     # Get test case comments
|       |       |-- attachments.get.ts  # Get test case attachments
|       |       |-- runs.get.ts         # Get test case runs
|       |
|       |-- test-runs/
|       |   |-- index.post.ts     # Create test run
|       |   |-- [id].get.ts       # Get test run
|       |   |-- [id].put.ts       # Update test run
|       |   |-- [id].delete.ts    # Delete test run
|       |
|       |-- comments/
|       |   |-- index.post.ts     # Create comment
|       |   |-- [id].delete.ts    # Delete comment
|       |
|       |-- activity/
|           |-- index.get.ts      # Get activity logs
|
|-- stores/
|   |-- auth.ts                   # Authentication state (user, token)
|   |-- organization.ts           # Organization state (list, current)
|   |-- project.ts                # Project state (list, current)
|
|-- composables/
|   |-- useAuth.ts                # Auth operations (login, register, logout)
|   |-- useOrganization.ts        # Organization CRUD operations
|   |-- useProject.ts             # Project CRUD operations
|   |-- useTestPlan.ts            # Test plan CRUD + linking
|   |-- useTestSuite.ts           # Test suite CRUD + linking
|   |-- useTestCase.ts            # Test case CRUD + debug flag + comments
|   |-- useTestRun.ts             # Test run CRUD operations
|
|-- types/
|   |-- index.ts                  # All TypeScript type definitions
|
|-- layouts/
|   |-- default.vue               # Main app layout (sidebar, topbar)
|   |-- auth.vue                  # Auth layout (login, register)
|
|-- middleware/
|   |-- auth.ts                   # Route guard for protected pages
|
|-- pages/
|   |-- index.vue                 # Landing/home page
|   |-- dashboard.vue             # Main dashboard
|   |-- auth/
|   |   |-- login.vue             # Login page
|   |   |-- register.vue          # Registration page
|   |-- organizations/
|   |   |-- index.vue             # Organizations list
|   |   |-- [id].vue              # Organization detail
|   |-- projects/
|   |   |-- [id].vue              # Project detail
|   |   |-- [id]/
|   |       |-- test-plans/
|   |       |   |-- index.vue     # Test plans list
|   |       |   |-- [planId].vue  # Test plan detail
|   |       |-- test-suites/
|   |       |   |-- index.vue     # Test suites list
|   |       |   |-- [suiteId].vue # Test suite detail
|   |       |-- test-cases/
|   |       |   |-- index.vue     # Test cases list
|   |       |   |-- new.vue       # Create test case form
|   |       |   |-- [caseId].vue  # Test case detail
|   |       |-- runs/
|   |           |-- index.vue     # Test runs list
|   |-- settings/
|       |-- index.vue             # Settings page
|
|-- components/
|   |-- app/
|   |   |-- Sidebar.vue           # Navigation sidebar
|   |   |-- TopBar.vue            # Top navigation bar
|   |   |-- OrgSwitcher.vue       # Organization switcher dropdown
|   |-- test/
|   |   |-- StatusBadge.vue       # Test run status badge
|   |   |-- DebugFlagToggle.vue   # Debug flag toggle button
|   |   |-- StepBuilder.vue       # Step-based test case editor
|   |   |-- GherkinEditor.vue     # Gherkin syntax editor
|   |   |-- RunExecutor.vue       # Test run execution component
|   |-- dashboard/
|       |-- StatsCard.vue         # Dashboard statistics card
|       |-- RecentActivity.vue    # Recent activity feed
|
|-- assets/
|   |-- css/
|       |-- main.css              # Global styles (Tailwind directives)
|
|-- tests/
|   |-- unit/
|   |   |-- setup.ts              # Vitest setup (localStorage mock)
|   |-- e2e/
|       |-- app.spec.ts           # Playwright E2E test
|
|-- docs/                         # Project documentation
```

---

## Data Flow

### Frontend Data Flow

```
User Interaction
      |
      v
Vue Page (.vue)
      |
      | calls
      v
Composable (useXxx)
      |
      | calls $fetch() for data operations
      | calls Pinia store for state management
      v
+-----+--------+
|              |
v              v
Pinia Store    $fetch() -> Nuxt Server API
|                          |
| reactive state           | HTTP response
v                          v
Vue Page re-renders    Composable returns data
```

1. **Pages** are the entry point for user interaction. They use `composables` and `stores`.
2. **Composables** (`useAuth`, `useOrganization`, etc.) encapsulate API calls via `$fetch()` and delegate state management to Pinia stores.
3. **Pinia Stores** (`auth`, `organization`, `project`) hold reactive application state that persists across page navigations.
4. **$fetch()** (Nuxt's built-in fetch utility) makes HTTP requests to the server API routes.

### Backend Data Flow

```
HTTP Request
      |
      v
Nitro Event Handler (server/api/...)
      |
      | 1. Authentication check (requireAuth)
      | 2. Input validation (Zod)
      | 3. Authorization check (membership/role)
      | 4. Business logic
      | 5. Prisma query
      | 6. Activity logging (logActivity)
      v
HTTP Response (JSON)
```

1. Every API route handler receives an H3 event.
2. `requireAuth(event)` extracts and verifies the JWT token.
3. Zod schemas validate the request body.
4. Organization membership and role checks enforce authorization.
5. Prisma performs the database operation.
6. `logActivity()` records the action (non-blocking, failures are silently caught).

---

## Authentication Flow

```
Registration / Login
         |
         v
   Server validates credentials
         |
         v
   Server creates JWT (7-day expiry)
   payload: { userId, email }
         |
         v
   JWT returned to client
         |
         v
   Client stores token in localStorage
   Client stores token in Pinia auth store
         |
         v
   Subsequent requests include:
   Authorization: Bearer <token>
         |
         v
   Server middleware (getUserFromEvent):
   1. Extract token from Authorization header
   2. Verify JWT signature with jwtSecret
   3. Look up user by userId from token payload
   4. Verify user status is ACTIVE
   5. Return user object (excluding passwordHash)
```

### Key Security Decisions

- **Password hashing:** bcryptjs with 12 salt rounds (registration), 10 rounds (seed)
- **Token expiry:** 7 days (`{ expiresIn: '7d' }`)
- **First-user admin:** The first user to register automatically becomes a system admin (`isAdmin: true`)
- **Stateless logout:** The server does not track active sessions. Logout is handled entirely client-side by removing the token from localStorage.
- **Password hash exclusion:** The `userSelectFields` constant ensures `passwordHash` is never included in API responses.

---

## RBAC System

### Overview

TestCraft implements a dynamic, organization-specific RBAC (Role-Based Access Control) system. Permissions are stored in the database, not hardcoded, allowing Organization Managers to customize access per role.

### Permission Model

Each permission is a unique combination of:

- **Organization** -- permissions are scoped per organization
- **Role** -- one of: ORGANIZATION_MANAGER, PROJECT_MANAGER, PRODUCT_OWNER, QA_ENGINEER, DEVELOPER
- **Object Type** -- one of: TEST_SUITE, TEST_PLAN, TEST_CASE, TEST_RUN, REPORT
- **Action** -- one of: READ, EDIT, DELETE
- **Allowed** -- boolean flag

### Default Permission Matrix

When an organization is created, the following default permissions are seeded:

| Role | READ | EDIT | DELETE |
|------|------|------|--------|
| **ORGANIZATION_MANAGER** | All objects | All objects | All objects |
| **PROJECT_MANAGER** | All objects | All objects | All objects |
| **PRODUCT_OWNER** | All objects | All objects (except Test Runs, Reports) | None |
| **QA_ENGINEER** | All objects | All objects (except Reports) | None |
| **DEVELOPER** | All objects | None | None |

### Access Control Enforcement

Currently, access control is enforced at two levels:

1. **Organization membership:** All API routes verify the user is a member of the organization that owns the requested resource.
2. **Role-based checks:** Specific operations (create project, update org, invite members, manage RBAC) check for specific roles (e.g., ORGANIZATION_MANAGER).

The RBAC permissions stored in the database are available via the API for the frontend to query, but fine-grained per-action enforcement against the RBAC table is deferred to Phase 2.

---

## Database Design

### Entity Relationship Diagram

```
User
 |-- 1:N --> OrganizationMember
 |-- 1:N --> ProjectMember
 |-- 1:N --> TestPlan (createdBy)
 |-- 1:N --> TestSuite (createdBy)
 |-- 1:N --> TestCase (createdBy)
 |-- 1:N --> TestCase (debugFlaggedBy)
 |-- 1:N --> TestRun (executedBy)
 |-- 1:N --> Attachment (uploadedBy)
 |-- 1:N --> Comment (author)
 |-- 1:N --> ActivityLog

Organization
 |-- 1:N --> OrganizationMember
 |-- 1:N --> RbacPermission
 |-- 1:N --> Project

Project
 |-- N:1 --> Organization
 |-- 1:N --> ProjectMember
 |-- 1:N --> TestPlan
 |-- 1:N --> TestSuite
 |-- 1:N --> TestCase

TestPlan
 |-- N:1 --> Project
 |-- M:N --> TestCase (via TestPlanCase)

TestSuite
 |-- N:1 --> Project
 |-- M:N --> TestCase (via TestSuiteCase)

TestCase
 |-- N:1 --> Project
 |-- M:N --> TestPlan (via TestPlanCase)
 |-- M:N --> TestSuite (via TestSuiteCase)
 |-- 1:N --> TestRun
 |-- 1:N --> Attachment

TestRun
 |-- N:1 --> TestCase
 |-- N:1 --> User (executedBy)
 |-- 1:N --> Attachment

Comment (polymorphic)
 |-- Belongs to TEST_CASE or TEST_RUN (via commentableType + commentableId)

ActivityLog
 |-- N:1 --> User
 |-- References any entity (via objectType + objectId)
```

### Key Design Decisions

1. **CUIDs for IDs:** All primary keys use `cuid()` for collision-resistant, sortable, URL-safe identifiers.
2. **Cascading deletes:** Deleting an organization cascades to projects, which cascades to test plans/suites/cases/runs.
3. **Many-to-many with explicit join tables:** `TestPlanCase` and `TestSuiteCase` join tables allow test cases to belong to multiple plans and suites.
4. **Polymorphic comments:** The `Comment` model uses `commentableType` and `commentableId` to support comments on both test cases and test runs.
5. **Cached last run status:** The `TestCase` model caches `lastRunStatus` and `lastRunAt` from the most recent test run, avoiding expensive joins for list views.
6. **Comprehensive indexing:** All foreign keys, frequently-queried columns (status, debugFlag, createdAt), and composite indexes for polymorphic lookups are indexed.
7. **Activity log as append-only:** The `ActivityLog` table is write-only from the application's perspective, storing JSON diffs of changes.

---

## Prisma Client Singleton

The Prisma client is instantiated as a singleton to prevent connection pool exhaustion during development (Nuxt hot-reloads):

```typescript
// server/utils/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Frontend Architecture

### State Management Strategy

The application uses a three-tier state management approach:

1. **Pinia Stores** (global, persistent state):
   - `auth` store: Current user and JWT token. Token persisted to localStorage.
   - `organization` store: List of organizations and current organization. Current org ID persisted to localStorage.
   - `project` store: List of projects and current project.

2. **Composables** (business logic layer):
   - Each domain has a composable (e.g., `useTestCase`, `useTestPlan`) that encapsulates API calls.
   - Composables use `$fetch()` directly for CRUD operations.
   - Composables expose both reactive computed properties (from stores) and async functions.

3. **Page-level state** (local, ephemeral):
   - Filters, form inputs, and UI state managed with Vue `ref()` and `reactive()`.

### Route Protection

The `middleware/auth.ts` route middleware protects authenticated pages:

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  if (!authStore.token) authStore.initFromStorage()
  if (!authStore.isAuthenticated && !authStore.token) {
    return navigateTo('/auth/login', { replace: true })
  }
})
```

### Layout System

- **`default` layout:** Full application layout with sidebar, topbar, and org switcher. Used for all authenticated pages.
- **`auth` layout:** Minimal layout for login and registration pages.

---

## API Design Patterns

### Consistent Route Handler Structure

Every API route follows this pattern:

```typescript
export default defineEventHandler(async (event) => {
  // 1. Authenticate
  const user = await requireAuth(event)

  // 2. Extract parameters
  const id = getRouterParam(event, 'id')

  // 3. Validate input (for POST/PUT)
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  // 4. Authorize (check membership/role)
  const membership = await prisma.organizationMember.findUnique({ ... })
  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  // 5. Execute business logic
  const entity = await prisma.entity.create({ ... })

  // 6. Log activity
  await logActivity(user.id, 'CREATED', 'Entity', entity.id, { ... })

  // 7. Return response
  setResponseStatus(event, 201)
  return entity
})
```

### Validation

All input validation uses Zod schemas with `.safeParse()`. The first validation error message is returned as the HTTP status message.

### Error Handling

Errors are thrown using Nuxt's `createError()` which returns structured error responses with `statusCode` and `statusMessage`.

### Activity Logging

The `logActivity()` utility is called after every create, update, and delete operation. It is wrapped in a try-catch to ensure logging failures never break the main operation.
