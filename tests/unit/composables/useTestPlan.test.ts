/**
 * Unit tests for the useTestPlan composable logic.
 *
 * Tests URL construction, request method/body correctness, error handling
 * patterns, and return value contracts by extracting the composable logic
 * and injecting a mock $fetch dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TestPlan,
  CreateTestPlanInput,
  UpdateTestPlanInput,
  PaginatedResponse,
} from '~/types'
import {
  createMockTestPlan,
  createMockPaginatedResponse,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock fetch type
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Extracted logic from composables/useTestPlan.ts
// ---------------------------------------------------------------------------

function createTestPlanLogic(fetchFn: MockFetch) {
  async function getTestPlans(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TestPlan>> {
    try {
      return await fetchFn(
        `/api/projects/${projectId}/test-plans?page=${page}&limit=${limit}`,
      )
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestPlan(planId: string): Promise<TestPlan | null> {
    try {
      return await fetchFn(`/api/test-plans/${planId}`)
    } catch {
      return null
    }
  }

  async function createTestPlan(data: CreateTestPlanInput): Promise<TestPlan | null> {
    try {
      return await fetchFn('/api/test-plans', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestPlan(planId: string, data: UpdateTestPlanInput): Promise<TestPlan | null> {
    try {
      return await fetchFn(`/api/test-plans/${planId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestPlan(planId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-plans/${planId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function linkTestCase(planId: string, caseId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-plans/${planId}/test-cases`, {
        method: 'POST',
        body: { testCaseId: caseId },
      })
      return true
    } catch {
      return false
    }
  }

  async function unlinkTestCase(planId: string, caseId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-plans/${planId}/test-cases/${caseId}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  }

  return {
    getTestPlans,
    getTestPlan,
    createTestPlan,
    updateTestPlan,
    deleteTestPlan,
    linkTestCase,
    unlinkTestCase,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestPlan Composable', () => {
  let mockFetch: MockFetch

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // getTestPlans
  // -------------------------------------------------------------------------

  describe('getTestPlans', () => {
    it('builds URL with projectId and default page/limit', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestPlans } = createTestPlanLogic(mockFetch)
      await getTestPlans('proj-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/test-plans?page=1&limit=20')
    })

    it('builds URL with custom page and limit', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestPlans } = createTestPlanLogic(mockFetch)
      await getTestPlans('proj-2', 3, 50)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-2/test-plans?page=3&limit=50')
    })

    it('returns fetched data on success', async () => {
      const plan = createMockTestPlan()
      mockFetch.mockResolvedValue(createMockPaginatedResponse([plan]))

      const { getTestPlans } = createTestPlanLogic(mockFetch)
      const result = await getTestPlans('proj-1')

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(plan)
    })

    it('returns empty paginated response on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getTestPlans } = createTestPlanLogic(mockFetch)
      const result = await getTestPlans('proj-1')

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    })
  })

  // -------------------------------------------------------------------------
  // getTestPlan
  // -------------------------------------------------------------------------

  describe('getTestPlan', () => {
    it('fetches from correct URL with planId', async () => {
      const plan = createMockTestPlan()
      mockFetch.mockResolvedValue(plan)

      const { getTestPlan } = createTestPlanLogic(mockFetch)
      await getTestPlan('plan-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans/plan-42')
    })

    it('returns fetched test plan on success', async () => {
      const plan = createMockTestPlan({ name: 'Smoke Tests' })
      mockFetch.mockResolvedValue(plan)

      const { getTestPlan } = createTestPlanLogic(mockFetch)
      const result = await getTestPlan('plan-1')

      expect(result?.name).toBe('Smoke Tests')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getTestPlan } = createTestPlanLogic(mockFetch)
      const result = await getTestPlan('plan-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createTestPlan
  // -------------------------------------------------------------------------

  describe('createTestPlan', () => {
    it('posts to correct endpoint with body', async () => {
      const plan = createMockTestPlan()
      mockFetch.mockResolvedValue(plan)

      const input: CreateTestPlanInput = {
        name: 'Sprint 13 Plan',
        projectId: 'proj-1',
        description: 'Regression for sprint 13',
        scope: 'All features',
      }

      const { createTestPlan } = createTestPlanLogic(mockFetch)
      await createTestPlan(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created test plan on success', async () => {
      const plan = createMockTestPlan({ name: 'New Plan' })
      mockFetch.mockResolvedValue(plan)

      const { createTestPlan } = createTestPlanLogic(mockFetch)
      const result = await createTestPlan({
        name: 'New Plan',
        projectId: 'proj-1',
      })

      expect(result?.name).toBe('New Plan')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createTestPlan } = createTestPlanLogic(mockFetch)
      const result = await createTestPlan({
        name: 'Bad Plan',
        projectId: 'proj-1',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // updateTestPlan
  // -------------------------------------------------------------------------

  describe('updateTestPlan', () => {
    it('puts to correct endpoint with planId', async () => {
      const plan = createMockTestPlan({ name: 'Updated' })
      mockFetch.mockResolvedValue(plan)

      const input: UpdateTestPlanInput = { name: 'Updated' }

      const { updateTestPlan } = createTestPlanLogic(mockFetch)
      await updateTestPlan('plan-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans/plan-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('returns updated test plan on success', async () => {
      const plan = createMockTestPlan({ name: 'Renamed Plan' })
      mockFetch.mockResolvedValue(plan)

      const { updateTestPlan } = createTestPlanLogic(mockFetch)
      const result = await updateTestPlan('plan-5', { name: 'Renamed Plan' })

      expect(result?.name).toBe('Renamed Plan')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateTestPlan } = createTestPlanLogic(mockFetch)
      const result = await updateTestPlan('plan-5', { name: 'Nope' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteTestPlan
  // -------------------------------------------------------------------------

  describe('deleteTestPlan', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestPlan } = createTestPlanLogic(mockFetch)
      await deleteTestPlan('plan-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans/plan-99', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestPlan } = createTestPlanLogic(mockFetch)
      const result = await deleteTestPlan('plan-99')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteTestPlan } = createTestPlanLogic(mockFetch)
      const result = await deleteTestPlan('plan-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // linkTestCase
  // -------------------------------------------------------------------------

  describe('linkTestCase', () => {
    it('posts testCaseId to correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { linkTestCase } = createTestPlanLogic(mockFetch)
      await linkTestCase('plan-1', 'tc-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans/plan-1/test-cases', {
        method: 'POST',
        body: { testCaseId: 'tc-10' },
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { linkTestCase } = createTestPlanLogic(mockFetch)
      const result = await linkTestCase('plan-1', 'tc-10')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Conflict'))

      const { linkTestCase } = createTestPlanLogic(mockFetch)
      const result = await linkTestCase('plan-1', 'tc-10')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // unlinkTestCase
  // -------------------------------------------------------------------------

  describe('unlinkTestCase', () => {
    it('deletes from correct URL with planId and caseId', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { unlinkTestCase } = createTestPlanLogic(mockFetch)
      await unlinkTestCase('plan-1', 'tc-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-plans/plan-1/test-cases/tc-10', {
        method: 'DELETE',
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { unlinkTestCase } = createTestPlanLogic(mockFetch)
      const result = await unlinkTestCase('plan-1', 'tc-10')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { unlinkTestCase } = createTestPlanLogic(mockFetch)
      const result = await unlinkTestCase('plan-1', 'tc-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createTestPlanLogic(mockFetch)
      expect(logic).toHaveProperty('getTestPlans')
      expect(logic).toHaveProperty('getTestPlan')
      expect(logic).toHaveProperty('createTestPlan')
      expect(logic).toHaveProperty('updateTestPlan')
      expect(logic).toHaveProperty('deleteTestPlan')
      expect(logic).toHaveProperty('linkTestCase')
      expect(logic).toHaveProperty('unlinkTestCase')
    })

    it('all methods are functions', () => {
      const logic = createTestPlanLogic(mockFetch)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
