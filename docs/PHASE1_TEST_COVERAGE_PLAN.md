# Phase 1 Test Coverage Plan

## Executive Summary

After a thorough audit of the TestCraft codebase, this document catalogs:
1. **All bugs and broken features** found in Phase 1
2. **Missing Playwright E2E tests** for every interactive element
3. **Recommended test additions** to achieve full Phase 1 coverage

### Current State
- **280 tests** exist (80 E2E Playwright + 200 unit Vitest)
- **22 broken/placeholder buttons** found across the application
- **3 missing features** that were part of Phase 1 requirements
- **~45 new E2E tests** recommended to cover all gaps

---

## Part 1: Bugs & Broken Features

### CRITICAL - Buttons with No Click Handlers

These buttons render in the UI but do **nothing** when clicked:

| # | Location | Button | Impact |
|---|----------|--------|--------|
| 1 | `pages/auth/login.vue:120-127` | "Continue with Google" | OAuth placeholder - no handler |
| 2 | `pages/auth/login.vue:128-135` | "Continue with Facebook" | OAuth placeholder - no handler |
| 3 | `pages/auth/register.vue:190-197` | "Continue with Google" | OAuth placeholder - no handler |
| 4 | `pages/auth/register.vue:198-205` | "Continue with Facebook" | OAuth placeholder - no handler |
| 5 | `pages/dashboard.vue:127-134` | "View Reports" | No navigation or handler |
| 6 | `pages/organizations/[id].vue:131-138` | "Settings" (org detail) | No navigation or handler |
| 7 | `pages/organizations/[id].vue:205-207` | "Invite Member" (members tab) | No handler (settings page has working version) |
| 8 | `pages/projects/[id].vue:79-86` | "Project Settings" | No navigation or handler |
| 9 | `pages/projects/[id]/test-cases/index.vue:179-181` | "Delete Selected" (bulk) | No handler - bulk delete broken |
| 10 | `pages/projects/[id]/test-cases/[caseId].vue:136-143` | "Edit" (test case) | No handler - can't edit test cases |
| 11 | `pages/projects/[id]/test-cases/[caseId].vue:337-339` | "Upload" (attachments) | No handler - file upload missing |
| 12 | `pages/projects/[id]/test-cases/[caseId].vue:362-368` | "Download" (attachment) | No handler - download missing |
| 13 | `pages/projects/[id]/test-plans/[planId].vue:110-115` | "Add Test Cases" | No handler - core feature missing |
| 14 | `pages/projects/[id]/test-suites/[suiteId].vue:72-74` | "Edit" (test suite) | No handler |
| 15 | `pages/projects/[id]/test-suites/[suiteId].vue:75-77` | "Add Test Cases" | No handler - core feature missing |
| 16 | `pages/settings/index.vue:216-218` | "Delete" (danger zone) | No handler - org deletion broken |
| 17 | `components/app/TopBar.vue:84-90` | Notifications bell | No handler - placeholder |
| 18 | `components/dashboard/RecentActivity.vue:69-75` | "View all" activity | No handler |

### HIGH - Missing Core Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Add test cases to test plans** | NOT IMPLEMENTED | `linkTestCase()` exists in composable but UI has no modal/picker. Button has no click handler. |
| 2 | **Add test cases to test suites** | NOT IMPLEMENTED | Same as above - composable ready, no UI. |
| 3 | **Edit test case from detail page** | NOT IMPLEMENTED | No edit mode, modal, or navigation to edit page. |
| 4 | **Edit test suite** | NOT IMPLEMENTED | No edit mode or modal. |
| 5 | **File upload/attachments** | NOT IMPLEMENTED | Model exists in DB, endpoints partially exist, UI is placeholder only. |
| 6 | **Forgot password flow** | NOT IMPLEMENTED | Login page links to `/auth/forgot-password` which doesn't exist. |

### MEDIUM - Missing UX Safety & Feedback

| # | Issue | Location |
|---|-------|----------|
| 1 | No confirmation before deleting test cases | `test-cases/index.vue` - `handleDelete()` |
| 2 | No confirmation before removing org members | `organizations/[id].vue` and `settings/index.vue` |
| 3 | Silent API error handling in all composables | `catch { return null }` pattern everywhere |
| 4 | No toast notifications on success/failure | Missing throughout all CRUD operations |
| 5 | "Remember me" checkbox does nothing | `login.vue:87` |

---

## Part 2: Existing Test Coverage Map

### E2E Tests (Playwright) - 80 tests across 7 files

| File | Tests | What's Covered |
|------|-------|----------------|
| `auth.spec.ts` | 17 | Login form, registration, validation, logout, route protection |
| `dashboard.spec.ts` | 6 | Stats cards, activity feed, quick actions, quick links |
| `navigation.spec.ts` | 10 | Sidebar, top bar, org switcher, breadcrumbs, page transitions |
| `organizations.spec.ts` | 13 | Org list, create modal, org detail tabs, projects, members, RBAC |
| `test-cases.spec.ts` | 15 | List page, filters, create form, detail page, debug flag |
| `test-plans.spec.ts` | 11 | List page, create modal, detail page, linked cases, unlink |
| `test-runs.spec.ts` | 8 | History page, filters, status badges, duration, links |

### Unit Tests (Vitest) - 200 tests across 10 files

| File | Tests | What's Covered |
|------|-------|----------------|
| `server/auth.test.ts` | 14 | JWT tokens, password hashing |
| `server/api/auth.test.ts` | 19 | Registration/login validation, admin logic |
| `server/api/organizations.test.ts` | 17 | Org CRUD validation, member invites |
| `server/api/test-cases.test.ts` | 24 | Test case validation, debug flags, pagination |
| `server/api/test-runs.test.ts` | 24 | Run validation, status logic, filtering |
| `components/StatusBadge.test.ts` | 8 | Status config mapping for all 6 statuses |
| `components/StepBuilder.test.ts` | 20 | Add/remove/move/update steps |
| `components/GherkinEditor.test.ts` | 16 | HTML escaping, keyword highlighting, toggle |
| `components/DebugFlagToggle.test.ts` | 17 | Button states, date formatting, metadata |
| `stores/auth.test.ts` | 21 | Auth state, getters, localStorage |
| `composables/useAuth.test.ts` | 20 | Login/register/logout flows |

---

## Part 3: Test Coverage Gaps & New Tests Needed

### Gap 1: Broken Button Tests (verify bugs exist, then verify fixes)

These tests assert that clicking broken buttons produces NO effect (documenting bugs), and should be updated when features are implemented.

```
tests/e2e/broken-features.spec.ts (NEW FILE)
```

| # | Test | Priority |
|---|------|----------|
| 1 | OAuth "Continue with Google" button on login page is non-functional | High |
| 2 | OAuth "Continue with Facebook" button on login page is non-functional | High |
| 3 | OAuth "Continue with Google" button on register page is non-functional | High |
| 4 | OAuth "Continue with Facebook" button on register page is non-functional | High |
| 5 | Dashboard "View Reports" button has no handler | High |
| 6 | Organization detail "Settings" button has no handler | High |
| 7 | Organization detail "Invite Member" button has no handler | High |
| 8 | Project detail "Project Settings" button has no handler | High |
| 9 | Test case "Edit" button has no handler | Critical |
| 10 | Test plan "Add Test Cases" button has no handler | Critical |
| 11 | Test suite "Edit" button has no handler | High |
| 12 | Test suite "Add Test Cases" button has no handler | Critical |
| 13 | Settings "Delete Organization" button has no handler | High |
| 14 | Bulk "Delete Selected" test cases button has no handler | High |
| 15 | Attachment "Upload" button has no handler | High |
| 16 | Attachment "Download" button has no handler | High |

### Gap 2: Test Case CRUD - Missing Tests

```
tests/e2e/test-cases.spec.ts (ADDITIONS to existing file)
```

| # | Test | Priority |
|---|------|----------|
| 1 | Create Gherkin test case with preview mode toggle | High |
| 2 | Gherkin editor syntax highlighting in preview | Medium |
| 3 | Step builder - add multiple steps and verify numbering | High |
| 4 | Step builder - remove step and verify renumbering | High |
| 5 | Step builder - move step up/down and verify order | Medium |
| 6 | Test case detail - steps table displays all columns (action, data, expected) | High |
| 7 | Test case detail - Gherkin syntax displays with highlighting | High |
| 8 | Test case detail - preconditions display | Medium |
| 9 | Delete test case from list with individual delete button | High |
| 10 | Filter test cases by status dropdown | High |
| 11 | Filter test cases by type dropdown | High |
| 12 | Filter test cases by debug flag toggle | High |
| 13 | Pagination - navigate between pages | Medium |
| 14 | Bulk selection - select all checkbox | Medium |

### Gap 3: Test Execution (RunExecutor) - No Tests Exist

```
tests/e2e/test-execution.spec.ts (NEW FILE)
```

| # | Test | Priority |
|---|------|----------|
| 1 | "Run Test" button opens RunExecutor modal | Critical |
| 2 | RunExecutor displays test case name and steps | High |
| 3 | RunExecutor environment dropdown has all options | High |
| 4 | RunExecutor status dropdown has all options (Pass/Fail/Blocked/Skipped/In Progress) | High |
| 5 | RunExecutor submit button disabled until environment and status selected | High |
| 6 | RunExecutor successful submission closes modal | High |
| 7 | RunExecutor successful submission updates run history | High |
| 8 | RunExecutor cancel/close button works | Medium |
| 9 | RunExecutor notes field accepts text | Medium |
| 10 | RunExecutor attachment area renders (placeholder test) | Low |

### Gap 4: Comments System - No Tests Exist

```
tests/e2e/comments.spec.ts (NEW FILE)
```

| # | Test | Priority |
|---|------|----------|
| 1 | Comments section displays on test case detail page | High |
| 2 | Empty comments section shows appropriate message | Medium |
| 3 | Add comment with text content | High |
| 4 | New comment appears at top of list after submission | High |
| 5 | Comment shows author name and timestamp | Medium |
| 6 | Comment textarea disables submit when empty | Medium |

### Gap 5: Test Plans - Linking Test Cases

```
tests/e2e/test-plans.spec.ts (ADDITIONS to existing file)
```

| # | Test | Priority |
|---|------|----------|
| 1 | "Add Test Cases" button exists on plan detail page | Critical |
| 2 | Linked test cases display with name and status badge | High |
| 3 | Unlink test case button removes case from plan | High |
| 4 | Plan detail shows scope, entry criteria, exit criteria cards | Medium |
| 5 | Edit mode allows updating plan name and description | High |

### Gap 6: Test Suites - Missing Tests

```
tests/e2e/test-suites.spec.ts (NEW FILE - currently no test file exists!)
```

| # | Test | Priority |
|---|------|----------|
| 1 | Test suites list page renders with header | High |
| 2 | Create test suite modal opens and works | High |
| 3 | Test suite type filter works | High |
| 4 | Grid/list view toggle works | Medium |
| 5 | Test suite detail page loads | High |
| 6 | Test suite shows type badge | Medium |
| 7 | "Add Test Cases" button exists on suite detail page | Critical |
| 8 | Linked test cases display with status badges | High |
| 9 | Unlink test case from suite works | High |
| 10 | Empty state when no suites exist | Medium |

### Gap 7: Settings Page - Incomplete Coverage

```
tests/e2e/settings.spec.ts (NEW FILE)
```

| # | Test | Priority |
|---|------|----------|
| 1 | Settings page loads with organization tab | High |
| 2 | Organization name field editable | High |
| 3 | Max projects and max test cases fields editable | Medium |
| 4 | Save settings button submits changes | High |
| 5 | Members tab shows member list with roles | High |
| 6 | Invite member modal opens and works | High |
| 7 | Change member role via dropdown | High |
| 8 | Remove member button exists | High |
| 9 | RBAC tab shows permissions table | High |
| 10 | RBAC toggle switches change permission state | High |
| 11 | Danger zone delete button exists | Medium |

### Gap 8: Project Detail Page - Incomplete Coverage

```
tests/e2e/project-detail.spec.ts (NEW FILE)
```

| # | Test | Priority |
|---|------|----------|
| 1 | Project detail page loads with name and description | High |
| 2 | Stats cards render (test cases, plans, suites, members) | High |
| 3 | Tabs switch between Overview, Test Plans, Test Suites, Test Cases | High |
| 4 | Quick action buttons navigate correctly | High |
| 5 | Project Settings button exists | Medium |

---

## Part 4: Recommended New Unit Tests

### Composable Tests (currently only useAuth is tested)

| Composable | Tests Needed | Priority |
|------------|-------------|----------|
| `useOrganization` | Fetch, switch, create, update, invite/remove members | High |
| `useProject` | Fetch, create, set current project | High |
| `useTestCase` | CRUD, toggle debug, comments, attachments | High |
| `useTestPlan` | CRUD, link/unlink test cases | High |
| `useTestSuite` | CRUD, link/unlink test cases | High |
| `useTestRun` | Start/complete run, filtering | High |

### Store Tests (currently only auth store is tested)

| Store | Tests Needed | Priority |
|-------|-------------|----------|
| `organization` | State management, switching, persistence | Medium |
| `project` | State management, current project | Medium |

### Component Tests

| Component | Tests Needed | Priority |
|-----------|-------------|----------|
| `RunExecutor` | Form validation, submission, environment/status selection | High |
| `Sidebar` | Navigation items, collapse, active link | Medium |
| `TopBar` | Org switcher, user menu | Medium |
| `OrgSwitcher` | Organization list, selection | Medium |
| `StatsCard` | Render with different props | Low |
| `RecentActivity` | Activity list, empty state, loading | Low |

---

## Part 5: Implementation Priority

### Phase 1A - Fix Critical Bugs (Before Writing Tests)

1. **Implement "Add Test Cases" modal for test plans** - Create a test case picker/selector component that queries available test cases and calls `linkTestCase()`
2. **Implement "Add Test Cases" modal for test suites** - Reuse the same picker component
3. **Implement test case edit mode** - Either inline edit or navigate to edit page
4. **Add delete confirmation dialogs** - For test cases, members, and organizations
5. **Add error toast notifications** - Wire up Nuxt UI's `useToast()` in all composables

### Phase 1B - Write Missing E2E Tests

Priority order for new test files:
1. `test-execution.spec.ts` - RunExecutor modal (10 tests) - **CRITICAL**
2. `test-suites.spec.ts` - Full suite CRUD (10 tests) - **HIGH**
3. `settings.spec.ts` - Organization settings (11 tests) - **HIGH**
4. `comments.spec.ts` - Comments system (6 tests) - **HIGH**
5. `project-detail.spec.ts` - Project overview (5 tests) - **MEDIUM**
6. `broken-features.spec.ts` - Document known broken buttons (16 tests) - **MEDIUM**
7. Additional tests in existing files (~14 tests) - **MEDIUM**

### Phase 1C - Write Missing Unit Tests

1. Composable tests for useTestCase, useTestPlan, useTestSuite, useTestRun
2. RunExecutor component unit tests
3. Organization and Project store tests
4. Remaining composable tests (useOrganization, useProject)

---

## Summary

| Category | Current | Needed | Total After |
|----------|---------|--------|-------------|
| E2E Tests (Playwright) | 80 | ~72 | ~152 |
| Unit Tests (Vitest) | 200 | ~80 | ~280 |
| **Total** | **280** | **~152** | **~432** |

### Critical Fixes Before Testing
- 6 core features not implemented (add test cases to plans/suites, edit test case, edit suite, file upload, forgot password)
- 18 buttons with no click handlers
- 0 delete confirmation dialogs
- 0 error/success toast notifications
