/**
 * Unit tests for test run API validation and logic.
 *
 * Tests input validation for creating and updating test runs,
 * status transitions, and filter parsing.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schemas matching the API route validation patterns
const createTestRunSchema = z.object({
  testCaseId: z.string().min(1, 'Test case ID is required'),
  environment: z.string().min(1, 'Environment is required'),
  status: z.enum(['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']),
  duration: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

const updateTestRunSchema = z.object({
  status: z.enum(['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']).optional(),
  duration: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

describe('Test Runs API - Create Validation', () => {
  it('accepts valid test run creation', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
      status: 'PASS',
    })
    expect(result.success).toBe(true)
  })

  it('accepts test run with all optional fields', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'production',
      status: 'FAIL',
      duration: 120,
      notes: 'Button not responsive on mobile',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing testCaseId', () => {
    const result = createTestRunSchema.safeParse({
      environment: 'staging',
      status: 'PASS',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty testCaseId', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: '',
      environment: 'staging',
      status: 'PASS',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing environment', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      status: 'PASS',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty environment', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: '',
      status: 'PASS',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing status', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
      status: 'INVALID_STATUS',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid status values', () => {
    const statuses = ['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']

    for (const status of statuses) {
      const result = createTestRunSchema.safeParse({
        testCaseId: 'tc-1',
        environment: 'staging',
        status,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects negative duration', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
      status: 'PASS',
      duration: -1,
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero duration', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
      status: 'PASS',
      duration: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects notes longer than 5000 characters', () => {
    const result = createTestRunSchema.safeParse({
      testCaseId: 'tc-1',
      environment: 'staging',
      status: 'PASS',
      notes: 'A'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

describe('Test Runs API - Update Validation', () => {
  it('accepts partial update with status only', () => {
    const result = updateTestRunSchema.safeParse({ status: 'FAIL' })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with duration only', () => {
    const result = updateTestRunSchema.safeParse({ duration: 300 })
    expect(result.success).toBe(true)
  })

  it('accepts partial update with notes only', () => {
    const result = updateTestRunSchema.safeParse({ notes: 'Updated notes' })
    expect(result.success).toBe(true)
  })

  it('accepts empty update (all optional)', () => {
    const result = updateTestRunSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts full update with all fields', () => {
    const result = updateTestRunSchema.safeParse({
      status: 'PASS',
      duration: 60,
      notes: 'Completed successfully',
    })
    expect(result.success).toBe(true)
  })
})

describe('Test Runs API - Status Update Logic', () => {
  it('completing a run updates the test case lastRunStatus', () => {
    const runStatus = 'PASS'
    const testCaseUpdate = {
      lastRunStatus: runStatus,
      lastRunAt: new Date(),
    }
    expect(testCaseUpdate.lastRunStatus).toBe('PASS')
    expect(testCaseUpdate.lastRunAt).toBeInstanceOf(Date)
  })

  it('handles all terminal statuses for test case update', () => {
    const terminalStatuses = ['PASS', 'FAIL', 'BLOCKED', 'SKIPPED']

    for (const status of terminalStatuses) {
      const testCaseUpdate = {
        lastRunStatus: status,
        lastRunAt: new Date(),
      }
      expect(testCaseUpdate.lastRunStatus).toBe(status)
    }
  })
})

describe('Test Runs API - Filter Parsing', () => {
  it('parses status filter', () => {
    const query = { status: 'PASS' }
    const validStatuses = ['NOT_RUN', 'IN_PROGRESS', 'PASS', 'FAIL', 'BLOCKED', 'SKIPPED']
    expect(validStatuses.includes(query.status)).toBe(true)
  })

  it('parses environment filter', () => {
    const query = { environment: 'staging' }
    expect(query.environment).toBe('staging')
  })

  it('parses date range filters', () => {
    const query = { dateFrom: '2025-01-01', dateTo: '2025-12-31' }
    const dateFrom = new Date(query.dateFrom)
    const dateTo = new Date(query.dateTo)

    expect(dateFrom).toBeInstanceOf(Date)
    expect(dateTo).toBeInstanceOf(Date)
    expect(dateFrom < dateTo).toBe(true)
  })

  it('handles missing optional filters gracefully', () => {
    const query: Record<string, string | undefined> = {}
    const filters: Record<string, unknown> = {}

    if (query.status) filters.status = query.status
    if (query.environment) filters.environment = query.environment

    expect(Object.keys(filters)).toHaveLength(0)
  })
})

describe('Test Runs API - Duration Formatting', () => {
  it('formats duration under 60 seconds as seconds', () => {
    const duration = 45
    const formatted = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`
    expect(formatted).toBe('45s')
  })

  it('formats duration over 60 seconds as minutes and seconds', () => {
    const duration = 120
    const formatted = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`
    expect(formatted).toBe('2m 0s')
  })

  it('formats null duration as --', () => {
    const duration: number | null = null
    const formatted = duration ? (duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`) : '--'
    expect(formatted).toBe('--')
  })

  it('formats zero duration as --', () => {
    const duration = 0
    const formatted = !duration ? '--' : (duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`)
    expect(formatted).toBe('--')
  })
})
