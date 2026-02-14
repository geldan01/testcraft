import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updatePermissionSchema = z.object({
  allowed: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')
  const permissionId = getRouterParam(event, 'permissionId')

  if (!orgId || !permissionId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID and Permission ID are required' })
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
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can update RBAC permissions' })
  }

  const body = await readBody(event)
  const result = updatePermissionSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Verify permission belongs to this org
  const permission = await prisma.rbacPermission.findFirst({
    where: { id: permissionId, organizationId: orgId },
  })

  if (!permission) {
    throw createError({ statusCode: 404, statusMessage: 'Permission not found' })
  }

  const updated = await prisma.rbacPermission.update({
    where: { id: permissionId },
    data: { allowed: result.data.allowed },
  })

  await logActivity(user.id, 'UPDATED', 'RbacPermission', permissionId, {
    allowed: result.data.allowed,
  })

  return updated
})
