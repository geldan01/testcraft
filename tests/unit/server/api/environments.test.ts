/**
 * Unit tests for server/api/projects/[id]/environments.get.ts
 *
 * Tests the environments endpoint which returns a merged, sorted list
 * of default environments and any custom environments recorded in
 * test runs for a given project.
 *
 * Mocks: Prisma client, auth utility, and H3 event utilities
 * (getRouterParam, createError).
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
// H3/Nuxt auto-imports are provided as globals by tests/unit/setup.ts.
// Override getRouterParam with test-specific mock fn.
// ---------------------------------------------------------------------------

const mockGetRouterParam = vi.fn()

;(globalThis as Record<string, unknown>).getRouterParam = mockGetRouterParam

// ---------------------------------------------------------------------------
// Import handler (defineEventHandler is identity fn from setup.ts)
// ---------------------------------------------------------------------------

import handler from '~/server/api/projects/[id]/environments.get'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const DEFAULT_ENVIRONMENTS = ['development', 'staging', 'production', 'qa']

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

const fakeEvent = {} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Environments API - Handler Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetRouterParam.mockReturnValue('proj-001')
  })

  it('returns default environments when no test runs exist', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result.environments).toBeDefined()
    expect(Array.isArray(result.environments)).toBe(true)

    // All defaults should be present
    for (const env of DEFAULT_ENVIRONMENTS) {
      expect(result.environments).toContain(env)
    }
  })

  it('returns sorted environments', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    const sorted = [...result.environments].sort()
    expect(result.environments).toEqual(sorted)
  })

  it('merges custom environments from test runs with defaults', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'integration' },
      { environment: 'performance' },
    ])

    const result = await handler(fakeEvent)

    // Should include both defaults and custom
    expect(result.environments).toContain('development')
    expect(result.environments).toContain('staging')
    expect(result.environments).toContain('production')
    expect(result.environments).toContain('qa')
    expect(result.environments).toContain('integration')
    expect(result.environments).toContain('performance')
  })

  it('deduplicates environments when runs use default names', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'staging' },
      { environment: 'production' },
    ])

    const result = await handler(fakeEvent)

    // Should not have duplicates
    const uniqueCount = new Set(result.environments).size
    expect(result.environments).toHaveLength(uniqueCount)

    // Defaults + no new ones = 4
    expect(result.environments).toHaveLength(4)
  })

  it('handles a single custom environment', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'canary' },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments).toContain('canary')
    // 4 defaults + 1 custom = 5
    expect(result.environments).toHaveLength(5)
  })

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

  it('throws 404 when project does not exist', async () => {
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

  it('verifies org membership using the project organizationId', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    await handler(fakeEvent)

    expect(mockOrgMemberFindUnique).toHaveBeenCalledWith({
      where: {
        organizationId_userId: {
          organizationId: 'org-001',
          userId: 'user-001',
        },
      },
    })
  })

  it('queries test runs filtered by projectId with distinct environments', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    await handler(fakeEvent)

    expect(mockTestRunFindMany).toHaveBeenCalledWith({
      where: {
        testCase: {
          projectId: 'proj-001',
        },
      },
      select: {
        environment: true,
      },
      distinct: ['environment'],
    })
  })

  it('returns all defaults when runs only contain defaults', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'development' },
      { environment: 'qa' },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments).toHaveLength(4)
    expect(result.environments).toEqual(
      expect.arrayContaining(DEFAULT_ENVIRONMENTS),
    )
  })

  it('returns response with environments key', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([])

    const result = await handler(fakeEvent)

    expect(result).toHaveProperty('environments')
    expect(Object.keys(result)).toEqual(['environments'])
  })

  it('handles many custom environments', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'alpha' },
      { environment: 'beta' },
      { environment: 'gamma' },
      { environment: 'delta' },
      { environment: 'epsilon' },
    ])

    const result = await handler(fakeEvent)

    // 4 defaults + 5 custom = 9
    expect(result.environments).toHaveLength(9)
    expect(result.environments).toContain('alpha')
    expect(result.environments).toContain('epsilon')
  })

  it('maintains alphabetical sort with mixed custom and default', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunFindMany.mockResolvedValue([
      { environment: 'zzz-last' },
      { environment: 'aaa-first' },
    ])

    const result = await handler(fakeEvent)

    expect(result.environments[0]).toBe('aaa-first')
    expect(result.environments[result.environments.length - 1]).toBe('zzz-last')
  })
})
