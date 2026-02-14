import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const testRunId = getRouterParam(event, 'id')

  if (!testRunId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Run ID is required' })
  }

  // Verify test run exists and user has org access
  const testRun = await prisma.testRun.findUnique({
    where: { id: testRunId },
    include: {
      testCase: {
        include: { project: true },
      },
    },
  })

  if (!testRun) {
    throw createError({ statusCode: 404, statusMessage: 'Test run not found' })
  }

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

  const attachments = await prisma.attachment.findMany({
    where: { testRunId },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return attachments
})
