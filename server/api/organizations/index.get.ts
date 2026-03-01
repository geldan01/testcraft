import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Super-admins see all organizations; regular users see only their own
  const where = user.isAdmin
    ? {}
    : { members: { some: { userId: user.id } } }

  const organizations = await prisma.organization.findMany({
    where,
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return organizations
})
