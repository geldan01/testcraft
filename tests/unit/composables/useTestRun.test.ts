/**
 * Unit tests for the useTestRun composable logic.
 *
 * Tests URL construction with filter parameters, request method/body
 * correctness, error handling patterns, and return value contracts
 * by extracting the composable logic and injecting a mock $fetch dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TestRun,
  CreateTestRunInput,
  UpdateTestRunInput,
  TestRunFilters,
  PaginatedResponse,
} from '~/types'
import {
  createMockTestRun,
  createMockPaginatedResponse,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock fetch type
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Extracted logic from composables/useTestRun.ts
// ---------------------------------------------------------------------------

function createTestRunLogic(fetchFn: MockFetch) {
  async function getRuns(
    projectId: string,
    filters?: TestRunFilters,
  ): Promise<PaginatedResponse<TestRun>> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.environment) params.set('environment', filters.environment)
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters?.dateTo) params.set('dateTo', filters.dateTo)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const query = params.toString()
      const url = `/api/projects/${projectId}/test-runs${query ? `?${query}` : ''}`

      return await fetchFn(url)
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getRunsForTestCase(caseId: string): Promise<TestRun[]> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}/runs`)
    } catch {
      return []
    }
  }

  async function getRun(runId: string): Promise<TestRun | null> {
    try {
      return await fetchFn(`/api/test-runs/${runId}`)
    } catch {
      return null
    }
  }

  async function startRun(data: CreateTestRunInput): Promise<TestRun | null> {
    try {
      return await fetchFn('/api/test-runs', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function completeRun(
    runId: string,
    data: UpdateTestRunInput,
  ): Promise<TestRun | null> {
    try {
      return await fetchFn(`/api/test-runs/${runId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteRun(runId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-runs/${runId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  return {
    getRuns,
    getRunsForTestCase,
    getRun,
    startRun,
    completeRun,
    deleteRun,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestRun Composable', () => {
  let mockFetch: MockFetch

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // getRuns
  // -------------------------------------------------------------------------

  describe('getRuns', () => {
    it('builds correct URL with projectId and no filters', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/test-runs')
    })

    it('appends status filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', { status: 'PASS' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('status=PASS')
    })

    it('appends environment filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', { environment: 'staging' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('environment=staging')
    })

    it('appends dateFrom filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', { dateFrom: '2025-01-01' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('dateFrom=2025-01-01')
    })

    it('appends dateTo filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', { dateTo: '2025-12-31' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('dateTo=2025-12-31')
    })

    it('appends page and limit to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', { page: 2, limit: 50 })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('page=2')
      expect(url).toContain('limit=50')
    })

    it('combines multiple filters in URL', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getRuns } = createTestRunLogic(mockFetch)
      await getRuns('proj-1', {
        status: 'FAIL',
        environment: 'production',
        dateFrom: '2025-01-01',
        dateTo: '2025-06-30',
        page: 3,
        limit: 10,
      })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('status=FAIL')
      expect(url).toContain('environment=production')
      expect(url).toContain('dateFrom=2025-01-01')
      expect(url).toContain('dateTo=2025-06-30')
      expect(url).toContain('page=3')
      expect(url).toContain('limit=10')
    })

    it('returns fetched data on success', async () => {
      const run = createMockTestRun()
      mockFetch.mockResolvedValue(createMockPaginatedResponse([run]))

      const { getRuns } = createTestRunLogic(mockFetch)
      const result = await getRuns('proj-1')

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(run)
    })

    it('returns empty paginated response on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getRuns } = createTestRunLogic(mockFetch)
      const result = await getRuns('proj-1')

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    })
  })

  // -------------------------------------------------------------------------
  // getRunsForTestCase
  // -------------------------------------------------------------------------

  describe('getRunsForTestCase', () => {
    it('fetches from correct URL with caseId', async () => {
      mockFetch.mockResolvedValue([])

      const { getRunsForTestCase } = createTestRunLogic(mockFetch)
      await getRunsForTestCase('tc-15')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-15/runs')
    })

    it('returns runs on success', async () => {
      const runs = [
        createMockTestRun({ status: 'PASS' }),
        createMockTestRun({ status: 'FAIL' }),
      ]
      mockFetch.mockResolvedValue(runs)

      const { getRunsForTestCase } = createTestRunLogic(mockFetch)
      const result = await getRunsForTestCase('tc-15')

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('PASS')
      expect(result[1].status).toBe('FAIL')
    })

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getRunsForTestCase } = createTestRunLogic(mockFetch)
      const result = await getRunsForTestCase('tc-missing')

      expect(result).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // getRun
  // -------------------------------------------------------------------------

  describe('getRun', () => {
    it('fetches from correct URL with runId', async () => {
      const run = createMockTestRun()
      mockFetch.mockResolvedValue(run)

      const { getRun } = createTestRunLogic(mockFetch)
      await getRun('run-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-runs/run-42')
    })

    it('returns fetched test run on success', async () => {
      const run = createMockTestRun({ environment: 'production' })
      mockFetch.mockResolvedValue(run)

      const { getRun } = createTestRunLogic(mockFetch)
      const result = await getRun('run-1')

      expect(result?.environment).toBe('production')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getRun } = createTestRunLogic(mockFetch)
      const result = await getRun('run-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // startRun
  // -------------------------------------------------------------------------

  describe('startRun', () => {
    it('posts to /api/test-runs with body data', async () => {
      const run = createMockTestRun()
      mockFetch.mockResolvedValue(run)

      const input: CreateTestRunInput = {
        testCaseId: 'tc-1',
        environment: 'staging',
        status: 'IN_PROGRESS',
        notes: 'Starting test execution',
      }

      const { startRun } = createTestRunLogic(mockFetch)
      await startRun(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-runs', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created test run on success', async () => {
      const run = createMockTestRun({ status: 'IN_PROGRESS' })
      mockFetch.mockResolvedValue(run)

      const { startRun } = createTestRunLogic(mockFetch)
      const result = await startRun({
        testCaseId: 'tc-1',
        environment: 'staging',
        status: 'IN_PROGRESS',
      })

      expect(result?.status).toBe('IN_PROGRESS')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { startRun } = createTestRunLogic(mockFetch)
      const result = await startRun({
        testCaseId: 'tc-1',
        environment: 'staging',
        status: 'IN_PROGRESS',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // completeRun
  // -------------------------------------------------------------------------

  describe('completeRun', () => {
    it('puts to correct URL with runId', async () => {
      const run = createMockTestRun({ status: 'PASS' })
      mockFetch.mockResolvedValue(run)

      const input: UpdateTestRunInput = {
        status: 'PASS',
        duration: 120,
        notes: 'All steps passed',
      }

      const { completeRun } = createTestRunLogic(mockFetch)
      await completeRun('run-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-runs/run-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('returns updated test run on success', async () => {
      const run = createMockTestRun({ status: 'PASS', duration: 120 })
      mockFetch.mockResolvedValue(run)

      const { completeRun } = createTestRunLogic(mockFetch)
      const result = await completeRun('run-5', { status: 'PASS', duration: 120 })

      expect(result?.status).toBe('PASS')
      expect(result?.duration).toBe(120)
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { completeRun } = createTestRunLogic(mockFetch)
      const result = await completeRun('run-5', { status: 'PASS' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteRun
  // -------------------------------------------------------------------------

  describe('deleteRun', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteRun } = createTestRunLogic(mockFetch)
      await deleteRun('run-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-runs/run-99', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteRun } = createTestRunLogic(mockFetch)
      const result = await deleteRun('run-99')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteRun } = createTestRunLogic(mockFetch)
      const result = await deleteRun('run-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createTestRunLogic(mockFetch)
      expect(logic).toHaveProperty('getRuns')
      expect(logic).toHaveProperty('getRunsForTestCase')
      expect(logic).toHaveProperty('getRun')
      expect(logic).toHaveProperty('startRun')
      expect(logic).toHaveProperty('completeRun')
      expect(logic).toHaveProperty('deleteRun')
    })

    it('all methods are functions', () => {
      const logic = createTestRunLogic(mockFetch)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
