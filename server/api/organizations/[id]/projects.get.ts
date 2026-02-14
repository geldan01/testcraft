import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID is required' })
  }

  // Verify membership
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You are not a member of this organization' })
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: {
          testCases: true,
          testPlans: true,
          testSuites: true,
          members: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return projects
})
