import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  // Check permissions
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership || !['ORGANIZATION_MANAGER', 'PROJECT_MANAGER'].includes(membership.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions to update this project' })
  }

  const body = await readBody(event)
  const result = updateProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: result.data,
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
  })

  await logActivity(user.id, 'UPDATED', 'Project', projectId, result.data)

  return updatedProject
})
