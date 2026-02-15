import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { getStorageProvider } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const attachmentId = getRouterParam(event, 'id')

  if (!attachmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Attachment ID is required' })
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      testRun: {
        include: { testCase: { include: { project: true } } },
      },
      testCase: {
        include: { project: true },
      },
    },
  })

  if (!attachment) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  // Verify org membership through the parent entity
  const organizationId = attachment.testRun
    ? attachment.testRun.testCase.project.organizationId
    : attachment.testCase?.project.organizationId

  if (!organizationId) {
    throw createError({ statusCode: 404, statusMessage: 'Associated project not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this attachment' })
  }

  // Read and serve the file
  const storage = getStorageProvider()

  let buffer: Buffer
  try {
    buffer = await storage.read(attachment.fileUrl)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  setResponseHeaders(event, {
    'Content-Type': attachment.fileType,
    'Content-Disposition': `inline; filename="${attachment.fileName}"`,
    'Content-Length': String(buffer.length),
    'Cache-Control': 'private, max-age=3600',
  })

  return buffer
})
