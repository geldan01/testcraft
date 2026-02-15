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
    by: ['status'],
    _count: { id: true },
    where,
  })

  const total = groups.reduce((sum, g) => sum + g._count.id, 0)
  const breakdown = groups.map(g => ({
    status: g.status,
    count: g._count.id,
    percentage: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
  }))

  return { breakdown, total }
})
