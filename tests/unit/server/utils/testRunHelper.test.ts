/**
 * Unit tests for server/utils/testRunHelper.ts
 *
 * Tests the updateTestCaseLastRun helper which recalculates a test case's
 * lastRunStatus and lastRunAt based on the most recent TestRun.
 *
 * Mocks the Prisma client to isolate database interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockTestRunFindFirst = vi.fn()
const mockTestCaseUpdate = vi.fn()

vi.mock('~/server/utils/db', () => ({
  prisma: {
    testRun: {
      findFirst: (...args: unknown[]) => mockTestRunFindFirst(...args),
    },
    testCase: {
      update: (...args: unknown[]) => mockTestCaseUpdate(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks are established
// ---------------------------------------------------------------------------

import { updateTestCaseLastRun } from '~/server/utils/testRunHelper'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('testRunHelper - updateTestCaseLastRun', () => {
  const testCaseId = 'tc-001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates test case with the latest run status and date', async () => {
    const executedAt = new Date('2025-06-15T10:30:00Z')

    mockTestRunFindFirst.mockResolvedValue({
      status: 'PASS',
      executedAt,
    })
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    // Verify findFirst was called with correct query
    expect(mockTestRunFindFirst).toHaveBeenCalledOnce()
    expect(mockTestRunFindFirst).toHaveBeenCalledWith({
      where: { testCaseId },
      orderBy: { executedAt: 'desc' },
      select: { status: true, executedAt: true },
    })

    // Verify update was called with the latest run data
    expect(mockTestCaseUpdate).toHaveBeenCalledOnce()
    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'PASS',
        lastRunAt: executedAt,
      },
    })
  })

  it('sets NOT_RUN and null date when no runs exist', async () => {
    mockTestRunFindFirst.mockResolvedValue(null)
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    expect(mockTestRunFindFirst).toHaveBeenCalledOnce()
    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'NOT_RUN',
        lastRunAt: null,
      },
    })
  })

  it('uses the FAIL status when latest run failed', async () => {
    const executedAt = new Date('2025-06-16T14:00:00Z')

    mockTestRunFindFirst.mockResolvedValue({
      status: 'FAIL',
      executedAt,
    })
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'FAIL',
        lastRunAt: executedAt,
      },
    })
  })

  it('uses the BLOCKED status when latest run is blocked', async () => {
    const executedAt = new Date('2025-06-17T08:00:00Z')

    mockTestRunFindFirst.mockResolvedValue({
      status: 'BLOCKED',
      executedAt,
    })
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'BLOCKED',
        lastRunAt: executedAt,
      },
    })
  })

  it('uses the SKIPPED status when latest run is skipped', async () => {
    const executedAt = new Date('2025-06-18T12:00:00Z')

    mockTestRunFindFirst.mockResolvedValue({
      status: 'SKIPPED',
      executedAt,
    })
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'SKIPPED',
        lastRunAt: executedAt,
      },
    })
  })

  it('uses the IN_PROGRESS status when latest run is in progress', async () => {
    const executedAt = new Date('2025-06-19T09:30:00Z')

    mockTestRunFindFirst.mockResolvedValue({
      status: 'IN_PROGRESS',
      executedAt,
    })
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun(testCaseId)

    expect(mockTestCaseUpdate).toHaveBeenCalledWith({
      where: { id: testCaseId },
      data: {
        lastRunStatus: 'IN_PROGRESS',
        lastRunAt: executedAt,
      },
    })
  })

  it('queries runs ordered by executedAt descending to get the latest', async () => {
    mockTestRunFindFirst.mockResolvedValue(null)
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun('any-id')

    const callArgs = mockTestRunFindFirst.mock.calls[0][0]
    expect(callArgs.orderBy).toEqual({ executedAt: 'desc' })
  })

  it('only selects status and executedAt fields from the run', async () => {
    mockTestRunFindFirst.mockResolvedValue(null)
    mockTestCaseUpdate.mockResolvedValue({})

    await updateTestCaseLastRun('any-id')

    const callArgs = mockTestRunFindFirst.mock.calls[0][0]
    expect(callArgs.select).toEqual({ status: true, executedAt: true })
  })

  it('propagates Prisma errors from findFirst', async () => {
    mockTestRunFindFirst.mockRejectedValue(new Error('Database connection failed'))

    await expect(updateTestCaseLastRun(testCaseId)).rejects.toThrow('Database connection failed')
  })

  it('propagates Prisma errors from update', async () => {
    mockTestRunFindFirst.mockResolvedValue({ status: 'PASS', executedAt: new Date() })
    mockTestCaseUpdate.mockRejectedValue(new Error('Record not found'))

    await expect(updateTestCaseLastRun(testCaseId)).rejects.toThrow('Record not found')
  })
})
