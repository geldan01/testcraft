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

export const useTestCase = () => {
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

      return await $fetch<PaginatedResponse<TestCase>>(url)
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestCase(caseId: string): Promise<TestCase | null> {
    try {
      return await $fetch<TestCase>(`/api/test-cases/${caseId}`)
    } catch {
      return null
    }
  }

  async function createTestCase(data: CreateTestCaseInput): Promise<TestCase | null> {
    try {
      return await $fetch<TestCase>('/api/test-cases', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestCase(caseId: string, data: UpdateTestCaseInput): Promise<TestCase | null> {
    try {
      return await $fetch<TestCase>(`/api/test-cases/${caseId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestCase(caseId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-cases/${caseId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function toggleDebugFlag(caseId: string): Promise<TestCase | null> {
    try {
      return await $fetch<TestCase>(`/api/test-cases/${caseId}/debug-flag`, {
        method: 'PUT',
      })
    } catch {
      return null
    }
  }

  async function getComments(caseId: string): Promise<Comment[]> {
    try {
      return await $fetch<Comment[]>(`/api/test-cases/${caseId}/comments`)
    } catch {
      return []
    }
  }

  async function addComment(data: CreateCommentInput): Promise<Comment | null> {
    try {
      return await $fetch<Comment>('/api/comments', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteComment(commentId: string): Promise<boolean> {
    try {
      await $fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function getAttachments(caseId: string): Promise<Attachment[]> {
    try {
      return await $fetch<Attachment[]>(`/api/test-cases/${caseId}/attachments`)
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
