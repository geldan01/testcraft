import { z } from 'zod'
import { requireAdmin, userSelectFields } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  isAdmin: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  // Safety: cannot modify yourself
  if (userId === admin.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot modify your own account via admin panel' })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const body = await readBody(event)
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: result.data,
    select: userSelectFields,
  })

  await logActivity(admin.id, 'UPDATED', 'User', userId, result.data)

  return updated
})
