import { promises as fs } from 'node:fs'
import { join, extname } from 'node:path'
import crypto from 'node:crypto'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorageProvider {
  /**
   * Upload a file buffer and return the public URL path (e.g. `/uploads/abc.png`).
   */
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<string>

  /**
   * Delete a previously-uploaded file by its URL path.
   */
  delete(fileUrl: string): Promise<void>

  /**
   * Resolve a URL path to an absolute filesystem path (local provider only).
   */
  getFilePath(fileUrl: string): string
}

// ---------------------------------------------------------------------------
// MIME type allowlist
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'image/webp',
  // Videos
  'video/mp4',
  'video/webm',
  // Documents
  'text/plain',
  'application/json',
  'application/xml',
  'text/xml',
  'application/pdf',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
])

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType)
}

export function getAllowedMimeTypes(): string[] {
  return [...ALLOWED_MIME_TYPES]
}

// ---------------------------------------------------------------------------
// File size helpers
// ---------------------------------------------------------------------------

export function getMaxFileSizeBytes(): number {
  const maxMb = Number(process.env.MAX_FILE_SIZE_MB) || 50
  return maxMb * 1024 * 1024
}

// ---------------------------------------------------------------------------
// Local filesystem storage provider
// ---------------------------------------------------------------------------

class LocalStorageProvider implements StorageProvider {
  private uploadDir: string

  constructor() {
    // Resolve from env or default to `./public/uploads` relative to project root
    const configuredDir = process.env.UPLOAD_DIR || './public/uploads'
    // If the path is relative, resolve from the current working directory
    this.uploadDir = configuredDir.startsWith('/')
      ? configuredDir
      : join(process.cwd(), configuredDir)
  }

  async upload(buffer: Buffer, fileName: string, _mimeType: string): Promise<string> {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true })

    // Build a collision-safe filename: uuid + original extension
    const ext = extname(fileName).toLowerCase()
    const uniqueName = `${crypto.randomUUID()}${ext}`
    const filePath = join(this.uploadDir, uniqueName)

    await fs.writeFile(filePath, buffer)

    // Return the public URL path (served by Nuxt from /public)
    return `/uploads/${uniqueName}`
  }

  async delete(fileUrl: string): Promise<void> {
    const filePath = this.getFilePath(fileUrl)
    try {
      await fs.unlink(filePath)
    } catch (err: unknown) {
      // If the file is already gone, that's fine
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err
      }
    }
  }

  getFilePath(fileUrl: string): string {
    // fileUrl looks like `/uploads/abc-123.png`
    // Strip leading `/uploads/` to get just the filename
    const fileName = fileUrl.replace(/^\/uploads\//, '')
    return join(this.uploadDir, fileName)
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _provider: StorageProvider | null = null

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    const providerType = process.env.STORAGE_PROVIDER || 'local'

    switch (providerType) {
      case 'local':
        _provider = new LocalStorageProvider()
        break
      default:
        throw new Error(`Unknown storage provider: ${providerType}. Supported: local`)
    }
  }

  return _provider
}
