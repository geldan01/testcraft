import { requireAdmin, userSelectFields } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID is required' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelectFields,
      organizationMemberships: {
        include: {
          organization: {
            select: { id: true, name: true, createdAt: true },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
    },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return user
})
