import type {
  TestPlan,
  CreateTestPlanInput,
  UpdateTestPlanInput,
  PaginatedResponse,
} from '~/types'

export const useTestPlan = () => {
  async function getTestPlans(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TestPlan>> {
    try {
      return await $fetch<PaginatedResponse<TestPlan>>(
        `/api/projects/${projectId}/test-plans?page=${page}&limit=${limit}`,
      )
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getTestPlan(planId: string): Promise<TestPlan | null> {
    try {
      return await $fetch<TestPlan>(`/api/test-plans/${planId}`)
    } catch {
      return null
    }
  }

  async function createTestPlan(data: CreateTestPlanInput): Promise<TestPlan | null> {
    try {
      return await $fetch<TestPlan>('/api/test-plans', {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function updateTestPlan(planId: string, data: UpdateTestPlanInput): Promise<TestPlan | null> {
    try {
      return await $fetch<TestPlan>(`/api/test-plans/${planId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteTestPlan(planId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-plans/${planId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  async function linkTestCase(planId: string, caseId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-plans/${planId}/test-cases`, {
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
      await $fetch(`/api/test-plans/${planId}/test-cases/${caseId}`, {
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
