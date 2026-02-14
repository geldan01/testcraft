import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const runId = getRouterParam(event, 'id')

  if (!runId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Run ID is required' })
  }

  const testRun = await prisma.testRun.findUnique({
    where: { id: runId },
    include: {
      testCase: {
        include: { project: true },
      },
    },
  })

  if (!testRun) {
    throw createError({ statusCode: 404, statusMessage: 'Test run not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testRun.testCase.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test run' })
  }

  await prisma.testRun.delete({
    where: { id: runId },
  })

  await logActivity(user.id, 'DELETED', 'TestRun', runId, {
    testCaseId: testRun.testCaseId,
    status: testRun.status,
  })

  return { message: 'Test run deleted successfully' }
})
