import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const testStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  action: z.string().min(1),
  data: z.string().optional().default(''),
  expectedResult: z.string(),
})

const createTestCaseSchema = z.object({
  name: z.string().min(1, 'Test case name is required').max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  preconditions: z.array(z.string()).optional(),
  testType: z.enum(['STEP_BASED', 'GHERKIN']),
  steps: z.array(testStepSchema).optional(),
  gherkinSyntax: z.string().max(10000).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = createTestCaseSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { projectId, ...caseData } = result.data

  // Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: true,
      _count: { select: { testCases: true } },
    },
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

  // Check test case limit
  if (project._count.testCases >= project.organization.maxTestCasesPerProject) {
    throw createError({
      statusCode: 400,
      statusMessage: `Project has reached the maximum of ${project.organization.maxTestCasesPerProject} test cases`,
    })
  }

  const testCase = await prisma.testCase.create({
    data: {
      name: caseData.name,
      description: caseData.description,
      projectId,
      preconditions: caseData.preconditions ?? Prisma.JsonNull,
      testType: caseData.testType,
      steps: caseData.steps ?? Prisma.JsonNull,
      gherkinSyntax: caseData.gherkinSyntax,
      createdById: user.id,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  await logActivity(user.id, 'CREATED', 'TestCase', testCase.id, { name: caseData.name })

  setResponseStatus(event, 201)
  return testCase
})
