import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import { updateTestCaseLastRun } from '~/server/utils/testRunHelper'

const completeTestRunSchema = z.object({
  status: z.enum(['PASS', 'FAIL', 'BLOCKED', 'SKIPPED'], {
    message: 'Status must be one of: PASS, FAIL, BLOCKED, SKIPPED',
  }),
  notes: z.string().max(5000).optional(),
  duration: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const runId = getRouterParam(event, 'id')

  if (!runId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Run ID is required' })
  }

  const testRun = await prisma.testRun.findUnique({
    where: { id: runId },
    include: {
      testCase: {
        include: { project: true },
      },
    },
  })

  if (!testRun) {
    throw createError({ statusCode: 404, statusMessage: 'Test run not found' })
  }

  // Verify the test run belongs to the current user
  if (testRun.executedById !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only complete your own test runs' })
  }

  // Verify the test run is currently in progress
  if (testRun.status !== 'IN_PROGRESS') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only test runs with IN_PROGRESS status can be completed',
    })
  }

  const body = await readBody(event)
  const result = completeTestRunSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { status, notes, duration } = result.data

  // Update the test run with final status
  const updatedRun = await prisma.testRun.update({
    where: { id: runId },
    data: {
      status,
      notes,
      duration,
    },
    include: {
      testCase: {
        select: { id: true, name: true, testType: true, projectId: true },
      },
      executedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // Sync test case lastRunStatus with latest run
  await updateTestCaseLastRun(testRun.testCaseId)

  await logActivity(user.id, 'UPDATED', 'TestRun', runId, {
    name: updatedRun.testCase.name,
    status,
    notes,
    duration,
    action: 'completed',
  })

  return updatedRun
})
