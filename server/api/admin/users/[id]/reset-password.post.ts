import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit'),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const body = await readBody(event)
  const result = resetPasswordSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  const passwordHash = await bcrypt.hash(result.data.newPassword, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  await logActivity(admin.id, 'UPDATED', 'User', userId, { action: 'password_reset' })

  return { message: 'Password reset successfully' }
})
