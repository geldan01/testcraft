import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const testStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  action: z.string().min(1),
  data: z.string(),
  expectedResult: z.string(),
})

const updateTestCaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  preconditions: z.array(z.string()).optional().nullable(),
  testType: z.enum(['STEP_BASED', 'GHERKIN']).optional(),
  steps: z.array(testStepSchema).optional().nullable(),
  gherkinSyntax: z.string().max(10000).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const caseId = getRouterParam(event, 'id')

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: 'Test Case ID is required' })
  }

  const testCase = await prisma.testCase.findUnique({
    where: { id: caseId },
    include: { project: true },
  })

  if (!testCase) {
    throw createError({ statusCode: 404, statusMessage: 'Test case not found' })
  }

  // Verify access and RBAC permission
  await requireRbacPermission(user.id, testCase.project.organizationId, 'TEST_CASE', 'EDIT')

  const body = await readBody(event)
  const result = updateTestCaseSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const data = {
    ...result.data,
    preconditions: result.data.preconditions === null ? Prisma.JsonNull : result.data.preconditions,
    steps: result.data.steps === null ? Prisma.JsonNull : result.data.steps,
  }

  const updated = await prisma.testCase.update({
    where: { id: caseId },
    data,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      debugFlaggedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  await logActivity(user.id, 'UPDATED', 'TestCase', caseId, { ...result.data, name: updated.name })

  return updated
})
