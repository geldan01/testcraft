import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!orgId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID and Member ID are required' })
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
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can remove members' })
  }

  // Verify the member exists in this org
  const targetMember = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: orgId },
  })

  if (!targetMember) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  // Prevent removing yourself if you're the last ORGANIZATION_MANAGER
  if (targetMember.userId === user.id) {
    const managerCount = await prisma.organizationMember.count({
      where: {
        organizationId: orgId,
        role: 'ORGANIZATION_MANAGER',
      },
    })
    if (managerCount <= 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot remove the last organization manager',
      })
    }
  }

  await prisma.organizationMember.delete({
    where: { id: memberId },
  })

  await logActivity(user.id, 'DELETED', 'OrganizationMember', memberId)

  return { message: 'Member removed successfully' }
})
