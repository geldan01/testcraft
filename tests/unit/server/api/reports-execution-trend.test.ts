/**
 * Unit tests for server/api/projects/[id]/reports/execution-trend.get.ts
 *
 * Tests the execution trend report endpoint which returns test run
 * data grouped by day (or week for spans > 90 days), with pass rate
 * calculations per bucket.
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
      findMany: (...args: unknown[]) => mockTestRunFindMany(...args),
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

import handler from '~/server/api/projects/[id]/reports/execution-trend.get'

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
// Tests
// ---------------------------------------------------------------------------

describe('Reports - Execution Trend API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetRouterParam.mockReturnValue('proj-001')
    mockGetQuery.mockReturnValue({})
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
  // Business logic
  // -----------------------------------------------------------------------

  it('returns trend data grouped by day', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { executedAt: new Date('2025-06-10T10:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T14:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T16:00:00Z'), status: 'FAIL' },
      { executedAt: new Date('2025-06-11T09:00:00Z'), status: 'PASS' },
    ])

    const result = await handler(fakeEvent)

    expect(result.trend).toHaveLength(2)
    expect(result.trend[0].date).toBe('2025-06-10')
    expect(result.trend[0].totalExecuted).toBe(3)
    expect(result.trend[0].passCount).toBe(2)
    expect(result.trend[0].failCount).toBe(1)
    expect(result.trend[1].date).toBe('2025-06-11')
    expect(result.trend[1].totalExecuted).toBe(1)
    expect(result.trend[1].passCount).toBe(1)
    expect(result.trend[1].failCount).toBe(0)
  })

  it('calculates pass rate correctly per day', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { executedAt: new Date('2025-06-10T10:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T11:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T12:00:00Z'), status: 'FAIL' },
    ])

    const result = await handler(fakeEvent)

    // 2 PASS out of 3 = 66.66... -> 67%
    expect(result.trend[0].passRate).toBe(67)
  })

  it('returns empty trend array when no runs', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.trend).toEqual([])
  })

  it('sorts trend by date ascending', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    // Return runs already in ascending order (as handler orders by executedAt asc),
    // but with multiple days to verify the output sorting
    mockTestRunFindMany.mockResolvedValue([
      { executedAt: new Date('2025-06-08T10:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T10:00:00Z'), status: 'FAIL' },
      { executedAt: new Date('2025-06-12T10:00:00Z'), status: 'PASS' },
    ])

    const result = await handler(fakeEvent)

    const dates = result.trend.map((t: any) => t.date)
    expect(dates).toEqual(['2025-06-08', '2025-06-10', '2025-06-12'])
  })

  it('includes BLOCKED and SKIPPED statuses in totalExecuted but not pass/fail counts', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { executedAt: new Date('2025-06-10T10:00:00Z'), status: 'PASS' },
      { executedAt: new Date('2025-06-10T11:00:00Z'), status: 'BLOCKED' },
      { executedAt: new Date('2025-06-10T12:00:00Z'), status: 'SKIPPED' },
    ])

    const result = await handler(fakeEvent)

    expect(result.trend[0].totalExecuted).toBe(3)
    expect(result.trend[0].passCount).toBe(1)
    expect(result.trend[0].failCount).toBe(0)
    // passRate: 1/3 = 33%
    expect(result.trend[0].passRate).toBe(33)
  })

  it('groups by week when time span exceeds 90 days', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    // Span > 90 days: Jan 6 to Jun 10 = ~155 days
    mockTestRunFindMany.mockResolvedValue([
      { executedAt: new Date('2025-01-06T10:00:00Z'), status: 'PASS' }, // Monday
      { executedAt: new Date('2025-01-08T10:00:00Z'), status: 'FAIL' }, // Wednesday same week
      { executedAt: new Date('2025-06-10T10:00:00Z'), status: 'PASS' }, // Distant future
    ])

    const result = await handler(fakeEvent)

    // Should group by ISO week start (Monday)
    // Jan 6 (Monday) and Jan 8 (Wednesday) should be in same bucket
    expect(result.trend.length).toBe(2)
    // First bucket: 2 runs (Jan 6 Mon + Jan 8 Wed -> week of Jan 6)
    expect(result.trend[0].totalExecuted).toBe(2)
  })

  it('passes where clause from buildReportWhereClause to findMany', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    await handler(fakeEvent)

    expect(mockTestRunFindMany).toHaveBeenCalledWith({
      where: defaultWhereClause,
      select: { executedAt: true, status: true },
      orderBy: { executedAt: 'asc' },
    })
  })
})
