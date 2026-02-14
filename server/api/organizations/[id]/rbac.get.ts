import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID is required' })
  }

  // Check user is ORGANIZATION_MANAGER
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: user.id,
      },
    },
  })

  if (!membership || membership.role !== 'ORGANIZATION_MANAGER') {
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can view RBAC permissions' })
  }

  const permissions = await prisma.rbacPermission.findMany({
    where: { organizationId: orgId },
    orderBy: [{ role: 'asc' }, { objectType: 'asc' }, { action: 'asc' }],
  })

  return permissions
})
