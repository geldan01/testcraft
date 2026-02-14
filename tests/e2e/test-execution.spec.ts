import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { TestCaseDetailPage, TestRunDetailPage, TestRunsPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import {
  mockProjectApi,
  mockTestCaseDetailApis,
  mockStartTestRunApi,
  mockCompleteTestRunApi,
  mockDeleteTestRunApi,
  mockTestRunDetailApi,
  mockTestRunsListApi,
  mockTestRunAttachmentsApi,
} from './helpers'

/**
 * E2E tests for the two-phase test execution flow.
 *
 * The RunExecutor modal operates in two phases:
 *   Phase 1 (Setup): Select environment, add notes, click "Start Run"
 *   Phase 2 (Active): Timer runs, select result status, click "Complete Run"
 *
 * Tests also cover close confirmation (Continue Later / Discard / Go Back),
 * the Test Run Detail page completion card, and the Test Runs list page.
 *
 * All API calls are intercepted with page.route() -- no running backend needed.
 */

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_TEST_CASE_STEP_BASED = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Verify that a user can log in with correct email and password',
  projectId: 'project-1',
  preconditions: ['User account must exist'],
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
  gherkinSyntax:
    'Feature: Password Reset\n  Scenario: User resets password\n    Given the user is on the login page\n    When the user clicks "Forgot Password"\n    Then a reset email is sent',
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
  id: 'run-1',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'staging',
  status: 'IN_PROGRESS',
  duration: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: MOCK_TEST_CASE_STEP_BASED,
  executedBy: MOCK_USER,
}

const MOCK_COMPLETED_RUN = {
  ...MOCK_STARTED_RUN,
  id: 'run-2',
  status: 'PASS',
  duration: 120,
  notes: 'All steps passed successfully',
}

const MOCK_TEST_RUN_IN_PROGRESS = {
  ...MOCK_STARTED_RUN,
  attachments: [],
  testCase: {
    ...MOCK_TEST_CASE_STEP_BASED,
    project: { organizationId: 'org-1' },
    createdBy: MOCK_USER,
  },
}

const MOCK_TEST_RUN_COMPLETED = {
  ...MOCK_COMPLETED_RUN,
  attachments: [],
  testCase: {
    ...MOCK_TEST_CASE_STEP_BASED,
    project: { organizationId: 'org-1' },
    createdBy: MOCK_USER,
  },
}

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/**
 * Sets up mocks for the test case detail page (used by RunExecutor modal tests).
 * Mocks: project API, test case detail APIs, and auth/me for the current user.
 */
async function setupTestCasePage(
  page: Page,
  testCase: typeof MOCK_TEST_CASE_STEP_BASED | typeof MOCK_TEST_CASE_GHERKIN = MOCK_TEST_CASE_STEP_BASED,
) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestCaseDetailApis(page, testCase.id, { testCase })
  await mockAuthMeApi(page)
}

/**
 * Sets up mocks for the test run detail page.
 * Mocks: project API, test run detail, attachments, comments, and auth/me.
 */
async function setupTestRunDetailPage(page: Page, run: object, runId: string) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestRunDetailApi(page, runId, run)
  await mockTestRunAttachmentsApi(page, runId, [])
  await mockAuthMeApi(page)

  // Mock comments endpoint for the run detail page
  await page.route(`**/api/test-runs/${runId}/comments`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
}

/**
 * Sets up mocks for the test runs list page.
 */
async function setupTestRunsListPage(page: Page, runs: object[]) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestRunsListApi(page, 'project-1', runs)
  await mockAuthMeApi(page)
}

/**
 * Mocks the /api/auth/me endpoint so the auth store has the current user.
 * NOTE: This mock may not intercept Nuxt's internal $fetch calls.
 * For tests that depend on isOwner, use getRealUser() instead.
 */
async function mockAuthMeApi(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    })
  })
}

/**
 * Gets the real logged-in user via the API (uses the auth cookie set by the fixture).
 * This is needed because page.route() cannot reliably intercept Nuxt's $fetch('/api/auth/me').
 * For tests that need isOwner to be true, use this user's ID in mock run data.
 */
async function getRealUser(page: Page) {
  const cookies = await page.context().cookies()
  const authCookie = cookies.find((c) => c.name === 'auth_token')
  if (!authCookie) throw new Error('No auth_token cookie found — is the auth fixture working?')

  const response = await page.request.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${authCookie.value}` },
  })
  return response.json()
}

/**
 * Opens the RunExecutor modal from the test case detail page.
 * Returns the detail page POM with modal already open.
 */
async function openRunExecutorModal(
  page: Page,
  testCase: typeof MOCK_TEST_CASE_STEP_BASED | typeof MOCK_TEST_CASE_GHERKIN = MOCK_TEST_CASE_STEP_BASED,
): Promise<TestCaseDetailPage> {
  const detail = new TestCaseDetailPage(page)
  await detail.goto('project-1', testCase.id)
  await detail.runTestButton.click()
  await expect(detail.runExecutorModal.modalTitle).toBeVisible()
  return detail
}

/**
 * Opens the RunExecutor modal and starts a run (Phase 1 -> Phase 2).
 * Mocks the startTestRunApi before clicking "Start Run".
 */
async function openAndStartRun(page: Page): Promise<TestCaseDetailPage> {
  await mockStartTestRunApi(page, MOCK_STARTED_RUN)
  const detail = await openRunExecutorModal(page)
  const modal = detail.runExecutorModal

  // Phase 1: select environment and start the run
  await modal.environmentSelect.selectOption('staging')
  await modal.startRunButton.click()

  // Wait for Phase 2 indicators
  await expect(modal.elapsedTimeLabel).toBeVisible()

  return detail
}

// ===========================================================================
// Group 1: RunExecutor Modal -- Opening & Display
// ===========================================================================

test.describe('RunExecutor Modal - Display', () => {
  test('Run Test button opens modal with test case info', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // Modal title
    await expect(modal.modalTitle).toBeVisible()

    // Test case name displayed as heading
    await expect(modal.heading('Login with valid credentials')).toBeVisible()
  })

  test('Step-based test displays steps in modal', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // Steps heading
    await expect(modal.stepsHeading).toBeVisible()

    // Each step action text should be visible
    await expect(modal.stepText('Navigate to login page')).toBeVisible()
    await expect(modal.stepText('Enter valid email')).toBeVisible()
    await expect(modal.stepText('Enter valid password')).toBeVisible()
    await expect(modal.stepText('Click Sign In button')).toBeVisible()
  })

  test('Gherkin test displays scenario in modal', async ({ page }) => {
    await setupTestCasePage(page, MOCK_TEST_CASE_GHERKIN)
    const detail = await openRunExecutorModal(page, MOCK_TEST_CASE_GHERKIN)
    const modal = detail.runExecutorModal

    // Gherkin heading instead of steps heading
    await expect(modal.gherkinHeading).toBeVisible()
    await expect(modal.stepsHeading).not.toBeVisible()

    // Gherkin content visible
    await expect(modal.stepText('Feature: Password Reset')).toBeVisible()
    await expect(modal.stepText(/Given the user is on the login page/)).toBeVisible()
    await expect(modal.stepText(/When the user clicks/)).toBeVisible()
    await expect(modal.stepText(/Then a reset email is sent/)).toBeVisible()
  })

  test('Environment selector shows predefined options', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // The native <select> should have the predefined environment options.
    // Use locator to inspect <option> elements within the select.
    const options = modal.environmentSelect.locator('option')

    // Expect the standard environments (excluding the disabled placeholder option)
    await expect(options.filter({ hasText: 'Development' })).toHaveCount(1)
    await expect(options.filter({ hasText: 'Staging' })).toHaveCount(1)
    await expect(options.filter({ hasText: 'Production' })).toHaveCount(1)
    await expect(options.filter({ hasText: 'QA' })).toHaveCount(1)
  })
})

// ===========================================================================
// Group 2: RunExecutor Modal -- Start Run Flow
// ===========================================================================

test.describe('RunExecutor Modal - Start Run', () => {
  test('Start Run button is disabled until environment selected', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // Initially the Start Run button should be disabled
    await expect(modal.startRunButton).toBeDisabled()
  })

  test('Selecting environment enables Start Run button', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // Disabled before selection
    await expect(modal.startRunButton).toBeDisabled()

    // Select an environment
    await modal.environmentSelect.selectOption('staging')

    // Now enabled
    await expect(modal.startRunButton).toBeEnabled()
  })

  test('Starting run shows timer and status selector', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Timer should be visible
    await expect(modal.elapsedTimeLabel).toBeVisible()

    // Status selector should be visible (second <select> in modal)
    await expect(modal.statusSelect).toBeVisible()

    // Environment selector should now be disabled
    await expect(modal.environmentSelect).toBeDisabled()

    // Complete Run button should be present
    await expect(modal.completeRunButton).toBeVisible()
  })

  test('Complete Run button disabled until status selected', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Complete Run button is disabled when status is still the placeholder (NOT_RUN)
    await expect(modal.completeRunButton).toBeDisabled()
  })
})

// ===========================================================================
// Group 3: RunExecutor Modal -- Complete Run Flow
// ===========================================================================

test.describe('RunExecutor Modal - Complete Run', () => {
  test('Selecting status enables Complete Run button', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Disabled before selecting status
    await expect(modal.completeRunButton).toBeDisabled()

    // Select a result status
    await modal.statusSelect.selectOption('PASS')

    // Now enabled
    await expect(modal.completeRunButton).toBeEnabled()
  })

  test('Completing run closes modal', async ({ page }) => {
    await setupTestCasePage(page)
    await mockCompleteTestRunApi(page, 'run-1', {
      ...MOCK_STARTED_RUN,
      status: 'PASS',
      duration: 5,
      notes: null,
    })

    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Select status and complete
    await modal.statusSelect.selectOption('PASS')
    await modal.completeRunButton.click()

    // Modal should close
    await expect(modal.container).not.toBeVisible()
  })

  test('Notes are included in completion', async ({ page }) => {
    await setupTestCasePage(page)

    // Capture the request body to verify notes are sent
    let capturedBody: Record<string, unknown> | null = null
    await page.route('**/api/test-runs/run-1/complete', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedBody = JSON.parse(route.request().postData() ?? '{}')
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_STARTED_RUN,
            status: 'FAIL',
            duration: 10,
            notes: 'Found a regression in the login button',
          }),
        })
      } else {
        await route.continue()
      }
    })

    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Fill in notes
    await modal.notesField.fill('Found a regression in the login button')

    // Select status and complete
    await modal.statusSelect.selectOption('FAIL')
    await modal.completeRunButton.click()

    // Modal should close
    await expect(modal.container).not.toBeVisible()

    // Verify the notes were included in the request
    expect(capturedBody).not.toBeNull()
    expect(capturedBody!.notes).toBe('Found a regression in the login button')
  })
})

// ===========================================================================
// Group 4: RunExecutor Modal -- Cancel / Close Flows
// ===========================================================================

test.describe('RunExecutor Modal - Close Flows', () => {
  test('Cancel before starting closes modal directly', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openRunExecutorModal(page)
    const modal = detail.runExecutorModal

    // Modal is visible
    await expect(modal.container).toBeVisible()

    // Cancel closes immediately (no active run yet)
    await modal.cancelButton.click()

    // Modal should close without showing any confirmation
    await expect(modal.container).not.toBeVisible()
  })

  test('Cancel after starting shows close confirmation', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Click cancel while a run is in progress
    await modal.cancelButton.click()

    // Close confirmation should appear
    await expect(modal.closeConfirmationWarning).toBeVisible()
    await expect(modal.continueLaterButton).toBeVisible()
    await expect(modal.discardRunButton).toBeVisible()
    await expect(modal.goBackButton).toBeVisible()
  })

  test('Go Back to Run returns to run form', async ({ page }) => {
    await setupTestCasePage(page)
    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Open close confirmation
    await modal.cancelButton.click()
    await expect(modal.closeConfirmationWarning).toBeVisible()

    // Click "Go Back to Run"
    await modal.goBackButton.click()

    // Should return to the active run form (Phase 2)
    await expect(modal.closeConfirmationWarning).not.toBeVisible()
    await expect(modal.elapsedTimeLabel).toBeVisible()
    await expect(modal.statusSelect).toBeVisible()
    await expect(modal.completeRunButton).toBeVisible()
  })

  test('Discard Run deletes the run and closes modal', async ({ page }) => {
    await setupTestCasePage(page)
    await mockDeleteTestRunApi(page, 'run-1')

    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Open close confirmation
    await modal.cancelButton.click()
    await expect(modal.closeConfirmationWarning).toBeVisible()

    // Click "Discard Run"
    await modal.discardRunButton.click()

    // Modal should close completely
    await expect(modal.container).not.toBeVisible()
  })

  test('Continue Later navigates to test run detail page', async ({ page }) => {
    await setupTestCasePage(page)

    // Also mock the detail page endpoints for navigation destination
    await setupTestRunDetailPage(page, MOCK_TEST_RUN_IN_PROGRESS, 'run-1')

    const detail = await openAndStartRun(page)
    const modal = detail.runExecutorModal

    // Open close confirmation
    await modal.cancelButton.click()
    await expect(modal.closeConfirmationWarning).toBeVisible()

    // Click "Continue Later"
    await modal.continueLaterButton.click()

    // Should navigate to the test run detail page
    await page.waitForURL(/\/projects\/.*\/test-runs\/.*/)
    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\/run-1/)
  })
})

// ===========================================================================
// Group 5: Test Run Detail Page -- Completion
// ===========================================================================

test.describe('Test Run Detail Page - Completion', () => {
  test('IN_PROGRESS run shows Complete This Run card', async ({ page }) => {
    // Use the real user's ID so isOwner is true
    const realUser = await getRealUser(page)
    const run = {
      ...MOCK_TEST_RUN_IN_PROGRESS,
      executedById: realUser.id,
      executedBy: realUser,
    }
    await setupTestRunDetailPage(page, run, 'run-1')

    const detail = new TestRunDetailPage(page)
    await detail.goto('project-1', 'run-1')

    // The completion card should be visible
    await expect(detail.completeThisRunHeading).toBeVisible()
    await expect(detail.completionStatusSelect).toBeVisible()
    await expect(detail.completeRunButton).toBeVisible()
    await expect(detail.discardRunButton).toBeVisible()
  })

  test('Completing run from detail page updates status', async ({ page }) => {
    // Use the real user's ID so isOwner is true
    const realUser = await getRealUser(page)
    const run = {
      ...MOCK_TEST_RUN_IN_PROGRESS,
      executedById: realUser.id,
      executedBy: realUser,
    }
    await setupTestRunDetailPage(page, run, 'run-1')
    await mockCompleteTestRunApi(page, 'run-1', {
      ...run,
      status: 'PASS',
      duration: 60,
      notes: 'Verified all steps',
    })

    const detail = new TestRunDetailPage(page)
    await detail.goto('project-1', 'run-1')

    // Fill in the completion form
    await detail.completionStatusSelect.selectOption('PASS')
    await detail.completionNotesField.fill('Verified all steps')
    await detail.completeRunButton.click()

    // After completion, the "Complete This Run" heading should disappear
    await expect(detail.completeThisRunHeading).not.toBeVisible()
  })

  test('Discard from detail page deletes run and navigates to runs list', async ({ page }) => {
    // Use the real user's ID so isOwner is true
    const realUser = await getRealUser(page)
    const run = {
      ...MOCK_TEST_RUN_IN_PROGRESS,
      executedById: realUser.id,
      executedBy: realUser,
    }

    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunAttachmentsApi(page, 'run-1', [])
    // Mock the runs list for the navigation destination
    await mockTestRunsListApi(page, 'project-1', [])

    // Mock comments endpoint for the run detail page
    await page.route('**/api/test-runs/run-1/comments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Combined handler for GET (detail) and DELETE (discard) on same URL pattern
    await page.route('**/api/test-runs/run-1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(run),
        })
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.continue()
      }
    })

    const detail = new TestRunDetailPage(page)
    await detail.goto('project-1', 'run-1')

    // Click Discard Run
    await detail.discardRunButton.click()

    // Inline confirmation should appear
    await expect(detail.confirmDiscardButton).toBeVisible()
    await expect(detail.cancelDiscardButton).toBeVisible()

    // Confirm the discard
    await detail.confirmDiscardButton.click()

    // Should navigate to the runs list page
    await page.waitForURL(/\/projects\/project-1\/runs/)
    await expect(page).toHaveURL(/\/projects\/project-1\/runs/)
  })

  test('Completed run does not show completion card', async ({ page }) => {
    await setupTestRunDetailPage(page, MOCK_TEST_RUN_COMPLETED, 'run-2')

    const detail = new TestRunDetailPage(page)
    await detail.goto('project-1', 'run-2')

    // The completion card should NOT be shown for a completed run
    await expect(detail.completeThisRunHeading).not.toBeVisible()

    // Standard info cards should still be visible
    await expect(detail.runInfoHeading).toBeVisible()
  })
})

// ===========================================================================
// Group 6: Test Runs List
// ===========================================================================

test.describe('Test Runs List', () => {
  const MOCK_RUNS_LIST = [
    {
      id: 'run-active',
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date().toISOString(),
      environment: 'staging',
      status: 'IN_PROGRESS',
      duration: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCase: { id: 'tc-1', name: 'Login with valid credentials' },
      executedBy: MOCK_USER,
    },
    {
      id: 'run-done',
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date().toISOString(),
      environment: 'production',
      status: 'PASS',
      duration: 45,
      notes: 'All good',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCase: { id: 'tc-1', name: 'Login with valid credentials' },
      executedBy: MOCK_USER,
    },
  ]

  test('IN_PROGRESS rows have amber highlight', async ({ page }) => {
    await setupTestRunsListPage(page, MOCK_RUNS_LIST)

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // The IN_PROGRESS status badge should be visible
    await expect(runsPage.statusBadges.filter({ hasText: 'In Progress' })).toBeVisible()

    // The row containing the in-progress run should have an amber/yellow background tint.
    // Locate the table row that contains the "In Progress" text and verify its class.
    const inProgressRow = page.locator('tr').filter({ hasText: 'In Progress' })
    await expect(inProgressRow).toBeVisible()
    // The amber tint is applied via Tailwind bg-amber-50/50; verify a non-transparent background
    const bg = await inProgressRow.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
    expect(bg).not.toBe('transparent')
  })

  test('Clicking a run navigates to detail page', async ({ page }) => {
    await setupTestRunsListPage(page, MOCK_RUNS_LIST)

    // Also mock the detail page endpoint for navigation
    await setupTestRunDetailPage(page, MOCK_TEST_RUN_COMPLETED, 'run-done')

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Click on a run row (the test case name link or the row itself)
    const runRow = page.locator('tr').filter({ hasText: 'Pass' }).first()
    await runRow.click()

    // Should navigate to the run detail page
    await page.waitForURL(/\/projects\/project-1\/test-runs\//)
    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\//)
  })
})
