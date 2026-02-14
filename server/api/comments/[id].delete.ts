import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const commentId = getRouterParam(event, 'id')

  if (!commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Comment ID is required' })
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }

  // Only the author or an admin can delete a comment
  if (comment.authorId !== user.id && !user.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'You can only delete your own comments' })
  }

  await prisma.comment.delete({
    where: { id: commentId },
  })

  await logActivity(user.id, 'DELETED', 'Comment', commentId)

  return { message: 'Comment deleted successfully' }
})
