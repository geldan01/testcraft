import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { userSelectFields } from '~/server/utils/auth'

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

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      members: {
        include: {
          user: { select: userSelectFields },
        },
        orderBy: { joinedAt: 'asc' },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
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
      },
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  })

  if (!organization) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  return organization
})
