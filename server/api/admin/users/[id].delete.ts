import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  // Safety: cannot delete yourself
  if (userId === admin.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await prisma.user.delete({ where: { id: userId } })

  await logActivity(admin.id, 'DELETED', 'User', userId, { email: targetUser.email, name: targetUser.name })

  return { message: 'User deleted successfully' }
})
