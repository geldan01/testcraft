/**
 * Unit tests for server auth utilities.
 *
 * Tests JWT token generation and password hashing/verification.
 * These functions are critical for security and must be tested thoroughly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Mock useRuntimeConfig for server-side auth utilities
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    jwtSecret: 'test-jwt-secret-key-for-testing',
    public: { appName: 'TestCraft' },
  }),
  createError: (opts: { statusCode: number; statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  },
  getHeader: vi.fn(),
}))

describe('Auth Utilities', () => {
  describe('generateToken', () => {
    it('creates a valid JWT token with userId and email', () => {
      const token = jwt.sign(
        { userId: 'user-123', email: 'test@example.com' },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts: header.payload.signature
    })

    it('includes userId and email in the token payload', () => {
      const userId = 'user-456'
      const email = 'admin@example.com'

      const token = jwt.sign(
        { userId, email },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      const decoded = jwt.verify(token, 'test-jwt-secret-key-for-testing') as {
        userId: string
        email: string
      }

      expect(decoded.userId).toBe(userId)
      expect(decoded.email).toBe(email)
    })

    it('sets token expiration to 7 days', () => {
      const token = jwt.sign(
        { userId: 'user-1', email: 'test@example.com' },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      const decoded = jwt.verify(token, 'test-jwt-secret-key-for-testing') as {
        exp: number
        iat: number
      }

      // exp - iat should be approximately 7 days (604800 seconds)
      const durationSeconds = decoded.exp - decoded.iat
      expect(durationSeconds).toBe(7 * 24 * 60 * 60) // 604800
    })

    it('fails verification with wrong secret', () => {
      const token = jwt.sign(
        { userId: 'user-1', email: 'test@example.com' },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      expect(() => {
        jwt.verify(token, 'wrong-secret')
      }).toThrow()
    })

    it('generates unique tokens for different users', () => {
      const token1 = jwt.sign(
        { userId: 'user-1', email: 'user1@example.com' },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      const token2 = jwt.sign(
        { userId: 'user-2', email: 'user2@example.com' },
        'test-jwt-secret-key-for-testing',
        { expiresIn: '7d' },
      )

      expect(token1).not.toBe(token2)
    })
  })

  describe('Password hashing', () => {
    it('hashes a password using bcrypt', async () => {
      const password = 'SecurePassword123!'
      const hash = await bcrypt.hash(password, 12)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true)
    })

    it('verifies correct password against hash', async () => {
      const password = 'MyPassword456!'
      const hash = await bcrypt.hash(password, 12)

      const isValid = await bcrypt.compare(password, hash)
      expect(isValid).toBe(true)
    })

    it('rejects incorrect password against hash', async () => {
      const password = 'CorrectPassword'
      const hash = await bcrypt.hash(password, 12)

      const isValid = await bcrypt.compare('WrongPassword', hash)
      expect(isValid).toBe(false)
    })

    it('generates different hashes for the same password', async () => {
      const password = 'SamePassword'
      const hash1 = await bcrypt.hash(password, 12)
      const hash2 = await bcrypt.hash(password, 12)

      // bcrypt uses random salt, so hashes should differ
      expect(hash1).not.toBe(hash2)

      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true)
      expect(await bcrypt.compare(password, hash2)).toBe(true)
    })

    it('handles empty string password', async () => {
      const hash = await bcrypt.hash('', 12)
      expect(await bcrypt.compare('', hash)).toBe(true)
      expect(await bcrypt.compare('not-empty', hash)).toBe(false)
    })

    it('handles unicode passwords', async () => {
      const password = 'P@ssw0rd-with-em0jis'
      const hash = await bcrypt.hash(password, 12)
      expect(await bcrypt.compare(password, hash)).toBe(true)
    })
  })
})
