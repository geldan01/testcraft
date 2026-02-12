# TestCraft: Comprehensive Requirements Document

**Version:** 1.0
**Date:** February 11, 2026
**Status:** Foundational Requirements — Ready for Development

---

## 1. Project Overview

### What is TestCraft?

TestCraft is an **open-source, self-hostable test management platform** designed to help software teams organize test plans, track test execution, collaborate on quality assurance, and generate insightful reports. It serves as a centralized hub for manual and automated testing workflows.

### Target Users

- **QA Engineers**: Create and maintain test plans, suites, and cases
- **Developers**: Execute tests, document results, investigate failures
- **Project Managers**: Monitor testing progress and generate reports
- **Product Owners**: Oversight of testing coverage and quality metrics
- **Organization Managers**: Configure the platform, manage users and permissions

### Core Value Proposition

- **Multi-tenant architecture**: Support multiple organizations, each with multiple projects
- **Flexible test structure**: Support both step-based and Gherkin (BDD) test cases
- **Customizable RBAC**: Organization Managers define role-based access control
- **Execution tracking**: Full history of manual and automated test runs
- **Visual reporting**: Executive dashboards with time-range and scope filtering
- **Open-source & self-hostable**: Public GitHub repository, Docker-based deployment

### Business Model

- **Open-source**: Public repository for community contribution
- **Self-hosted**: Teams deploy on their own infrastructure
- **Future tiered plans**: Configurable limits (max projects, max test cases per org) with potential SaaS offering later

---

## 2. User Roles & Permissions

### Role Definitions

| Role | Description | Key Capabilities |
|------|-------------|------------------|
| **Admin** | Support/system administrator | Manage all users across all organizations |
| **Organization Manager** | Owner/administrator of an organization | Create projects, manage org members, define RBAC policies, assign roles |
| **Project Manager** | Oversees specific projects | Invite users to projects, view all tests/runs/reports, generate reports (read-only on test plans) |
| **Product Owner** | Product oversight role | View tests and reports (permissions configurable via RBAC) |
| **QA Engineer** | Test designer and executor | Create, modify, delete test plans, suites, cases; execute tests; flag DEBUG |
| **Developer** | Code contributor and tester | Execute tests, document results, generate reports, view tests (read-only on plans) |

### Customizable RBAC System

**Organization Managers have a dedicated RBAC configuration panel** where they can define permissions for each role:

- **Actions**: Read, Edit, Delete
- **Objects**: Test Suites, Test Plans, Test Cases, Test Runs, Reports

Example configuration:
```
Role: Product Owner
- Test Plans: Read, Edit, Delete
- Test Cases: Read, Edit, Delete
- Test Runs: Read, Edit, Delete
- Reports: Read, Edit, Delete
```

This makes the permission system **dynamic and organization-specific**, not hardcoded.

### User Onboarding Flow

1. **First signup ever** -> User becomes **system Admin**
2. **Subsequent signups** -> Users create accounts (open registration by default)
3. **Admin can disable public registration** -> Make platform invite-only
4. **Creating an organization** -> Any user can create an org (requires a plan -- **free for v1**)
5. **Organization creator** -> Automatically becomes **Organization Manager**
6. **Adding users to organizations** -> Organization Manager invites users by email OR selects from existing platform users
7. **Project invitations** -> Project Managers can invite users to specific projects

**Key principle**: Users can exist on the platform without belonging to any organization. Organization membership is controlled by Organization Managers.

---

## 3. Data Model & Object Hierarchy

### Entity Relationship Overview

```
Organization
  +- Projects (1-to-many)
  |   +- Test Plans (many-to-many with Test Cases)
  |   +- Test Suites (many-to-many with Test Cases)
  |   +- Test Cases
  |       +- Preconditions
  |       +- Steps (or Gherkin syntax)
  |       +- Test Runs (1-to-many)
  |           +- Metadata (user, timestamp, environment, status)
  |           +- Attachments (screenshots, logs, videos)
  +- Members (users with roles)
```

### Core Entities

#### Organization
- **Fields**: name, created_at, settings (max_projects, max_test_cases -- configurable)
- **Relationships**: Has many Projects, has many Members (through organization_members join table)

#### Project
- **Fields**: name, description, organization_id, created_at
- **Relationships**: Belongs to Organization, has many Test Plans, Test Suites, Test Cases

#### Test Plan
- **Purpose**: Define the "why" and "when" of testing (release cycle, sprint, environment)
- **Fields**:
  - name, description, project_id
  - scope, schedule, test_types
  - entry_criteria, exit_criteria
  - created_at, updated_at
- **Relationships**:
  - Belongs to Project
  - **Many-to-many** with Test Cases (through test_plan_cases join table)

#### Test Suite
- **Purpose**: Group tests by feature, risk level, or test type
- **Fields**: name, description, project_id, suite_type (feature, risk, smoke, regression, API, etc.)
- **Relationships**:
  - Belongs to Project
  - **Many-to-many** with Test Cases (through test_suite_cases join table)

#### Test Case
- **Purpose**: Atomic unit of testing -- the actual test to be executed
- **Fields**:
  - name, description, project_id
  - preconditions (environment, browser, current_page, logged_in_status, etc.)
  - test_type: "step-based" | "gherkin"
  - steps (JSON array for step-based) OR gherkin_syntax (text for BDD)
  - debug_flag (boolean), debug_flagged_at, debug_flagged_by (user_id)
  - last_run_status (cached from most recent Run)
  - last_run_at (cached timestamp)
  - created_at, updated_at, created_by (user_id)
- **Relationships**:
  - Belongs to Project
  - **Many-to-many** with Test Plans
  - **Many-to-many** with Test Suites
  - **Has many** Test Runs

**Step-based Test Case structure** (JSON):
```json
{
  "steps": [
    {
      "step_number": 1,
      "action": "Click login button",
      "data": "username: test@example.com",
      "expected_result": "Login form appears"
    },
    {
      "step_number": 2,
      "action": "Enter credentials and submit",
      "data": "password: ******",
      "expected_result": "User is redirected to dashboard"
    }
  ]
}
```

**Gherkin Test Case** (text):
```gherkin
Given the user is on the login page
When the user enters valid credentials
And clicks the login button
Then the user should be redirected to the dashboard
```

#### Test Run
- **Purpose**: A single execution of a Test Case (first-class object with full history)
- **Fields**:
  - test_case_id
  - executed_by (user_id)
  - executed_at (timestamp)
  - environment (dev, staging, prod, etc.)
  - status: "Pass" | "Fail" | "Blocked" | "Skipped" | "In Progress" | "Not Run"
  - duration (seconds)
  - notes (text -- manual commentary)
  - created_at, updated_at
- **Relationships**:
  - Belongs to Test Case
  - Has many Attachments (screenshots, logs, videos)

#### Attachment
- **Fields**: file_url, file_type, uploaded_by (user_id), uploaded_at
- **Relationships**: Belongs to Test Run (or Test Case for general attachments)

#### Comment
- **Fields**: content, author (user_id), commentable_type (Test Case, Test Run), commentable_id, created_at
- **Relationships**: Polymorphic -- can belong to Test Case or Test Run

#### Activity Log / Audit Trail
- **Fields**: user_id, action_type (created, updated, deleted), object_type (Test Case, Test Plan, etc.), object_id, changes (JSON diff), timestamp
- **Purpose**: Track all modifications for compliance and debugging

---

## 4. Authentication & User Management

### Authentication Methods (v1)

- **Email/Password** -- Classic authentication
- **OAuth with Google** -- Social login
- **OAuth with Facebook** -- Social login

### Future Considerations (post-v1)
- SSO/SAML for enterprises
- Magic links (passwordless)
- LDAP/Active Directory for on-premise deployments

### Session Management
- JWT-based authentication (stateless)
- Refresh tokens for extended sessions
- Configurable session timeout via `.env`

### Password Requirements
- Minimum 8 characters
- Must include uppercase, lowercase, number, special character
- Configurable via `.env` for self-hosted deployments

### User Account States
- **Active**: Normal account
- **Suspended**: Admin-disabled account
- **Pending Invitation**: User invited but hasn't accepted yet

---

## 5. Execution Tracking

### Manual Test Execution Flow

**QA Engineer or Developer workflow**:

1. Navigate to a **Test Plan** (shows list of linked test cases)
2. Open a **Test Case**
3. Click **"Run"** button on Test Case page
4. System creates a new **Test Run object** and displays:
   - Test steps (or Gherkin syntax)
   - Start timestamp
   - Status selector dropdown
5. User executes test manually, step by step
6. User sets final status: Pass, Fail, Blocked, Skipped
7. User can attach screenshots, logs, or notes
8. Test Run is saved with full metadata
9. **Test Case object updates** `last_run_status` and `last_run_at` for quick visibility

### Automated Test Execution (Post-v1)

**Future integration with automated test runners**:
- Playwright, Cypress, Selenium, Jest, etc.
- Test runners send results to TestCraft via **API** or **webhook**
- Automatically create Test Run objects with pass/fail status
- Attach logs, screenshots, videos programmatically

**v1 Note**: Design the API endpoints now (even if unused), so automated integration is seamless later.

### Test Run Statuses

| Status | Description |
|--------|-------------|
| **Not Run** | Test case has never been executed |
| **In Progress** | Test execution started but not completed |
| **Pass** | Test executed successfully, all steps passed |
| **Fail** | Test failed, expected vs actual mismatch |
| **Blocked** | Test cannot be executed due to blocker (e.g., environment down) |
| **Skipped** | Test intentionally not executed (out of scope for this run) |

### DEBUG Flag System

**Purpose**: Simple queue-based system for flagging failing tests that need developer attention.

**How it works**:
1. QA Engineer notices a test failure
2. Flags the **Test Case** (not the Run) with **DEBUG status**
3. Developers see a **dedicated view**: "All Test Cases Flagged DEBUG"
4. Developer investigates, fixes issue, and removes DEBUG flag

**Data model**:
- `test_cases.debug_flag` (boolean)
- `test_cases.debug_flagged_at` (timestamp)
- `test_cases.debug_flagged_by` (user_id)

### Environment Tracking

Each Test Run records the **environment** where it was executed:
- Development
- Staging
- Production
- QA
- Custom (configurable via dropdown)

This enables **per-environment reporting** (e.g., "staging has 20% fail rate, but prod is clean").

---

## 6. Reporting & Dashboards

### Executive Summary Dashboard

**Purpose**: High-level overview of testing health, accessible to **all project members** (not just managers).

**Key Features**:

#### Time-Range Filters
- Last 24 hours
- Last 3 days
- Last 7 days
- All time
- Custom date range

#### Scope Filters
- **Global view**: All Test Cases across the project
- **Per Test Plan**: Filter to a specific plan
- **Per Test Suite**: Filter to a specific suite

#### Visual Components

1. **Pass/Fail Breakdown** (Pie chart or donut chart)
   - % Pass, % Fail, % Blocked, % Skipped, % Not Run

2. **Test Execution Trend** (Line chart over time)
   - X-axis: Time (days/weeks)
   - Y-axis: # of tests executed, % pass rate

3. **Environment Comparison** (Bar chart)
   - Compare pass rates across dev, staging, prod

4. **Flaky Test Detection** (Table)
   - Identify test cases with inconsistent results (e.g., passed 3 times, failed 2 times in last 7 days)
   - Show flakiness score (% of runs that failed)

5. **Top Failing Tests** (Table)
   - Test cases with highest fail count in selected time range
   - Link to DEBUG flagged tests

6. **Test Coverage Overview** (Deferred to post-v1)
   - % of requirements with linked test cases

#### Export Formats
- **PDF**: Executive summary report with charts
- **Excel/CSV**: Raw data tables for further analysis
- **JSON**: API export for integrations

### Role-Specific Report Views

| Role | Report Access |
|------|---------------|
| **Developer** | Can view reports, generate exports, see their own test run history |
| **QA Engineer** | Full access to all reports, can drill into test case details |
| **Project Manager** | Full access, primarily uses Executive Summary |
| **Product Owner** | Configurable via RBAC (typically read-only access) |
| **Organization Manager** | Full access across all projects in the organization |

---

## 7. Collaboration Features

### Comments & Discussions

- **Where**: On Test Cases and Test Runs
- **Features**:
  - Rich text editor (markdown support)
  - @mentions to notify specific users
  - Threaded replies (optional for v2)
  - Timestamps and author attribution

### Attachments

- **Where**: On Test Runs (primarily) and Test Cases
- **Supported file types**:
  - Images (PNG, JPG, GIF) -- screenshots
  - Videos (MP4, WebM) -- screen recordings
  - Logs (TXT, JSON, XML)
  - Archives (ZIP) -- crash dumps, HAR files
- **Storage**: Configurable via `.env` (Cloudflare, S3, Supabase Storage, local filesystem)
- **Max file size**: Configurable (default 50MB per file)

### Notifications

**Triggers**:
- Test flagged as DEBUG
- New comment on a test case you're involved with
- Test run fails in production environment
- @mention in a comment
- User invited to project

**Channels**:
- **In-app notifications** (bell icon, notification center)
- **Email notifications** (configurable per-user preferences)

**User preferences** (per user):
- Enable/disable email notifications
- Choose which events trigger emails
- Digest mode (daily summary vs real-time)

### Real-Time Collaboration

**v1 Implementation**:
- **Simple polling approach**: Frontend polls API every 5-10 seconds for updates
- Show "User X is currently editing this test case" indicator
- Conflict resolution: Last write wins (with warning)

**Post-v1 Enhancement**:
- **WebSockets** (via Socket.io or Nuxt's native server capabilities)
- Real-time cursor positions, live editing indicators

### Activity Log / Audit Trail

**What gets logged**:
- Test Case created, updated, deleted
- Test Plan created, updated, deleted
- Test Suite created, updated, deleted
- Test Run created, status changed
- DEBUG flag added/removed
- User added to project/organization
- RBAC permissions changed

**UI**:
- **Per-object activity feed**: Show changes specific to a test case
- **Project-wide activity feed**: Recent activity across the project
- **Filterable by user, date, action type**

---

## 8. Integrations (Post-v1)

### Planned Integrations

**Priority 1** (post-v1):
- **Playwright**: Automated test runner integration
- **GitHub Actions**: Trigger test runs on CI/CD pipelines

**Priority 2** (future):
- **Slack / Microsoft Teams**: Notifications and reports
- **Jira / Linear**: Create bug tickets from failed tests
- **Cypress, Selenium, Jest**: Additional test framework support

### Integration Architecture (Design Now, Build Later)

**API-First Approach**:
- All frontend operations use a REST or GraphQL API
- External tools can use the same API
- Generate API documentation (Swagger/OpenAPI)

**Webhook System**:
- Allow external services to subscribe to events:
  - `test_run.completed`
  - `test_case.flagged_debug`
  - `test_plan.created`
- Webhook payload includes full object data + metadata

---

## 9. Tech Stack

### Frontend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | **Nuxt 3** (Vue 3) | Already scaffolded, server-side rendering, file-based routing |
| **Styling** | **Tailwind CSS** | Utility-first, highly customizable |
| **Component Library** | **Nuxt UI** or **Shadcn Vue** | Modern, composable, Tailwind-compatible |
| **Charts** | **Apache ECharts** | Feature-rich, handles complex dashboards well |
| **Forms** | **FormKit** | Nuxt-native, validation built-in |
| **Rich Text Editor** | **TipTap** | Modern, extensible, markdown support for comments |
| **State Management** | **Pinia** (Nuxt built-in) | Vue 3's official state management |

### Backend

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Server Framework** | **Nuxt Server API** (Nitro) | Built into Nuxt 3, no separate backend needed |
| **Database** | **PostgreSQL** | Relational data, RBAC, aggregations, open-source standard |
| **ORM** | **Prisma** or **Drizzle ORM** | Type-safe, migration management |
| **Authentication** | **Nuxt Auth** or custom JWT | Email/password + OAuth (Google, Facebook) |
| **File Storage** | **Configurable via .env** | Cloudflare, S3, Supabase Storage, local filesystem |
| **Real-Time (v1)** | **Simple polling** (5-10 sec intervals) | Sufficient for v1 |
| **Real-Time (v2)** | **Socket.io** or **Nuxt WebSockets** | Future upgrade for live collaboration |

### DevOps & Deployment

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Containerization** | **Docker** | Single container for app + separate container for PostgreSQL |
| **CI/CD** | **GitHub Actions** | Optional for self-hosters |
| **Environment Config** | **.env file** with sensible defaults | All limits, storage providers, auth secrets configurable |

---

## 10. Deployment & Infrastructure

### Docker Compose Setup

```yaml
version: '3.8'

services:
  testcraft-app:
    image: testcraft:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/testcraft
      - JWT_SECRET=${JWT_SECRET}
      - STORAGE_PROVIDER=${STORAGE_PROVIDER}
      - MAX_PROJECTS_PER_ORG=${MAX_PROJECTS_PER_ORG:-10}
      - MAX_TEST_CASES_PER_PROJECT=${MAX_TEST_CASES_PER_PROJECT:-1000}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=testcraft

volumes:
  postgres-data:
```

### Environment Configuration

All settings configurable via `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/testcraft

# Authentication
JWT_SECRET=your-secret-key
SESSION_TIMEOUT=7d
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_FACEBOOK_CLIENT_ID=...
OAUTH_FACEBOOK_CLIENT_SECRET=...

# Storage
STORAGE_PROVIDER=cloudflare  # cloudflare | s3 | supabase | local
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...

# Limits (configurable per deployment)
MAX_PROJECTS_PER_ORG=10
MAX_TEST_CASES_PER_PROJECT=1000
MAX_FILE_SIZE_MB=50
ALLOW_PUBLIC_REGISTRATION=true

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
FROM_EMAIL=noreply@testcraft.example.com

# Application
BASE_URL=https://testcraft.example.com
NODE_ENV=production
```

---

## 11. Scale & Configuration

### Configurable Limits

All limits set via environment variables (not hardcoded):

- `MAX_PROJECTS_PER_ORG` (default: 10)
- `MAX_TEST_CASES_PER_PROJECT` (default: 1,000)
- `MAX_TEST_SUITES_PER_PROJECT` (default: 50)
- `MAX_TEST_PLANS_PER_PROJECT` (default: 20)
- `MAX_FILE_SIZE_MB` (default: 50)
- `MAX_ORG_MEMBERS` (default: unlimited)

### Database Design Considerations
- **Indexes** on: organization_id, project_id, test_case_id, user_id, created_at, status, debug_flag
- **Partitioning** (future): Partition `test_runs` table by date if run history grows massive
- **Archival strategy** (future): Move runs older than 1 year to cold storage

---

## 12. UI/UX Direction

### Design Inspiration

**Primary inspiration**: **Notion**
- Clean, minimal, spacious layout
- Excellent use of whitespace
- Smooth animations and transitions
- Intuitive navigation (sidebar + breadcrumbs)

**Secondary references**:
- **Linear**: Modern SaaS aesthetic, keyboard shortcuts, fast interactions
- **Vercel Dashboard**: Clean metrics visualization

### UI Tone & Principles

- **Modern SaaS style** -- professional, polished, trustworthy
- **Clean and minimal** -- avoid clutter, focus on content
- **Spacious** -- generous padding, breathing room
- **Visual hierarchy** -- clear headings, sections, cards
- **Accessible** -- WCAG AA compliance, keyboard navigation
- **Responsive** -- mobile-friendly (especially for viewing reports)

### Navigation Structure
```
Top Bar: Logo, Organization Switcher, User Menu
Sidebar:
  - Dashboard
  - Test Plans
  - Test Suites
  - Test Cases
  - Runs History
  - Reports
  - Settings (for Org Managers)
Breadcrumbs: Organization > Project > Test Plan > Test Case
```

---

## 13. MVP Scope (v1)

### P0 -- Must Have

**User Management**: Auth (email/password + OAuth), organizations, roles, RBAC panel
**Test Management**: CRUD for Test Plans, Suites, Cases (step-based + Gherkin), many-to-many linking
**Execution Tracking**: Manual runs, Run object with metadata, 6 statuses, DEBUG flag, attachments
**Reporting**: Executive Summary dashboard, time-range/scope filters, charts, PDF/Excel/CSV export
**Collaboration**: Comments, attachments, activity log, in-app notifications
**Deployment**: Docker, PostgreSQL, .env configuration

### P1 -- Important (post-MVP)

- Flaky test detection
- Per-environment reporting breakdown
- Real-time collaboration (polling-based)
- Email notifications

### P2 -- Deferred

- Automated test runner integrations (Playwright, Cypress)
- External integrations (Jira, Slack, GitHub Actions)
- SSO/SAML authentication
- WebSocket real-time collaboration
- Test case versioning
- Test coverage metrics

---

## 14. Suggested Roadmap

### Phase 1: Foundation (Weeks 1-4)
Database schema, authentication, organization/project setup, basic RBAC, Test Case CRUD, Test Plan and Suite CRUD, many-to-many linking.

### Phase 2: Execution & Tracking (Weeks 5-8)
Test Run object and workflow, manual execution UI, statuses, environment tracking, attachments, DEBUG flag system.

### Phase 3: Reporting & Dashboards (Weeks 9-12)
Executive Summary dashboard, time-range/scope filters, charts (ECharts), export to PDF/Excel/CSV, flaky test detection.

### Phase 4: Collaboration & Polish (Weeks 13-16)
Comments, notifications, activity log, Gherkin support, RBAC configuration panel, UI polish, Docker setup, documentation.

---

**This requirements document serves as the foundational blueprint for TestCraft development.**
