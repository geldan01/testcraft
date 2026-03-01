import { z } from 'zod'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const result = querySchema.safeParse(query)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  const { page, limit, search } = result.data

  const where: Record<string, unknown> = {}
  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      include: {
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ])

  return {
    data: organizations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
})
