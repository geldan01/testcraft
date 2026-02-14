import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import { updateTestCaseLastRun } from '~/server/utils/testRunHelper'

const updateTestRunSchema = z.object({
  status: z.enum(['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']).optional(),
  duration: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional().nullable(),
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

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testRun.testCase.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test run' })
  }

  const body = await readBody(event)
  const result = updateTestRunSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const updateData = result.data

  const updatedRun = await prisma.testRun.update({
    where: { id: runId },
    data: updateData,
    include: {
      testCase: {
        select: { id: true, name: true, testType: true, projectId: true },
      },
      executedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // Recalculate test case lastRunStatus based on the most recent run
  await updateTestCaseLastRun(updatedRun.testCase.id)

  await logActivity(user.id, 'UPDATED', 'TestRun', runId, updateData)

  return updatedRun
})
