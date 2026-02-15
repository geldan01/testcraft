import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const caseId = getRouterParam(event, 'id')

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Case ID is required' })
  }

  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: { project: true },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

  // Verify access and RBAC permission
  await requireRbacPermission(user.id, testCase.project.organizationId, 'TEST_CASE', 'DELETE')

  await prisma.testCase.delete({
    where: { id: caseId },
  })

  await logActivity(user.id, 'DELETED', 'TestCase', caseId, { name: testCase.name })

  return { message: 'Test case deleted successfully' }
})
