import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit

  // Scope activity logs to the current user's own actions only.
  // This prevents information disclosure across organizations.
  const where: Prisma.ActivityLogWhereInput = {
    userId: user.id,
  }

  if (query.objectType && typeof query.objectType === 'string') {
    where.objectType = query.objectType
  }

  if (query.objectId && typeof query.objectId === 'string') {
    where.objectId = query.objectId
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ])

  return {
    data: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
