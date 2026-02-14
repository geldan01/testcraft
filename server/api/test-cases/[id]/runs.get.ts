import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const caseId = getRouterParam(event, 'id')

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Case ID is required' })
  }

  // Verify test case exists and user has access
  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: { project: true },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

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

  const runs = await prisma.testRun.findMany({
    where: { testCaseId: caseId },
    include: {
      executedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { executedAt: 'desc' },
  })

  return runs
})
