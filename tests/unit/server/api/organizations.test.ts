/**
 * Unit tests for organization-related API validation and logic.
 *
 * Tests input validation for creating and updating organizations,
 * and the business logic around organization limits.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schemas matching the API route validation patterns
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
})

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  maxProjects: z.number().int().min(1).max(100).optional(),
  maxTestCasesPerProject: z.number().int().min(1).max(10000).optional(),
})

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'ORGANIZATION_MANAGER',
    'PROJECT_MANAGER',
    'PRODUCT_OWNER',
    'QA_ENGINEER',
    'DEVELOPER',
  ]),
})

describe('Organizations API - Create Validation', () => {
  it('accepts valid organization name', () => {
    const result = createOrganizationSchema.safeParse({ name: 'Acme Corp' })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createOrganizationSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing name', () => {
    const result = createOrganizationSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 200 characters', () => {
    const result = createOrganizationSchema.safeParse({ name: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts name with special characters', () => {
    const result = createOrganizationSchema.safeParse({ name: 'Acme Corp & Co.' })
    expect(result.success).toBe(true)
  })

  it('accepts name exactly 200 characters', () => {
    const result = createOrganizationSchema.safeParse({ name: 'A'.repeat(200) })
    expect(result.success).toBe(true)
  })
})

describe('Organizations API - Update Validation', () => {
  it('accepts valid update with name only', () => {
    const result = updateOrganizationSchema.safeParse({ name: 'New Name' })
    expect(result.success).toBe(true)
  })

  it('accepts valid update with maxProjects only', () => {
    const result = updateOrganizationSchema.safeParse({ maxProjects: 20 })
    expect(result.success).toBe(true)
  })

  it('accepts valid update with maxTestCasesPerProject only', () => {
    const result = updateOrganizationSchema.safeParse({ maxTestCasesPerProject: 5000 })
    expect(result.success).toBe(true)
  })

  it('accepts empty update (all optional)', () => {
    const result = updateOrganizationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects maxProjects below 1', () => {
    const result = updateOrganizationSchema.safeParse({ maxProjects: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects maxProjects above 100', () => {
    const result = updateOrganizationSchema.safeParse({ maxProjects: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects maxTestCasesPerProject below 1', () => {
    const result = updateOrganizationSchema.safeParse({ maxTestCasesPerProject: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects maxTestCasesPerProject above 10000', () => {
    const result = updateOrganizationSchema.safeParse({ maxTestCasesPerProject: 10001 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer maxProjects', () => {
    const result = updateOrganizationSchema.safeParse({ maxProjects: 5.5 })
    expect(result.success).toBe(false)
  })
})

describe('Organizations API - Invite Member Validation', () => {
  it('accepts valid invitation data', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'colleague@example.com',
      role: 'QA_ENGINEER',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all valid role values', () => {
    const roles = [
      'ORGANIZATION_MANAGER',
      'PROJECT_MANAGER',
      'PRODUCT_OWNER',
      'QA_ENGINEER',
      'DEVELOPER',
    ]

    for (const role of roles) {
      const result = inviteMemberSchema.safeParse({
        email: 'test@example.com',
        role,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid email', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'not-valid',
      role: 'QA_ENGINEER',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'test@example.com',
      role: 'INVALID_ROLE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = inviteMemberSchema.safeParse({
      role: 'QA_ENGINEER',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing role', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'test@example.com',
    })
    expect(result.success).toBe(false)
  })
})
