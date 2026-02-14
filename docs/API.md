# TestCraft API Reference

Version: 1.0 (Phase 1)

---

## Overview

TestCraft exposes a RESTful API built on Nuxt 3's Nitro server engine. All endpoints are prefixed with `/api/` and follow a consistent pattern for request validation (Zod), authentication (JWT Bearer tokens), and error handling.

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/auth/login` or `/api/auth/register` endpoints and expire after 7 days.

### Common Error Response Format

All errors return an HTTP error status with a JSON body:

```json
{
  "statusCode": 400,
  "statusMessage": "Description of the error"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, limit exceeded) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |

### Pagination

Paginated endpoints accept `page` and `limit` query parameters and return:

```typescript
{
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Default: `page=1`, `limit=20`. Maximum `limit` is 100.

---

## Authentication

### POST /api/auth/register

Register a new user account. The first user to register becomes the system admin.

**Authentication:** No

**Request Body:**

```typescript
{
  name: string;     // required, 1-100 characters
  email: string;    // required, valid email
  password: string; // required, minimum 8 characters
}
```

**Success Response (201):**

```json
{
  "user": {
    "id": "cuid_string",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null,
    "authProvider": "EMAIL",
    "isAdmin": false,
    "status": "ACTIVE",
    "createdAt": "2026-02-11T00:00:00.000Z",
    "updatedAt": "2026-02-11T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error (name empty, email invalid, password too short) |
| 409 | Email already registered |

---

### POST /api/auth/login

Authenticate with email and password.

**Authentication:** No

**Request Body:**

```typescript
{
  email: string;    // required, valid email
  password: string; // required
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": "cuid_string",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null,
    "authProvider": "EMAIL",
    "isAdmin": false,
    "status": "ACTIVE",
    "createdAt": "2026-02-11T00:00:00.000Z",
    "updatedAt": "2026-02-11T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |
| 401 | Invalid email or password |
| 403 | Account is not active (suspended) |

---

### GET /api/auth/me

Get the currently authenticated user's profile.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "id": "cuid_string",
  "email": "user@example.com",
  "name": "User Name",
  "avatarUrl": null,
  "authProvider": "EMAIL",
  "isAdmin": false,
  "status": "ACTIVE",
  "createdAt": "2026-02-11T00:00:00.000Z",
  "updatedAt": "2026-02-11T00:00:00.000Z"
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 401 | Not authenticated |

---

### POST /api/auth/logout

Log out the current user. Since authentication is stateless (JWT), this is a no-op on the server side. The client is responsible for removing the stored token.

**Authentication:** No

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Organizations

### GET /api/organizations

List all organizations the authenticated user is a member of.

**Authentication:** Yes

**Success Response (200):**

```json
[
  {
    "id": "cuid_string",
    "name": "My Organization",
    "maxProjects": 10,
    "maxTestCasesPerProject": 1000,
    "createdAt": "2026-02-11T00:00:00.000Z",
    "updatedAt": "2026-02-11T00:00:00.000Z",
    "_count": {
      "members": 5,
      "projects": 3
    }
  }
]
```

---

### POST /api/organizations

Create a new organization. The creator automatically becomes the ORGANIZATION_MANAGER. Default RBAC permissions are seeded for all roles.

**Authentication:** Yes

**Request Body:**

```typescript
{
  name: string; // required, 1-100 characters
}
```

**Success Response (201):**

Returns the created Organization object with `_count`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |

---

### GET /api/organizations/:id

Get detailed information about an organization, including members and projects.

**Authentication:** Yes (must be a member)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Success Response (200):**

```json
{
  "id": "cuid_string",
  "name": "My Organization",
  "maxProjects": 10,
  "maxTestCasesPerProject": 1000,
  "createdAt": "...",
  "updatedAt": "...",
  "members": [
    {
      "id": "...",
      "organizationId": "...",
      "userId": "...",
      "role": "ORGANIZATION_MANAGER",
      "joinedAt": "...",
      "user": { "id": "...", "name": "...", "email": "...", "avatarUrl": null, "..." }
    }
  ],
  "projects": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "_count": { "testCases": 5, "testPlans": 2, "testSuites": 3, "members": 3 }
    }
  ],
  "_count": { "members": 3, "projects": 1 }
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 403 | Not a member of the organization |
| 404 | Organization not found |

---

### PUT /api/organizations/:id

Update an organization's settings.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Request Body:**

```typescript
{
  name?: string;                  // 1-100 characters
  maxProjects?: number;           // integer >= 1
  maxTestCasesPerProject?: number; // integer >= 1
}
```

**Success Response (200):**

Returns the updated Organization object with `_count`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |
| 403 | Not an organization manager |

---

### GET /api/organizations/:id/members

List all members of an organization.

**Authentication:** Yes (must be a member)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Success Response (200):**

```json
[
  {
    "id": "member_cuid",
    "organizationId": "org_cuid",
    "userId": "user_cuid",
    "role": "ORGANIZATION_MANAGER",
    "joinedAt": "2026-02-11T00:00:00.000Z",
    "user": {
      "id": "user_cuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatarUrl": null,
      "authProvider": "EMAIL",
      "isAdmin": false,
      "status": "ACTIVE",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
]
```

---

### POST /api/organizations/:id/members

Invite a user to the organization. If the user does not have an account, a PENDING_INVITATION account is created.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Request Body:**

```typescript
{
  email: string; // required, valid email
  role: "ORGANIZATION_MANAGER" | "PROJECT_MANAGER" | "PRODUCT_OWNER" | "QA_ENGINEER" | "DEVELOPER";
}
```

**Success Response (201):**

Returns the created OrganizationMember object with nested user.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |
| 403 | Not an organization manager |
| 409 | User is already a member |

---

### PUT /api/organizations/:id/members/:memberId

Update a member's role within the organization.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |
| memberId | Organization Member ID |

**Request Body:**

```typescript
{
  role: "ORGANIZATION_MANAGER" | "PROJECT_MANAGER" | "PRODUCT_OWNER" | "QA_ENGINEER" | "DEVELOPER";
}
```

**Success Response (200):**

Returns the updated OrganizationMember object with nested user.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |
| 403 | Not an organization manager |
| 404 | Member not found |

---

### DELETE /api/organizations/:id/members/:memberId

Remove a member from the organization. Cannot remove the last ORGANIZATION_MANAGER.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |
| memberId | Organization Member ID |

**Success Response (200):**

```json
{
  "message": "Member removed successfully"
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Cannot remove the last organization manager |
| 403 | Not an organization manager |
| 404 | Member not found |

---

### GET /api/organizations/:id/rbac

Get all RBAC permissions for an organization.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Success Response (200):**

```json
[
  {
    "id": "perm_cuid",
    "organizationId": "org_cuid",
    "role": "DEVELOPER",
    "objectType": "TEST_CASE",
    "action": "READ",
    "allowed": true
  }
]
```

---

### PUT /api/organizations/:id/rbac

Bulk update RBAC permissions. Uses upsert within a transaction.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Request Body:**

```typescript
Array<{
  role: "ORGANIZATION_MANAGER" | "PROJECT_MANAGER" | "PRODUCT_OWNER" | "QA_ENGINEER" | "DEVELOPER";
  objectType: "TEST_SUITE" | "TEST_PLAN" | "TEST_CASE" | "TEST_RUN" | "REPORT";
  action: "READ" | "EDIT" | "DELETE";
  allowed: boolean;
}>
```

**Success Response (200):**

Returns the full list of updated RBAC permissions for the organization.

---

### PUT /api/organizations/:id/rbac/:permissionId

Toggle a single RBAC permission.

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |
| permissionId | RBAC Permission ID |

**Request Body:**

```typescript
{
  allowed: boolean;
}
```

**Success Response (200):**

Returns the updated RbacPermission object.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 403 | Not an organization manager |
| 404 | Permission not found |

---

### GET /api/organizations/:id/projects

List all projects in an organization.

**Authentication:** Yes (must be a member)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Success Response (200):**

```json
[
  {
    "id": "proj_cuid",
    "name": "My Project",
    "description": "A description",
    "organizationId": "org_cuid",
    "createdAt": "...",
    "updatedAt": "...",
    "_count": {
      "testCases": 15,
      "testPlans": 3,
      "testSuites": 5,
      "members": 4
    }
  }
]
```

---

### POST /api/organizations/:id/projects

Create a new project within an organization. Enforces the organization's `maxProjects` limit. The creator is automatically added as a project member.

**Authentication:** Yes (must be ORGANIZATION_MANAGER or PROJECT_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Organization ID |

**Request Body:**

```typescript
{
  name: string;         // required, 1-100 characters
  description?: string; // max 500 characters
}
```

**Success Response (201):**

Returns the created Project object with `_count`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error or project limit reached |
| 403 | Insufficient permissions |
| 404 | Organization not found |

---

## Projects

### POST /api/projects

Create a new project (alternative endpoint; requires `organizationId` in the body).

**Authentication:** Yes (must be ORGANIZATION_MANAGER or PROJECT_MANAGER in the target organization)

**Request Body:**

```typescript
{
  name: string;           // required, 1-100 characters
  description?: string;   // max 500 characters
  organizationId: string; // required
}
```

**Success Response (201):**

Returns the created Project object with `_count`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error or project limit reached |
| 403 | Insufficient permissions |
| 404 | Organization not found |

---

### GET /api/projects/:id

Get a project by ID, including organization and counts.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Success Response (200):**

```json
{
  "id": "proj_cuid",
  "name": "My Project",
  "description": "A description",
  "organizationId": "org_cuid",
  "createdAt": "...",
  "updatedAt": "...",
  "organization": { "id": "...", "name": "..." },
  "_count": {
    "testCases": 15,
    "testPlans": 3,
    "testSuites": 5,
    "members": 4
  }
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 403 | Not a member of the organization |
| 404 | Project not found |

---

### PUT /api/projects/:id

Update a project.

**Authentication:** Yes (must be ORGANIZATION_MANAGER or PROJECT_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Request Body:**

```typescript
{
  name?: string;        // 1-100 characters
  description?: string | null; // max 500 characters
}
```

**Success Response (200):**

Returns the updated Project object with `_count`.

---

### DELETE /api/projects/:id

Delete a project and all associated data (cascading delete).

**Authentication:** Yes (must be ORGANIZATION_MANAGER)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Success Response (200):**

```json
{
  "message": "Project deleted successfully"
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 403 | Only organization managers can delete projects |
| 404 | Project not found |

---

### GET /api/projects/:id/stats

Get dashboard statistics for a project.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Success Response (200):**

```json
{
  "totalTestCases": 25,
  "passRate": 72,
  "recentRuns": 14,
  "debugFlagged": 3
}
```

| Field | Description |
|-------|-------------|
| totalTestCases | Total number of test cases in the project |
| passRate | Percentage of run test cases that currently have PASS status |
| recentRuns | Number of test runs in the last 7 days |
| debugFlagged | Number of test cases with the debug flag set |

---

## Test Plans

### GET /api/projects/:id/test-plans

List test plans for a project (paginated).

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "plan_cuid",
      "name": "Sprint 1 Test Plan",
      "description": "...",
      "projectId": "proj_cuid",
      "scope": "...",
      "schedule": "...",
      "testTypes": "...",
      "entryCriteria": "...",
      "exitCriteria": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "createdById": "...",
      "createdBy": { "id": "...", "name": "...", "email": "...", "avatarUrl": null },
      "_count": { "testCases": 5 }
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### POST /api/projects/:id/test-plans

Create a test plan within a project.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Request Body:**

```typescript
{
  name: string;            // required, 1-200 characters
  description?: string;    // max 2000 characters
  scope?: string;          // max 2000 characters
  schedule?: string;       // max 500 characters
  testTypes?: string;      // max 500 characters
  entryCriteria?: string;  // max 2000 characters
  exitCriteria?: string;   // max 2000 characters
}
```

**Success Response (201):**

Returns the created TestPlan object.

---

### POST /api/test-plans

Create a test plan (alternative endpoint; requires `projectId` in the body).

**Authentication:** Yes (must be a member of the parent organization)

**Request Body:**

```typescript
{
  name: string;            // required, 1-200 characters
  projectId: string;       // required
  description?: string;    // max 2000 characters
  scope?: string;          // max 2000 characters
  schedule?: string;       // max 500 characters
  testTypes?: string;      // max 500 characters
  entryCriteria?: string;  // max 2000 characters
  exitCriteria?: string;   // max 2000 characters
}
```

**Success Response (201):**

Returns the created TestPlan object.

---

### GET /api/test-plans/:id

Get a test plan by ID, including linked test cases.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Plan ID |

**Success Response (200):**

Returns the TestPlan object with `createdBy`, `testCases` (join records with nested `testCase`), and `_count`.

---

### PUT /api/test-plans/:id

Update a test plan.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Plan ID |

**Request Body:**

```typescript
{
  name?: string;               // 1-200 characters
  description?: string | null; // max 2000 characters
  scope?: string | null;       // max 2000 characters
  schedule?: string | null;    // max 500 characters
  testTypes?: string | null;   // max 500 characters
  entryCriteria?: string | null; // max 2000 characters
  exitCriteria?: string | null;  // max 2000 characters
}
```

**Success Response (200):**

Returns the updated TestPlan object.

---

### DELETE /api/test-plans/:id

Delete a test plan. This does NOT delete linked test cases; it only removes the plan and the join records.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Plan ID |

**Success Response (200):**

```json
{
  "message": "Test plan deleted successfully"
}
```

---

### POST /api/test-plans/:id/test-cases

Link a test case to a test plan. The test case must belong to the same project.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Plan ID |

**Request Body:**

```typescript
{
  testCaseId: string; // required
}
```

**Success Response (201):**

Returns the created TestPlanCase join record.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Test case not found or belongs to a different project |
| 409 | Test case already linked to this plan |

---

### DELETE /api/test-plans/:id/test-cases/:caseId

Unlink a test case from a test plan.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Plan ID |
| caseId | Test Case ID |

**Success Response (200):**

```json
{
  "message": "Test case unlinked from test plan successfully"
}
```

---

## Test Suites

### GET /api/projects/:id/test-suites

List test suites for a project (paginated).

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |

**Success Response (200):**

Paginated response with TestSuite objects (includes `createdBy` and `_count`).

---

### POST /api/projects/:id/test-suites

Create a test suite within a project.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Request Body:**

```typescript
{
  name: string;         // required, 1-200 characters
  description?: string; // max 2000 characters
  suiteType: string;    // required, 1-50 characters (e.g., "smoke", "regression", "api", "feature")
}
```

**Success Response (201):**

Returns the created TestSuite object.

---

### POST /api/test-suites

Create a test suite (alternative endpoint; requires `projectId` in the body).

**Authentication:** Yes (must be a member of the parent organization)

**Request Body:**

```typescript
{
  name: string;         // required, 1-200 characters
  projectId: string;    // required
  description?: string; // max 2000 characters
  suiteType: string;    // required, 1-50 characters
}
```

**Success Response (201):**

Returns the created TestSuite object.

---

### GET /api/test-suites/:id

Get a test suite by ID, including linked test cases.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Suite ID |

**Success Response (200):**

Returns the TestSuite object with `createdBy`, `testCases` (join records with nested `testCase`), and `_count`.

---

### PUT /api/test-suites/:id

Update a test suite.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Suite ID |

**Request Body:**

```typescript
{
  name?: string;               // 1-200 characters
  description?: string | null; // max 2000 characters
  suiteType?: string;          // 1-50 characters
}
```

**Success Response (200):**

Returns the updated TestSuite object.

---

### DELETE /api/test-suites/:id

Delete a test suite. Linked test cases are NOT deleted.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Suite ID |

**Success Response (200):**

```json
{
  "message": "Test suite deleted successfully"
}
```

---

### POST /api/test-suites/:id/test-cases

Link a test case to a test suite. The test case must belong to the same project.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Suite ID |

**Request Body:**

```typescript
{
  testCaseId: string; // required
}
```

**Success Response (201):**

Returns the created TestSuiteCase join record.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Test case not found or belongs to a different project |
| 409 | Test case already linked to this suite |

---

### DELETE /api/test-suites/:id/test-cases/:caseId

Unlink a test case from a test suite.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Suite ID |
| caseId | Test Case ID |

**Success Response (200):**

```json
{
  "message": "Test case unlinked from test suite successfully"
}
```

---

## Test Cases

### GET /api/projects/:id/test-cases

List test cases for a project (paginated, with filtering).

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| status | string | - | Filter by `lastRunStatus` (e.g., PASS, FAIL, NOT_RUN) |
| testType | string | - | Filter by test type (STEP_BASED, GHERKIN) |
| debugFlag | string | - | Filter by debug flag ("true" or "false") |
| search | string | - | Case-insensitive search on name and description |

**Success Response (200):**

Paginated response with TestCase objects (includes `createdBy` and `debugFlaggedBy`).

---

### POST /api/test-cases

Create a new test case. Enforces the organization's `maxTestCasesPerProject` limit.

**Authentication:** Yes (must be a member of the parent organization)

**Request Body:**

```typescript
{
  name: string;              // required, 1-200 characters
  projectId: string;         // required
  testType: "STEP_BASED" | "GHERKIN"; // required
  description?: string;      // max 2000 characters
  preconditions?: string[];  // array of strings
  steps?: Array<{            // for STEP_BASED type
    stepNumber: number;      // integer >= 1
    action: string;          // required
    data: string;
    expectedResult: string;
  }>;
  gherkinSyntax?: string;   // for GHERKIN type, max 10000 characters
}
```

**Success Response (201):**

Returns the created TestCase object with `createdBy`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error or test case limit reached |
| 403 | Not a member of the organization |
| 404 | Project not found |

---

### GET /api/test-cases/:id

Get a test case by ID with full details including linked plans, suites, recent runs, and attachments.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Success Response (200):**

```json
{
  "id": "case_cuid",
  "name": "User Login Test",
  "description": "...",
  "projectId": "...",
  "preconditions": ["...", "..."],
  "testType": "STEP_BASED",
  "steps": [
    { "stepNumber": 1, "action": "...", "data": "...", "expectedResult": "..." }
  ],
  "gherkinSyntax": null,
  "debugFlag": false,
  "debugFlaggedAt": null,
  "debugFlaggedById": null,
  "lastRunStatus": "PASS",
  "lastRunAt": "...",
  "createdAt": "...",
  "updatedAt": "...",
  "createdById": "...",
  "createdBy": { "id": "...", "name": "...", "email": "...", "avatarUrl": null },
  "debugFlaggedBy": null,
  "testPlans": [
    { "id": "...", "testPlanId": "...", "testCaseId": "...", "testPlan": { "id": "...", "name": "..." } }
  ],
  "testSuites": [
    { "id": "...", "testSuiteId": "...", "testCaseId": "...", "testSuite": { "id": "...", "name": "...", "suiteType": "..." } }
  ],
  "testRuns": [ /* last 10 runs */ ],
  "attachments": [ /* attachments */ ]
}
```

---

### PUT /api/test-cases/:id

Update a test case.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Request Body:**

```typescript
{
  name?: string;                         // 1-200 characters
  description?: string | null;          // max 2000 characters
  preconditions?: string[] | null;
  testType?: "STEP_BASED" | "GHERKIN";
  steps?: Array<{
    stepNumber: number;
    action: string;
    data: string;
    expectedResult: string;
  }> | null;
  gherkinSyntax?: string | null;        // max 10000 characters
}
```

**Success Response (200):**

Returns the updated TestCase object.

---

### DELETE /api/test-cases/:id

Delete a test case and all associated runs, attachments, comments, and plan/suite links (cascading).

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Success Response (200):**

```json
{
  "message": "Test case deleted successfully"
}
```

---

### PUT /api/test-cases/:id/debug-flag

Toggle the debug flag on a test case. When enabling, records the flagging user and timestamp. When disabling, clears both.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Request Body:** None (the flag is toggled automatically)

**Success Response (200):**

Returns the updated TestCase object with `createdBy` and `debugFlaggedBy`.

---

### GET /api/test-cases/:id/comments

Get all comments on a test case.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Success Response (200):**

```json
[
  {
    "id": "comment_cuid",
    "content": "This test needs updating for the new login flow.",
    "authorId": "...",
    "commentableType": "TEST_CASE",
    "commentableId": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "author": { "id": "...", "name": "...", "email": "...", "avatarUrl": null }
  }
]
```

---

### GET /api/test-cases/:id/attachments

Get all attachments for a test case.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Success Response (200):**

```json
[
  {
    "id": "attach_cuid",
    "fileUrl": "https://...",
    "fileName": "screenshot.png",
    "fileType": "image/png",
    "fileSize": 245760,
    "uploadedById": "...",
    "testRunId": null,
    "testCaseId": "...",
    "createdAt": "...",
    "uploadedBy": { "id": "...", "name": "...", "email": "...", "avatarUrl": null }
  }
]
```

---

### GET /api/test-cases/:id/runs

Get all test runs for a test case, ordered by most recent first.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Case ID |

**Success Response (200):**

Array of TestRun objects with `executedBy`.

---

## Test Runs

### GET /api/projects/:id/test-runs

List test runs for a project (paginated, with filtering).

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Project ID |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| status | string | - | Filter by status (PASS, FAIL, etc.) |
| environment | string | - | Filter by environment (case-insensitive) |
| dateFrom | string | - | ISO date string, filter runs executed after this date |
| dateTo | string | - | ISO date string, filter runs executed before this date |

**Success Response (200):**

Paginated response with TestRun objects including `testCase` summary and `executedBy`.

---

### POST /api/test-runs

Create a new test run. Automatically updates the parent test case's `lastRunStatus` and `lastRunAt` fields within a transaction.

**Authentication:** Yes (must be a member of the parent organization)

**Request Body:**

```typescript
{
  testCaseId: string;   // required
  environment: string;  // required, 1-100 characters (e.g., "dev", "staging", "prod", "qa")
  status: "NOT_RUN" | "IN_PROGRESS" | "PASS" | "FAIL" | "BLOCKED" | "SKIPPED"; // required
  duration?: number;    // integer >= 0, in seconds
  notes?: string;       // max 5000 characters
}
```

**Success Response (201):**

Returns the created TestRun object with `testCase` summary and `executedBy`.

---

### GET /api/test-runs/:id

Get a test run by ID with full details including the test case, executor, and attachments.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Run ID |

**Success Response (200):**

Returns the TestRun object with `testCase` (including `project`), `executedBy`, and `attachments`.

---

### PUT /api/test-runs/:id

Update a test run. If the status changes, the parent test case's `lastRunStatus` and `lastRunAt` are also updated.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Run ID |

**Request Body:**

```typescript
{
  status?: "NOT_RUN" | "IN_PROGRESS" | "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
  duration?: number;        // integer >= 0
  notes?: string | null;    // max 5000 characters
}
```

**Success Response (200):**

Returns the updated TestRun object.

---

### DELETE /api/test-runs/:id

Delete a test run.

**Authentication:** Yes (must be a member of the parent organization)

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Test Run ID |

**Success Response (200):**

```json
{
  "message": "Test run deleted successfully"
}
```

---

## Comments

### POST /api/comments

Create a comment on a test case or test run. Validates that the commentable entity exists and the user has access.

**Authentication:** Yes

**Request Body:**

```typescript
{
  content: string;          // required, 1-5000 characters
  commentableType: "TEST_CASE" | "TEST_RUN"; // required
  commentableId: string;    // required, ID of the test case or test run
}
```

**Success Response (201):**

Returns the created Comment object with `author`.

**Error Responses:**

| Code | Condition |
|------|-----------|
| 400 | Validation error |
| 403 | Not a member of the parent organization |
| 404 | Commentable entity not found |

---

### DELETE /api/comments/:id

Delete a comment. Only the author or a system admin can delete a comment.

**Authentication:** Yes

**URL Parameters:**

| Param | Description |
|-------|-------------|
| id | Comment ID |

**Success Response (200):**

```json
{
  "message": "Comment deleted successfully"
}
```

**Error Responses:**

| Code | Condition |
|------|-----------|
| 403 | You can only delete your own comments |
| 404 | Comment not found |

---

## Activity

### GET /api/activity

Get activity logs (paginated, with filtering). All modifications to entities are logged automatically.

**Authentication:** Yes

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| objectType | string | - | Filter by object type (e.g., "TestCase", "Organization") |
| objectId | string | - | Filter by specific object ID |

**Success Response (200):**

```json
{
  "data": [
    {
      "id": "log_cuid",
      "userId": "user_cuid",
      "actionType": "CREATED",
      "objectType": "TestCase",
      "objectId": "case_cuid",
      "changes": { "name": "New Test Case" },
      "timestamp": "2026-02-11T00:00:00.000Z",
      "user": { "id": "...", "name": "...", "email": "...", "avatarUrl": null }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```
