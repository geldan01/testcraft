import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
  commentableType: z.enum(['TEST_CASE', 'TEST_RUN']),
  commentableId: z.string().min(1, 'Commentable ID is required'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = createCommentSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { content, commentableType, commentableId } = result.data

  // Verify the commentable entity exists and user has access
  if (commentableType === 'TEST_CASE') {
    const testCase = await prisma.testCase.findUnique({
      where: { id: commentableId },
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
  } else if (commentableType === 'TEST_RUN') {
    const testRun = await prisma.testRun.findUnique({
      where: { id: commentableId },
      include: {
        testCase: {
          include: { project: true },
        },
      },
    })

    if (!testRun) {
      throw createError({ statusCode: 404, statusMessage: 'Test run not found' })
    }

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
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      commentableType,
      commentableId,
      authorId: user.id,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  await logActivity(user.id, 'CREATED', 'Comment', comment.id, {
    commentableType,
    commentableId,
  })

  setResponseStatus(event, 201)
  return comment
})
