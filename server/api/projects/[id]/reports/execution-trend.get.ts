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

  const runs = await prisma.testRun.findMany({
    where,
    select: { executedAt: true, status: true },
    orderBy: { executedAt: 'asc' },
  })

  // Determine grouping interval: by week if span > 90 days, else by day
  let groupByWeek = false
  if (runs.length >= 2) {
    const first = runs[0].executedAt.getTime()
    const last = runs[runs.length - 1].executedAt.getTime()
    groupByWeek = (last - first) > 90 * 24 * 60 * 60 * 1000
  }

  // Group runs by date bucket
  const buckets = new Map<string, { totalExecuted: number; passCount: number; failCount: number }>()

  for (const run of runs) {
    let key: string
    if (groupByWeek) {
      // Group by ISO week start (Monday)
      const d = new Date(run.executedAt)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      const monday = new Date(d)
      monday.setDate(diff)
      key = monday.toISOString().slice(0, 10)
    } else {
      key = run.executedAt.toISOString().slice(0, 10)
    }

    const bucket = buckets.get(key) ?? { totalExecuted: 0, passCount: 0, failCount: 0 }
    bucket.totalExecuted++
    if (run.status === 'PASS') bucket.passCount++
    if (run.status === 'FAIL') bucket.failCount++
    buckets.set(key, bucket)
  }

  const trend = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      totalExecuted: data.totalExecuted,
      passCount: data.passCount,
      failCount: data.failCount,
      passRate: data.totalExecuted > 0
        ? Math.round((data.passCount / data.totalExecuted) * 100)
        : 0,
    }))

  return { trend }
})
