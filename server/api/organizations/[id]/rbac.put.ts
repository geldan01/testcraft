import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const rbacUpdateSchema = z.array(
  z.object({
    role: z.enum(['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER']),
    objectType: z.enum(['TEST_SUITE', 'TEST_PLAN', 'TEST_CASE', 'TEST_RUN', 'REPORT']),
    action: z.enum(['READ', 'EDIT', 'DELETE']),
    allowed: z.boolean(),
  }),
)

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
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can update RBAC permissions' })
  }

  const body = await readBody(event)
  const result = rbacUpdateSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid RBAC permissions data',
    })
  }

  // Upsert each permission
  const updates = result.data.map((perm) =>
    prisma.rbacPermission.upsert({
      where: {
        organizationId_role_objectType_action: {
          organizationId: orgId,
          role: perm.role,
          objectType: perm.objectType,
          action: perm.action,
        },
      },
      update: { allowed: perm.allowed },
      create: {
        organizationId: orgId,
        role: perm.role,
        objectType: perm.objectType,
        action: perm.action,
        allowed: perm.allowed,
      },
    }),
  )

  await prisma.$transaction(updates)

  await logActivity(user.id, 'UPDATED', 'RbacPermission', orgId, {
    updatedPermissions: result.data.length,
  })

  // Return updated permissions
  const permissions = await prisma.rbacPermission.findMany({
    where: { organizationId: orgId },
    orderBy: [{ role: 'asc' }, { objectType: 'asc' }, { action: 'asc' }],
  })

  return permissions
})
