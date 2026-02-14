import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

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

  await prisma.testPlan.delete({
    where: { id: planId },
  })

  await logActivity(user.id, 'DELETED', 'TestPlan', planId, { name: testPlan.name })

  return { message: 'Test plan deleted successfully' }
})
