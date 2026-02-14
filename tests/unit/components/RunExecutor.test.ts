/**
 * Unit tests for the RunExecutor component logic.
 *
 * Tests environment options, status options, form validation (isValid),
 * resetForm, steps extraction, and submit data construction.
 *
 * Since rendering Vue components in a Nuxt context requires heavy setup,
 * these tests extract and validate the pure logic used by RunExecutor.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { TestCase, TestStep, TestRunStatus, CreateTestRunInput } from '~/types'
import { createMockTestCase, createMockGherkinTestCase, createMockStep, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted configuration from RunExecutor.vue
// ---------------------------------------------------------------------------

const environments = [
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
  { label: 'QA', value: 'qa' },
]

const statusOptions: Array<{ label: string; value: TestRunStatus }> = [
  { label: 'Pass', value: 'PASS' },
  { label: 'Fail', value: 'FAIL' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
]

// ---------------------------------------------------------------------------
// Extracted logic from RunExecutor.vue
// ---------------------------------------------------------------------------

interface RunExecutorFormState {
  environment: string
  status: TestRunStatus
  notes: string
}

function createFormState(): RunExecutorFormState {
  return {
    environment: '',
    status: 'NOT_RUN',
    notes: '',
  }
}

function isValid(form: RunExecutorFormState): boolean {
  return !!form.environment && form.status !== 'NOT_RUN'
}

function resetForm(): RunExecutorFormState {
  return {
    environment: '',
    status: 'NOT_RUN',
    notes: '',
  }
}

function extractSteps(testCase: TestCase): TestStep[] {
  if (testCase.testType === 'STEP_BASED' && testCase.steps) {
    return testCase.steps
  }
  return []
}

function buildSubmitData(
  testCaseId: string,
  form: RunExecutorFormState,
): CreateTestRunInput {
  const data: CreateTestRunInput = {
    testCaseId,
    environment: form.environment,
    status: form.status,
    notes: form.notes || undefined,
  }
  return data
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RunExecutor Logic', () => {
  beforeEach(() => {
    resetFixtureCounter()
  })

  describe('Environment options', () => {
    it('has 4 environment options', () => {
      expect(environments).toHaveLength(4)
    })

    it('includes Development, Staging, Production, QA', () => {
      const labels = environments.map((e) => e.label)
      expect(labels).toContain('Development')
      expect(labels).toContain('Staging')
      expect(labels).toContain('Production')
      expect(labels).toContain('QA')
    })

    it('each option has both label and value', () => {
      for (const env of environments) {
        expect(env.label).toBeTruthy()
        expect(env.value).toBeTruthy()
      }
    })
  })

  describe('Status options', () => {
    it('has 5 status options', () => {
      expect(statusOptions).toHaveLength(5)
    })

    it('includes Pass, Fail, Blocked, Skipped, In Progress', () => {
      const labels = statusOptions.map((s) => s.label)
      expect(labels).toContain('Pass')
      expect(labels).toContain('Fail')
      expect(labels).toContain('Blocked')
      expect(labels).toContain('Skipped')
      expect(labels).toContain('In Progress')
    })

    it('does NOT include NOT_RUN as a selectable option', () => {
      const values = statusOptions.map((s) => s.value)
      expect(values).not.toContain('NOT_RUN')
    })
  })

  describe('Form validation (isValid)', () => {
    it('is invalid when environment is empty and status is NOT_RUN', () => {
      const form = createFormState()
      expect(isValid(form)).toBe(false)
    })

    it('is invalid when environment is set but status is NOT_RUN', () => {
      const form: RunExecutorFormState = {
        environment: 'staging',
        status: 'NOT_RUN',
        notes: '',
      }
      expect(isValid(form)).toBe(false)
    })

    it('is invalid when environment is empty but status is set', () => {
      const form: RunExecutorFormState = {
        environment: '',
        status: 'PASS',
        notes: '',
      }
      expect(isValid(form)).toBe(false)
    })

    it('is valid when both environment and status are set', () => {
      const form: RunExecutorFormState = {
        environment: 'production',
        status: 'PASS',
        notes: '',
      }
      expect(isValid(form)).toBe(true)
    })

    it('is valid with any combination of valid environment and status', () => {
      const envValues = environments.map((e) => e.value)
      const statusValues = statusOptions.map((s) => s.value)

      for (const env of envValues) {
        for (const status of statusValues) {
          const form: RunExecutorFormState = {
            environment: env,
            status,
            notes: '',
          }
          expect(isValid(form)).toBe(true)
        }
      }
    })
  })

  describe('Reset form', () => {
    it('clears environment to empty string', () => {
      const form = resetForm()
      expect(form.environment).toBe('')
    })

    it('resets status to NOT_RUN', () => {
      const form = resetForm()
      expect(form.status).toBe('NOT_RUN')
    })

    it('clears notes to empty string', () => {
      const form = resetForm()
      expect(form.notes).toBe('')
    })
  })

  describe('Steps extraction', () => {
    it('returns steps from STEP_BASED test case', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'Click login' }),
        createMockStep({ stepNumber: 2, action: 'Enter password' }),
      ]
      const testCase = createMockTestCase({ testType: 'STEP_BASED', steps })

      const result = extractSteps(testCase)
      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('Click login')
      expect(result[1].action).toBe('Enter password')
    })

    it('returns empty array for GHERKIN test case', () => {
      const testCase = createMockGherkinTestCase()
      const result = extractSteps(testCase)
      expect(result).toEqual([])
    })

    it('returns empty array when steps is null', () => {
      const testCase = createMockTestCase({ testType: 'STEP_BASED', steps: null })
      const result = extractSteps(testCase)
      expect(result).toEqual([])
    })
  })

  describe('Submit run data construction', () => {
    it('includes testCaseId from props', () => {
      const form: RunExecutorFormState = {
        environment: 'staging',
        status: 'PASS',
        notes: '',
      }

      const data = buildSubmitData('tc-42', form)
      expect(data.testCaseId).toBe('tc-42')
    })

    it('includes selected environment', () => {
      const form: RunExecutorFormState = {
        environment: 'production',
        status: 'PASS',
        notes: '',
      }

      const data = buildSubmitData('tc-1', form)
      expect(data.environment).toBe('production')
    })

    it('includes selected status', () => {
      const form: RunExecutorFormState = {
        environment: 'staging',
        status: 'FAIL',
        notes: '',
      }

      const data = buildSubmitData('tc-1', form)
      expect(data.status).toBe('FAIL')
    })

    it('includes notes when provided', () => {
      const form: RunExecutorFormState = {
        environment: 'staging',
        status: 'PASS',
        notes: 'All steps passed without issues',
      }

      const data = buildSubmitData('tc-1', form)
      expect(data.notes).toBe('All steps passed without issues')
    })

    it('excludes notes when empty (undefined)', () => {
      const form: RunExecutorFormState = {
        environment: 'staging',
        status: 'PASS',
        notes: '',
      }

      const data = buildSubmitData('tc-1', form)
      expect(data.notes).toBeUndefined()
    })
  })
})
