import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  // Verify project exists and user has access
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
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.TestRunWhereInput = {
    testCase: {
      projectId,
    },
  }

  if (query.status && typeof query.status === 'string') {
    where.status = query.status as Prisma.EnumTestRunStatusFilter['equals']
  }

  if (query.environment && typeof query.environment === 'string') {
    where.environment = { contains: query.environment, mode: 'insensitive' }
  }

  if (query.dateFrom && typeof query.dateFrom === 'string') {
    where.executedAt = {
      ...(where.executedAt as Prisma.DateTimeFilter || {}),
      gte: new Date(query.dateFrom),
    }
  }

  if (query.dateTo && typeof query.dateTo === 'string') {
    where.executedAt = {
      ...(where.executedAt as Prisma.DateTimeFilter || {}),
      lte: new Date(query.dateTo),
    }
  }

  const [testRuns, total] = await Promise.all([
    prisma.testRun.findMany({
      where,
      include: {
        testCase: {
          select: { id: true, name: true, testType: true, projectId: true },
        },
        executedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { executedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.testRun.count({ where }),
  ])

  return {
    data: testRuns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
