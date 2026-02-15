/**
 * Unit tests for server/utils/reportFilters.ts
 *
 * Tests the buildReportWhereClause utility which constructs Prisma
 * where clauses for report endpoints based on time range, scope,
 * and project ID parameters.
 *
 * This is a pure function — no Prisma/auth mocking needed. Only
 * Date is controlled via vi.useFakeTimers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildReportWhereClause } from '~/server/utils/reportFilters'

// ---------------------------------------------------------------------------
// Freeze time for deterministic date arithmetic
// ---------------------------------------------------------------------------

const NOW = new Date('2025-06-15T12:00:00.000Z')

describe('buildReportWhereClause', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // Base clause
  // -------------------------------------------------------------------------

  it('returns base where clause with projectId and status exclusions for "all" time range', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: 'all',
    })

    expect(result).toEqual({
      testCase: { projectId: 'proj-001' },
      status: { notIn: ['NOT_RUN', 'IN_PROGRESS'] },
    })
  })

  it('excludes NOT_RUN and IN_PROGRESS from status filter', () => {
    const result = buildReportWhereClause({ projectId: 'proj-001' })

    expect(result.status).toEqual({ notIn: ['NOT_RUN', 'IN_PROGRESS'] })
  })

  // -------------------------------------------------------------------------
  // Time range filters
  // -------------------------------------------------------------------------

  it('adds 24h date filter for timeRange="24h"', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: '24h',
    })

    const expected = new Date(NOW.getTime() - 24 * 60 * 60 * 1000)
    expect(result.executedAt).toEqual({ gte: expected })
  })

  it('adds 3d date filter for timeRange="3d"', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: '3d',
    })

    const expected = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(result.executedAt).toEqual({ gte: expected })
  })

  it('adds 7d date filter for timeRange="7d"', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: '7d',
    })

    const expected = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000)
    expect(result.executedAt).toEqual({ gte: expected })
  })

  // -------------------------------------------------------------------------
  // Custom date range
  // -------------------------------------------------------------------------

  it('handles custom date range with both dateFrom and dateTo', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: 'custom',
      dateFrom: '2025-01-01',
      dateTo: '2025-03-31',
    })

    expect(result.executedAt).toEqual({
      gte: new Date('2025-01-01'),
      lte: new Date('2025-03-31'),
    })
  })

  it('handles custom date range with only dateFrom', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: 'custom',
      dateFrom: '2025-01-01',
    })

    expect(result.executedAt).toEqual({
      gte: new Date('2025-01-01'),
    })
    // No lte key should be present
    expect(result.executedAt).not.toHaveProperty('lte')
  })

  it('does not add date filter when timeRange is "all"', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      timeRange: 'all',
    })

    expect(result).not.toHaveProperty('executedAt')
  })

  it('does not add date filter when timeRange is undefined', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
    })

    expect(result).not.toHaveProperty('executedAt')
  })

  // -------------------------------------------------------------------------
  // Scope filters
  // -------------------------------------------------------------------------

  it('adds test plan scope filter when scope="test-plan" and scopeId provided', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      scope: 'test-plan',
      scopeId: 'plan-001',
    })

    expect(result.testCase).toEqual({
      projectId: 'proj-001',
      testPlans: { some: { testPlanId: 'plan-001' } },
    })
  })

  it('adds test suite scope filter when scope="test-suite" and scopeId provided', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      scope: 'test-suite',
      scopeId: 'suite-001',
    })

    expect(result.testCase).toEqual({
      projectId: 'proj-001',
      testSuites: { some: { testSuiteId: 'suite-001' } },
    })
  })

  it('no scope filter for scope="global"', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      scope: 'global',
    })

    expect(result.testCase).toEqual({ projectId: 'proj-001' })
    expect(result.testCase).not.toHaveProperty('testPlans')
    expect(result.testCase).not.toHaveProperty('testSuites')
  })

  it('no scope filter when scope is provided without scopeId', () => {
    const result = buildReportWhereClause({
      projectId: 'proj-001',
      scope: 'test-plan',
    })

    expect(result.testCase).toEqual({ projectId: 'proj-001' })
    expect(result.testCase).not.toHaveProperty('testPlans')
  })
})
