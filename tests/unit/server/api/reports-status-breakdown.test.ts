/**
 * Unit tests for server/api/projects/[id]/reports/status-breakdown.get.ts
 *
 * Tests the status breakdown report endpoint which returns a grouped
 * count of test runs by status with calculated percentages.
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

import handler from '~/server/api/projects/[id]/reports/status-breakdown.get'

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

describe('Reports - Status Breakdown API', () => {
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

  it('returns correct breakdown with percentages', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([
      { status: 'PASS', _count: { id: 3 } },
      { status: 'FAIL', _count: { id: 1 } },
      { status: 'BLOCKED', _count: { id: 1 } },
    ])

    const result = await handler(fakeEvent)

    expect(result.total).toBe(5)
    expect(result.breakdown).toEqual([
      { status: 'PASS', count: 3, percentage: 60 },
      { status: 'FAIL', count: 1, percentage: 20 },
      { status: 'BLOCKED', count: 1, percentage: 20 },
    ])
  })

  it('returns empty breakdown and total=0 when no runs exist', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.total).toBe(0)
    expect(result.breakdown).toEqual([])
  })

  it('passes query params to buildReportWhereClause correctly', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([])
    mockGetQuery.mockReturnValue({
      timeRange: '7d',
      dateFrom: '2025-01-01',
      dateTo: '2025-03-31',
      scope: 'test-plan',
      scopeId: 'plan-001',
    })

    await handler(fakeEvent)

    expect(mockBuildReportWhereClause).toHaveBeenCalledWith({
      projectId: 'proj-001',
      timeRange: '7d',
      dateFrom: '2025-01-01',
      dateTo: '2025-03-31',
      scope: 'test-plan',
      scopeId: 'plan-001',
    })
  })

  it('calculates percentages correctly and rounds to nearest integer', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    // 1/3 = 33.33... -> 33, 2/3 = 66.66... -> 67
    mockTestRunGroupBy.mockResolvedValue([
      { status: 'PASS', _count: { id: 1 } },
      { status: 'FAIL', _count: { id: 2 } },
    ])

    const result = await handler(fakeEvent)

    expect(result.total).toBe(3)
    expect(result.breakdown).toEqual([
      { status: 'PASS', count: 1, percentage: 33 },
      { status: 'FAIL', count: 2, percentage: 67 },
    ])
  })

  it('passes where clause from buildReportWhereClause to groupBy', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([])

    await handler(fakeEvent)

    expect(mockTestRunGroupBy).toHaveBeenCalledWith({
      by: ['status'],
      _count: { id: true },
      where: defaultWhereClause,
    })
  })
})
