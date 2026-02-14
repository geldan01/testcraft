/**
 * Unit tests for the useTestCase composable logic.
 *
 * Tests URL construction, parameter building, error handling patterns,
 * and return value contracts by extracting the composable logic and
 * injecting a mock $fetch dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TestCase,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  TestCaseFilters,
  PaginatedResponse,
  Comment,
  CreateCommentInput,
  Attachment,
} from '~/types'
import {
  createMockTestCase,
  createMockComment,
  createMockAttachment,
  createMockPaginatedResponse,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock fetch type
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Extracted logic from composables/useTestCase.ts
// ---------------------------------------------------------------------------

function createTestCaseLogic(fetchFn: MockFetch) {
  async function getTestCases(
    projectId: string,
    filters?: TestCaseFilters,
  ): Promise<PaginatedResponse<TestCase>> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.testType) params.set('testType', filters.testType)
      if (filters?.debugFlag !== undefined) params.set('debugFlag', String(filters.debugFlag))
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      const query = params.toString()
      const url = `/api/projects/${projectId}/test-cases${query ? `?${query}` : ''}`

      return await fetchFn(url)
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestCase(caseId: string): Promise<TestCase | null> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}`)
    } catch {
      return null
    }
  }

  async function createTestCase(data: CreateTestCaseInput): Promise<TestCase | null> {
    try {
      return await fetchFn('/api/test-cases', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestCase(caseId: string, data: UpdateTestCaseInput): Promise<TestCase | null> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestCase(caseId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/test-cases/${caseId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function toggleDebugFlag(caseId: string): Promise<TestCase | null> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}/debug-flag`, {
        method: 'PUT',
      })
    } catch {
      return null
    }
  }

  async function getComments(caseId: string): Promise<Comment[]> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}/comments`)
    } catch {
      return []
    }
  }

  async function addComment(data: CreateCommentInput): Promise<Comment | null> {
    try {
      return await fetchFn('/api/comments', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteComment(commentId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/comments/${commentId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function getAttachments(caseId: string): Promise<Attachment[]> {
    try {
      return await fetchFn(`/api/test-cases/${caseId}/attachments`)
    } catch {
      return []
    }
  }

  return {
    getTestCases,
    getTestCase,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    toggleDebugFlag,
    getComments,
    addComment,
    deleteComment,
    getAttachments,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestCase Composable', () => {
  let mockFetch: MockFetch

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
  })

  // -------------------------------------------------------------------------
  // getTestCases
  // -------------------------------------------------------------------------

  describe('getTestCases', () => {
    it('builds correct URL with projectId', async () => {
      const mockResponse = createMockPaginatedResponse([createMockTestCase()])
      mockFetch.mockResolvedValue(mockResponse)

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/test-cases')
    })

    it('appends status filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { status: 'PASS' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('status=PASS')
    })

    it('appends testType filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { testType: 'GHERKIN' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('testType=GHERKIN')
    })

    it('appends debugFlag filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { debugFlag: true })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('debugFlag=true')
    })

    it('appends debugFlag=false filter to URL when explicitly set', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { debugFlag: false })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('debugFlag=false')
    })

    it('appends search filter to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { search: 'login' })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('search=login')
    })

    it('appends page and limit to URL when provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', { page: 2, limit: 50 })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('page=2')
      expect(url).toContain('limit=50')
    })

    it('combines multiple filters in URL', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1', {
        status: 'FAIL',
        testType: 'STEP_BASED',
        search: 'auth',
        page: 3,
        limit: 10,
      })

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('status=FAIL')
      expect(url).toContain('testType=STEP_BASED')
      expect(url).toContain('search=auth')
      expect(url).toContain('page=3')
      expect(url).toContain('limit=10')
    })

    it('does not append query string when no filters provided', async () => {
      mockFetch.mockResolvedValue(createMockPaginatedResponse([]))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      await getTestCases('proj-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/test-cases')
    })

    it('returns fetched data on success', async () => {
      const testCase = createMockTestCase()
      const mockResponse = createMockPaginatedResponse([testCase])
      mockFetch.mockResolvedValue(mockResponse)

      const { getTestCases } = createTestCaseLogic(mockFetch)
      const result = await getTestCases('proj-1')

      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(testCase)
    })

    it('returns empty paginated response on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getTestCases } = createTestCaseLogic(mockFetch)
      const result = await getTestCases('proj-1')

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })
    })
  })

  // -------------------------------------------------------------------------
  // getTestCase
  // -------------------------------------------------------------------------

  describe('getTestCase', () => {
    it('fetches from correct URL with caseId', async () => {
      const testCase = createMockTestCase()
      mockFetch.mockResolvedValue(testCase)

      const { getTestCase } = createTestCaseLogic(mockFetch)
      await getTestCase('tc-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-42')
    })

    it('returns fetched test case on success', async () => {
      const testCase = createMockTestCase({ name: 'Login test' })
      mockFetch.mockResolvedValue(testCase)

      const { getTestCase } = createTestCaseLogic(mockFetch)
      const result = await getTestCase('tc-1')

      expect(result).toEqual(testCase)
      expect(result?.name).toBe('Login test')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getTestCase } = createTestCaseLogic(mockFetch)
      const result = await getTestCase('tc-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createTestCase
  // -------------------------------------------------------------------------

  describe('createTestCase', () => {
    it('posts to /api/test-cases with body data', async () => {
      const newCase = createMockTestCase()
      mockFetch.mockResolvedValue(newCase)

      const input: CreateTestCaseInput = {
        name: 'New test',
        projectId: 'proj-1',
        testType: 'STEP_BASED',
        steps: [{ stepNumber: 1, action: 'Click', data: '', expectedResult: 'Done' }],
      }

      const { createTestCase } = createTestCaseLogic(mockFetch)
      await createTestCase(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created test case on success', async () => {
      const newCase = createMockTestCase({ name: 'Created' })
      mockFetch.mockResolvedValue(newCase)

      const { createTestCase } = createTestCaseLogic(mockFetch)
      const result = await createTestCase({
        name: 'Created',
        projectId: 'proj-1',
        testType: 'STEP_BASED',
      })

      expect(result?.name).toBe('Created')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createTestCase } = createTestCaseLogic(mockFetch)
      const result = await createTestCase({
        name: 'Bad',
        projectId: 'proj-1',
        testType: 'STEP_BASED',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // updateTestCase
  // -------------------------------------------------------------------------

  describe('updateTestCase', () => {
    it('puts to correct URL with caseId', async () => {
      const updated = createMockTestCase({ name: 'Updated' })
      mockFetch.mockResolvedValue(updated)

      const input: UpdateTestCaseInput = { name: 'Updated' }

      const { updateTestCase } = createTestCaseLogic(mockFetch)
      await updateTestCase('tc-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('returns updated test case on success', async () => {
      const updated = createMockTestCase({ name: 'Updated name' })
      mockFetch.mockResolvedValue(updated)

      const { updateTestCase } = createTestCaseLogic(mockFetch)
      const result = await updateTestCase('tc-5', { name: 'Updated name' })

      expect(result?.name).toBe('Updated name')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateTestCase } = createTestCaseLogic(mockFetch)
      const result = await updateTestCase('tc-5', { name: 'Nope' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteTestCase
  // -------------------------------------------------------------------------

  describe('deleteTestCase', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestCase } = createTestCaseLogic(mockFetch)
      await deleteTestCase('tc-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-99', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteTestCase } = createTestCaseLogic(mockFetch)
      const result = await deleteTestCase('tc-99')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteTestCase } = createTestCaseLogic(mockFetch)
      const result = await deleteTestCase('tc-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // toggleDebugFlag
  // -------------------------------------------------------------------------

  describe('toggleDebugFlag', () => {
    it('puts to correct debug-flag URL', async () => {
      const toggled = createMockTestCase({ debugFlag: true })
      mockFetch.mockResolvedValue(toggled)

      const { toggleDebugFlag } = createTestCaseLogic(mockFetch)
      await toggleDebugFlag('tc-7')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-7/debug-flag', {
        method: 'PUT',
      })
    })

    it('returns updated test case on success', async () => {
      const toggled = createMockTestCase({ debugFlag: true })
      mockFetch.mockResolvedValue(toggled)

      const { toggleDebugFlag } = createTestCaseLogic(mockFetch)
      const result = await toggleDebugFlag('tc-7')

      expect(result?.debugFlag).toBe(true)
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'))

      const { toggleDebugFlag } = createTestCaseLogic(mockFetch)
      const result = await toggleDebugFlag('tc-7')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // getComments
  // -------------------------------------------------------------------------

  describe('getComments', () => {
    it('fetches from correct comments URL', async () => {
      mockFetch.mockResolvedValue([])

      const { getComments } = createTestCaseLogic(mockFetch)
      await getComments('tc-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-10/comments')
    })

    it('returns comments on success', async () => {
      const comments = [createMockComment(), createMockComment({ content: 'Second comment' })]
      mockFetch.mockResolvedValue(comments)

      const { getComments } = createTestCaseLogic(mockFetch)
      const result = await getComments('tc-10')

      expect(result).toHaveLength(2)
    })

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getComments } = createTestCaseLogic(mockFetch)
      const result = await getComments('tc-10')

      expect(result).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // addComment
  // -------------------------------------------------------------------------

  describe('addComment', () => {
    it('posts to /api/comments with correct body', async () => {
      const comment = createMockComment()
      mockFetch.mockResolvedValue(comment)

      const input: CreateCommentInput = {
        content: 'Great test case',
        commentableType: 'TEST_CASE',
        commentableId: 'tc-10',
      }

      const { addComment } = createTestCaseLogic(mockFetch)
      await addComment(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/comments', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created comment on success', async () => {
      const comment = createMockComment({ content: 'Nice!' })
      mockFetch.mockResolvedValue(comment)

      const { addComment } = createTestCaseLogic(mockFetch)
      const result = await addComment({
        content: 'Nice!',
        commentableType: 'TEST_CASE',
        commentableId: 'tc-10',
      })

      expect(result?.content).toBe('Nice!')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Unauthorized'))

      const { addComment } = createTestCaseLogic(mockFetch)
      const result = await addComment({
        content: 'Nope',
        commentableType: 'TEST_CASE',
        commentableId: 'tc-10',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteComment
  // -------------------------------------------------------------------------

  describe('deleteComment', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteComment } = createTestCaseLogic(mockFetch)
      await deleteComment('comment-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-1', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteComment } = createTestCaseLogic(mockFetch)
      const result = await deleteComment('comment-1')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteComment } = createTestCaseLogic(mockFetch)
      const result = await deleteComment('comment-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // getAttachments
  // -------------------------------------------------------------------------

  describe('getAttachments', () => {
    it('fetches from correct URL', async () => {
      mockFetch.mockResolvedValue([])

      const { getAttachments } = createTestCaseLogic(mockFetch)
      await getAttachments('tc-15')

      expect(mockFetch).toHaveBeenCalledWith('/api/test-cases/tc-15/attachments')
    })

    it('returns attachments on success', async () => {
      const attachments = [createMockAttachment(), createMockAttachment({ fileName: 'log.txt' })]
      mockFetch.mockResolvedValue(attachments)

      const { getAttachments } = createTestCaseLogic(mockFetch)
      const result = await getAttachments('tc-15')

      expect(result).toHaveLength(2)
    })

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'))

      const { getAttachments } = createTestCaseLogic(mockFetch)
      const result = await getAttachments('tc-15')

      expect(result).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createTestCaseLogic(mockFetch)
      expect(logic).toHaveProperty('getTestCases')
      expect(logic).toHaveProperty('getTestCase')
      expect(logic).toHaveProperty('createTestCase')
      expect(logic).toHaveProperty('updateTestCase')
      expect(logic).toHaveProperty('deleteTestCase')
      expect(logic).toHaveProperty('toggleDebugFlag')
      expect(logic).toHaveProperty('getComments')
      expect(logic).toHaveProperty('addComment')
      expect(logic).toHaveProperty('deleteComment')
      expect(logic).toHaveProperty('getAttachments')
    })

    it('all methods are functions', () => {
      const logic = createTestCaseLogic(mockFetch)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
