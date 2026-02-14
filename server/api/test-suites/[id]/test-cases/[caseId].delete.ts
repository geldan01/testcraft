import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const suiteId = getRouterParam(event, 'id')
  const caseId = getRouterParam(event, 'caseId')

  if (!suiteId || !caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Suite ID and Case ID are required' })
  }

  const testSuite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    include: { project: true },
  })

  if (!testSuite) {
    throw createError({ statusCode: 404, statusMessage: 'Test suite not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testSuite.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test suite' })
  }

  const link = await prisma.testSuiteCase.findUnique({
    where: {
      testSuiteId_testCaseId: {
        testSuiteId: suiteId,
        testCaseId: caseId,
      },
    },
  })

  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Test case is not linked to this test suite' })
  }

  await prisma.testSuiteCase.delete({
    where: { id: link.id },
  })

  await logActivity(user.id, 'DELETED', 'TestSuiteCase', link.id, { testSuiteId: suiteId, testCaseId: caseId })

  return { message: 'Test case unlinked from test suite successfully' }
})
