import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxProjects: z.number().int().min(1).optional(),
  maxTestCasesPerProject: z.number().int().min(1).optional(),
})

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
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can update the organization' })
  }

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const organization = await prisma.organization.update({
    where: { id: orgId },
    data: result.data,
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  })

  await logActivity(user.id, 'UPDATED', 'Organization', orgId, result.data)

  return organization
})
