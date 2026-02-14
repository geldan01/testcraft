import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

const DEFAULT_ENVIRONMENTS = ['development', 'staging', 'production', 'qa']

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

  // Query distinct environment values from test runs for this project's test cases
  const testRuns = await prisma.testRun.findMany({
    where: {
      testCase: {
        projectId,
      },
    },
    select: {
      environment: true,
    },
    distinct: ['environment'],
  })

  const usedEnvironments = testRuns.map((run) => run.environment)

  // Merge with defaults, avoiding duplicates
  const allEnvironments = new Set([...DEFAULT_ENVIRONMENTS, ...usedEnvironments])

  // Return sorted array
  const environments = Array.from(allEnvironments).sort()

  return { environments }
})
