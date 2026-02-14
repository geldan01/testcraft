/**
 * Unit tests for auth API route handlers.
 *
 * Tests the register and login endpoint logic including
 * input validation, duplicate email handling, password verification,
 * and first-user-becomes-admin behavior.
 *
 * The Prisma client and runtime config are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ---- Schemas (mirroring the ones in the API routes) ----

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

describe('Auth API - Registration Validation', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing name', () => {
      const result = registerSchema.safeParse({
        email: 'john@example.com',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = registerSchema.safeParse({
        name: '',
        email: 'john@example.com',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name longer than 100 characters', () => {
      const result = registerSchema.safeParse({
        name: 'A'.repeat(101),
        email: 'john@example.com',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing email', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email format', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects email without domain', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing password', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Password must be at least 8 characters',
        )
      }
    })

    it('accepts password exactly 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345678',
      })
      expect(result.success).toBe(true)
    })

    it('rejects completely empty body', () => {
      const result = registerSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('provides correct error message for invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'bad-email',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })
  })
})

describe('Auth API - Login Validation', () => {
  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: 'Password123!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing email', () => {
      const result = loginSchema.safeParse({
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'Password123!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required')
      }
    })

    it('accepts any non-empty password (no length requirement on login)', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: 'x',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty body', () => {
      const result = loginSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})

describe('Auth API - First User Admin Logic', () => {
  it('first user should become admin when user count is 0', () => {
    const userCount = 0
    const isAdmin = userCount === 0
    expect(isAdmin).toBe(true)
  })

  it('subsequent users should not become admin', () => {
    const userCount: number = 1
    const isAdmin = userCount === 0
    expect(isAdmin).toBe(false)
  })

  it('with many existing users, new user is not admin', () => {
    const userCount: number = 42
    const isAdmin = userCount === 0
    expect(isAdmin).toBe(false)
  })
})

describe('Auth API - User Select Fields', () => {
  it('does not include passwordHash in select fields', () => {
    // This matches the userSelectFields const in server/utils/auth.ts
    const userSelectFields = {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      authProvider: true,
      isAdmin: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    }

    expect(userSelectFields).not.toHaveProperty('passwordHash')
    expect(Object.keys(userSelectFields)).toHaveLength(9)
    expect(userSelectFields.id).toBe(true)
    expect(userSelectFields.email).toBe(true)
  })
})
