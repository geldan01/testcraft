import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import { getStorageProvider } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const attachmentId = getRouterParam(event, 'id')

  if (!attachmentId) {
    throw createError({ statusCode: 400, statusMessage: 'Attachment ID is required' })
  }

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })

  if (!attachment) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  // Only the uploader can delete their attachment
  if (attachment.uploadedById !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the uploader can delete this attachment' })
  }

  // Delete file from storage
  await getStorageProvider().delete(attachment.fileUrl)

  // Delete attachment record
  await prisma.attachment.delete({
    where: { id: attachmentId },
  })

  await logActivity(user.id, 'DELETED', 'Attachment', attachmentId, {
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    testRunId: attachment.testRunId ?? undefined,
    testCaseId: attachment.testCaseId ?? undefined,
  })

  setResponseStatus(event, 200)
  return { message: 'Attachment deleted successfully' }
})
