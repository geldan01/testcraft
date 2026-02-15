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

  /**
   * Read a file and return its contents as a Buffer.
   */
  read(fileUrl: string): Promise<Buffer>
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
    const configuredDir = process.env.UPLOAD_DIR || './data/uploads'
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

  async read(fileUrl: string): Promise<Buffer> {
    return fs.readFile(this.getFilePath(fileUrl))
  }
}

// ---------------------------------------------------------------------------
// S3-compatible storage provider (AWS S3, Cloudflare R2, MinIO, etc.)
// ---------------------------------------------------------------------------

class S3StorageProvider implements StorageProvider {
  private client: import('@aws-sdk/client-s3').S3Client
  private bucket: string

  constructor() {
    const { S3Client } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3')

    const region = process.env.S3_REGION || 'us-east-1'
    const endpoint = process.env.S3_ENDPOINT || undefined
    const bucket = process.env.S3_BUCKET

    if (!bucket) {
      throw new Error('S3_BUCKET environment variable is required for S3 storage provider')
    }

    this.bucket = bucket
    this.client = new S3Client({
      region,
      ...(endpoint && { endpoint, forcePathStyle: true }),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    })
  }

  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3')

    const ext = extname(fileName).toLowerCase()
    const key = `uploads/${crypto.randomUUID()}${ext}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )

    return `/${key}`
  }

  async delete(fileUrl: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3')

    const key = fileUrl.replace(/^\//, '')
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      )
    } catch {
      // If the object is already gone, that's fine
    }
  }

  getFilePath(fileUrl: string): string {
    // Return the S3 object key for reference
    return fileUrl.replace(/^\//, '')
  }

  async read(fileUrl: string): Promise<Buffer> {
    const { GetObjectCommand } = require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3')

    const key = fileUrl.replace(/^\//, '')
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    )

    const stream = response.Body
    if (!stream) {
      throw new Error(`Empty response body for S3 key: ${key}`)
    }

    const chunks: Uint8Array[] = []
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
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
      case 's3':
        _provider = new S3StorageProvider()
        break
      default:
        throw new Error(`Unknown storage provider: ${providerType}. Supported: local, s3`)
    }
  }

  return _provider
}
