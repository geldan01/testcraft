import type {
  TestRun,
  CreateTestRunInput,
  UpdateTestRunInput,
  StartTestRunInput,
  CompleteTestRunInput,
  TestRunFilters,
  PaginatedResponse,
} from '~/types'

export const useTestRun = () => {
  const toast = useToast()

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

      return await $fetch<PaginatedResponse<TestRun>>(url)
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
  }

  async function getRunsForTestCase(caseId: string): Promise<TestRun[]> {
    try {
      return await $fetch<TestRun[]>(`/api/test-cases/${caseId}/runs`)
    } catch {
      return []
    }
  }

  async function getRun(runId: string): Promise<TestRun | null> {
    try {
      return await $fetch<TestRun>(`/api/test-runs/${runId}`)
    } catch {
      return null
    }
  }

  async function startRun(data: CreateTestRunInput): Promise<TestRun | null> {
    try {
      return await $fetch<TestRun>('/api/test-runs', {
        method: 'POST',
        body: data,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to start run'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function completeRun(
    runId: string,
    data: UpdateTestRunInput,
  ): Promise<TestRun | null> {
    try {
      return await $fetch<TestRun>(`/api/test-runs/${runId}`, {
        method: 'PUT',
        body: data,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to complete run'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function deleteRun(runId: string): Promise<boolean> {
    try {
      await $fetch(`/api/test-runs/${runId}`, { method: 'DELETE' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete run'
      toast.add({ title: message, color: 'error' })
      return false
    }
  }

  async function startTestRun(input: StartTestRunInput): Promise<TestRun | null> {
    try {
      return await $fetch<TestRun>('/api/test-runs/start', {
        method: 'POST',
        body: input,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to start test run'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function completeTestRun(
    runId: string,
    input: CompleteTestRunInput,
  ): Promise<TestRun | null> {
    try {
      return await $fetch<TestRun>(`/api/test-runs/${runId}/complete`, {
        method: 'PUT',
        body: input,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to complete test run'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function getEnvironments(projectId: string): Promise<string[]> {
    try {
      return await $fetch<string[]>(`/api/projects/${projectId}/environments`)
    } catch {
      return []
    }
  }

  return {
    getRuns,
    getRunsForTestCase,
    getRun,
    startRun,
    completeRun,
    deleteRun,
    startTestRun,
    completeTestRun,
    getEnvironments,
  }
}
