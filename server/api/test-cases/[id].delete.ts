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

  await prisma.testCase.delete({
    where: { id: caseId },
  })

  await logActivity(user.id, 'DELETED', 'TestCase', caseId, { name: testCase.name })

  return { message: 'Test case deleted successfully' }
})
