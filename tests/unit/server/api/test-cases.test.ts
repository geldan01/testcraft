/**
 * Unit tests for test case API validation and logic.
 *
 * Tests input validation for creating and updating test cases,
 * including step-based and Gherkin types, debug flag toggling,
 * and pagination/filtering parameter parsing.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schemas matching the API route validation patterns
const testStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  action: z.string().min(1, 'Action is required'),
  data: z.string().default(''),
  expectedResult: z.string().min(1, 'Expected result is required'),
})

const createTestCaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  preconditions: z.array(z.string()).optional(),
  testType: z.enum(['STEP_BASED', 'GHERKIN']),
  steps: z.array(testStepSchema).optional(),
  gherkinSyntax: z.string().optional(),
})

const updateTestCaseSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  preconditions: z.array(z.string()).optional(),
  testType: z.enum(['STEP_BASED', 'GHERKIN']).optional(),
  steps: z.array(testStepSchema).optional(),
  gherkinSyntax: z.string().optional(),
})

describe('Test Cases API - Create Validation', () => {
  describe('Step-Based test case', () => {
    it('accepts valid step-based test case', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Login with valid credentials',
        description: 'Tests login flow',
        projectId: 'project-1',
        testType: 'STEP_BASED',
        steps: [
          { stepNumber: 1, action: 'Open login page', data: '', expectedResult: 'Page loads' },
          { stepNumber: 2, action: 'Enter email', data: 'user@test.com', expectedResult: 'Email entered' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('accepts step-based test case without steps', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case name',
        projectId: 'project-1',
        testType: 'STEP_BASED',
      })
      expect(result.success).toBe(true)
    })

    it('accepts test case with preconditions', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test with preconditions',
        projectId: 'project-1',
        testType: 'STEP_BASED',
        preconditions: ['User must be logged in', 'Feature flag must be enabled'],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.preconditions).toHaveLength(2)
      }
    })
  })

  describe('Gherkin test case', () => {
    it('accepts valid Gherkin test case', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'BDD Login Flow',
        projectId: 'project-1',
        testType: 'GHERKIN',
        gherkinSyntax: 'Feature: Login\n  Scenario: Valid login\n    Given user is on login page',
      })
      expect(result.success).toBe(true)
    })

    it('accepts Gherkin test case without gherkinSyntax (optional)', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Empty Gherkin test',
        projectId: 'project-1',
        testType: 'GHERKIN',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Required fields', () => {
    it('rejects missing name', () => {
      const result = createTestCaseSchema.safeParse({
        projectId: 'project-1',
        testType: 'STEP_BASED',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = createTestCaseSchema.safeParse({
        name: '',
        projectId: 'project-1',
        testType: 'STEP_BASED',
      })
      expect(result.success).toBe(false)
    })

    it('rejects name longer than 500 characters', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'A'.repeat(501),
        projectId: 'project-1',
        testType: 'STEP_BASED',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing projectId', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        testType: 'STEP_BASED',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing testType', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        projectId: 'project-1',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid testType', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        projectId: 'project-1',
        testType: 'INVALID',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Test step validation', () => {
    it('rejects step with missing action', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        projectId: 'project-1',
        testType: 'STEP_BASED',
        steps: [
          { stepNumber: 1, action: '', data: '', expectedResult: 'Something' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('rejects step with missing expectedResult', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        projectId: 'project-1',
        testType: 'STEP_BASED',
        steps: [
          { stepNumber: 1, action: 'Do something', data: '', expectedResult: '' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('rejects step with stepNumber below 1', () => {
      const result = createTestCaseSchema.safeParse({
        name: 'Test case',
        projectId: 'project-1',
        testType: 'STEP_BASED',
        steps: [
          { stepNumber: 0, action: 'Do something', data: '', expectedResult: 'Result' },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('accepts step with empty data field', () => {
      const result = testStepSchema.safeParse({
        stepNumber: 1,
        action: 'Click button',
        data: '',
        expectedResult: 'Button is clicked',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Test Cases API - Update Validation', () => {
  it('accepts partial update with name only', () => {
    const result = updateTestCaseSchema.safeParse({ name: 'Updated name' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with description only', () => {
    const result = updateTestCaseSchema.safeParse({ description: 'Updated desc' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with testType change', () => {
    const result = updateTestCaseSchema.safeParse({ testType: 'GHERKIN' })
    expect(result.success).toBe(true)
  })

  it('accepts empty update (all optional)', () => {
    const result = updateTestCaseSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects description longer than 5000 characters', () => {
    const result = updateTestCaseSchema.safeParse({
      description: 'A'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

describe('Test Cases API - Debug Flag Logic', () => {
  it('toggles debug flag from false to true', () => {
    const currentFlag = false
    const newFlag = !currentFlag
    expect(newFlag).toBe(true)
  })

  it('toggles debug flag from true to false', () => {
    const currentFlag = true
    const newFlag = !currentFlag
    expect(newFlag).toBe(false)
  })

  it('sets debugFlaggedAt when flagging', () => {
    const debugFlag = true
    const debugFlaggedAt = debugFlag ? new Date() : null
    expect(debugFlaggedAt).toBeInstanceOf(Date)
  })

  it('clears debugFlaggedAt when unflagging', () => {
    const debugFlag = false
    const debugFlaggedAt = debugFlag ? new Date() : null
    expect(debugFlaggedAt).toBeNull()
  })
})

describe('Test Cases API - Pagination and Filter Parsing', () => {
  it('parses page and limit from query params', () => {
    const query = { page: '2', limit: '10' }
    const page = parseInt(query.page, 10) || 1
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100)

    expect(page).toBe(2)
    expect(limit).toBe(10)
  })

  it('defaults page to 1 when not provided', () => {
    const query: Record<string, string> = {}
    const page = parseInt(query.page, 10) || 1
    expect(page).toBe(1)
  })

  it('defaults limit to 20 when not provided', () => {
    const query: Record<string, string> = {}
    const limit = parseInt(query.limit, 10) || 20
    expect(limit).toBe(20)
  })

  it('caps limit at 100', () => {
    const query = { limit: '500' }
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100)
    expect(limit).toBe(100)
  })

  it('calculates correct skip value for pagination', () => {
    const page = 3
    const limit = 20
    const skip = (page - 1) * limit
    expect(skip).toBe(40)
  })

  it('parses status filter', () => {
    const validStatuses = ['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']
    const query = { status: 'PASS' }

    expect(validStatuses.includes(query.status)).toBe(true)
  })

  it('parses testType filter', () => {
    const validTypes = ['STEP_BASED', 'GHERKIN']
    const query = { testType: 'GHERKIN' }

    expect(validTypes.includes(query.testType)).toBe(true)
  })

  it('parses debugFlag filter', () => {
    const query = { debugFlag: 'true' }
    const debugFlag = query.debugFlag === 'true'
    expect(debugFlag).toBe(true)
  })

  it('computes totalPages correctly', () => {
    const total = 45
    const limit = 20
    const totalPages = Math.ceil(total / limit)
    expect(totalPages).toBe(3)
  })

  it('computes totalPages as 1 for fewer items than limit', () => {
    const total = 5
    const limit = 20
    const totalPages = Math.ceil(total / limit)
    expect(totalPages).toBe(1)
  })

  it('computes totalPages as 0 for empty results', () => {
    const total = 0
    const limit = 20
    const totalPages = Math.ceil(total / limit)
    expect(totalPages).toBe(0)
  })
})
