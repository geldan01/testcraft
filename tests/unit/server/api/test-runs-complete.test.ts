/**
 * Unit tests for server/api/test-runs/[id]/complete.put.ts
 *
 * Tests the "complete test run" endpoint which updates an IN_PROGRESS
 * test run to a terminal status (PASS, FAIL, BLOCKED, SKIPPED).
 *
 * Validates: input schema, ownership check, status transition guard,
 * and proper Prisma update call.
 *
 * Mocks: Prisma client, auth utility, activity logger, testRunHelper,
 * and H3 event utilities (readBody, getRouterParam, createError).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockTestRunFindUnique = vi.fn()
const mockTestRunUpdate = vi.fn()

vi.mock('~/server/utils/db', () => ({
  prisma: {
    testRun: {
      findUnique: (...args: unknown[]) => mockTestRunFindUnique(...args),
      update: (...args: unknown[]) => mockTestRunUpdate(...args),
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
// Override readBody and getRouterParam with test-specific mock fns.
// ---------------------------------------------------------------------------

const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

;(globalThis as Record<string, unknown>).readBody = mockReadBody
;(globalThis as Record<string, unknown>).getRouterParam = mockGetRouterParam

// ---------------------------------------------------------------------------
// Import handler (defineEventHandler is identity fn from setup.ts)
// ---------------------------------------------------------------------------

import handler from '~/server/api/test-runs/[id]/complete.put'

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

const mockOtherUser = {
  id: 'user-999',
  email: 'other@example.com',
  name: 'Other User',
  isAdmin: false,
  status: 'ACTIVE',
}

const mockInProgressRun = {
  id: 'run-001',
  testCaseId: 'tc-001',
  executedById: 'user-001',
  status: 'IN_PROGRESS',
  environment: 'staging',
  executedAt: new Date('2025-06-15T10:00:00Z'),
  testCase: {
    id: 'tc-001',
    project: {
      id: 'proj-001',
      organizationId: 'org-001',
    },
  },
}

const mockCompletedRun = {
  id: 'run-001',
  testCaseId: 'tc-001',
  executedById: 'user-001',
  status: 'PASS',
  environment: 'staging',
  notes: 'All steps passed',
  duration: 120,
  executedAt: new Date('2025-06-15T10:00:00Z'),
  testCase: {
    id: 'tc-001',
    name: 'Login flow test',
    testType: 'MANUAL',
    projectId: 'proj-001',
  },
  executedBy: {
    id: 'user-001',
    name: 'Test User',
    email: 'tester@example.com',
    avatarUrl: null,
  },
}

const mockAlreadyPassedRun = {
  ...mockInProgressRun,
  status: 'PASS',
}

const fakeEvent = {} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Test Runs Complete API - Input Validation Schema', () => {
  const completeTestRunSchema = z.object({
    status: z.enum(['PASS', 'FAIL', 'BLOCKED', 'SKIPPED'], {
      message: 'Status must be one of: PASS, FAIL, BLOCKED, SKIPPED',
    }),
    notes: z.string().max(5000).optional(),
    duration: z.number().int().min(0).optional(),
  })

  it('accepts valid completion with status PASS', () => {
    const result = completeTestRunSchema.safeParse({ status: 'PASS' })
    expect(result.success).toBe(true)
  })

  it('accepts valid completion with status FAIL', () => {
    const result = completeTestRunSchema.safeParse({ status: 'FAIL' })
    expect(result.success).toBe(true)
  })

  it('accepts valid completion with status BLOCKED', () => {
    const result = completeTestRunSchema.safeParse({ status: 'BLOCKED' })
    expect(result.success).toBe(true)
  })

  it('accepts valid completion with status SKIPPED', () => {
    const result = completeTestRunSchema.safeParse({ status: 'SKIPPED' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status value', () => {
    const result = completeTestRunSchema.safeParse({ status: 'IN_PROGRESS' })
    expect(result.success).toBe(false)
  })

  it('rejects NOT_RUN as completion status', () => {
    const result = completeTestRunSchema.safeParse({ status: 'NOT_RUN' })
    expect(result.success).toBe(false)
  })

  it('rejects missing status', () => {
    const result = completeTestRunSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts status with optional notes', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'FAIL',
      notes: 'Button was unresponsive',
    })
    expect(result.success).toBe(true)
  })

  it('rejects notes longer than 5000 characters', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      notes: 'A'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts notes exactly 5000 characters', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      notes: 'A'.repeat(5000),
    })
    expect(result.success).toBe(true)
  })

  it('accepts status with optional duration', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      duration: 300,
    })
    expect(result.success).toBe(true)
  })

  it('accepts zero duration', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      duration: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative duration', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      duration: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer duration', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'PASS',
      duration: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('accepts all fields together', () => {
    const result = completeTestRunSchema.safeParse({
      status: 'FAIL',
      notes: 'Failed on step 3',
      duration: 45,
    })
    expect(result.success).toBe(true)
  })
})

describe('Test Runs Complete API - Handler Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockGetRouterParam.mockReturnValue('run-001')
    mockLogActivity.mockResolvedValue(undefined)
    mockUpdateTestCaseLastRun.mockResolvedValue(undefined)
  })

  it('successfully completes a test run with PASS', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'PASS', notes: 'All good', duration: 60 })
    mockTestRunUpdate.mockResolvedValue(mockCompletedRun)

    const result = await handler(fakeEvent)

    expect(result).toEqual(mockCompletedRun)
  })

  it('updates the test run with the correct status, notes, and duration', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'FAIL', notes: 'Step 3 failed', duration: 90 })
    mockTestRunUpdate.mockResolvedValue(mockCompletedRun)

    await handler(fakeEvent)

    expect(mockTestRunUpdate).toHaveBeenCalledWith({
      where: { id: 'run-001' },
      data: {
        status: 'FAIL',
        notes: 'Step 3 failed',
        duration: 90,
      },
      include: expect.objectContaining({
        testCase: expect.any(Object),
        executedBy: expect.any(Object),
      }),
    })
  })

  it('throws 400 when run ID is missing from route params', async () => {
    mockGetRouterParam.mockReturnValue(undefined)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Test Run ID is required')
    }
  })

  it('throws 404 when test run does not exist', async () => {
    mockTestRunFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Test run not found')
    }
  })

  it('throws 403 when non-owner tries to complete a run', async () => {
    mockRequireAuth.mockResolvedValue(mockOtherUser)
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('You can only complete your own test runs')
    }
  })

  it('throws 400 when run is already completed (not IN_PROGRESS)', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockAlreadyPassedRun)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Only test runs with IN_PROGRESS status can be completed')
    }
  })

  it('throws 400 for invalid status in body', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'INVALID' })

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })

  it('calls updateTestCaseLastRun after completing', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'PASS' })
    mockTestRunUpdate.mockResolvedValue(mockCompletedRun)

    await handler(fakeEvent)

    expect(mockUpdateTestCaseLastRun).toHaveBeenCalledWith('tc-001')
  })

  it('logs activity with completed action', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'PASS', notes: 'Good', duration: 30 })
    mockTestRunUpdate.mockResolvedValue(mockCompletedRun)

    await handler(fakeEvent)

    expect(mockLogActivity).toHaveBeenCalledWith(
      'user-001',
      'UPDATED',
      'TestRun',
      'run-001',
      expect.objectContaining({
        status: 'PASS',
        action: 'completed',
      }),
    )
  })

  it('completes successfully without optional notes and duration', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'SKIPPED' })
    mockTestRunUpdate.mockResolvedValue({ ...mockCompletedRun, status: 'SKIPPED' })

    const result = await handler(fakeEvent)

    expect(result.status).toBe('SKIPPED')
    const updateArgs = mockTestRunUpdate.mock.calls[0][0]
    expect(updateArgs.data.status).toBe('SKIPPED')
    expect(updateArgs.data.notes).toBeUndefined()
    expect(updateArgs.data.duration).toBeUndefined()
  })

  it('verifies ownership before checking status', async () => {
    // Even if status is valid, ownership is checked first
    mockRequireAuth.mockResolvedValue(mockOtherUser)
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'PASS' })

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      // Should fail on ownership, not reach body validation
      expect(err.statusCode).toBe(403)
    }
  })

  it('queries the test run with testCase and project included', async () => {
    mockTestRunFindUnique.mockResolvedValue(mockInProgressRun)
    mockReadBody.mockResolvedValue({ status: 'PASS' })
    mockTestRunUpdate.mockResolvedValue(mockCompletedRun)

    await handler(fakeEvent)

    expect(mockTestRunFindUnique).toHaveBeenCalledWith({
      where: { id: 'run-001' },
      include: {
        testCase: {
          include: { project: true },
        },
      },
    })
  })
})
