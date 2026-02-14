import type {
  TestSuite,
  CreateTestSuiteInput,
  UpdateTestSuiteInput,
  PaginatedResponse,
} from '~/types'

export const useTestSuite = () => {
  async function getTestSuites(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TestSuite>> {
    try {
      return await $fetch<PaginatedResponse<TestSuite>>(
        `/api/projects/${projectId}/test-suites?page=${page}&limit=${limit}`,
      )
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestSuite(suiteId: string): Promise<TestSuite | null> {
    try {
      return await $fetch<TestSuite>(`/api/test-suites/${suiteId}`)
    } catch {
      return null
    }
  }

  async function createTestSuite(data: CreateTestSuiteInput): Promise<TestSuite | null> {
    try {
      return await $fetch<TestSuite>('/api/test-suites', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestSuite(suiteId: string, data: UpdateTestSuiteInput): Promise<TestSuite | null> {
    try {
      return await $fetch<TestSuite>(`/api/test-suites/${suiteId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestSuite(suiteId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-suites/${suiteId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function linkTestCase(suiteId: string, caseId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-suites/${suiteId}/test-cases`, {
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
      await $fetch(`/api/test-suites/${suiteId}/test-cases/${caseId}`, {
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
