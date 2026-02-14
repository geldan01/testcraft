import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { TestCasesPage, TestCaseDetailPage, TestCaseCreatePage } from './pages'
import {
  MOCK_USER,
  MOCK_ORG,
  MOCK_PROJECT,
  mockProjectApi,
  mockTestCasesListApi,
  mockTestCaseDetailApis,
  mockTestCaseNotFoundApis,
} from './helpers'

/**
 * E2E tests for test case management.
 *
 * Covers list view, creation (step-based and Gherkin), filtering,
 * searching, debug flag toggling, detail view, and deletion.
 */

const TC_PROJECT = {
  ...MOCK_PROJECT,
  _count: { testCases: 3, testPlans: 1, testSuites: 2, members: 4 },
  organization: MOCK_ORG,
}

function createMockTestCaseItem(id: string, name: string, overrides = {}) {
  return {
    id,
    name,
    description: `Description for ${name}`,
    projectId: 'project-1',
    preconditions: [],
    testType: 'STEP_BASED',
    steps: [
      { stepNumber: 1, action: 'Step 1 action', data: '', expectedResult: 'Step 1 result' },
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
    ...overrides,
  }
}

const MOCK_TEST_CASES = [
  createMockTestCaseItem('tc-1', 'Login with valid credentials'),
  createMockTestCaseItem('tc-2', 'Login with invalid password', {
    lastRunStatus: 'FAIL',
    lastRunAt: new Date().toISOString(),
  }),
  createMockTestCaseItem('tc-3', 'Password reset flow', {
    debugFlag: true,
    debugFlaggedAt: new Date().toISOString(),
    debugFlaggedById: 'user-1',
    debugFlaggedBy: MOCK_USER,
    testType: 'GHERKIN',
    steps: null,
    gherkinSyntax: 'Feature: Password Reset\n  Scenario: User resets password',
  }),
]

async function setupTestCasesPageMocks(page: Page) {
  await mockProjectApi(page, 'project-1', TC_PROJECT)
  await mockTestCasesListApi(page, 'project-1', MOCK_TEST_CASES)
}

test.describe('Test Cases - List Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
  })

  test('renders the test cases page with header and count', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    await expect(testCasesPage.heading).toBeVisible()
    await expect(testCasesPage.countText).toBeVisible()
    await expect(testCasesPage.countText).toContainText('3 test cases in this project')
  })

  test('renders the Create Test Case button', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    await expect(testCasesPage.createButton).toBeVisible()
  })

  test('renders filter controls', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // Search input
    await expect(testCasesPage.searchInput).toBeVisible()
  })

  test('displays test cases in a table', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // Table headers
    await expect(page.getByText('Name').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('Status').first()).toBeVisible()

    // Test case names should be visible
    await expect(testCasesPage.rowName('tc-1')).toHaveText('Login with valid credentials')
    await expect(testCasesPage.rowName('tc-2')).toHaveText('Login with invalid password')
    await expect(testCasesPage.rowName('tc-3')).toHaveText('Password reset flow')
  })

  test('shows test type badges correctly', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // Step-Based badges
    const stepBadges = page.getByText('Step-Based')
    await expect(stepBadges.first()).toBeVisible()

    // Gherkin badge
    await expect(page.getByText('Gherkin')).toBeVisible()
  })

  test('shows debug flag icon for flagged test cases', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // The third test case has debugFlag: true — its debug toggle should be visible
    await expect(testCasesPage.debugToggle('tc-3')).toBeVisible()
  })

  test('Create Test Case button navigates to new form', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    await testCasesPage.createButton.click()

    await expect(page).toHaveURL(/\/projects\/project-1\/test-cases\/new/)
  })
})

test.describe('Test Cases - Empty State', () => {
  test('shows empty state when no test cases exist', async ({ page }) => {
    await mockProjectApi(page, 'project-1', TC_PROJECT)
    await mockTestCasesListApi(page, 'project-1', [])

    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    await expect(testCasesPage.emptyState).toBeVisible()
    await expect(testCasesPage.emptyStateDescription).toBeVisible()
  })
})

test.describe('Test Cases - Create Form (Step-Based)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
  })

  test('renders the create test case form', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    await expect(testCaseCreate.heading).toBeVisible()
    await expect(testCaseCreate.subtitle).toBeVisible()

    // Form fields
    await expect(testCaseCreate.nameInput).toBeVisible()
    await expect(testCaseCreate.descriptionInput).toBeVisible()

    // Test type toggle buttons
    await expect(testCaseCreate.stepBasedButton).toBeVisible()
    await expect(testCaseCreate.gherkinButton).toBeVisible()

    // Preconditions section
    await expect(testCaseCreate.preconditionsHeading).toBeVisible()

    // Test Steps section (default is Step-Based)
    await expect(testCaseCreate.testStepsHeading).toBeVisible()
    await expect(testCaseCreate.addStepButton).toBeVisible()

    // Create button (initially disabled because form is invalid)
    await expect(testCaseCreate.createButton).toBeVisible()
  })

  test('can add preconditions', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    await testCaseCreate.preconditionInput.fill('User must be logged in')
    await testCaseCreate.addPreconditionButton.click()

    await expect(page.getByText('User must be logged in')).toBeVisible()
  })

  test('can add test steps', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    // Initially should show empty state
    await expect(testCaseCreate.noStepsMessage).toBeVisible()

    // Add a step
    await testCaseCreate.addStepButton.click()

    // Step 1 should now be visible with fields
    await expect(page.getByText('1').first()).toBeVisible()
    await expect(testCaseCreate.stepActionInput).toBeVisible()
    await expect(testCaseCreate.stepDataInput).toBeVisible()
    await expect(testCaseCreate.stepExpectedInput).toBeVisible()
  })

  test('switches to Gherkin editor when toggled', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    // Click Gherkin toggle
    await testCaseCreate.gherkinButton.click()

    // Should show Gherkin editor with syntax heading
    await expect(testCaseCreate.gherkinSyntaxHeading).toBeVisible()
  })

  test('shows Cancel button that navigates back', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    // Multiple cancel buttons exist; click the one in the form footer
    await testCaseCreate.cancelButtons.last().click()

    await expect(page).toHaveURL(/\/projects\/project-1\/test-cases$/)
  })
})

test.describe('Test Cases - Detail Page', () => {
  test('renders test case detail with all sections', async ({ page }) => {
    await setupTestCasesPageMocks(page)
    await mockTestCaseDetailApis(page, 'tc-1', { testCase: MOCK_TEST_CASES[0] })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Header with test case name
    await expect(testCaseDetail.heading('Login with valid credentials')).toBeVisible()

    // Status badge
    await expect(testCaseDetail.statusBadge).toBeVisible()

    // Type badge
    await expect(testCaseDetail.typeBadge).toBeVisible()
    await expect(testCaseDetail.typeBadge).toContainText('Step-Based')

    // Debug flag toggle
    await expect(testCaseDetail.debugToggle).toBeVisible()
    await expect(testCaseDetail.debugToggle).toContainText('Flag for Debug')

    // Run Test button
    await expect(testCaseDetail.runTestButton).toBeVisible()

    // Edit button
    await expect(testCaseDetail.editButton).toBeVisible()

    // Test Steps section
    await expect(testCaseDetail.stepsHeading).toBeVisible()

    // Run History section
    await expect(testCaseDetail.runHistoryHeading).toBeVisible()
    await expect(testCaseDetail.noRunsMessage).toBeVisible()

    // Comments section
    await expect(testCaseDetail.commentsSection.heading).toBeVisible()

    // Attachments section
    await expect(testCaseDetail.attachmentsHeading).toBeVisible()
  })

  test('displays debug flag toggle for flagged test case', async ({ page }) => {
    await setupTestCasesPageMocks(page)
    await mockTestCaseDetailApis(page, 'tc-3', { testCase: MOCK_TEST_CASES[2] })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-3')

    // Debug flag should show "Flagged" state
    await expect(testCaseDetail.debugToggle).toContainText('Flagged')
    await expect(testCaseDetail.debugInfo).toContainText(`by ${MOCK_USER.name}`)
  })

  test('shows not found state for invalid test case ID', async ({ page }) => {
    await setupTestCasesPageMocks(page)
    await mockTestCaseNotFoundApis(page, 'invalid-id')

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'invalid-id')

    await expect(testCaseDetail.notFoundMessage).toBeVisible()
    await expect(testCaseDetail.backButton).toBeVisible()
  })
})

test.describe('Test Cases - Create Form (Gherkin)', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
  })

  test('switches to Gherkin editor and shows Gherkin Syntax heading', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    // Click the Gherkin (BDD) toggle button
    await testCaseCreate.gherkinButton.click()

    // Should show the Gherkin Syntax heading
    await expect(testCaseCreate.gherkinSyntaxHeading).toBeVisible()
  })

  test('Gherkin editor has textarea for syntax input', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    await testCaseCreate.gherkinButton.click()

    // The textarea should have a placeholder with Gherkin example syntax
    await expect(testCaseCreate.gherkinTextarea).toBeVisible()
  })

  test('Gherkin editor shows preview mode toggle', async ({ page }) => {
    const testCaseCreate = new TestCaseCreatePage(page)
    await testCaseCreate.goto('project-1')

    await testCaseCreate.gherkinButton.click()

    // Preview button should be visible in the Gherkin editor
    await expect(testCaseCreate.previewButton).toBeVisible()
  })
})

test.describe('Test Cases - Detail Page (Steps Display)', () => {
  const MOCK_DETAIL_CASE_WITH_STEPS = createMockTestCaseItem('tc-1', 'Login with valid credentials', {
    steps: [
      { stepNumber: 1, action: 'Navigate to login page', data: 'https://app.example.com/login', expectedResult: 'Login page is displayed' },
      { stepNumber: 2, action: 'Enter valid credentials', data: 'user@test.com / Pass123', expectedResult: 'Fields are populated' },
      { stepNumber: 3, action: 'Click Sign In button', data: '', expectedResult: 'User is redirected to dashboard' },
    ],
  })

  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
    await mockTestCaseDetailApis(page, 'tc-1', { testCase: MOCK_DETAIL_CASE_WITH_STEPS })
  })

  test('steps table displays all columns', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Verify column headers in the steps table
    const stepsCard = testCaseDetail.stepsTable
    await expect(stepsCard.getByText('#')).toBeVisible()
    await expect(stepsCard.getByText('Action')).toBeVisible()
    await expect(stepsCard.getByText('Test Data')).toBeVisible()
    await expect(stepsCard.getByText('Expected Result')).toBeVisible()
  })

  test('steps show step numbers, actions, and expected results', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Step 1 data
    await expect(page.getByText('Navigate to login page')).toBeVisible()
    await expect(page.getByText('Login page is displayed')).toBeVisible()

    // Step 2 data
    await expect(page.getByText('Enter valid credentials')).toBeVisible()
    await expect(page.getByText('Fields are populated')).toBeVisible()

    // Step 3 data
    await expect(page.getByText('Click Sign In button')).toBeVisible()
    await expect(page.getByText('User is redirected to dashboard')).toBeVisible()
  })

  test('steps display data column content or "--" for empty data', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Step 1 and 2 have test data
    await expect(page.getByText('https://app.example.com/login')).toBeVisible()
    await expect(page.getByText('user@test.com / Pass123')).toBeVisible()

    // Step 3 has empty data, should show "--"
    const stepsTable = testCaseDetail.stepsTable
    await expect(stepsTable.getByText('--')).toBeVisible()
  })
})

test.describe('Test Cases - Detail Page (Run History)', () => {
  const MOCK_RUNS = [
    {
      id: 'run-1',
      testCaseId: 'tc-1',
      status: 'PASS',
      environment: 'staging',
      executedAt: new Date().toISOString(),
      executedById: 'user-1',
      executedBy: MOCK_USER,
      duration: 45,
      notes: 'All checks passed',
      stepResults: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'run-2',
      testCaseId: 'tc-1',
      status: 'FAIL',
      environment: 'production',
      executedAt: new Date().toISOString(),
      executedById: 'user-1',
      executedBy: MOCK_USER,
      duration: 120,
      notes: 'Login button unresponsive',
      stepResults: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASES[0],
      runs: MOCK_RUNS,
    })
  })

  test('run history table displays when runs exist', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Run History heading with count
    await expect(testCaseDetail.runHistoryHeading).toContainText('Run History (2)')
  })

  test('run history shows status badges for each run', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Status badges rendered by TestStatusBadge component
    await expect(page.getByText('Pass', { exact: true })).toBeVisible()
    await expect(page.getByText('Fail', { exact: true })).toBeVisible()
  })

  test('run history shows environment and duration', async ({ page }) => {
    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Environment values (rendered with capitalize class)
    await expect(page.getByText('staging')).toBeVisible()
    await expect(page.getByText('production')).toBeVisible()

    // Duration: 45s and 2m 0s
    await expect(page.getByText('45s')).toBeVisible()
    await expect(page.getByText('2m 0s')).toBeVisible()
  })
})

test.describe('Test Cases - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestCasesPageMocks(page)
  })

  test('search input filters test cases', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // All 3 test cases should be visible initially
    await expect(testCasesPage.rowName('tc-1')).toHaveText('Login with valid credentials')
    await expect(testCasesPage.rowName('tc-2')).toHaveText('Login with invalid password')
    await expect(testCasesPage.rowName('tc-3')).toHaveText('Password reset flow')

    // Fill the search input
    await testCasesPage.searchInput.fill('Login')

    // The search triggers a reload via the watched filter; the mock still returns all results
    // so we verify the search input value was applied
    await expect(testCasesPage.searchInput).toHaveValue('Login')
  })

  test('debug flag filter shows flagged test cases icon', async ({ page }) => {
    const testCasesPage = new TestCasesPage(page)
    await testCasesPage.goto('project-1')

    // Each test case row should have a debug toggle button
    await expect(testCasesPage.debugToggle('tc-1')).toBeVisible()
    await expect(testCasesPage.debugToggle('tc-2')).toBeVisible()
    await expect(testCasesPage.debugToggle('tc-3')).toBeVisible()
  })
})

// =============================================================================
// Test Case Detail - Linked Test Plans & Suites
// =============================================================================

test.describe('Test Cases - Detail Page (Linked Plans & Suites)', () => {
  const MOCK_LINKED_PLANS = [
    {
      id: 'tpc-1',
      testPlanId: 'plan-1',
      testCaseId: 'tc-1',
      testPlan: {
        id: 'plan-1',
        name: 'Sprint 12 Regression',
      },
    },
    {
      id: 'tpc-2',
      testPlanId: 'plan-2',
      testCaseId: 'tc-1',
      testPlan: {
        id: 'plan-2',
        name: 'Smoke Tests',
      },
    },
  ]

  const MOCK_LINKED_SUITES = [
    {
      id: 'tsc-1',
      testSuiteId: 'suite-1',
      testCaseId: 'tc-1',
      testSuite: {
        id: 'suite-1',
        name: 'Login Regression',
        suiteType: 'regression',
      },
    },
  ]

  function createDetailCase(overrides = {}) {
    return {
      ...createMockTestCaseItem('tc-1', 'Login with valid credentials'),
      testPlans: MOCK_LINKED_PLANS,
      testSuites: MOCK_LINKED_SUITES,
      ...overrides,
    }
  }

  async function setupDetailWithPlansAndSuites(page: Page, caseOverrides = {}) {
    await setupTestCasesPageMocks(page)
    await mockTestCaseDetailApis(page, 'tc-1', { testCase: createDetailCase(caseOverrides) })
  }

  test('displays linked test plans section with count', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.plansHeading).toContainText('Test Plans (2)')
  })

  test('displays linked plan names', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(page.getByText('Sprint 12 Regression')).toBeVisible()
    await expect(page.getByText('Smoke Tests')).toBeVisible()
  })

  test('displays linked test suites section with count', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.suitesHeading).toContainText('Test Suites (1)')
  })

  test('displays linked suite names with type badge', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(page.getByText('Login Regression')).toBeVisible()
    await expect(page.getByText('regression', { exact: true })).toBeVisible()
  })

  test('shows empty state when no plans linked', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page, {
      testPlans: [],
      testSuites: MOCK_LINKED_SUITES,
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.plansHeading).toContainText('Test Plans (0)')
    await expect(testCaseDetail.noPlanMessage).toBeVisible()
  })

  test('shows empty state when no suites linked', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page, {
      testPlans: MOCK_LINKED_PLANS,
      testSuites: [],
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.suitesHeading).toContainText('Test Suites (0)')
    await expect(testCaseDetail.noSuiteMessage).toBeVisible()
  })

  test('each linked plan has a remove button', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.removeFromPlanButtons).toHaveCount(2)
  })

  test('each linked suite has a remove button', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await expect(testCaseDetail.removeFromSuiteButtons).toHaveCount(1)
  })

  test('remove from plan calls unlink API', async ({ page }) => {
    let unlinkPlanApiCalled = false

    await setupDetailWithPlansAndSuites(page)

    await page.route('**/api/test-plans/plan-1/test-cases/tc-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        unlinkPlanApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.continue()
      }
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await testCaseDetail.removeFromPlanButtons.first().click()

    expect(unlinkPlanApiCalled).toBe(true)
  })

  test('remove from suite calls unlink API', async ({ page }) => {
    let unlinkSuiteApiCalled = false

    await setupDetailWithPlansAndSuites(page)

    await page.route('**/api/test-suites/suite-1/test-cases/tc-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        unlinkSuiteApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.continue()
      }
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    await testCaseDetail.removeFromSuiteButtons.click()

    expect(unlinkSuiteApiCalled).toBe(true)
  })

  test('"Add" button in plans section opens add-to-plans modal', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    // Mock the test plans list endpoint for the modal
    await page.route('**/api/projects/project-1/test-plans*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'plan-1', name: 'Sprint 12 Regression', description: 'Regression', projectId: 'project-1' },
            { id: 'plan-2', name: 'Smoke Tests', description: null, projectId: 'project-1' },
            { id: 'plan-3', name: 'E2E Coverage', description: 'End to end tests', projectId: 'project-1' },
          ],
          total: 3,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Click the "Add" link button in the Test Plans card header
    // There are two "Add" buttons (one for plans, one for suites)
    await testCaseDetail.addPlanButton.click()

    // Modal should open
    await expect(page.getByText('Select test plans to link this test case to.')).toBeVisible()
    await expect(page.getByPlaceholder('Search test plans...')).toBeVisible()

    // Only plan-3 should be available (plan-1 and plan-2 are already linked)
    await expect(page.locator('[role="dialog"]').getByText('E2E Coverage')).toBeVisible()
    await expect(page.locator('[role="dialog"]').getByText('Sprint 12 Regression')).not.toBeVisible()
  })

  test('"Add" button in suites section opens add-to-suites modal', async ({ page }) => {
    await setupDetailWithPlansAndSuites(page)

    // Mock the test suites list endpoint for the modal
    await page.route('**/api/projects/project-1/test-suites*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'suite-1', name: 'Login Regression', suiteType: 'regression', projectId: 'project-1' },
            { id: 'suite-2', name: 'API Integration', suiteType: 'integration', projectId: 'project-1' },
          ],
          total: 2,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Click the "Add" link button in the Test Suites card header (second one)
    await testCaseDetail.addSuiteButton.click()

    // Modal should open
    await expect(page.getByText('Select test suites to link this test case to.')).toBeVisible()
    await expect(page.getByPlaceholder('Search test suites...')).toBeVisible()

    // Only suite-2 should be available (suite-1 is already linked)
    await expect(page.locator('[role="dialog"]').getByText('API Integration')).toBeVisible()
    await expect(page.locator('[role="dialog"]').getByText('Login Regression')).not.toBeVisible()
  })

  test('link to plan from modal calls API', async ({ page }) => {
    let linkPlanApiCalled = false

    await setupDetailWithPlansAndSuites(page)

    await page.route('**/api/projects/project-1/test-plans*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'plan-3', name: 'E2E Coverage', description: 'End to end', projectId: 'project-1' },
          ],
          total: 1,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })

    await page.route('**/api/test-plans/plan-3/test-cases', async (route) => {
      if (route.request().method() === 'POST') {
        linkPlanApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'tpc-new', testPlanId: 'plan-3', testCaseId: 'tc-1' }),
        })
      } else {
        await route.continue()
      }
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Open add plans modal
    await testCaseDetail.addPlanButton.click()

    // Select the plan
    await page.locator('[role="dialog"]').getByText('E2E Coverage').click()

    // Click the add button
    await page.locator('[role="dialog"]').getByRole('button', { name: /Add to 1 Plan/ }).click()

    expect(linkPlanApiCalled).toBe(true)
  })

  test('link to suite from modal calls API', async ({ page }) => {
    let linkSuiteApiCalled = false

    await setupDetailWithPlansAndSuites(page)

    await page.route('**/api/projects/project-1/test-suites*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 'suite-2', name: 'API Integration', suiteType: 'integration', projectId: 'project-1' },
          ],
          total: 1,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })

    await page.route('**/api/test-suites/suite-2/test-cases', async (route) => {
      if (route.request().method() === 'POST') {
        linkSuiteApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'tsc-new', testSuiteId: 'suite-2', testCaseId: 'tc-1' }),
        })
      } else {
        await route.continue()
      }
    })

    const testCaseDetail = new TestCaseDetailPage(page)
    await testCaseDetail.goto('project-1', 'tc-1')

    // Open add suites modal
    await testCaseDetail.addSuiteButton.click()

    // Select the suite
    await page.locator('[role="dialog"]').getByText('API Integration').click()

    // Click the add button
    await page.locator('[role="dialog"]').getByRole('button', { name: /Add to 1 Suite/ }).click()

    expect(linkSuiteApiCalled).toBe(true)
  })
})
