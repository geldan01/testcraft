/**
 * Unit tests for server/utils/storage.ts
 *
 * Tests the storage utility functions: MIME type validation,
 * file size limit calculation, and storage provider factory.
 *
 * The LocalStorageProvider and factory use process.env so we
 * manipulate environment variables where needed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to reset the module-level singleton between tests that exercise
// different env configurations, so we dynamically import where necessary.
// For the pure-function tests we can import once.

describe('Storage Utility - isAllowedMimeType', () => {
  // Dynamic import so we get a fresh module for each describe block if needed
  let isAllowedMimeType: (mimeType: string) => boolean

  beforeEach(async () => {
    const mod = await import('~/server/utils/storage')
    isAllowedMimeType = mod.isAllowedMimeType
  })

  describe('allowed image types', () => {
    it.each([
      'image/png',
      'image/jpg',
      'image/jpeg',
      'image/gif',
      'image/webp',
    ])('accepts %s', (mimeType) => {
      expect(isAllowedMimeType(mimeType)).toBe(true)
    })
  })

  describe('allowed video types', () => {
    it.each([
      'video/mp4',
      'video/webm',
    ])('accepts %s', (mimeType) => {
      expect(isAllowedMimeType(mimeType)).toBe(true)
    })
  })

  describe('allowed document types', () => {
    it.each([
      'text/plain',
      'application/json',
      'application/xml',
      'text/xml',
      'application/pdf',
      'text/csv',
    ])('accepts %s', (mimeType) => {
      expect(isAllowedMimeType(mimeType)).toBe(true)
    })
  })

  describe('allowed archive types', () => {
    it.each([
      'application/zip',
      'application/x-zip-compressed',
    ])('accepts %s', (mimeType) => {
      expect(isAllowedMimeType(mimeType)).toBe(true)
    })
  })

  describe('disallowed types', () => {
    it.each([
      'application/octet-stream',
      'application/x-executable',
      'text/html',
      'application/javascript',
      'image/svg+xml',
      'audio/mpeg',
      'video/avi',
      'application/x-msdownload',
      '',
      'completely-invalid',
    ])('rejects %s', (mimeType) => {
      expect(isAllowedMimeType(mimeType)).toBe(false)
    })
  })

  it('is case-sensitive (rejects uppercase)', () => {
    expect(isAllowedMimeType('IMAGE/PNG')).toBe(false)
    expect(isAllowedMimeType('Image/Png')).toBe(false)
  })
})

describe('Storage Utility - getAllowedMimeTypes', () => {
  it('returns an array of all allowed MIME types', async () => {
    const { getAllowedMimeTypes } = await import('~/server/utils/storage')
    const types = getAllowedMimeTypes()

    expect(Array.isArray(types)).toBe(true)
    expect(types.length).toBeGreaterThan(0)
    expect(types).toContain('image/png')
    expect(types).toContain('application/pdf')
    expect(types).toContain('application/zip')
  })

  it('returns a new array instance each time (not the internal set)', async () => {
    const { getAllowedMimeTypes } = await import('~/server/utils/storage')
    const a = getAllowedMimeTypes()
    const b = getAllowedMimeTypes()

    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('Storage Utility - getMaxFileSizeBytes', () => {
  const originalEnv = process.env.MAX_FILE_SIZE_MB

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.MAX_FILE_SIZE_MB = originalEnv
    } else {
      delete process.env.MAX_FILE_SIZE_MB
    }
  })

  it('returns default of 50 MB in bytes when env is not set', async () => {
    delete process.env.MAX_FILE_SIZE_MB
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    expect(result).toBe(50 * 1024 * 1024)
  })

  it('returns custom value from MAX_FILE_SIZE_MB env variable', async () => {
    process.env.MAX_FILE_SIZE_MB = '10'
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    expect(result).toBe(10 * 1024 * 1024)
  })

  it('returns default when env is non-numeric', async () => {
    process.env.MAX_FILE_SIZE_MB = 'not-a-number'
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    // Number('not-a-number') is NaN, NaN || 50 === 50
    expect(result).toBe(50 * 1024 * 1024)
  })

  it('returns default when env is empty string', async () => {
    process.env.MAX_FILE_SIZE_MB = ''
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    // Number('') is 0, 0 || 50 === 50
    expect(result).toBe(50 * 1024 * 1024)
  })

  it('returns default when env is zero', async () => {
    process.env.MAX_FILE_SIZE_MB = '0'
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    // Number('0') is 0, 0 || 50 === 50
    expect(result).toBe(50 * 1024 * 1024)
  })

  it('uses the env value of 1 MB correctly', async () => {
    process.env.MAX_FILE_SIZE_MB = '1'
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    expect(result).toBe(1 * 1024 * 1024)
  })

  it('converts MB to bytes correctly for large values', async () => {
    process.env.MAX_FILE_SIZE_MB = '100'
    const { getMaxFileSizeBytes } = await import('~/server/utils/storage')
    const result = getMaxFileSizeBytes()
    expect(result).toBe(100 * 1024 * 1024)
  })
})

describe('Storage Utility - getStorageProvider', () => {
  it('returns a LocalStorageProvider by default', async () => {
    // Reset the module to clear the singleton
    vi.resetModules()
    delete process.env.STORAGE_PROVIDER
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    expect(provider).toBeDefined()
    expect(typeof provider.upload).toBe('function')
    expect(typeof provider.delete).toBe('function')
    expect(typeof provider.getFilePath).toBe('function')
  })

  it('returns a LocalStorageProvider when STORAGE_PROVIDER is "local"', async () => {
    vi.resetModules()
    process.env.STORAGE_PROVIDER = 'local'
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    expect(provider).toBeDefined()
    expect(typeof provider.upload).toBe('function')
  })

  it('returns the same instance on subsequent calls (singleton)', async () => {
    vi.resetModules()
    delete process.env.STORAGE_PROVIDER
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider1 = getStorageProvider()
    const provider2 = getStorageProvider()

    expect(provider1).toBe(provider2)
  })

  it('throws for unknown storage provider type', async () => {
    vi.resetModules()
    process.env.STORAGE_PROVIDER = 'azure-blob'
    const { getStorageProvider } = await import('~/server/utils/storage')

    expect(() => getStorageProvider()).toThrow('Supported: local, s3')
  })

  it('LocalStorageProvider exposes a read() method', async () => {
    vi.resetModules()
    delete process.env.STORAGE_PROVIDER
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    expect(typeof provider.read).toBe('function')
  })

  it('LocalStorageProvider.getFilePath strips /uploads/ prefix', async () => {
    vi.resetModules()
    delete process.env.STORAGE_PROVIDER
    delete process.env.UPLOAD_DIR
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    const filePath = provider.getFilePath('/uploads/abc-123.png')
    expect(filePath).toContain('abc-123.png')
    expect(filePath).not.toContain('/uploads/uploads/')
  })
})

describe('Storage Utility - S3StorageProvider via factory', () => {
  afterEach(() => {
    delete process.env.STORAGE_PROVIDER
    delete process.env.S3_BUCKET
    delete process.env.S3_REGION
    delete process.env.S3_ENDPOINT
    delete process.env.S3_ACCESS_KEY_ID
    delete process.env.S3_SECRET_ACCESS_KEY
  })

  it('returns an S3StorageProvider when STORAGE_PROVIDER is "s3"', async () => {
    vi.resetModules()
    process.env.STORAGE_PROVIDER = 's3'
    process.env.S3_BUCKET = 'test-bucket'
    process.env.S3_ACCESS_KEY_ID = 'test-key'
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    expect(provider).toBeDefined()
    expect(typeof provider.upload).toBe('function')
    expect(typeof provider.delete).toBe('function')
    expect(typeof provider.read).toBe('function')
    expect(typeof provider.getFilePath).toBe('function')
  })

  it('throws when S3_BUCKET is not set', async () => {
    vi.resetModules()
    process.env.STORAGE_PROVIDER = 's3'
    delete process.env.S3_BUCKET
    const { getStorageProvider } = await import('~/server/utils/storage')

    expect(() => getStorageProvider()).toThrow('S3_BUCKET environment variable is required')
  })

  it('S3StorageProvider.getFilePath returns the object key', async () => {
    vi.resetModules()
    process.env.STORAGE_PROVIDER = 's3'
    process.env.S3_BUCKET = 'test-bucket'
    process.env.S3_ACCESS_KEY_ID = 'test-key'
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
    const { getStorageProvider } = await import('~/server/utils/storage')
    const provider = getStorageProvider()

    expect(provider.getFilePath('/uploads/abc-123.png')).toBe('uploads/abc-123.png')
  })
})
