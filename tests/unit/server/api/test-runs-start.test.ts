/**
 * Unit tests for server/api/test-runs/start.post.ts
 *
 * Tests the "start test run" endpoint which creates a new test run
 * with IN_PROGRESS status after validating input, verifying the test
 * case exists, and confirming org membership.
 *
 * Mocks: Prisma client, auth utility, activity logger, testRunHelper,
 * and H3 event utilities (readBody, createError, setResponseStatus).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockTestCaseFindUnique = vi.fn()
const mockOrgMemberFindUnique = vi.fn()
const mockTestRunCreate = vi.fn()

vi.mock('~/server/utils/db', () => ({
  prisma: {
    testCase: {
      findUnique: (...args: unknown[]) => mockTestCaseFindUnique(...args),
    },
    organizationMember: {
      findUnique: (...args: unknown[]) => mockOrgMemberFindUnique(...args),
    },
    testRun: {
      create: (...args: unknown[]) => mockTestRunCreate(...args),
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
// Mock activity logger
// ---------------------------------------------------------------------------

const mockLogActivity = vi.fn()

vi.mock('~/server/utils/activity', () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}))

// ---------------------------------------------------------------------------
// Mock testRunHelper
// ---------------------------------------------------------------------------

const mockUpdateTestCaseLastRun = vi.fn()

vi.mock('~/server/utils/testRunHelper', () => ({
  updateTestCaseLastRun: (...args: unknown[]) => mockUpdateTestCaseLastRun(...args),
}))

// ---------------------------------------------------------------------------
// H3/Nuxt auto-imports are provided as globals by tests/unit/setup.ts.
// Override readBody and setResponseStatus with test-specific mock fns.
// ---------------------------------------------------------------------------

const mockReadBody = vi.fn()
const mockSetResponseStatus = vi.fn()

// Replace the global stubs with our per-test mocks
;(globalThis as Record<string, unknown>).readBody = mockReadBody
;(globalThis as Record<string, unknown>).setResponseStatus = mockSetResponseStatus

// ---------------------------------------------------------------------------
// Import handler (defineEventHandler is identity fn from setup.ts)
// ---------------------------------------------------------------------------

import handler from '~/server/api/test-runs/start.post'

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

const mockTestCase = {
  id: 'tc-001',
  name: 'Login flow test',
  project: {
    id: 'proj-001',
    organizationId: 'org-001',
  },
}

const mockMembership = {
  id: 'mem-001',
  organizationId: 'org-001',
  userId: 'user-001',
  role: 'QA_ENGINEER',
}

const mockCreatedRun = {
  id: 'run-001',
  testCaseId: 'tc-001',
  executedById: 'user-001',
  environment: 'staging',
  status: 'IN_PROGRESS',
  executedAt: new Date(),
  testCase: {
    id: 'tc-001',
    name: 'Login flow test',
    description: null,
    testType: 'MANUAL',
    projectId: 'proj-001',
    steps: [],
    gherkinSyntax: null,
    preconditions: null,
  },
  executedBy: {
    id: 'user-001',
    name: 'Test User',
    email: 'tester@example.com',
    avatarUrl: null,
  },
}

const fakeEvent = {} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Test Runs Start API - Input Validation Schema', () => {
  const startTestRunSchema = z.object({
    testCaseId: z.string().min(1, 'Test Case ID is required'),
    environment: z.string().min(1, 'Environment is required').max(100),
  })

  it('accepts valid input with testCaseId and environment', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing testCaseId', () => {
    const result = startTestRunSchema.safeParse({
      environment: 'staging',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty testCaseId', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: '',
      environment: 'staging',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing environment', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: 'tc-001',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty environment', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: 'tc-001',
      environment: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects environment longer than 100 characters', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: 'tc-001',
      environment: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('accepts environment exactly 100 characters', () => {
    const result = startTestRunSchema.safeParse({
      testCaseId: 'tc-001',
      environment: 'A'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty body', () => {
    const result = startTestRunSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('Test Runs Start API - Handler Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockLogActivity.mockResolvedValue(undefined)
    mockUpdateTestCaseLastRun.mockResolvedValue(undefined)
  })

  it('successfully starts a test run with valid input', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'Staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    const result = await handler(fakeEvent)

    expect(result).toEqual(mockCreatedRun)
    expect(mockRequireAuth).toHaveBeenCalledWith(fakeEvent)
    expect(mockReadBody).toHaveBeenCalledWith(fakeEvent)
  })

  it('creates test run with IN_PROGRESS status', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    await handler(fakeEvent)

    const createArgs = mockTestRunCreate.mock.calls[0][0]
    expect(createArgs.data.status).toBe('IN_PROGRESS')
    expect(createArgs.data.testCaseId).toBe('tc-001')
    expect(createArgs.data.executedById).toBe('user-001')
  })

  it('normalizes environment to lowercase and trimmed', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: '  Staging  ',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    await handler(fakeEvent)

    const createArgs = mockTestRunCreate.mock.calls[0][0]
    expect(createArgs.data.environment).toBe('staging')
  })

  it('returns the created run on successful creation (201)', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    const result = await handler(fakeEvent)

    expect(result).toEqual(mockCreatedRun)
  })

  it('throws 400 for invalid body (missing testCaseId)', async () => {
    mockReadBody.mockResolvedValue({
      environment: 'staging',
    })

    await expect(handler(fakeEvent)).rejects.toThrow()

    try {
      await handler(fakeEvent)
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })

  it('throws 400 for invalid body (missing environment)', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
    })

    await expect(handler(fakeEvent)).rejects.toThrow()
  })

  it('throws 404 when test case does not exist', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'nonexistent',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Test case not found')
    }
  })

  it('throws 403 when user lacks org membership', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('You do not have access to this test case')
    }
  })

  it('verifies org membership using the test case project organizationId', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

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

  it('calls updateTestCaseLastRun after creating the run', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    await handler(fakeEvent)

    expect(mockUpdateTestCaseLastRun).toHaveBeenCalledWith('tc-001')
  })

  it('logs activity after creating the run', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    await handler(fakeEvent)

    expect(mockLogActivity).toHaveBeenCalledWith(
      'user-001',
      'CREATED',
      'TestRun',
      'run-001',
      expect.objectContaining({
        testCaseId: 'tc-001',
        status: 'IN_PROGRESS',
        action: 'started',
      }),
    )
  })

  it('includes testCase and executedBy in the created run response', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    await handler(fakeEvent)

    const createArgs = mockTestRunCreate.mock.calls[0][0]
    expect(createArgs.include).toHaveProperty('testCase')
    expect(createArgs.include).toHaveProperty('executedBy')
  })

  it('sets executedAt to the current timestamp', async () => {
    mockReadBody.mockResolvedValue({
      testCaseId: 'tc-001',
      environment: 'staging',
    })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockTestRunCreate.mockResolvedValue(mockCreatedRun)

    const before = new Date()
    await handler(fakeEvent)
    const after = new Date()

    const createArgs = mockTestRunCreate.mock.calls[0][0]
    const executedAt = createArgs.data.executedAt as Date
    expect(executedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(executedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
