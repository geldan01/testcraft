import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { buildReportWhereClause } from '~/server/utils/reportFilters'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' })
  }

  const query = getQuery(event)
  const where = buildReportWhereClause({
    projectId,
    timeRange: query.timeRange as string | undefined,
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    scope: query.scope as string | undefined,
    scopeId: query.scopeId as string | undefined,
  })

  const groups = await prisma.testRun.groupBy({
    by: ['environment', 'status'],
    _count: { id: true },
    where,
  })

  // Aggregate per environment
  const envMap = new Map<string, { totalRuns: number; passCount: number; failCount: number }>()

  for (const g of groups) {
    const env = g.environment
    const data = envMap.get(env) ?? { totalRuns: 0, passCount: 0, failCount: 0 }
    data.totalRuns += g._count.id
    if (g.status === 'PASS') data.passCount += g._count.id
    if (g.status === 'FAIL') data.failCount += g._count.id
    envMap.set(env, data)
  }

  const environments = Array.from(envMap.entries())
    .map(([environment, data]) => ({
      environment,
      totalRuns: data.totalRuns,
      passCount: data.passCount,
      failCount: data.failCount,
      passRate: data.totalRuns > 0
        ? Math.round((data.passCount / data.totalRuns) * 100)
        : 0,
    }))
    .sort((a, b) => a.environment.localeCompare(b.environment))

  return { environments }
})
