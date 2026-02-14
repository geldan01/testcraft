import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import { updateTestCaseLastRun } from '~/server/utils/testRunHelper'

const startTestRunSchema = z.object({
  testCaseId: z.string().min(1, 'Test Case ID is required'),
  environment: z.string().min(1, 'Environment is required').max(100),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = startTestRunSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { testCaseId } = result.data
  const environment = result.data.environment.trim().toLowerCase()

  // Verify test case exists and user has access
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
    include: { project: true },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testCase.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test case' })
  }

  const now = new Date()

  // Create test run with IN_PROGRESS status
  const testRun = await prisma.testRun.create({
    data: {
      testCaseId,
      executedById: user.id,
      executedAt: now,
      environment,
      status: 'IN_PROGRESS',
    },
    include: {
      testCase: {
        select: {
          id: true,
          name: true,
          description: true,
          testType: true,
          projectId: true,
          steps: true,
          gherkinSyntax: true,
          preconditions: true,
        },
      },
      executedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // Update test case status to reflect the in-progress run
  await updateTestCaseLastRun(testCaseId)

  await logActivity(user.id, 'CREATED', 'TestRun', testRun.id, {
    testCaseId,
    status: 'IN_PROGRESS',
    environment,
    action: 'started',
  })

  setResponseStatus(event, 201)
  return testRun
})
