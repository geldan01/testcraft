import { z } from 'zod'
import { requireAdmin, userSelectFields } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_INVITATION']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const result = querySchema.safeParse(query)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  const { page, limit, search, status } = result.data

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        ...userSelectFields,
        _count: { select: { organizationMemberships: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
