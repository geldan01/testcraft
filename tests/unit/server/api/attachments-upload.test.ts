/**
 * Unit tests for server/api/attachments/upload.post.ts
 *
 * Tests the file upload endpoint which accepts multipart form data,
 * validates MIME type and file size, stores the file via the storage
 * provider, and creates an Attachment record in the database.
 *
 * Mocks: Prisma client, auth utility, activity logger, storage utility,
 * and H3 event utilities (readMultipartFormData, getQuery, createError,
 * setResponseStatus).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockTestRunFindUnique = vi.fn()
const mockTestCaseFindUnique = vi.fn()
const mockOrgMemberFindUnique = vi.fn()
const mockAttachmentCreate = vi.fn()

vi.mock('~/server/utils/db', () => ({
  prisma: {
    testRun: {
      findUnique: (...args: unknown[]) => mockTestRunFindUnique(...args),
    },
    testCase: {
      findUnique: (...args: unknown[]) => mockTestCaseFindUnique(...args),
    },
    organizationMember: {
      findUnique: (...args: unknown[]) => mockOrgMemberFindUnique(...args),
    },
    attachment: {
      create: (...args: unknown[]) => mockAttachmentCreate(...args),
    },
  },
}))

// ---------------------------------------------------------------------------
// Mock auth
// ---------------------------------------------------------------------------

const mockRequireAuth = vi.fn()

vi.mock('~/server/utils/auth', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}))

// ---------------------------------------------------------------------------
// Mock activity logger
// ---------------------------------------------------------------------------

const mockLogActivity = vi.fn()

vi.mock('~/server/utils/activity', () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}))

// ---------------------------------------------------------------------------
// Mock storage utility
// ---------------------------------------------------------------------------

const mockUpload = vi.fn()
const mockGetStorageProvider = vi.fn(() => ({
  upload: mockUpload,
  delete: vi.fn(),
  getFilePath: vi.fn(),
}))
const mockGetMaxFileSizeBytes = vi.fn()
const mockIsAllowedMimeType = vi.fn()
const mockGetAllowedMimeTypes = vi.fn()

vi.mock('~/server/utils/storage', () => ({
  getStorageProvider: () => mockGetStorageProvider(),
  getMaxFileSizeBytes: () => mockGetMaxFileSizeBytes(),
  isAllowedMimeType: (...args: unknown[]) => mockIsAllowedMimeType(args[0]),
  getAllowedMimeTypes: () => mockGetAllowedMimeTypes(),
}))

// ---------------------------------------------------------------------------
// H3/Nuxt auto-imports are provided as globals by tests/unit/setup.ts.
// Override with test-specific mock fns.
// ---------------------------------------------------------------------------

const mockReadMultipartFormData = vi.fn()
const mockGetQuery = vi.fn()
const mockSetResponseStatus = vi.fn()

;(globalThis as Record<string, unknown>).readMultipartFormData = mockReadMultipartFormData
;(globalThis as Record<string, unknown>).getQuery = mockGetQuery
;(globalThis as Record<string, unknown>).setResponseStatus = mockSetResponseStatus

// ---------------------------------------------------------------------------
// Import handler (defineEventHandler is identity fn from setup.ts)
// ---------------------------------------------------------------------------

import handler from '~/server/api/attachments/upload.post'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-001',
  email: 'tester@example.com',
  name: 'Test User',
  isAdmin: false,
  status: 'ACTIVE',
}

const mockTestRun = {
  id: 'run-001',
  testCaseId: 'tc-001',
  testCase: {
    id: 'tc-001',
    project: {
      id: 'proj-001',
      organizationId: 'org-001',
    },
  },
}

const mockTestCase = {
  id: 'tc-001',
  project: {
    id: 'proj-001',
    organizationId: 'org-001',
  },
}

const mockMembership = {
  id: 'mem-001',
  organizationId: 'org-001',
  userId: 'user-001',
  role: 'QA_ENGINEER',
}

const mockCreatedAttachment = {
  id: 'att-001',
  fileUrl: '/uploads/abc-123.png',
  fileName: 'screenshot.png',
  fileType: 'image/png',
  fileSize: 1024,
  uploadedById: 'user-001',
  testRunId: 'run-001',
  testCaseId: null,
  uploadedBy: {
    id: 'user-001',
    name: 'Test User',
    email: 'tester@example.com',
    avatarUrl: null,
  },
}

function createFilePart(overrides: Partial<{
  name: string
  data: Buffer
  filename: string
  type: string
}> = {}) {
  return {
    name: overrides.name ?? 'file',
    data: overrides.data ?? Buffer.from('fake-image-data'),
    filename: overrides.filename ?? 'screenshot.png',
    type: overrides.type ?? 'image/png',
  }
}

const fakeEvent = {} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Attachments Upload API - Query Validation Schema', () => {
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

  it('accepts query with testRunId only', () => {
    const result = uploadQuerySchema.safeParse({ testRunId: 'run-001' })
    expect(result.success).toBe(true)
  })

  it('accepts query with testCaseId only', () => {
    const result = uploadQuerySchema.safeParse({ testCaseId: 'tc-001' })
    expect(result.success).toBe(true)
  })

  it('rejects query with neither testRunId nor testCaseId', () => {
    const result = uploadQuerySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects query with both testRunId and testCaseId', () => {
    const result = uploadQuerySchema.safeParse({
      testRunId: 'run-001',
      testCaseId: 'tc-001',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty testRunId', () => {
    const result = uploadQuerySchema.safeParse({ testRunId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty testCaseId', () => {
    const result = uploadQuerySchema.safeParse({ testCaseId: '' })
    expect(result.success).toBe(false)
  })
})

describe('Attachments Upload API - Handler Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
    mockLogActivity.mockResolvedValue(undefined)
    mockGetMaxFileSizeBytes.mockReturnValue(50 * 1024 * 1024) // 50 MB
    mockIsAllowedMimeType.mockReturnValue(true)
    mockGetAllowedMimeTypes.mockReturnValue(['image/png', 'image/jpeg', 'application/pdf'])
    mockUpload.mockResolvedValue('/uploads/abc-123.png')
  })

  it('successfully uploads a file attached to a test run', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([createFilePart()])
    mockAttachmentCreate.mockResolvedValue(mockCreatedAttachment)

    const result = await handler(fakeEvent)

    expect(result).toEqual(mockCreatedAttachment)
  })

  it('successfully uploads a file attached to a test case', async () => {
    mockGetQuery.mockReturnValue({ testCaseId: 'tc-001' })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([createFilePart()])
    mockAttachmentCreate.mockResolvedValue({
      ...mockCreatedAttachment,
      testRunId: null,
      testCaseId: 'tc-001',
    })

    const result = await handler(fakeEvent)

    expect(result).toBeDefined()
    expect(mockTestCaseFindUnique).toHaveBeenCalled()
  })

  it('throws 400 when query params are invalid (neither ID provided)', async () => {
    mockGetQuery.mockReturnValue({})

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })

  it('throws 404 when test run does not exist', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'nonexistent' })
    mockTestRunFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Test run not found')
    }
  })

  it('throws 404 when test case does not exist', async () => {
    mockGetQuery.mockReturnValue({ testCaseId: 'nonexistent' })
    mockTestCaseFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Test case not found')
    }
  })

  it('throws 403 when user lacks org membership (via test run)', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('You do not have access to this test run')
    }
  })

  it('throws 403 when user lacks org membership (via test case)', async () => {
    mockGetQuery.mockReturnValue({ testCaseId: 'tc-001' })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(403)
      expect(err.message).toBe('You do not have access to this test case')
    }
  })

  it('throws 400 when no file is uploaded (null form data)', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue(null)

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('No file uploaded')
    }
  })

  it('throws 400 when form data is empty array', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('No file uploaded')
    }
  })

  it('throws 400 when form data has no "file" field', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      { name: 'other-field', data: Buffer.from('data'), filename: 'test.png', type: 'image/png' },
    ])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toContain('No file found')
    }
  })

  it('throws 400 when file part has no data', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      { name: 'file', data: null, filename: 'test.png', type: 'image/png' },
    ])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toContain('No file found')
    }
  })

  it('throws 400 when file part has no filename', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      { name: 'file', data: Buffer.from('data'), filename: null, type: 'image/png' },
    ])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.message).toContain('No file found')
    }
  })

  it('throws 413 when file exceeds max size', async () => {
    const maxSize = 10 * 1024 * 1024 // 10 MB
    mockGetMaxFileSizeBytes.mockReturnValue(maxSize)
    const oversizedBuffer = Buffer.alloc(maxSize + 1)

    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ data: oversizedBuffer }),
    ])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(413)
      expect(err.message).toContain('exceeds maximum')
    }
  })

  it('throws 415 when MIME type is not allowed', async () => {
    mockIsAllowedMimeType.mockReturnValue(false)
    mockGetAllowedMimeTypes.mockReturnValue(['image/png', 'image/jpeg'])

    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ type: 'application/x-executable' }),
    ])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      expect(err.statusCode).toBe(415)
      expect(err.message).toContain('not allowed')
    }
  })

  it('calls storage provider upload with correct arguments', async () => {
    const fileBuffer = Buffer.from('fake-png-data')
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ data: fileBuffer, filename: 'report.png', type: 'image/png' }),
    ])
    mockAttachmentCreate.mockResolvedValue(mockCreatedAttachment)

    await handler(fakeEvent)

    expect(mockUpload).toHaveBeenCalledWith(fileBuffer, 'report.png', 'image/png')
  })

  it('creates attachment record with correct data', async () => {
    const fileBuffer = Buffer.from('fake-data')
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ data: fileBuffer, filename: 'screenshot.png', type: 'image/png' }),
    ])
    mockAttachmentCreate.mockResolvedValue(mockCreatedAttachment)

    await handler(fakeEvent)

    expect(mockAttachmentCreate).toHaveBeenCalledWith({
      data: {
        fileUrl: '/uploads/abc-123.png',
        fileName: 'screenshot.png',
        fileType: 'image/png',
        fileSize: fileBuffer.length,
        uploadedById: 'user-001',
        testRunId: 'run-001',
        testCaseId: null,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    })
  })

  it('creates attachment with testCaseId when uploading to a test case', async () => {
    mockGetQuery.mockReturnValue({ testCaseId: 'tc-001' })
    mockTestCaseFindUnique.mockResolvedValue(mockTestCase)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([createFilePart()])
    mockAttachmentCreate.mockResolvedValue({
      ...mockCreatedAttachment,
      testRunId: null,
      testCaseId: 'tc-001',
    })

    await handler(fakeEvent)

    const createArgs = mockAttachmentCreate.mock.calls[0][0]
    expect(createArgs.data.testRunId).toBeNull()
    expect(createArgs.data.testCaseId).toBe('tc-001')
  })

  it('defaults MIME type to application/octet-stream when not provided', async () => {
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      { name: 'file', data: Buffer.from('data'), filename: 'mystery.bin', type: undefined },
    ])
    // application/octet-stream should be checked
    mockIsAllowedMimeType.mockReturnValue(false)
    mockGetAllowedMimeTypes.mockReturnValue(['image/png'])

    try {
      await handler(fakeEvent)
      expect.unreachable('Should have thrown')
    } catch (err: any) {
      // The MIME type should be defaulted to application/octet-stream
      expect(err.statusCode).toBe(415)
      expect(err.message).toContain('application/octet-stream')
    }
  })

  it('logs activity after successful upload', async () => {
    const fileBuffer = Buffer.from('file-content')
    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ data: fileBuffer, filename: 'log.txt', type: 'text/plain' }),
    ])
    mockAttachmentCreate.mockResolvedValue({ ...mockCreatedAttachment, id: 'att-002' })

    await handler(fakeEvent)

    expect(mockLogActivity).toHaveBeenCalledWith(
      'user-001',
      'CREATED',
      'Attachment',
      'att-002',
      expect.objectContaining({
        fileName: 'log.txt',
        fileType: 'text/plain',
        fileSize: fileBuffer.length,
      }),
    )
  })

  it('accepts file exactly at the max size limit', async () => {
    const maxSize = 10 * 1024 * 1024
    mockGetMaxFileSizeBytes.mockReturnValue(maxSize)
    const exactBuffer = Buffer.alloc(maxSize)

    mockGetQuery.mockReturnValue({ testRunId: 'run-001' })
    mockTestRunFindUnique.mockResolvedValue(mockTestRun)
    mockOrgMemberFindUnique.mockResolvedValue(mockMembership)
    mockReadMultipartFormData.mockResolvedValue([
      createFilePart({ data: exactBuffer }),
    ])
    mockAttachmentCreate.mockResolvedValue(mockCreatedAttachment)

    // Should NOT throw -- file size equals max, not exceeds
    const result = await handler(fakeEvent)
    expect(result).toBeDefined()
  })
})
