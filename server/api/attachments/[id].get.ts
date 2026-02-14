import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const attachmentId = getRouterParam(event, 'id')

  if (!attachmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Attachment ID is required' })
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  if (!attachment) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  // Verify org membership through entity chain
  if (attachment.testRunId) {
    const testRun = await prisma.testRun.findUnique({
      where: { id: attachment.testRunId },
      include: {
        testCase: {
          include: { project: true },
        },
      },
    })

    if (!testRun) {
      throw createError({ statusCode: 404, statusMessage: 'Associated test run not found' })
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
      throw createError({ statusCode: 403, statusMessage: 'You do not have access to this attachment' })
    }
  } else if (attachment.testCaseId) {
    const testCase = await prisma.testCase.findUnique({
      where: { id: attachment.testCaseId },
      include: { project: true },
    })

    if (!testCase) {
      throw createError({ statusCode: 404, statusMessage: 'Associated test case not found' })
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
      throw createError({ statusCode: 403, statusMessage: 'You do not have access to this attachment' })
    }
  }

  return attachment
})
