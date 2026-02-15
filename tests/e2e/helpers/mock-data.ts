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
