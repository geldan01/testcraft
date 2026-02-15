/**
 * Unit tests for server/api/projects/[id]/reports/test-analysis.get.ts
 *
 * Tests the test analysis report endpoint which provides two analysis
 * types: "flaky" (tests with both PASS and FAIL, scored by flakiness)
 * and "top-failing" (tests with failures, sorted by fail count).
 *
 * Mocks: Prisma client, auth utility, reportFilters, and H3 event
 * utilities (getRouterParam, getQuery, createError).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockProjectFindUnique = vi.fn()
const mockOrgMemberFindUnique = vi.fn()
const mockTestRunGroupBy = vi.fn()
const mockTestCaseFindMany = vi.fn()
const mockTestRunFindMany = vi.fn()

vi.mock('~/server/utils/db', () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => mockProjectFindUnique(...args),
    },
    organizationMember: {
      findUnique: (...args: unknown[]) => mockOrgMemberFindUnique(...args),
    },
    testRun: {
      groupBy: (...args: unknown[]) => mockTestRunGroupBy(...args),
      findMany: (...args: unknown[]) => mockTestRunFindMany(...args),
    },
    testCase: {
      findMany: (...args: unknown[]) => mockTestCaseFindMany(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Mock auth
// ---------------------------------------------------------------------------

const mockRequireAuth = vi.fn()

vi.mock('~/server/utils/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

// ---------------------------------------------------------------------------
// Mock reportFilters
// ---------------------------------------------------------------------------

const mockBuildReportWhereClause = vi.fn()

vi.mock('~/server/utils/reportFilters', () => ({
  buildReportWhereClause: (...args: unknown[]) => mockBuildReportWhereClause(...args),
}))

// ---------------------------------------------------------------------------
// H3/Nuxt auto-imports — override globals from setup.ts
// ---------------------------------------------------------------------------

const mockGetRouterParam = vi.fn()
const mockGetQuery = vi.fn()

;(globalThis as Record<string, unknown>).getRouterParam = mockGetRouterParam
;(globalThis as Record<string, unknown>).getQuery = mockGetQuery

// ---------------------------------------------------------------------------
// Import handler (defineEventHandler is identity fn from setup.ts)
// ---------------------------------------------------------------------------

import handler from '~/server/api/projects/[id]/reports/test-analysis.get'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-001',
  email: 'tester@example.com',
  name: 'Test User',
  isAdmin: false,
  status: 'ACTIVE',
}

const mockProject = {
  id: 'proj-001',
  name: 'TestCraft',
  organizationId: 'org-001',
}

const mockMembership = {
  id: 'mem-001',
  organizationId: 'org-001',
  userId: 'user-001',
  role: 'QA_ENGINEER',
}

const defaultWhereClause = {
  testCase: { projectId: 'proj-001' },
  status: { notIn: ['NOT_RUN', 'IN_PROGRESS'] },
}

const fakeEvent = {} as any

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set up standard mocks for a successful authorized request. */
function setupAuthorizedRequest() {
  mockProjectFindUnique.mockResolvedValue(mockProject)
  mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Reports - Test Analysis API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetRouterParam.mockReturnValue('proj-001')
    mockGetQuery.mockReturnValue({ type: 'flaky' })
    mockBuildReportWhereClause.mockReturnValue(defaultWhereClause)
  })

  // -----------------------------------------------------------------------
  // Access control
  // -----------------------------------------------------------------------

  it('throws 400 when project ID is missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Project ID is required')
    }
  })

  it('throws 404 when project not found', async () => {
    mockProjectFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Project not found')
    }
  })

  it('throws 403 when user lacks org membership', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('You do not have access to this project')
    }
  })

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it('throws 400 when type parameter is missing', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({})

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Query parameter "type" must be "flaky" or "top-failing"')
    }
  })

  it('throws 400 when type is an invalid value', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'invalid-type' })

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Query parameter "type" must be "flaky" or "top-failing"')
    }
  })

  // -----------------------------------------------------------------------
  // Flaky analysis
  // -----------------------------------------------------------------------

  it('flaky: identifies tests with both PASS and FAIL, calculates flakiness score', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    // tc-001: 6 PASS + 4 FAIL = flakiness 40%
    // tc-002: 3 PASS + 7 FAIL = flakiness 70%
    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 6 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 4 } },
      { testCaseId: 'tc-002', status: 'PASS', _count: { id: 3 } },
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 7 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Login Flow', debugFlag: false, lastRunAt: new Date('2025-06-10T12:00:00Z') },
      { id: 'tc-002', name: 'Checkout Flow', debugFlag: true, lastRunAt: new Date('2025-06-11T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests).toHaveLength(2)
    // tc-002 should be first (higher flakiness score: 70%)
    expect(result.tests[0].testCaseId).toBe('tc-002')
    expect(result.tests[0].testCaseName).toBe('Checkout Flow')
    expect(result.tests[0].flakinessScore).toBe(70)
    expect(result.tests[0].totalRuns).toBe(10)
    expect(result.tests[0].passCount).toBe(3)
    expect(result.tests[0].failCount).toBe(7)

    // tc-001 second (flakiness score: 40%)
    expect(result.tests[1].testCaseId).toBe('tc-001')
    expect(result.tests[1].flakinessScore).toBe(40)
  })

  it('flaky: excludes tests with only PASS or only FAIL', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    mockTestRunGroupBy.mockResolvedValue([
      // tc-001: only PASS — not flaky
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 10 } },
      // tc-002: only FAIL — not flaky
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 5 } },
      // tc-003: both PASS and FAIL — flaky
      { testCaseId: 'tc-003', status: 'PASS', _count: { id: 3 } },
      { testCaseId: 'tc-003', status: 'FAIL', _count: { id: 2 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-003', name: 'Flaky Test', debugFlag: false, lastRunAt: null },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests).toHaveLength(1)
    expect(result.tests[0].testCaseId).toBe('tc-003')
  })

  it('flaky: sorts by flakiness score descending', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    mockTestRunGroupBy.mockResolvedValue([
      // tc-001: 9 PASS + 1 FAIL = 10% flakiness
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 9 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 1 } },
      // tc-002: 5 PASS + 5 FAIL = 50% flakiness
      { testCaseId: 'tc-002', status: 'PASS', _count: { id: 5 } },
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 5 } },
      // tc-003: 7 PASS + 3 FAIL = 30% flakiness
      { testCaseId: 'tc-003', status: 'PASS', _count: { id: 7 } },
      { testCaseId: 'tc-003', status: 'FAIL', _count: { id: 3 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Test A', debugFlag: false, lastRunAt: null },
      { id: 'tc-002', name: 'Test B', debugFlag: false, lastRunAt: null },
      { id: 'tc-003', name: 'Test C', debugFlag: false, lastRunAt: null },
    ])

    const result = await handler(fakeEvent)

    const scores = result.tests.map((t: any) => t.flakinessScore)
    expect(scores).toEqual([50, 30, 10])
  })

  it('flaky: respects limit parameter', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky', limit: '2' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 5 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 5 } },
      { testCaseId: 'tc-002', status: 'PASS', _count: { id: 6 } },
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 4 } },
      { testCaseId: 'tc-003', status: 'PASS', _count: { id: 8 } },
      { testCaseId: 'tc-003', status: 'FAIL', _count: { id: 2 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Test A', debugFlag: false, lastRunAt: null },
      { id: 'tc-002', name: 'Test B', debugFlag: false, lastRunAt: null },
    ])

    const result = await handler(fakeEvent)

    // Only top 2 by flakiness score should be returned
    expect(result.tests).toHaveLength(2)
  })

  it('flaky: returns empty tests array when no matching data', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    mockTestRunGroupBy.mockResolvedValue([])
    mockTestCaseFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.tests).toEqual([])
  })

  it('flaky: includes debugFlag status from test case', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 3 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 2 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Flagged Test', debugFlag: true, lastRunAt: new Date('2025-06-10T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests[0].debugFlag).toBe(true)
  })

  it('flaky: returns "Unknown" name when test case not found', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'flaky' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-deleted', status: 'PASS', _count: { id: 2 } },
      { testCaseId: 'tc-deleted', status: 'FAIL', _count: { id: 1 } },
    ])

    // Test case no longer exists
    mockTestCaseFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.tests[0].testCaseName).toBe('Unknown')
    expect(result.tests[0].debugFlag).toBe(false)
  })

  // -----------------------------------------------------------------------
  // Top-failing analysis
  // -----------------------------------------------------------------------

  it('top-failing: sorts by fail count descending', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 8 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 2 } },
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 7 } },
      { testCaseId: 'tc-003', status: 'PASS', _count: { id: 5 } },
      { testCaseId: 'tc-003', status: 'FAIL', _count: { id: 5 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Test A', debugFlag: false, lastRunAt: null },
      { id: 'tc-002', name: 'Test B', debugFlag: true, lastRunAt: null },
      { id: 'tc-003', name: 'Test C', debugFlag: false, lastRunAt: null },
    ])

    mockTestRunFindMany.mockResolvedValue([
      { testCaseId: 'tc-001', executedAt: new Date('2025-06-09T12:00:00Z') },
      { testCaseId: 'tc-002', executedAt: new Date('2025-06-10T12:00:00Z') },
      { testCaseId: 'tc-003', executedAt: new Date('2025-06-11T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    // Sorted by failCount desc: tc-002 (7), tc-003 (5), tc-001 (2)
    expect(result.tests[0].testCaseId).toBe('tc-002')
    expect(result.tests[0].failCount).toBe(7)
    expect(result.tests[1].testCaseId).toBe('tc-003')
    expect(result.tests[1].failCount).toBe(5)
    expect(result.tests[2].testCaseId).toBe('tc-001')
    expect(result.tests[2].failCount).toBe(2)
  })

  it('top-failing: includes debug flag status', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 3 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Debug Test', debugFlag: true, lastRunAt: null },
    ])

    mockTestRunFindMany.mockResolvedValue([
      { testCaseId: 'tc-001', executedAt: new Date('2025-06-10T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests[0].debugFlag).toBe(true)
  })

  it('top-failing: includes lastFailedAt from test runs', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 5 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 3 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Failing Test', debugFlag: false, lastRunAt: null },
    ])

    const lastFailedDate = new Date('2025-06-12T15:30:00Z')
    mockTestRunFindMany.mockResolvedValue([
      { testCaseId: 'tc-001', executedAt: lastFailedDate },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests[0].lastFailedAt).toBe(lastFailedDate.toISOString())
  })

  it('top-failing: returns null lastFailedAt when no failed runs found', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 1 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Test', debugFlag: false, lastRunAt: null },
    ])

    // No matching last-failed run returned
    mockTestRunFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.tests[0].lastFailedAt).toBeNull()
  })

  it('top-failing: excludes tests with zero failures', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([
      // tc-001: only PASS — no failures
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 10 } },
      // tc-002: has failures
      { testCaseId: 'tc-002', status: 'PASS', _count: { id: 5 } },
      { testCaseId: 'tc-002', status: 'FAIL', _count: { id: 3 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-002', name: 'Failing Test', debugFlag: false, lastRunAt: null },
    ])

    mockTestRunFindMany.mockResolvedValue([
      { testCaseId: 'tc-002', executedAt: new Date('2025-06-10T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    // Only tc-002 should appear (has failures)
    expect(result.tests).toHaveLength(1)
    expect(result.tests[0].testCaseId).toBe('tc-002')
  })

  it('top-failing: calculates fail rate as percentage', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    // 3 FAIL out of 10 total = 30% fail rate
    mockTestRunGroupBy.mockResolvedValue([
      { testCaseId: 'tc-001', status: 'PASS', _count: { id: 7 } },
      { testCaseId: 'tc-001', status: 'FAIL', _count: { id: 3 } },
    ])

    mockTestCaseFindMany.mockResolvedValue([
      { id: 'tc-001', name: 'Test', debugFlag: false, lastRunAt: null },
    ])

    mockTestRunFindMany.mockResolvedValue([
      { testCaseId: 'tc-001', executedAt: new Date('2025-06-10T12:00:00Z') },
    ])

    const result = await handler(fakeEvent)

    expect(result.tests[0].failRate).toBe(30)
    expect(result.tests[0].totalRuns).toBe(10)
  })

  it('top-failing: returns empty tests array when no failing data', async () => {
    setupAuthorizedRequest()
    mockGetQuery.mockReturnValue({ type: 'top-failing' })

    mockTestRunGroupBy.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.tests).toEqual([])
  })
})
