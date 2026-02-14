import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { TestCaseDetailPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import { mockProjectApi, mockTestCaseDetailApis, mockCreateTestRunApi } from './helpers'

/**
 * E2E tests for the RunExecutor modal on the test case detail page.
 *
 * Tests cover opening the modal, displaying test case info and steps,
 * environment/status dropdowns, form validation, submission, and cancellation.
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

async function setupPage(page: Page, testCase = MOCK_TEST_CASE_STEP_BASED) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestCaseDetailApis(page, testCase.id, { testCase })
}

test.describe('Test Execution - RunExecutor Modal', () => {
  test('"Run Test" button opens the RunExecutor modal', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    await detail.runTestButton.click()

    // Modal should open with title
    await expect(detail.runExecutorModal.modalTitle).toBeVisible()
  })

  test('RunExecutor displays test case name and steps', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Test case name should appear inside the modal
    await expect(detail.runExecutorModal.heading('Login with valid credentials')).toBeVisible()

    // Steps heading
    await expect(detail.runExecutorModal.stepsHeading).toBeVisible()

    // Individual steps should be visible
    await expect(detail.runExecutorModal.stepText('Navigate to login page')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('Enter valid email')).toBeVisible()
    await expect(detail.runExecutorModal.stepText('Click Sign In button')).toBeVisible()
  })

  test('RunExecutor environment dropdown has all options', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Click the environment select to open dropdown
    await detail.runExecutorModal.environmentSelect.click()

    // All environment options
    await expect(detail.runExecutorModal.environmentOption('Development')).toBeVisible()
    await expect(detail.runExecutorModal.environmentOption('Staging')).toBeVisible()
    await expect(detail.runExecutorModal.environmentOption('Production')).toBeVisible()
    await expect(detail.runExecutorModal.environmentOption('QA')).toBeVisible()
  })

  test('RunExecutor status dropdown has all options', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Click the status select to open dropdown
    await detail.runExecutorModal.statusSelect.click()

    // All status options (use exact match to avoid matching "Password" etc.)
    await expect(detail.runExecutorModal.statusOption('Pass')).toBeVisible()
    await expect(detail.runExecutorModal.statusOption('Fail')).toBeVisible()
    await expect(detail.runExecutorModal.statusOption('Blocked')).toBeVisible()
    await expect(detail.runExecutorModal.statusOption('Skipped')).toBeVisible()
    await expect(detail.runExecutorModal.statusOption('In Progress')).toBeVisible()
  })

  test('RunExecutor submit button disabled until environment and status selected', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Submit button should be disabled initially
    await expect(detail.runExecutorModal.submitButton).toBeDisabled()
  })

  test('RunExecutor submit enabled after selecting environment and status', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment
    await detail.runExecutorModal.environmentSelect.click()
    await detail.runExecutorModal.environmentOption('Staging').click()

    // Select status
    await detail.runExecutorModal.statusSelect.click()
    await page.getByText('Pass', { exact: true }).click()

    // Submit button should now be enabled
    await expect(detail.runExecutorModal.submitButton).toBeEnabled()
  })

  test('RunExecutor successful submission closes modal', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    // Mock the POST endpoint for creating a test run
    await mockCreateTestRunApi(page, {
      id: 'run-new',
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date().toISOString(),
      environment: 'staging',
      status: 'PASS',
      duration: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Select environment
    await detail.runExecutorModal.environmentSelect.click()
    await detail.runExecutorModal.environmentOption('Staging').click()

    // Select status
    await detail.runExecutorModal.statusSelect.click()
    await page.getByText('Pass', { exact: true }).click()

    // Submit
    await detail.runExecutorModal.submitButton.click()

    // Modal should close
    await expect(detail.runExecutorModal.modalTitle).not.toBeVisible()
  })

  test('RunExecutor cancel button closes modal and resets form', async ({ page }) => {
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

  test('RunExecutor notes field accepts text input', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')
    await detail.runTestButton.click()

    // Fill notes
    await detail.runExecutorModal.notesField.fill('Login button was slow to respond')

    await expect(detail.runExecutorModal.notesField).toHaveValue('Login button was slow to respond')
  })

  test('RunExecutor shows Gherkin scenario for BDD test cases', async ({ page }) => {
    await setupPage(page, MOCK_TEST_CASE_GHERKIN)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-2')
    await detail.runTestButton.click()

    // Gherkin heading
    await expect(detail.runExecutorModal.gherkinHeading).toBeVisible()

    // Gherkin content should be visible
    await expect(detail.runExecutorModal.stepText('Feature: Password Reset')).toBeVisible()
    await expect(detail.runExecutorModal.stepText(/Given the user is on the login page/)).toBeVisible()
  })
})
