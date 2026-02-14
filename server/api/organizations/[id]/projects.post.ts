import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID is required' })
  }

  // Check user is ORGANIZATION_MANAGER or PROJECT_MANAGER
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: user.id,
      },
    },
  })

  if (!membership || !['ORGANIZATION_MANAGER', 'PROJECT_MANAGER'].includes(membership.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Insufficient permissions to create projects' })
  }

  const body = await readBody(event)
  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  // Check project limit
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { _count: { select: { projects: true } } },
  })

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  if (org._count.projects >= org.maxProjects) {
    throw createError({
      statusCode: 400,
      statusMessage: `Organization has reached the maximum of ${org.maxProjects} projects`,
    })
  }

  const { name, description } = result.data

  // Create project and add creator as member
  const project = await prisma.project.create({
    data: {
      name,
      description,
      organizationId: orgId,
      members: {
        create: {
          userId: user.id,
        },
      },
    },
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

  await logActivity(user.id, 'CREATED', 'Project', project.id, { name, description })

  setResponseStatus(event, 201)
  return project
})
