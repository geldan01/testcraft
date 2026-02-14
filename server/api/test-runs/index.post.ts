import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createTestRunSchema = z.object({
  testCaseId: z.string().min(1, 'Test Case ID is required'),
  environment: z.string().min(1, 'Environment is required').max(100),
  status: z.enum(['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
  duration: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = createTestRunSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { testCaseId, environment, status, duration, notes } = result.data

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

  // Create test run and update test case in a transaction
  const [testRun] = await prisma.$transaction([
    prisma.testRun.create({
      data: {
        testCaseId,
        executedById: user.id,
        executedAt: now,
        environment,
        status,
        duration,
        notes,
      },
      include: {
        testCase: {
          select: { id: true, name: true, testType: true, projectId: true },
        },
        executedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    }),
    prisma.testCase.update({
      where: { id: testCaseId },
      data: {
        lastRunStatus: status,
        lastRunAt: now,
      },
    }),
  ])

  await logActivity(user.id, 'CREATED', 'TestRun', testRun.id, {
    testCaseId,
    status,
    environment,
  })

  setResponseStatus(event, 201)
  return testRun
})
