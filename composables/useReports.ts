import type {
  ReportFilters,
  StatusBreakdownResponse,
  ExecutionTrendResponse,
  EnvironmentComparisonResponse,
  FlakyTestResponse,
  TopFailingTestResponse,
} from '~/types'

export const useReports = () => {
  const toast = useToast()

  function buildQueryParams(filters: ReportFilters): Record<string, string> {
    const params: Record<string, string> = {
      timeRange: filters.timeRange,
    }
    if (filters.timeRange === 'custom') {
      if (filters.dateFrom) params.dateFrom = filters.dateFrom
      if (filters.dateTo) params.dateTo = filters.dateTo
    }
    if (filters.scope !== 'global') {
      params.scope = filters.scope
      if (filters.scopeId) params.scopeId = filters.scopeId
    }
    return params
  }

  async function getStatusBreakdown(
    projectId: string,
    filters: ReportFilters,
  ): Promise<StatusBreakdownResponse | null> {
    try {
      return await $fetch<StatusBreakdownResponse>(
        `/api/projects/${projectId}/reports/status-breakdown`,
        { query: buildQueryParams(filters) },
      )
    } catch {
      toast.add({ title: 'Failed to load status breakdown', color: 'error' })
      return null
    }
  }

  async function getExecutionTrend(
    projectId: string,
    filters: ReportFilters,
  ): Promise<ExecutionTrendResponse | null> {
    try {
      return await $fetch<ExecutionTrendResponse>(
        `/api/projects/${projectId}/reports/execution-trend`,
        { query: buildQueryParams(filters) },
      )
    } catch {
      toast.add({ title: 'Failed to load execution trend', color: 'error' })
      return null
    }
  }

  async function getEnvironmentComparison(
    projectId: string,
    filters: ReportFilters,
  ): Promise<EnvironmentComparisonResponse | null> {
    try {
      return await $fetch<EnvironmentComparisonResponse>(
        `/api/projects/${projectId}/reports/environment-comparison`,
        { query: buildQueryParams(filters) },
      )
    } catch {
      toast.add({ title: 'Failed to load environment comparison', color: 'error' })
      return null
    }
  }

  async function getFlakyTests(
    projectId: string,
    filters: ReportFilters,
    limit = 10,
  ): Promise<FlakyTestResponse | null> {
    try {
      return await $fetch<FlakyTestResponse>(
        `/api/projects/${projectId}/reports/test-analysis`,
        { query: { ...buildQueryParams(filters), type: 'flaky', limit: String(limit) } },
      )
    } catch {
      toast.add({ title: 'Failed to load flaky tests', color: 'error' })
      return null
    }
  }

  async function getTopFailingTests(
    projectId: string,
    filters: ReportFilters,
    limit = 10,
  ): Promise<TopFailingTestResponse | null> {
    try {
      return await $fetch<TopFailingTestResponse>(
        `/api/projects/${projectId}/reports/test-analysis`,
        { query: { ...buildQueryParams(filters), type: 'top-failing', limit: String(limit) } },
      )
    } catch {
      toast.add({ title: 'Failed to load top failing tests', color: 'error' })
      return null
    }
  }

  return {
    getStatusBreakdown,
    getExecutionTrend,
    getEnvironmentComparison,
    getFlakyTests,
    getTopFailingTests,
  }
}
