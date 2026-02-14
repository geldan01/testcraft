import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateTestPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  scope: z.string().max(2000).optional().nullable(),
  schedule: z.string().max(500).optional().nullable(),
  testTypes: z.string().max(500).optional().nullable(),
  entryCriteria: z.string().max(2000).optional().nullable(),
  exitCriteria: z.string().max(2000).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const planId = getRouterParam(event, 'id')

  if (!planId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Plan ID is required' })
  }

  const testPlan = await prisma.testPlan.findUnique({
    where: { id: planId },
    include: { project: true },
  })

  if (!testPlan) {
    throw createError({ statusCode: 404, statusMessage: 'Test plan not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testPlan.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test plan' })
  }

  const body = await readBody(event)
  const result = updateTestPlanSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const updated = await prisma.testPlan.update({
    where: { id: planId },
    data: result.data,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { testCases: true },
      },
    },
  })

  await logActivity(user.id, 'UPDATED', 'TestPlan', planId, result.data)

  return updated
})
