import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const caseId = getRouterParam(event, 'id')

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Case ID is required' })
  }

  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      debugFlaggedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      testPlans: {
        include: {
          testPlan: {
            select: { id: true, name: true },
          },
        },
      },
      testSuites: {
        include: {
          testSuite: {
            select: { id: true, name: true, suiteType: true },
          },
        },
      },
      testRuns: {
        orderBy: { executedAt: 'desc' },
        take: 10,
        include: {
          executedBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

  // Verify access
  const project = await prisma.project.findUnique({
    where: { id: testCase.projectId },
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
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test case' })
  }

  return testCase
})
