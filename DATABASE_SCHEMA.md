# TestCraft Database Schema Reference

## Entity Relationship Overview

```
Organization
├── OrganizationMember (User + Role)
├── RbacPermission (Role + ObjectType + Action)
└── Project
    ├── ProjectMember (User)
    ├── TestPlan
    │   └── TestPlanCase → TestCase
    ├── TestSuite
    │   └── TestSuiteCase → TestCase
    └── TestCase
        ├── TestRun
        │   └── Attachment
        └── Attachment

User (global)
├── OrganizationMember
├── ProjectMember
├── TestPlan (created by)
├── TestSuite (created by)
├── TestCase (created by, debug flagged by)
├── TestRun (executed by)
├── Attachment (uploaded by)
├── Comment (author)
└── ActivityLog
```

## Tables

### User
**Purpose**: User accounts with authentication and role management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique user identifier |
| email | String | Unique, Indexed | User email address |
| passwordHash | String? | Optional | Hashed password (null for OAuth) |
| name | String | Required | Display name |
| avatarUrl | String? | Optional | Profile picture URL |
| authProvider | Enum | Required | EMAIL, GOOGLE, FACEBOOK |
| isAdmin | Boolean | Default: false | System administrator flag |
| status | Enum | Default: ACTIVE, Indexed | ACTIVE, SUSPENDED, PENDING_INVITATION |
| createdAt | DateTime | Auto | Account creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: email, status

---

### Organization
**Purpose**: Multi-tenant organization container

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique organization identifier |
| name | String | Required, Indexed | Organization name |
| maxProjects | Int | Default: 10 | Project limit |
| maxTestCasesPerProject | Int | Default: 1000 | Test case limit per project |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: name

---

### OrganizationMember
**Purpose**: Join table linking users to organizations with roles

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique membership identifier |
| organizationId | String | FK, Indexed | Reference to Organization |
| userId | String | FK, Indexed | Reference to User |
| role | Enum | Required, Indexed | ORGANIZATION_MANAGER, PROJECT_MANAGER, PRODUCT_OWNER, QA_ENGINEER, DEVELOPER |
| joinedAt | DateTime | Auto | Membership creation timestamp |

**Unique Constraint**: [organizationId, userId]
**Indexes**: organizationId, userId, role
**Cascade**: ON DELETE CASCADE (both relations)

---

### RbacPermission
**Purpose**: Role-based access control permission definitions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique permission identifier |
| organizationId | String | FK, Indexed | Reference to Organization |
| role | Enum | Required, Indexed | Organization role |
| objectType | Enum | Required | TEST_SUITE, TEST_PLAN, TEST_CASE, TEST_RUN, REPORT |
| action | Enum | Required | READ, EDIT, DELETE |
| allowed | Boolean | Default: true | Permission granted/denied |

**Unique Constraint**: [organizationId, role, objectType, action]
**Indexes**: organizationId, role
**Cascade**: ON DELETE CASCADE

---

### Project
**Purpose**: Project container within an organization

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique project identifier |
| name | String | Required, Indexed | Project name |
| description | String? | Optional | Project description |
| organizationId | String | FK, Indexed | Reference to Organization |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: organizationId, name
**Cascade**: ON DELETE CASCADE

---

### ProjectMember
**Purpose**: Join table for project-level access control

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique membership identifier |
| projectId | String | FK, Indexed | Reference to Project |
| userId | String | FK, Indexed | Reference to User |

**Unique Constraint**: [projectId, userId]
**Indexes**: projectId, userId
**Cascade**: ON DELETE CASCADE (both relations)

---

### TestPlan
**Purpose**: Test planning and strategy documents

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique test plan identifier |
| name | String | Required | Test plan name |
| description | String? | Optional | Detailed description |
| projectId | String | FK, Indexed | Reference to Project |
| scope | String? | Optional | Testing scope |
| schedule | String? | Optional | Testing schedule |
| testTypes | String? | Optional | Types of tests included |
| entryCriteria | String? | Optional | Conditions to start testing |
| exitCriteria | String? | Optional | Conditions to complete testing |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |
| createdById | String | FK, Indexed | Reference to User (creator) |

**Indexes**: projectId, createdById, createdAt
**Cascade**: ON DELETE CASCADE (projectId)

---

### TestSuite
**Purpose**: Collections of test cases by type or feature

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique test suite identifier |
| name | String | Required | Test suite name |
| description | String? | Optional | Suite description |
| projectId | String | FK, Indexed | Reference to Project |
| suiteType | String | Required, Indexed | Type: feature, risk, smoke, regression, api |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |
| createdById | String | FK, Indexed | Reference to User (creator) |

**Indexes**: projectId, createdById, suiteType, createdAt
**Cascade**: ON DELETE CASCADE (projectId)

---

### TestCase
**Purpose**: Individual test cases (step-based or Gherkin/BDD)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique test case identifier |
| name | String | Required | Test case name |
| description | String? | Optional | Detailed description |
| projectId | String | FK, Indexed | Reference to Project |
| preconditions | Json? | Optional | Prerequisites as JSON array |
| testType | Enum | Required, Indexed | STEP_BASED, GHERKIN |
| steps | Json? | Optional | Step-by-step instructions (for STEP_BASED) |
| gherkinSyntax | String? | Optional | BDD Gherkin syntax (for GHERKIN) |
| debugFlag | Boolean | Default: false, Indexed | Flagged for debugging |
| debugFlaggedAt | DateTime? | Optional | When debug flag was set |
| debugFlaggedById | String? | FK, Indexed | User who flagged for debug |
| lastRunStatus | Enum | Default: NOT_RUN, Indexed | NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED, SKIPPED |
| lastRunAt | DateTime? | Optional | Last execution timestamp |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |
| createdById | String | FK, Indexed | Reference to User (creator) |

**Indexes**: projectId, createdById, debugFlaggedById, lastRunStatus, debugFlag, testType, createdAt
**Cascade**: ON DELETE CASCADE (projectId)

---

### TestPlanCase
**Purpose**: Many-to-many join table for test plans and test cases

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique relationship identifier |
| testPlanId | String | FK, Indexed | Reference to TestPlan |
| testCaseId | String | FK, Indexed | Reference to TestCase |

**Unique Constraint**: [testPlanId, testCaseId]
**Indexes**: testPlanId, testCaseId
**Cascade**: ON DELETE CASCADE (both relations)

---

### TestSuiteCase
**Purpose**: Many-to-many join table for test suites and test cases

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique relationship identifier |
| testSuiteId | String | FK, Indexed | Reference to TestSuite |
| testCaseId | String | FK, Indexed | Reference to TestCase |

**Unique Constraint**: [testSuiteId, testCaseId]
**Indexes**: testSuiteId, testCaseId
**Cascade**: ON DELETE CASCADE (both relations)

---

### TestRun
**Purpose**: Execution records of test cases

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique test run identifier |
| testCaseId | String | FK, Indexed | Reference to TestCase |
| executedById | String | FK, Indexed | Reference to User (executor) |
| executedAt | DateTime | Required, Indexed | When test was executed |
| environment | String | Required, Indexed | dev, staging, prod, qa, custom |
| status | Enum | Required, Indexed | NOT_RUN, IN_PROGRESS, PASS, FAIL, BLOCKED, SKIPPED |
| duration | Int? | Optional | Execution duration in seconds |
| notes | String? | Optional | Additional notes or comments |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: testCaseId, executedById, executedAt, status, environment, createdAt
**Cascade**: ON DELETE CASCADE (testCaseId)

---

### Attachment
**Purpose**: File attachments for test runs and test cases

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique attachment identifier |
| fileUrl | String | Required | URL or path to file |
| fileName | String | Required | Original file name |
| fileType | String | Required | MIME type or file extension |
| fileSize | Int | Required | File size in bytes |
| uploadedById | String | FK, Indexed | Reference to User (uploader) |
| testRunId | String? | FK, Indexed | Optional reference to TestRun |
| testCaseId | String? | FK, Indexed | Optional reference to TestCase |
| createdAt | DateTime | Auto, Indexed | Upload timestamp |

**Indexes**: uploadedById, testRunId, testCaseId, createdAt
**Cascade**: ON DELETE CASCADE (testRunId, testCaseId)

---

### Comment
**Purpose**: Comments on test cases and test runs (polymorphic)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique comment identifier |
| content | String | Required | Comment text |
| authorId | String | FK, Indexed | Reference to User (author) |
| commentableType | Enum | Required | TEST_CASE, TEST_RUN |
| commentableId | String | Required, Indexed | ID of related entity (polymorphic) |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes**: authorId, [commentableType, commentableId], createdAt
**Cascade**: ON DELETE CASCADE (authorId)

---

### ActivityLog
**Purpose**: Audit trail of all system actions

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, cuid | Unique log entry identifier |
| userId | String | FK, Indexed | Reference to User (actor) |
| actionType | Enum | Required, Indexed | CREATED, UPDATED, DELETED |
| objectType | String | Required, Indexed | Type of object affected |
| objectId | String | Required, Indexed | ID of affected object |
| changes | Json? | Optional | JSON representation of changes |
| timestamp | DateTime | Auto, Indexed | When action occurred |

**Indexes**: userId, [objectType, objectId], timestamp, actionType
**Cascade**: ON DELETE CASCADE (userId)

---

## Enums

### AuthProvider
- EMAIL
- GOOGLE
- FACEBOOK

### UserStatus
- ACTIVE
- SUSPENDED
- PENDING_INVITATION

### OrganizationRole
- ORGANIZATION_MANAGER (full access)
- PROJECT_MANAGER (manage projects)
- PRODUCT_OWNER (plan and view)
- QA_ENGINEER (test execution and management)
- DEVELOPER (limited test access)

### ObjectType
- TEST_SUITE
- TEST_PLAN
- TEST_CASE
- TEST_RUN
- REPORT

### RbacAction
- READ
- EDIT
- DELETE

### TestType
- STEP_BASED (traditional step-by-step)
- GHERKIN (BDD Given-When-Then)

### TestRunStatus
- NOT_RUN (never executed)
- IN_PROGRESS (currently running)
- PASS (successful)
- FAIL (failed)
- BLOCKED (cannot execute)
- SKIPPED (intentionally skipped)

### CommentableType
- TEST_CASE
- TEST_RUN

### ActivityActionType
- CREATED
- UPDATED
- DELETED

---

## Common Queries

### Get user with organization memberships
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    organizationMemberships: {
      include: {
        organization: true
      }
    }
  }
})
```

### Get project with test cases
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    testCases: {
      where: { debugFlag: true },
      orderBy: { lastRunAt: 'desc' }
    }
  }
})
```

### Get test case with runs
```typescript
const testCase = await prisma.testCase.findUnique({
  where: { id: testCaseId },
  include: {
    testRuns: {
      orderBy: { executedAt: 'desc' },
      take: 10,
      include: {
        executedBy: true
      }
    }
  }
})
```

### Check RBAC permission
```typescript
const permission = await prisma.rbacPermission.findUnique({
  where: {
    organizationId_role_objectType_action: {
      organizationId,
      role: userRole,
      objectType: 'TEST_CASE',
      action: 'EDIT'
    }
  }
})
const hasPermission = permission?.allowed ?? false
```

### Activity log query
```typescript
const logs = await prisma.activityLog.findMany({
  where: {
    objectType: 'TestCase',
    objectId: testCaseId
  },
  orderBy: { timestamp: 'desc' },
  include: {
    user: true
  }
})
```

---

## Data Integrity Rules

1. **User Deletion**: When a user is deleted, their memberships are removed, but their created content (test cases, etc.) remains with a null creator reference.

2. **Organization Deletion**: Cascades to all projects, members, and RBAC permissions.

3. **Project Deletion**: Cascades to all test plans, test suites, test cases, and associated data.

4. **Test Case Deletion**: Cascades to all test runs and attachments.

5. **Unique Constraints**: Prevent duplicate memberships and test case associations.

6. **Soft Delete**: Not implemented in schema, but can be added via status fields if needed.

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried fields are indexed.

2. **JSON Fields**: `preconditions`, `steps`, and `changes` use JSON for flexibility but should be kept reasonably sized.

3. **Pagination**: Large result sets (test runs, activity logs) should be paginated.

4. **Connection Pooling**: Configure Prisma connection pooling for production workloads.

5. **Query Optimization**: Use `select` to fetch only needed fields, and `include` judiciously.

---

## Migration Strategy

1. **Development**: Use `prisma migrate dev` to create and apply migrations.

2. **Production**: Use `prisma migrate deploy` to apply migrations without prompts.

3. **Schema Changes**: Always create migrations, never use `db push` in production.

4. **Rollback**: Keep migration history and test rollback procedures.

5. **Data Migration**: Complex data transformations should be done via separate scripts, not in Prisma migrations.
