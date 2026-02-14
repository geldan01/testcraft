import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const suiteId = getRouterParam(event, 'id')

  if (!suiteId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Suite ID is required' })
  }

  const testSuite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      testCases: {
        include: {
          testCase: {
            include: {
              createdBy: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      _count: {
        select: { testCases: true },
      },
    },
  })

  if (!testSuite) {
    throw createError({ statusCode: 404, statusMessage: 'Test suite not found' })
  }

  // Verify access
  const project = await prisma.project.findUnique({
    where: { id: testSuite.projectId },
  })

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test suite' })
  }

  return testSuite
})
