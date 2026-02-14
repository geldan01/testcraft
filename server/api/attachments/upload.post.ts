import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import {
  getStorageProvider,
  getMaxFileSizeBytes,
  isAllowedMimeType,
  getAllowedMimeTypes,
} from '~/server/utils/storage'

const uploadQuerySchema = z
  .object({
    testRunId: z.string().min(1).optional(),
    testCaseId: z.string().min(1).optional(),
  })
  .refine((data) => data.testRunId || data.testCaseId, {
    message: 'Either testRunId or testCaseId is required',
  })
  .refine((data) => !(data.testRunId && data.testCaseId), {
    message: 'Provide either testRunId or testCaseId, not both',
  })

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // Validate query params
  const query = getQuery(event)
  const queryResult = uploadQuerySchema.safeParse(query)
  if (!queryResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: queryResult.error.issues[0].message,
    })
  }

  const { testRunId, testCaseId } = queryResult.data

  // Verify org membership through the entity chain
  if (testRunId) {
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
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
  } else if (testCaseId) {
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
  }

  // Read multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const filePart = formData.find((part) => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file found in upload. Use field name "file".' })
  }

  const buffer = filePart.data
  const fileName = filePart.filename
  const mimeType = filePart.type || 'application/octet-stream'

  // Validate file size
  const maxSize = getMaxFileSizeBytes()
  if (buffer.length > maxSize) {
    throw createError({
      statusCode: 413,
      statusMessage: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    })
  }

  // Validate MIME type
  if (!isAllowedMimeType(mimeType)) {
    throw createError({
      statusCode: 415,
      statusMessage: `File type "${mimeType}" is not allowed. Allowed types: ${getAllowedMimeTypes().join(', ')}`,
    })
  }

  // Upload file to storage
  const fileUrl = await getStorageProvider().upload(buffer, fileName, mimeType)

  // Create attachment record
  const attachment = await prisma.attachment.create({
    data: {
      fileUrl,
      fileName,
      fileType: mimeType,
      fileSize: buffer.length,
      uploadedById: user.id,
      testRunId: testRunId ?? null,
      testCaseId: testCaseId ?? null,
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  await logActivity(user.id, 'CREATED', 'Attachment', attachment.id, {
    fileName,
    fileType: mimeType,
    fileSize: buffer.length,
    testRunId: testRunId ?? undefined,
    testCaseId: testCaseId ?? undefined,
  })

  setResponseStatus(event, 201)
  return attachment
})
