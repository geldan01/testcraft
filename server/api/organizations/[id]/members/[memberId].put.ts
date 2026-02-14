import { z } from 'zod'
import { requireAuth, userSelectFields } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateRoleSchema = z.object({
  role: z.enum(['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER']),
})

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
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can update member roles' })
  }

  const body = await readBody(event)
  const result = updateRoleSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Verify the member exists in this org
  const targetMember = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: orgId },
  })

  if (!targetMember) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found' })
  }

  const updatedMember = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: result.data.role },
    include: {
      user: { select: userSelectFields },
    },
  })

  await logActivity(user.id, 'UPDATED', 'OrganizationMember', memberId, { role: result.data.role })

  return updatedMember
})
