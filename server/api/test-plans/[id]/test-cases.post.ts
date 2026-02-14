import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const linkTestCaseSchema = z.object({
  testCaseId: z.string().min(1, 'Test Case ID is required'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const planId = getRouterParam(event, 'id')

  if (!planId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Plan ID is required' })
  }

  const testPlan = await prisma.testPlan.findUnique({
    where: { id: planId },
    include: { project: true },
  })

  if (!testPlan) {
    throw createError({ statusCode: 404, statusMessage: 'Test plan not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testPlan.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test plan' })
  }

  const body = await readBody(event)
  const result = linkTestCaseSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { testCaseId } = result.data

  // Verify test case exists and belongs to the same project
  const testCase = await prisma.testCase.findUnique({
    where: { id: testCaseId },
  })

  if (!testCase || testCase.projectId !== testPlan.projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Test case not found or belongs to a different project' })
  }

  // Check if already linked
  const existingLink = await prisma.testPlanCase.findUnique({
    where: {
      testPlanId_testCaseId: {
        testPlanId: planId,
        testCaseId,
      },
    },
  })

  if (existingLink) {
    throw createError({ statusCode: 409, statusMessage: 'Test case is already linked to this test plan' })
  }

  const link = await prisma.testPlanCase.create({
    data: {
      testPlanId: planId,
      testCaseId,
    },
  })

  await logActivity(user.id, 'CREATED', 'TestPlanCase', link.id, { testPlanId: planId, testCaseId })

  setResponseStatus(event, 201)
  return link
})
