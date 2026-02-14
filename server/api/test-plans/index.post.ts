import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createTestPlanSchema = z.object({
  name: z.string().min(1, 'Test plan name is required').max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  scope: z.string().max(2000).optional(),
  schedule: z.string().max(500).optional(),
  testTypes: z.string().max(500).optional(),
  entryCriteria: z.string().max(2000).optional(),
  exitCriteria: z.string().max(2000).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = createTestPlanSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { projectId, ...planData } = result.data

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' })
  }

  const testPlan = await prisma.testPlan.create({
    data: {
      ...planData,
      projectId,
      createdById: user.id,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { testCases: true },
      },
    },
  })

  await logActivity(user.id, 'CREATED', 'TestPlan', testPlan.id, { name: planData.name })

  setResponseStatus(event, 201)
  return testPlan
})
