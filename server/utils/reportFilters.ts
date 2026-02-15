import type { Prisma } from '@prisma/client'

interface ReportFilterParams {
  projectId: string
  timeRange?: string
  dateFrom?: string
  dateTo?: string
  scope?: string
  scopeId?: string
}

export function buildReportWhereClause(params: ReportFilterParams): Prisma.TestRunWhereInput {
  const testCaseFilter: Prisma.TestCaseWhereInput = { projectId: params.projectId }

  const where: Prisma.TestRunWhereInput = {
    testCase: testCaseFilter,
    status: { notIn: ['NOT_RUN', 'IN_PROGRESS'] },
  }

  // Time range filter
  const now = new Date()
  if (params.timeRange === '24h') {
    where.executedAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
  } else if (params.timeRange === '3d') {
    where.executedAt = { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }
  } else if (params.timeRange === '7d') {
    where.executedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
  } else if (params.timeRange === 'custom' && params.dateFrom) {
    const dateFilter: Prisma.DateTimeFilter = { gte: new Date(params.dateFrom) }
    if (params.dateTo) {
      dateFilter.lte = new Date(params.dateTo)
    }
    where.executedAt = dateFilter
  }
  // 'all' = no date filter

  // Scope filter
  if (params.scope === 'test-plan' && params.scopeId) {
    testCaseFilter.testPlans = { some: { testPlanId: params.scopeId } }
  } else if (params.scope === 'test-suite' && params.scopeId) {
    testCaseFilter.testSuites = { some: { testSuiteId: params.scopeId } }
  }

  return where
}
