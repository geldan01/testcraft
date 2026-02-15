import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { TestCaseDetailPage } from './pages'
import {
  MOCK_USER,
  MOCK_PROJECT,
  mockProjectApi,
  mockTestCaseDetailApis,
  mockStartTestRunApi,
  mockCompleteTestRunApi,
} from './helpers'

/**
 * E2E tests for the two-phase test run execution flow (Start Run -> Complete Run).
 *
 * The Phase 2 RunExecutor has a two-step workflow:
 * 1. Select environment and click "Start Run" -> POST /api/test-runs/start
 *    This creates an IN_PROGRESS run and starts a timer.
 * 2. Select a result status (PASS/FAIL/BLOCKED/SKIPPED), add notes, then
 *    click "Complete Run" -> PUT /api/test-runs/:id/complete
 *    This finalizes the run with the chosen status and elapsed duration.
 */

const MOCK_TEST_CASE_STEP_BASED = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Verify that a user can log in with correct email and password',
  projectId: 'project-1',
  preconditions: ['User account must exist', 'User must not be locked out'],
  testType: 'STEP_BASED',
  steps: [
    { stepNumber: 1, action: 'Navigate to login page', data: '', expectedResult: 'Login form is displayed' },
    { stepNumber: 2, action: 'Enter valid email', data: 'test@example.com', expectedResult: 'Email field populated' },
    { stepNumber: 3, action: 'Enter valid password', data: 'Password123!', expectedResult: 'Password field populated' },
    { stepNumber: 4, action: 'Click Sign In button', data: '', expectedResult: 'User is redirected to dashboard' },
  ],
  gherkinSyntax: null,
  debugFlag: false,
  debugFlaggedAt: null,
  debugFlaggedById: null,
  lastRunStatus: 'NOT_RUN',
  lastRunAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  debugFlaggedBy: null,
}

const MOCK_TEST_CASE_GHERKIN = {
  id: 'tc-2',
  name: 'Password reset flow',
  description: 'Verify the password reset workflow via BDD',
  projectId: 'project-1',
  preconditions: [],
  testType: 'GHERKIN',
  steps: null,
  gherkinSyntax: 'Feature: Password Reset\n  Scenario: User resets password\n    Given the user is on the login page\n    When the user clicks "Forgot Password"\n    Then a reset email is sent',
  debugFlag: false,
  debugFlaggedAt: null,
  debugFlaggedById: null,
  lastRunStatus: 'NOT_RUN',
  lastRunAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  debugFlaggedBy: null,
}

const MOCK_STARTED_RUN = {
  id: 'run-new-1',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'staging',
  status: 'IN_PROGRESS',
  duration: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: {
    id: 'tc-1',
    name: 'Login with valid credentials',
    description: 'Verify that a user can log in',
    testType: 'STEP_BASED',
    projectId: 'project-1',
    steps: MOCK_TEST_CASE_STEP_BASED.steps,
    gherkinSyntax: null,
    preconditions: MOCK_TEST_CASE_STEP_BASED.preconditions,
  },
  executedBy: MOCK_USER,
}

const MOCK_COMPLETED_RUN = {
  ...MOCK_STARTED_RUN,
  status: 'PASS',
  duration: 12000,
  notes: 'All steps verified successfully',
}

async function setupPage(
  page: Page,
  testCase: typeof MOCK_TEST_CASE_STEP_BASED | typeof MOCK_TEST_CASE_GHERKIN = MOCK_TEST_CASE_STEP_BASED,
) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestCaseDetailApis(page, testCase.id, { testCase })
}

test.describe('Test Execution Flow - Two-Phase (Start Run -> Complete Run)', () => {
  test('"Start Run" button is visible in the RunExecutor modal', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // The modal should show "Start Run" button (not "Submit Result" from old flow)
    await expect(page.getByRole('button', { name: 'Start Run' })).toBeVisible()
  })

  test('"Start Run" button is disabled when no environment is selected', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Start Run should be disabled without environment
    const startButton = page.getByRole('button', { name: 'Start Run' })
    await expect(startButton).toBeDisabled()
  })

  test('"Start Run" button enables after selecting an environment', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment
    await detail.runExecutorModal.environmentSelect.selectOption('staging')

    // Start Run should now be enabled
    const startButton = page.getByRole('button', { name: 'Start Run' })
    await expect(startButton).toBeEnabled()
  })

  test('clicking "Start Run" calls POST /api/test-runs/start and shows timer', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment
    await detail.runExecutorModal.environmentSelect.selectOption('staging')

    // Click Start Run
    const startButton = page.getByRole('button', { name: 'Start Run' })
    await startButton.click()

    // After starting: timer should appear with "Elapsed Time" label
    await expect(page.getByText('Elapsed Time')).toBeVisible()

    // The "Start Run" button should be replaced by "Complete Run"
    await expect(page.getByRole('button', { name: 'Complete Run' })).toBeVisible()
    await expect(startButton).not.toBeVisible()
  })

  test('timer displays elapsed time after starting a run', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Timer should show a time value (00:00 format initially)
    await expect(page.getByText('Elapsed Time')).toBeVisible()
    // The timer output should be visible - it starts at 00:00
    await expect(page.getByText(/\d{2}:\d{2}/)).toBeVisible()
  })

  test('environment selector is disabled after starting a run', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // After starting, the environment select should be disabled
    await expect(detail.runExecutorModal.environmentSelect).toBeDisabled()
  })

  test('result status dropdown appears after starting a run', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Before starting, status dropdown should NOT be visible
    await expect(page.getByText('Result Status')).not.toBeVisible()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // After starting, "Result Status" label should be visible
    await expect(page.getByText('Result Status')).toBeVisible()
  })

  test('"Complete Run" button is disabled until a result status is selected', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Complete Run should be disabled (no status selected yet, default is NOT_RUN)
    const completeButton = page.getByRole('button', { name: 'Complete Run' })
    await expect(completeButton).toBeDisabled()
  })

  test('selecting a result status enables "Complete Run" button', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Select result status
    await detail.runExecutorModal.statusSelect.selectOption('PASS')

    // Complete Run should now be enabled
    const completeButton = page.getByRole('button', { name: 'Complete Run' })
    await expect(completeButton).toBeEnabled()
  })

  test('completing a run with PASS status calls PUT /api/test-runs/:id/complete and closes modal', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)
    await mockCompleteTestRunApi(page, 'run-new-1', MOCK_COMPLETED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Select result status
    await detail.runExecutorModal.statusSelect.selectOption('PASS')

    // Click Complete Run
    await page.getByRole('button', { name: 'Complete Run' }).click()

    // Modal should close
    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('completing a run with FAIL status works correctly', async ({ page }) => {
    const failedRun = { ...MOCK_STARTED_RUN, status: 'FAIL', notes: 'Step 3 failed' }

    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)
    await mockCompleteTestRunApi(page, 'run-new-1', failedRun)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Select FAIL status
    await detail.runExecutorModal.statusSelect.selectOption('FAIL')

    // Add notes about the failure
    await detail.runExecutorModal.notesField.fill('Step 3 failed')
    await expect(detail.runExecutorModal.notesField).toHaveValue('Step 3 failed')

    // Complete the run
    await page.getByRole('button', { name: 'Complete Run' }).click()

    // Modal should close
    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('completing a run with BLOCKED status works correctly', async ({ page }) => {
    const blockedRun = { ...MOCK_STARTED_RUN, status: 'BLOCKED' }

    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)
    await mockCompleteTestRunApi(page, 'run-new-1', blockedRun)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('production')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Select BLOCKED status
    await detail.runExecutorModal.statusSelect.selectOption('BLOCKED')

    // Complete the run
    await page.getByRole('button', { name: 'Complete Run' }).click()

    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('completing a run with SKIPPED status works correctly', async ({ page }) => {
    const skippedRun = { ...MOCK_STARTED_RUN, status: 'SKIPPED' }

    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)
    await mockCompleteTestRunApi(page, 'run-new-1', skippedRun)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('qa')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Select SKIPPED status
    await detail.runExecutorModal.statusSelect.selectOption('SKIPPED')

    // Complete the run
    await page.getByRole('button', { name: 'Complete Run' }).click()

    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('notes field is available during both phases', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Notes field should be visible before starting
    await expect(detail.runExecutorModal.notesField).toBeVisible()
    await detail.runExecutorModal.notesField.fill('Pre-run observation: staging looks slow')
    await expect(detail.runExecutorModal.notesField).toHaveValue('Pre-run observation: staging looks slow')

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Notes field should still be visible after starting
    await expect(detail.runExecutorModal.notesField).toBeVisible()
  })

  test('cancel button closes modal and resets form during start phase', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Modal should be open
    await expect(detail.runExecutorModal.modalTitle).toBeVisible()

    // Click cancel
    await detail.runExecutorModal.cancelButton.click()

    // Modal should close
    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('cancel button during running phase closes modal', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment and start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Timer should be visible (run is active)
    await expect(page.getByText('Elapsed Time')).toBeVisible()

    // Click cancel — with an active run this shows the close confirmation
    await detail.runExecutorModal.cancelButton.click()

    // Close confirmation should appear (modal stays open but shows confirmation UI)
    await expect(detail.runExecutorModal.closeConfirmationWarning).toBeVisible()
  })

  test('RunExecutor displays test case info and test type badge', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Test case name should be in the modal (use heading role to avoid matching description text)
    await expect(detail.runExecutorModal.heading('Login with valid credentials')).toBeVisible()

    // Description should be visible
    await expect(page.locator('[role="dialog"]').getByText('Verify that a user can log in with correct email and password')).toBeVisible()

    // Test type badge
    await expect(page.locator('[role="dialog"]').getByText('Step-Based')).toBeVisible()
  })

  test('RunExecutor shows steps for step-based test cases', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Steps heading
    await expect(detail.runExecutorModal.stepsHeading).toBeVisible()

    // Individual steps
    await expect(detail.runExecutorModal.stepText('Navigate to login page')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('Enter valid email')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('Enter valid password')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('Click Sign In button')).toBeVisible()

    // Expected results should appear
    await expect(detail.runExecutorModal.stepText('Login form is displayed')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('User is redirected to dashboard')).toBeVisible()
  })

  test('RunExecutor shows Gherkin scenario for BDD test cases', async ({ page }) => {
    await setupPage(page, MOCK_TEST_CASE_GHERKIN)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-2')
    await detail.runTestButton.click()

    // Gherkin heading
    await expect(detail.runExecutorModal.gherkinHeading).toBeVisible()

    // Gherkin content
    await expect(detail.runExecutorModal.stepText('Feature: Password Reset')).toBeVisible()
    await expect(detail.runExecutorModal.stepText(/Given the user is on the login page/)).toBeVisible()
  })
})

test.describe('Test Execution Flow - EnvironmentSelector', () => {
  test('environment selector shows predefined options', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Native <select> options exist in the DOM but aren't "visible" in the Playwright sense.
    // Verify they exist as <option> elements inside the select.
    const select = detail.runExecutorModal.environmentSelect
    await expect(select.locator('option[value="development"]')).toHaveCount(1)
    await expect(select.locator('option[value="staging"]')).toHaveCount(1)
    await expect(select.locator('option[value="production"]')).toHaveCount(1)
    await expect(select.locator('option[value="qa"]')).toHaveCount(1)
  })

  test('environment selector has a "Custom..." option', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Verify the Custom option exists inside the native select
    const select = detail.runExecutorModal.environmentSelect
    await expect(select.locator('option[value="__custom__"]')).toHaveCount(1)
  })

  test('selecting "Custom..." shows a text input for custom environment', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select Custom via native select
    await detail.runExecutorModal.environmentSelect.selectOption('__custom__')

    // Custom input should appear
    await expect(page.getByPlaceholder('Enter custom environment...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Set' })).toBeVisible()
    await expect(page.locator('[role="dialog"]').getByRole('button', { name: 'Cancel' }).first()).toBeVisible()
  })

  test('custom environment "Set" button is disabled when input is empty', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    await detail.runExecutorModal.environmentSelect.selectOption('__custom__')

    // Set button should be disabled when empty
    await expect(page.getByRole('button', { name: 'Set' })).toBeDisabled()
  })

  test('custom environment can be set via text input', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, { ...MOCK_STARTED_RUN, environment: 'integration' })

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select Custom via native select
    await detail.runExecutorModal.environmentSelect.selectOption('__custom__')

    // Type custom environment
    await page.getByPlaceholder('Enter custom environment...').fill('Integration')
    await expect(page.getByRole('button', { name: 'Set' })).toBeEnabled()

    // Click Set
    await page.getByRole('button', { name: 'Set' }).click()

    // The Start Run button should now be enabled
    await expect(page.getByRole('button', { name: 'Start Run' })).toBeEnabled()
  })
})

test.describe('Test Execution Flow - API Call Verification', () => {
  test('Start Run sends correct payload to POST /api/test-runs/start', async ({ page }) => {
    await setupPage(page)

    let capturedPayload: Record<string, unknown> | null = null

    await page.route('**/api/test-runs/start', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_STARTED_RUN),
        })
      }
    })

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Wait for the API call
    await expect(page.getByText('Elapsed Time')).toBeVisible()

    // Verify the payload
    expect(capturedPayload).toBeTruthy()
    expect(capturedPayload!.testCaseId).toBe('tc-1')
    expect(capturedPayload!.environment).toBe('staging')
  })

  test('Complete Run sends correct payload to PUT /api/test-runs/:id/complete', async ({ page }) => {
    await setupPage(page)
    await mockStartTestRunApi(page, MOCK_STARTED_RUN)

    let capturedPayload: Record<string, unknown> | null = null

    await page.route('**/api/test-runs/run-new-1/complete', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedPayload = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_COMPLETED_RUN),
        })
      }
    })

    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Start
    await detail.runExecutorModal.environmentSelect.selectOption('staging')
    await page.getByRole('button', { name: 'Start Run' }).click()

    // Complete with PASS and notes
    await detail.runExecutorModal.statusSelect.selectOption('PASS')
    await detail.runExecutorModal.notesField.fill('All steps verified successfully')
    await page.getByRole('button', { name: 'Complete Run' }).click()

    // Modal should close
    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()

    // Verify the payload
    expect(capturedPayload).toBeTruthy()
    expect(capturedPayload!.status).toBe('PASS')
    expect(capturedPayload!.notes).toBe('All steps verified successfully')
    // Duration should be a number (elapsed milliseconds)
    expect(typeof capturedPayload!.duration).toBe('number')
  })
})
