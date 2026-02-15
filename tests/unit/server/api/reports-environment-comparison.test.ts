/**
 * Unit tests for server/api/projects/[id]/reports/environment-comparison.get.ts
 *
 * Tests the environment comparison report endpoint which returns
 * per-environment pass rates, fail counts, and total runs aggregated
 * from test run data grouped by environment and status.
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

import handler from '~/server/api/projects/[id]/reports/environment-comparison.get'

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

describe('Reports - Environment Comparison API', () => {
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

  it('returns per-environment pass rates', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([
      { environment: 'staging', status: 'PASS', _count: { id: 4 } },
      { environment: 'staging', status: 'FAIL', _count: { id: 1 } },
      { environment: 'production', status: 'PASS', _count: { id: 5 } },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments).toHaveLength(2)

    const production = result.environments.find((e: any) => e.environment === 'production')
    expect(production).toEqual({
      environment: 'production',
      totalRuns: 5,
      passCount: 5,
      failCount: 0,
      passRate: 100,
    })

    const staging = result.environments.find((e: any) => e.environment === 'staging')
    expect(staging).toEqual({
      environment: 'staging',
      totalRuns: 5,
      passCount: 4,
      failCount: 1,
      passRate: 80,
    })
  })

  it('handles single environment', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([
      { environment: 'qa', status: 'PASS', _count: { id: 7 } },
      { environment: 'qa', status: 'FAIL', _count: { id: 3 } },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments).toHaveLength(1)
    expect(result.environments[0]).toEqual({
      environment: 'qa',
      totalRuns: 10,
      passCount: 7,
      failCount: 3,
      passRate: 70,
    })
  })

  it('returns empty array when no runs', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.environments).toEqual([])
  })

  it('sorts environments alphabetically', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([
      { environment: 'staging', status: 'PASS', _count: { id: 2 } },
      { environment: 'development', status: 'PASS', _count: { id: 3 } },
      { environment: 'production', status: 'PASS', _count: { id: 1 } },
    ])

    const result = await handler(fakeEvent)

    const names = result.environments.map((e: any) => e.environment)
    expect(names).toEqual(['development', 'production', 'staging'])
  })

  it('counts BLOCKED and SKIPPED in totalRuns but not in pass/fail', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([
      { environment: 'staging', status: 'PASS', _count: { id: 2 } },
      { environment: 'staging', status: 'BLOCKED', _count: { id: 1 } },
      { environment: 'staging', status: 'SKIPPED', _count: { id: 1 } },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments[0]).toEqual({
      environment: 'staging',
      totalRuns: 4,
      passCount: 2,
      failCount: 0,
      passRate: 50,
    })
  })

  it('passes where clause from buildReportWhereClause to groupBy', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunGroupBy.mockResolvedValue([])

    await handler(fakeEvent)

    expect(mockTestRunGroupBy).toHaveBeenCalledWith({
      by: ['environment', 'status'],
      _count: { id: true },
      where: defaultWhereClause,
    })
  })
})
