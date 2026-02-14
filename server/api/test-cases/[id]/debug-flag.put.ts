import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const caseId = getRouterParam(event, 'id')

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Case ID is required' })
  }

  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: { project: true },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testCase.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test case' })
  }

  // Toggle debug flag
  const newDebugFlag = !testCase.debugFlag

  const updated = await prisma.testCase.update({
    where: { id: caseId },
    data: {
      debugFlag: newDebugFlag,
      debugFlaggedAt: newDebugFlag ? new Date() : null,
      debugFlaggedById: newDebugFlag ? user.id : null,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      debugFlaggedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  await logActivity(user.id, 'UPDATED', 'TestCase', caseId, {
    debugFlag: newDebugFlag,
  })

  return updated
})
