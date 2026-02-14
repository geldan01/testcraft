import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const updateTestSuiteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  suiteType: z.string().min(1).max(50).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const suiteId = getRouterParam(event, 'id')

  if (!suiteId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Suite ID is required' })
  }

  const testSuite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    include: { project: true },
  })

  if (!testSuite) {
    throw createError({ statusCode: 404, statusMessage: 'Test suite not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testSuite.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test suite' })
  }

  const body = await readBody(event)
  const result = updateTestSuiteSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const updated = await prisma.testSuite.update({
    where: { id: suiteId },
    data: result.data,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { testCases: true },
      },
    },
  })

  await logActivity(user.id, 'UPDATED', 'TestSuite', suiteId, result.data)

  return updated
})
