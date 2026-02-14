import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' })
  }

  // Get all stats in parallel
  const [totalTestCases, debugFlagged, passCount, totalRunCount, recentRuns] = await Promise.all([
    // Total test cases
    prisma.testCase.count({ where: { projectId } }),

    // Debug flagged count
    prisma.testCase.count({ where: { projectId, debugFlag: true } }),

    // Pass count (test cases with lastRunStatus = PASS)
    prisma.testCase.count({
      where: { projectId, lastRunStatus: 'PASS' },
    }),

    // Total test cases that have been run at least once
    prisma.testCase.count({
      where: { projectId, lastRunStatus: { not: 'NOT_RUN' } },
    }),

    // Recent runs (last 7 days)
    prisma.testRun.count({
      where: {
        testCase: { projectId },
        executedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  const passRate = totalRunCount > 0
    ? Math.round((passCount / totalRunCount) * 100)
    : 0

  return {
    totalTestCases,
    passRate,
    recentRuns,
    debugFlagged,
  }
})
