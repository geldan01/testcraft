import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const planId = getRouterParam(event, 'id')
  const caseId = getRouterParam(event, 'caseId')

  if (!planId || !caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Plan ID and Case ID are required' })
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

  const link = await prisma.testPlanCase.findUnique({
    where: {
      testPlanId_testCaseId: {
        testPlanId: planId,
        testCaseId: caseId,
      },
    },
  })

  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Test case is not linked to this test plan' })
  }

  await prisma.testPlanCase.delete({
    where: { id: link.id },
  })

  await logActivity(user.id, 'DELETED', 'TestPlanCase', link.id, { testPlanId: planId, testCaseId: caseId })

  return { message: 'Test case unlinked from test plan successfully' }
})
