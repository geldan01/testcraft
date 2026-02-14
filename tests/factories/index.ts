/**
 * Mock data factories for TestCraft tests.
 *
 * These factories create realistic test data that matches the application's
 * TypeScript interfaces. Each factory accepts an optional overrides object
 * to customize individual fields.
 */

import type {
  User,
  Organization,
  OrganizationMember,
  Project,
  TestCase,
  TestPlan,
  TestSuite,
  TestRun,
  TestStep,
  Comment,
  Attachment,
  ActivityLog,
  RbacPermission,
  DashboardStats,
  PaginatedResponse,
  AuthResponse,
} from '~/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0

function nextId(): string {
  counter++
  return `cuid-${counter.toString().padStart(6, '0')}`
}

function isoDate(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId(),
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    authProvider: 'EMAIL',
    isAdmin: false,
    status: 'ACTIVE',
    createdAt: isoDate(30),
    updatedAt: isoDate(1),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export function createMockOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: nextId(),
    name: 'Acme Corp',
    maxProjects: 10,
    maxTestCasesPerProject: 1000,
    createdAt: isoDate(60),
    updatedAt: isoDate(5),
    _count: {
      members: 3,
      projects: 2,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// OrganizationMember
// ---------------------------------------------------------------------------

export function createMockMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    id: nextId(),
    organizationId: 'org-1',
    userId: 'user-1',
    role: 'QA_ENGINEER',
    joinedAt: isoDate(30),
    user: createMockUser(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: nextId(),
    name: 'Test Project',
    description: 'A project for testing',
    organizationId: 'org-1',
    createdAt: isoDate(30),
    updatedAt: isoDate(2),
    _count: {
      testCases: 15,
      testPlans: 3,
      testSuites: 4,
      members: 5,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// TestStep
// ---------------------------------------------------------------------------

export function createMockStep(overrides: Partial<TestStep> = {}): TestStep {
  return {
    stepNumber: 1,
    action: 'Click the login button',
    data: 'user@example.com',
    expectedResult: 'User is redirected to dashboard',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// TestCase
// ---------------------------------------------------------------------------

export function createMockTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: nextId(),
    name: 'Verify user login with valid credentials',
    description: 'Tests that a user can log in with correct email and password',
    projectId: 'project-1',
    preconditions: ['User must have an active account', 'User must not be suspended'],
    testType: 'STEP_BASED',
    steps: [
      createMockStep({ stepNumber: 1, action: 'Navigate to login page', data: '', expectedResult: 'Login form is displayed' }),
      createMockStep({ stepNumber: 2, action: 'Enter valid email', data: 'user@example.com', expectedResult: 'Email is entered' }),
      createMockStep({ stepNumber: 3, action: 'Enter valid password', data: 'password123', expectedResult: 'Password is entered' }),
      createMockStep({ stepNumber: 4, action: 'Click Sign In', data: '', expectedResult: 'User is redirected to dashboard' }),
    ],
    gherkinSyntax: null,
    debugFlag: false,
    debugFlaggedAt: null,
    debugFlaggedById: null,
    lastRunStatus: 'NOT_RUN',
    lastRunAt: null,
    createdAt: isoDate(14),
    updatedAt: isoDate(3),
    createdById: 'user-1',
    createdBy: createMockUser(),
    debugFlaggedBy: null,
    ...overrides,
  }
}

export function createMockGherkinTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return createMockTestCase({
    testType: 'GHERKIN',
    steps: null,
    gherkinSyntax: `Feature: User Login
  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user enters "user@example.com" as email
    And the user enters "password123" as password
    And the user clicks the "Sign in" button
    Then the user should be redirected to the dashboard`,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// TestPlan
// ---------------------------------------------------------------------------

export function createMockTestPlan(overrides: Partial<TestPlan> = {}): TestPlan {
  return {
    id: nextId(),
    name: 'Sprint 12 Regression',
    description: 'Regression test plan for Sprint 12 release',
    projectId: 'project-1',
    scope: 'All login and dashboard features',
    schedule: 'Before each release',
    testTypes: 'Regression, Smoke',
    entryCriteria: 'Build deployed to staging',
    exitCriteria: '100% pass rate on critical tests',
    createdAt: isoDate(10),
    updatedAt: isoDate(2),
    createdById: 'user-1',
    createdBy: createMockUser(),
    _count: {
      testCases: 8,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// TestSuite
// ---------------------------------------------------------------------------

export function createMockTestSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    id: nextId(),
    name: 'Login Regression',
    description: 'Regression tests for the login flow',
    projectId: 'project-1',
    suiteType: 'regression',
    createdAt: isoDate(20),
    updatedAt: isoDate(1),
    createdById: 'user-1',
    createdBy: createMockUser(),
    _count: {
      testCases: 6,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// TestRun
// ---------------------------------------------------------------------------

export function createMockTestRun(overrides: Partial<TestRun> = {}): TestRun {
  return {
    id: nextId(),
    testCaseId: 'tc-1',
    executedById: 'user-1',
    executedAt: isoDate(1),
    environment: 'staging',
    status: 'PASS',
    duration: 45,
    notes: 'All steps passed successfully',
    createdAt: isoDate(1),
    updatedAt: isoDate(1),
    testCase: createMockTestCase(),
    executedBy: createMockUser(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export function createMockComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: nextId(),
    content: 'This test case needs to be updated for the new login flow.',
    authorId: 'user-1',
    commentableType: 'TEST_CASE',
    commentableId: 'tc-1',
    createdAt: isoDate(2),
    updatedAt: isoDate(2),
    author: createMockUser(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Attachment
// ---------------------------------------------------------------------------

export function createMockAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: nextId(),
    fileUrl: '/uploads/screenshot.png',
    fileName: 'screenshot.png',
    fileType: 'image/png',
    fileSize: 204800,
    uploadedById: 'user-1',
    testRunId: null,
    testCaseId: 'tc-1',
    createdAt: isoDate(1),
    uploadedBy: createMockUser(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ActivityLog
// ---------------------------------------------------------------------------

export function createMockActivityLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: nextId(),
    userId: 'user-1',
    actionType: 'CREATED',
    objectType: 'TEST_CASE',
    objectId: 'tc-1',
    changes: null,
    timestamp: isoDate(0),
    user: createMockUser(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// RbacPermission
// ---------------------------------------------------------------------------

export function createMockRbacPermission(overrides: Partial<RbacPermission> = {}): RbacPermission {
  return {
    id: nextId(),
    organizationId: 'org-1',
    role: 'QA_ENGINEER',
    objectType: 'TEST_CASE',
    action: 'EDIT',
    allowed: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// DashboardStats
// ---------------------------------------------------------------------------

export function createMockDashboardStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    totalTestCases: 42,
    passRate: 87,
    recentRuns: 15,
    debugFlagged: 3,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// AuthResponse
// ---------------------------------------------------------------------------

export function createMockAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    user: createMockUser(),
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDB9.mock-signature',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// PaginatedResponse helper
// ---------------------------------------------------------------------------

export function createMockPaginatedResponse<T>(
  data: T[],
  overrides: Partial<Omit<PaginatedResponse<T>, 'data'>> = {},
): PaginatedResponse<T> {
  return {
    data,
    total: data.length,
    page: 1,
    limit: 20,
    totalPages: 1,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset counter (for deterministic IDs in tests)
// ---------------------------------------------------------------------------

export function resetFixtureCounter(): void {
  counter = 0
}
