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

  // Build where clause with filters
  const where: Prisma.TestCaseWhereInput = { projectId }

  const validStatuses = ['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']
  if (query.status && typeof query.status === 'string') {
    if (!validStatuses.includes(query.status)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}` })
    }
    where.lastRunStatus = query.status as Prisma.EnumTestRunStatusFilter['equals']
  }

  const validTestTypes = ['STEP_BASED', 'GHERKIN']
  if (query.testType && typeof query.testType === 'string') {
    if (!validTestTypes.includes(query.testType)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid testType filter. Must be one of: ${validTestTypes.join(', ')}` })
    }
    where.testType = query.testType as Prisma.EnumTestTypeFilter['equals']
  }

  if (query.debugFlag !== undefined) {
    where.debugFlag = query.debugFlag === 'true'
  }

  if (query.search && typeof query.search === 'string') {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [testCases, total] = await Promise.all([
    prisma.testCase.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        debugFlaggedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.testCase.count({ where }),
  ])

  return {
    data: testCases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
