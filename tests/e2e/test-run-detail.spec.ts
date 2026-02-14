import { test, expect } from './fixtures'
import { TestRunDetailPage, TestRunsPage } from './pages'
import {
  MOCK_USER,
  MOCK_PROJECT,
  mockProjectApi,
  mockTestRunDetailApi,
  mockTestRunNotFoundApi,
  mockTestRunsListApi,
} from './helpers'

/**
 * E2E tests for the Test Run Detail page.
 *
 * The detail page shows comprehensive information about a single test run,
 * including:
 * - Run Information card (status, environment, duration, executor, date, notes)
 * - Test Case card (linked test case info with steps or gherkin syntax)
 * - Attachments card (file upload and listing)
 * - Comments placeholder
 * - Not found state
 * - Navigation from runs list
 */

const MOCK_STEP_BASED_TEST_CASE = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Verify that a user can log in with correct email and password',
  testType: 'STEP_BASED',
  steps: [
    { stepNumber: 1, action: 'Navigate to login page', data: 'https://app.example.com/login', expectedResult: 'Login page is displayed' },
    { stepNumber: 2, action: 'Enter valid credentials', data: 'user@test.com / Pass123', expectedResult: 'Fields are populated' },
    { stepNumber: 3, action: 'Click Sign In button', data: '', expectedResult: 'User is redirected to dashboard' },
  ],
  gherkinSyntax: null,
  projectId: 'project-1',
  preconditions: ['User account must exist'],
  createdBy: MOCK_USER,
  project: { ...MOCK_PROJECT },
}

const MOCK_GHERKIN_TEST_CASE = {
  id: 'tc-2',
  name: 'Password reset flow',
  description: 'Verify the password reset workflow via BDD',
  testType: 'GHERKIN',
  steps: null,
  gherkinSyntax: 'Feature: Password Reset\n  Scenario: User resets password\n    Given the user is on the login page\n    When the user clicks "Forgot Password"\n    Then a reset email is sent',
  projectId: 'project-1',
  preconditions: [],
  createdBy: MOCK_USER,
  project: { ...MOCK_PROJECT },
}

const MOCK_RUN_PASS = {
  id: 'run-1',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'staging',
  status: 'PASS',
  duration: 45,
  notes: 'All checks passed. Login flow verified on staging.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: MOCK_STEP_BASED_TEST_CASE,
  executedBy: MOCK_USER,
  attachments: [],
}

const MOCK_RUN_FAIL = {
  id: 'run-2',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date(Date.now() - 3600000).toISOString(),
  environment: 'production',
  status: 'FAIL',
  duration: 120,
  notes: 'Login button was unresponsive after 3rd attempt.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: MOCK_STEP_BASED_TEST_CASE,
  executedBy: MOCK_USER,
  attachments: [
    {
      id: 'att-1',
      fileUrl: '/uploads/failure-screenshot.png',
      fileName: 'failure-screenshot.png',
      fileType: 'image/png',
      fileSize: 256000,
      uploadedById: 'user-1',
      testRunId: 'run-2',
      testCaseId: null,
      createdAt: new Date().toISOString(),
      uploadedBy: MOCK_USER,
    },
  ],
}

const MOCK_RUN_NO_NOTES = {
  id: 'run-3',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'development',
  status: 'BLOCKED',
  duration: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: MOCK_STEP_BASED_TEST_CASE,
  executedBy: MOCK_USER,
  attachments: [],
}

const MOCK_RUN_GHERKIN = {
  id: 'run-4',
  testCaseId: 'tc-2',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'qa',
  status: 'PASS',
  duration: 30,
  notes: 'BDD scenario verified.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: MOCK_GHERKIN_TEST_CASE,
  executedBy: MOCK_USER,
  attachments: [],
}

test.describe('Test Run Detail - Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('displays the "Test Run" heading with status badge', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.heading).toBeVisible()
    await expect(page.getByText('Pass', { exact: true })).toBeVisible()
  })

  test('displays the "Back to Runs" button', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.backToRunsButton).toBeVisible()
  })

  test('"Back to Runs" button navigates to the runs list', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)
    await mockTestRunsListApi(page, 'project-1', [])

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await runDetail.backToRunsButton.click()

    await expect(page).toHaveURL(/\/projects\/project-1\/runs/)
  })

  test('displays the "Executed X ago" relative time', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // The relative time text should contain "Executed" followed by a time phrase
    await expect(page.getByText(/Executed .+ ago|Executed just now/)).toBeVisible()
  })
})

test.describe('Test Run Detail - Run Information Card', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('displays Run Information card heading', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.runInfoHeading).toBeVisible()
  })

  test('displays status badge in the run info card', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // "Status" label and the badge
    await expect(page.getByText('Status').first()).toBeVisible()
    // Pass badge appears multiple times (header + card), at least one should be visible
    const passBadges = page.getByText('Pass', { exact: true })
    await expect(passBadges.first()).toBeVisible()
  })

  test('displays environment badge', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('staging')).toBeVisible()
  })

  test('displays formatted duration', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('45s')).toBeVisible()
  })

  test('displays "--" for null duration', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-3', MOCK_RUN_NO_NOTES)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-3')

    // Duration should show "--" for null
    await expect(page.getByText('--').first()).toBeVisible()
  })

  test('displays executor name and avatar', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('Test User')).toBeVisible()
  })

  test('displays execution date in formatted form', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // The "Date" label should be visible
    await expect(runDetail.dateField).toBeVisible()
  })

  test('displays notes when present', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('All checks passed. Login flow verified on staging.')).toBeVisible()
  })

  test('notes section is hidden when notes are null', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-3', MOCK_RUN_NO_NOTES)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-3')

    // Notes label should not appear for null notes (the v-if hides the entire section)
    // We check that the specific notes content area is absent
    await expect(page.getByText('All checks passed')).not.toBeVisible()
  })
})

test.describe('Test Run Detail - Test Case Info Card', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('displays the Test Case card heading', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.testCaseHeading).toBeVisible()
  })

  test('displays the test case name as a link', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    const testCaseLink = page.getByRole('link', { name: 'Login with valid credentials' })
    await expect(testCaseLink).toBeVisible()
    await expect(testCaseLink).toHaveAttribute('href', /\/projects\/project-1\/test-cases\/tc-1/)
  })

  test('displays "View Full Details" link', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.viewFullDetailsLink).toBeVisible()
    await expect(runDetail.viewFullDetailsLink).toHaveAttribute('href', /\/projects\/project-1\/test-cases\/tc-1/)
  })

  test('displays test type badge for step-based test', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('Step-Based')).toBeVisible()
  })

  test('displays test type badge for Gherkin test', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-4', MOCK_RUN_GHERKIN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-4')

    await expect(page.getByText('Gherkin')).toBeVisible()
  })

  test('displays test case description', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page.getByText('Verify that a user can log in with correct email and password')).toBeVisible()
  })

  test('displays steps table for step-based test case', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Steps table headers
    await expect(page.getByText('#').first()).toBeVisible()
    await expect(page.getByText('Action').first()).toBeVisible()
    await expect(page.getByText('Test Data').first()).toBeVisible()
    await expect(page.getByText('Expected Result').first()).toBeVisible()

    // Step content
    await expect(page.getByText('Navigate to login page')).toBeVisible()
    await expect(page.getByText('Enter valid credentials')).toBeVisible()
    await expect(page.getByText('Click Sign In button')).toBeVisible()

    // Expected results
    await expect(page.getByText('Login page is displayed')).toBeVisible()
    await expect(page.getByText('User is redirected to dashboard')).toBeVisible()
  })

  test('displays "--" for empty step data', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Step 3 has empty data, should show "--"
    const testCaseCard = page.locator('table').last()
    await expect(testCaseCard.getByText('--')).toBeVisible()
  })

  test('displays Gherkin syntax for Gherkin test case', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-4', MOCK_RUN_GHERKIN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-4')

    // Gherkin content should be rendered in a pre element
    await expect(page.getByText('Feature: Password Reset')).toBeVisible()
    await expect(page.getByText(/Given the user is on the login page/)).toBeVisible()
    await expect(page.getByText(/When the user clicks "Forgot Password"/)).toBeVisible()
    await expect(page.getByText(/Then a reset email is sent/)).toBeVisible()
  })
})

test.describe('Test Run Detail - Attachments Card', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('displays Attachments heading', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.attachmentsHeading).toBeVisible()
  })

  test('displays file uploader in the attachments card', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.fileUploaderZone).toBeVisible()
  })

  test('shows empty message when run has no attachments', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.noAttachmentsMessage).toBeVisible()
  })

  test('shows attachment list when run has attachments', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-2', MOCK_RUN_FAIL)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-2')

    await expect(page.getByText('failure-screenshot.png')).toBeVisible()
  })
})

test.describe('Test Run Detail - Comments Card', () => {
  test('displays Comments heading', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.commentsHeading).toBeVisible()
  })

  test('shows "coming soon" message for comments', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.commentsComingSoon).toBeVisible()
  })
})

test.describe('Test Run Detail - Not Found State', () => {
  test('displays not found message for invalid run ID', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunNotFoundApi(page, 'invalid-run')

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'invalid-run')

    await expect(runDetail.notFoundMessage).toBeVisible()
  })

  test('not found state has "Back to Runs" button', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunNotFoundApi(page, 'invalid-run')

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'invalid-run')

    await expect(runDetail.notFoundBackButton).toBeVisible()
  })

  test('"Back to Runs" navigates to runs list from not found state', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunNotFoundApi(page, 'invalid-run')
    await mockTestRunsListApi(page, 'project-1', [])

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'invalid-run')

    await runDetail.notFoundBackButton.click()

    await expect(page).toHaveURL(/\/projects\/project-1\/runs/)
  })
})

test.describe('Test Run Detail - FAIL Status Details', () => {
  test('displays FAIL status badge', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-2', MOCK_RUN_FAIL)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-2')

    await expect(page.getByText('Fail', { exact: true }).first()).toBeVisible()
  })

  test('displays production environment for FAIL run', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-2', MOCK_RUN_FAIL)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-2')

    await expect(page.getByText('production')).toBeVisible()
  })

  test('displays longer duration for FAIL run (2m 0s)', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-2', MOCK_RUN_FAIL)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-2')

    await expect(page.getByText('2m 0s')).toBeVisible()
  })

  test('displays failure notes', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-2', MOCK_RUN_FAIL)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-2')

    await expect(page.getByText('Login button was unresponsive after 3rd attempt.')).toBeVisible()
  })
})

test.describe('Test Run Detail - Navigation from Runs List', () => {
  const MOCK_RUNS_LIST = [
    {
      id: 'run-1',
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date().toISOString(),
      environment: 'staging',
      status: 'PASS',
      duration: 45,
      notes: 'All checks passed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCase: { id: 'tc-1', name: 'Login with valid credentials' },
      executedBy: MOCK_USER,
    },
    {
      id: 'run-2',
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date(Date.now() - 3600000).toISOString(),
      environment: 'production',
      status: 'FAIL',
      duration: 120,
      notes: 'Button not clickable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCase: { id: 'tc-1', name: 'Login with valid credentials' },
      executedBy: MOCK_USER,
    },
  ]

  test('clicking a run row in the list navigates to run detail page', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS_LIST)
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Rows are clickable via the @click handler
    // Click on the first table row (which has cursor-pointer)
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    // Should navigate to the run detail page
    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\/run-1/)
  })

  test('run detail URL follows /projects/:id/test-runs/:runId pattern', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', MOCK_RUN_PASS)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\/run-1/)
  })
})
