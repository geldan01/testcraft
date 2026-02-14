/**
 * Unit tests for the useTestSuite composable logic.
 *
 * Tests URL construction, request method/body correctness, error handling
 * patterns, and return value contracts by extracting the composable logic
 * and injecting a mock $fetch dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TestSuite,
  CreateTestSuiteInput,
  UpdateTestSuiteInput,
  PaginatedResponse,
} from '~/types'
import {
  createMockTestSuite,
  createMockPaginatedResponse,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock fetch type
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Extracted logic from composables/useTestSuite.ts
// ---------------------------------------------------------------------------

function createTestSuiteLogic(fetchFn: MockFetch) {
  async function getTestSuites(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TestSuite>> {
    try {
      return await fetchFn(
        `/api/projects/${projectId}/test-suites?page=${page}&limit=${limit}`,
      )
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestSuite(suiteId: string): Promise<TestSuite | null> {
    try {
      return await fetchFn(`/api/test-suites/${suiteId}`)
    } catch {
      return null
    }
  }

  async function createTestSuite(data: CreateTestSuiteInput): Promise<TestSuite | null> {
    try {
      return await fetchFn('/api/test-suites', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestSuite(suiteId: string, data: UpdateTestSuiteInput): Promise<TestSuite | null> {
    try {
      return await fetchFn(`/api/test-suites/${suiteId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestSuite(suiteId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-suites/${suiteId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function linkTestCase(suiteId: string, caseId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-suites/${suiteId}/test-cases`, {
        method: 'POST',
        body: { testCaseId: caseId },
      })
      return true
    } catch {
      return false
    }
  }

  async function unlinkTestCase(suiteId: string, caseId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-suites/${suiteId}/test-cases/${caseId}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  }

  return {
    getTestSuites,
    getTestSuite,
    createTestSuite,
    updateTestSuite,
    deleteTestSuite,
    linkTestCase,
    unlinkTestCase,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestSuite Composable', () => {
  let mockFetch: MockFetch

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // getTestSuites
  // -------------------------------------------------------------------------

  describe('getTestSuites', () => {
    it('builds URL with projectId and default page/limit', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestSuites } = createTestSuiteLogic(mockFetch)
      await getTestSuites('proj-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/test-suites?page=1&limit=20')
    })

    it('builds URL with custom page and limit', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestSuites } = createTestSuiteLogic(mockFetch)
      await getTestSuites('proj-2', 5, 100)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-2/test-suites?page=5&limit=100')
    })

    it('returns fetched data on success', async () => {
      const suite = createMockTestSuite()
      mockFetch.mockResolvedValue(createMockPaginatedResponse([suite]))

      const { getTestSuites } = createTestSuiteLogic(mockFetch)
      const result = await getTestSuites('proj-1')

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(suite)
    })

    it('returns empty paginated response on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getTestSuites } = createTestSuiteLogic(mockFetch)
      const result = await getTestSuites('proj-1')

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    })
  })

  // -------------------------------------------------------------------------
  // getTestSuite
  // -------------------------------------------------------------------------

  describe('getTestSuite', () => {
    it('fetches from correct URL with suiteId', async () => {
      const suite = createMockTestSuite()
      mockFetch.mockResolvedValue(suite)

      const { getTestSuite } = createTestSuiteLogic(mockFetch)
      await getTestSuite('suite-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites/suite-42')
    })

    it('returns fetched test suite on success', async () => {
      const suite = createMockTestSuite({ name: 'Regression Suite' })
      mockFetch.mockResolvedValue(suite)

      const { getTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await getTestSuite('suite-1')

      expect(result?.name).toBe('Regression Suite')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await getTestSuite('suite-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createTestSuite
  // -------------------------------------------------------------------------

  describe('createTestSuite', () => {
    it('posts to correct endpoint with body', async () => {
      const suite = createMockTestSuite()
      mockFetch.mockResolvedValue(suite)

      const input: CreateTestSuiteInput = {
        name: 'Smoke Tests',
        projectId: 'proj-1',
        suiteType: 'smoke',
        description: 'Quick smoke test suite',
      }

      const { createTestSuite } = createTestSuiteLogic(mockFetch)
      await createTestSuite(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created test suite on success', async () => {
      const suite = createMockTestSuite({ name: 'New Suite' })
      mockFetch.mockResolvedValue(suite)

      const { createTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await createTestSuite({
        name: 'New Suite',
        projectId: 'proj-1',
        suiteType: 'regression',
      })

      expect(result?.name).toBe('New Suite')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await createTestSuite({
        name: 'Bad Suite',
        projectId: 'proj-1',
        suiteType: 'regression',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // updateTestSuite
  // -------------------------------------------------------------------------

  describe('updateTestSuite', () => {
    it('puts to correct endpoint with suiteId', async () => {
      const suite = createMockTestSuite({ name: 'Updated' })
      mockFetch.mockResolvedValue(suite)

      const input: UpdateTestSuiteInput = { name: 'Updated' }

      const { updateTestSuite } = createTestSuiteLogic(mockFetch)
      await updateTestSuite('suite-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites/suite-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('returns updated test suite on success', async () => {
      const suite = createMockTestSuite({ name: 'Renamed Suite' })
      mockFetch.mockResolvedValue(suite)

      const { updateTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await updateTestSuite('suite-5', { name: 'Renamed Suite' })

      expect(result?.name).toBe('Renamed Suite')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await updateTestSuite('suite-5', { name: 'Nope' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteTestSuite
  // -------------------------------------------------------------------------

  describe('deleteTestSuite', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestSuite } = createTestSuiteLogic(mockFetch)
      await deleteTestSuite('suite-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites/suite-99', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await deleteTestSuite('suite-99')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteTestSuite } = createTestSuiteLogic(mockFetch)
      const result = await deleteTestSuite('suite-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // linkTestCase
  // -------------------------------------------------------------------------

  describe('linkTestCase', () => {
    it('posts testCaseId to correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { linkTestCase } = createTestSuiteLogic(mockFetch)
      await linkTestCase('suite-1', 'tc-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites/suite-1/test-cases', {
        method: 'POST',
        body: { testCaseId: 'tc-10' },
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { linkTestCase } = createTestSuiteLogic(mockFetch)
      const result = await linkTestCase('suite-1', 'tc-10')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Conflict'))

      const { linkTestCase } = createTestSuiteLogic(mockFetch)
      const result = await linkTestCase('suite-1', 'tc-10')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // unlinkTestCase
  // -------------------------------------------------------------------------

  describe('unlinkTestCase', () => {
    it('deletes from correct URL with suiteId and caseId', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { unlinkTestCase } = createTestSuiteLogic(mockFetch)
      await unlinkTestCase('suite-1', 'tc-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-suites/suite-1/test-cases/tc-10', {
        method: 'DELETE',
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { unlinkTestCase } = createTestSuiteLogic(mockFetch)
      const result = await unlinkTestCase('suite-1', 'tc-10')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { unlinkTestCase } = createTestSuiteLogic(mockFetch)
      const result = await unlinkTestCase('suite-1', 'tc-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createTestSuiteLogic(mockFetch)
      expect(logic).toHaveProperty('getTestSuites')
      expect(logic).toHaveProperty('getTestSuite')
      expect(logic).toHaveProperty('createTestSuite')
      expect(logic).toHaveProperty('updateTestSuite')
      expect(logic).toHaveProperty('deleteTestSuite')
      expect(logic).toHaveProperty('linkTestCase')
      expect(logic).toHaveProperty('unlinkTestCase')
    })

    it('all methods are functions', () => {
      const logic = createTestSuiteLogic(mockFetch)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
