import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

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

  await prisma.testSuite.delete({
    where: { id: suiteId },
  })

  await logActivity(user.id, 'DELETED', 'TestSuite', suiteId, { name: testSuite.name })

  return { message: 'Test suite deleted successfully' }
})
