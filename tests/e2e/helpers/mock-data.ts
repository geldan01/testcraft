export const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  authProvider: 'EMAIL',
  isAdmin: false,
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEifQ.mock'

export const MOCK_ORG = {
  id: 'org-1',
  name: 'Acme Corp',
  maxProjects: 10,
  maxTestCasesPerProject: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: { members: 3, projects: 2 },
}

export const MOCK_PROJECT = {
  id: 'project-1',
  name: 'Web App',
  description: 'Main web application',
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: { testCases: 15, testPlans: 3, testSuites: 4, members: 5 },
  organization: { id: 'org-1', name: 'Acme Corp' },
}

export const MOCK_STATS = {
  totalTestCases: 42,
  passRate: 87,
  recentRuns: 15,
  debugFlagged: 3,
}

// =============================================================================
// REPORT MOCK DATA
// =============================================================================

export const MOCK_STATUS_BREAKDOWN = {
  breakdown: [
    { status: 'PASS', count: 45, percentage: 60 },
    { status: 'FAIL', count: 15, percentage: 20 },
    { status: 'BLOCKED', count: 8, percentage: 11 },
    { status: 'SKIPPED', count: 7, percentage: 9 },
  ],
  total: 75,
}

export const MOCK_EXECUTION_TREND = {
  trend: [
    { date: '2026-02-08', totalExecuted: 10, passCount: 8, failCount: 2, passRate: 80 },
    { date: '2026-02-09', totalExecuted: 12, passCount: 9, failCount: 3, passRate: 75 },
    { date: '2026-02-10', totalExecuted: 15, passCount: 12, failCount: 3, passRate: 80 },
    { date: '2026-02-11', totalExecuted: 8, passCount: 7, failCount: 1, passRate: 88 },
    { date: '2026-02-12', totalExecuted: 20, passCount: 18, failCount: 2, passRate: 90 },
  ],
}

export const MOCK_ENVIRONMENT_COMPARISON = {
  environments: [
    { environment: 'development', totalRuns: 30, passCount: 24, failCount: 6, passRate: 80 },
    { environment: 'production', totalRuns: 15, passCount: 15, failCount: 0, passRate: 100 },
    { environment: 'staging', totalRuns: 20, passCount: 14, failCount: 6, passRate: 70 },
  ],
}

export const MOCK_FLAKY_TESTS = {
  tests: [
    {
      testCaseId: 'tc-1',
      testCaseName: 'Login Flow',
      totalRuns: 10,
      passCount: 6,
      failCount: 4,
      flakinessScore: 40,
      debugFlag: true,
      lastRunAt: new Date().toISOString(),
    },
    {
      testCaseId: 'tc-2',
      testCaseName: 'Search Feature',
      totalRuns: 8,
      passCount: 6,
      failCount: 2,
      flakinessScore: 25,
      debugFlag: false,
      lastRunAt: new Date().toISOString(),
    },
  ],
}

export const MOCK_TOP_FAILING_TESTS = {
  tests: [
    {
      testCaseId: 'tc-3',
      testCaseName: 'Checkout Process',
      failCount: 8,
      totalRuns: 12,
      failRate: 67,
      debugFlag: true,
      lastFailedAt: new Date().toISOString(),
    },
    {
      testCaseId: 'tc-4',
      testCaseName: 'File Upload',
      failCount: 5,
      totalRuns: 10,
      failRate: 50,
      debugFlag: false,
      lastFailedAt: new Date().toISOString(),
    },
  ],
}

// =============================================================================
// ADMIN MOCK DATA
// =============================================================================

export const MOCK_ADMIN_STATS = {
  totalUsers: 25,
  activeUsers: 22,
  suspendedUsers: 3,
  totalOrganizations: 5,
  totalProjects: 12,
  totalTestCases: 340,
}

export const MOCK_ADMIN_USERS = [
  {
    id: 'admin-user-1',
    email: 'admin@testcraft.io',
    name: 'System Administrator',
    avatarUrl: null,
    authProvider: 'EMAIL',
    isAdmin: true,
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    _count: { organizationMemberships: 2 },
  },
  {
    id: 'regular-user-2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    avatarUrl: null,
    authProvider: 'EMAIL',
    isAdmin: false,
    status: 'ACTIVE',
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
    _count: { organizationMemberships: 1 },
  },
  {
    id: 'suspended-user-3',
    email: 'bob@example.com',
    name: 'Bob Johnson',
    avatarUrl: null,
    authProvider: 'EMAIL',
    isAdmin: false,
    status: 'SUSPENDED',
    createdAt: '2025-03-10T00:00:00.000Z',
    updatedAt: '2025-03-10T00:00:00.000Z',
    _count: { organizationMemberships: 0 },
  },
]

export const MOCK_ADMIN_USER_DETAIL = {
  id: 'regular-user-2',
  email: 'jane@example.com',
  name: 'Jane Smith',
  avatarUrl: null,
  authProvider: 'EMAIL',
  isAdmin: false,
  status: 'ACTIVE',
  createdAt: '2025-02-15T00:00:00.000Z',
  updatedAt: '2025-02-15T00:00:00.000Z',
  organizationMemberships: [
    {
      id: 'membership-1',
      organizationId: 'org-1',
      role: 'QA_ENGINEER',
      joinedAt: '2025-02-15T00:00:00.000Z',
      organization: {
        id: 'org-1',
        name: 'Acme Corp',
      },
    },
  ],
}

export const MOCK_ADMIN_ORGS = [
  {
    id: 'org-admin-1',
    name: 'Acme Corp',
    maxProjects: 10,
    maxTestCasesPerProject: 1000,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    _count: { members: 5, projects: 3 },
  },
  {
    id: 'org-admin-2',
    name: 'Beta Inc',
    maxProjects: 5,
    maxTestCasesPerProject: 500,
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
    _count: { members: 2, projects: 1 },
  },
]

export const MOCK_RBAC_PERMISSIONS = (() => {
  const roles = [
    'ORGANIZATION_MANAGER',
    'PROJECT_MANAGER',
    'PRODUCT_OWNER',
    'QA_ENGINEER',
    'DEVELOPER',
  ]
  const objects = ['TEST_CASE', 'TEST_PLAN', 'TEST_SUITE', 'TEST_RUN', 'REPORT']
  const actions = ['READ', 'EDIT', 'DELETE']

  // Organization Manager gets full access
  // Project Manager gets read+edit on everything, delete on test cases/plans/suites
  // Product Owner gets read on everything, edit on test plans
  // QA Engineer gets read+edit on everything except delete
  // Developer gets read on everything, edit on test runs only
  const permissions: Array<{
    id: string
    organizationId: string
    role: string
    objectType: string
    action: string
    allowed: boolean
  }> = []

  let idx = 0
  for (const role of roles) {
    for (const obj of objects) {
      for (const action of actions) {
        let allowed = false
        if (role === 'ORGANIZATION_MANAGER') {
          allowed = true
        } else if (role === 'PROJECT_MANAGER') {
          allowed = action !== 'DELETE' || ['TEST_CASE', 'TEST_PLAN', 'TEST_SUITE'].includes(obj)
        } else if (role === 'PRODUCT_OWNER') {
          allowed = action === 'READ' || (action === 'EDIT' && obj === 'TEST_PLAN')
        } else if (role === 'QA_ENGINEER') {
          allowed = action !== 'DELETE'
        } else if (role === 'DEVELOPER') {
          allowed = action === 'READ' || (action === 'EDIT' && obj === 'TEST_RUN')
        }
        permissions.push({
          id: `rbac-${idx++}`,
          organizationId: 'org-1',
          role,
          objectType: obj,
          action,
          allowed,
        })
      }
    }
  }
  return permissions
})()
