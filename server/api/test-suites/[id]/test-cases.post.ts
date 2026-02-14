import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const linkTestCaseSchema = z.object({
  testCaseId: z.string().min(1, 'Test Case ID is required'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const suiteId = getRouterParam(event, 'id')

  if (!suiteId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Suite ID is required' })
  }

  const testSuite = await prisma.testSuite.findUnique({
    where: { id: suiteId },
    include: { project: true },
  })

  if (!testSuite) {
    throw createError({ statusCode: 404, statusMessage: 'Test suite not found' })
  }

  // Verify access
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: testSuite.project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this test suite' })
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

  if (!testCase || testCase.projectId !== testSuite.projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Test case not found or belongs to a different project' })
  }

  // Check if already linked
  const existingLink = await prisma.testSuiteCase.findUnique({
    where: {
      testSuiteId_testCaseId: {
        testSuiteId: suiteId,
        testCaseId,
      },
    },
  })

  if (existingLink) {
    throw createError({ statusCode: 409, statusMessage: 'Test case is already linked to this test suite' })
  }

  const link = await prisma.testSuiteCase.create({
    data: {
      testSuiteId: suiteId,
      testCaseId,
    },
  })

  await logActivity(user.id, 'CREATED', 'TestSuiteCase', link.id, { testSuiteId: suiteId, testCaseId })

  setResponseStatus(event, 201)
  return link
})
