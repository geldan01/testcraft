import { test, expect } from './fixtures'
import { TestRunsPage } from './pages'
import {
  MOCK_USER,
  MOCK_PROJECT,
  mockProjectApi,
  mockTestRunsListApi,
  mockTestRunDetailApi,
} from './helpers'

/**
 * E2E tests for the enhanced Test Runs list page.
 *
 * Phase 2 enhancements include:
 * - TestRunFilters component (status, environment, date filters)
 * - Clickable rows navigating to run detail
 * - Environment and executor columns display
 * - Test case filter banner
 * - Clear filters button
 * - Pagination
 */

const MOCK_RUNS = [
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
    testCaseId: 'tc-2',
    executedById: 'user-1',
    executedAt: new Date(Date.now() - 3600000).toISOString(),
    environment: 'production',
    status: 'FAIL',
    duration: 120,
    notes: 'Button not clickable in production',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testCase: { id: 'tc-2', name: 'Checkout flow' },
    executedBy: MOCK_USER,
  },
  {
    id: 'run-3',
    testCaseId: 'tc-3',
    executedById: 'user-1',
    executedAt: new Date(Date.now() - 7200000).toISOString(),
    environment: 'development',
    status: 'BLOCKED',
    duration: null,
    notes: 'Blocked by API dependency',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testCase: { id: 'tc-3', name: 'Payment integration' },
    executedBy: MOCK_USER,
  },
  {
    id: 'run-4',
    testCaseId: 'tc-1',
    executedById: 'user-1',
    executedAt: new Date(Date.now() - 14400000).toISOString(),
    environment: 'qa',
    status: 'SKIPPED',
    duration: null,
    notes: 'Skipped due to environment unavailability',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testCase: { id: 'tc-1', name: 'Login with valid credentials' },
    executedBy: MOCK_USER,
  },
  {
    id: 'run-5',
    testCaseId: 'tc-4',
    executedById: 'user-1',
    executedAt: new Date(Date.now() - 28800000).toISOString(),
    environment: 'staging',
    status: 'IN_PROGRESS',
    duration: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    testCase: { id: 'tc-4', name: 'User profile update' },
    executedBy: MOCK_USER,
  },
]

// ============================================================================
// TestRunFilters Component
// ============================================================================

test.describe('Test Runs - Filter Controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)
  })

  test('displays status filter with "All Statuses" default', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // The TestRunFilters component should show the "Status" label
    await expect(page.getByText('Status').first()).toBeVisible()

    // Default value should be "All Statuses"
    await expect(page.getByText('All Statuses').first()).toBeVisible()
  })

  test('displays environment filter with "All Environments" default', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // The TestRunFilters component should show the "Environment" label
    await expect(page.getByText('Environment').first()).toBeVisible()

    // Default value should be "All Environments"
    await expect(page.getByText('All Environments').first()).toBeVisible()
  })

  test('displays date range filters (From and To)', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Date inputs - the TestRunFilters has "From" and "To" labels
    await expect(page.getByText('From').first()).toBeVisible()
    await expect(page.getByText('To').first()).toBeVisible()

    // Date inputs should be present
    await expect(runsPage.dateFromFilter).toBeVisible()
    await expect(runsPage.dateToFilter).toBeVisible()
  })

  test('status filter dropdown shows all status options', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Click the status select (the first USelect in the TestRunFilters)
    // Find it by clicking "All Statuses"
    await page.getByText('All Statuses').first().click()

    // All status options should be visible
    await expect(page.getByRole('option', { name: 'Pass' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Fail' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Blocked' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Skipped' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'In Progress' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Not Run' })).toBeVisible()
  })

  test('environment filter dropdown shows all environment options', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Click the environment select
    await page.getByText('All Environments').first().click()

    // All environment options should be visible
    await expect(page.getByRole('option', { name: 'Development' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Staging' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Production' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'QA' })).toBeVisible()
  })

  test('selecting a status filter triggers a reload', async ({ page }) => {
    let apiCallCount = 0

    // Override the standard mock to count API calls
    await page.route('**/api/projects/project-1/test-runs*', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_RUNS,
          total: MOCK_RUNS.length,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      })
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    const initialCalls = apiCallCount

    // Select "Pass" from the status filter
    await page.getByText('All Statuses').first().click()
    await page.getByRole('option', { name: 'Pass' }).click()

    // Wait for the API call to happen
    await page.waitForTimeout(300)

    // The API should have been called again after filter change
    expect(apiCallCount).toBeGreaterThan(initialCalls)
  })

  test('selecting an environment filter triggers a reload', async ({ page }) => {
    let apiCallCount = 0

    await page.route('**/api/projects/project-1/test-runs*', async (route) => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_RUNS,
          total: MOCK_RUNS.length,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      })
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    const initialCalls = apiCallCount

    // Select "Staging" from the environment filter
    await page.getByText('All Environments').first().click()
    await page.getByRole('option', { name: 'Staging' }).click()

    await page.waitForTimeout(300)

    expect(apiCallCount).toBeGreaterThan(initialCalls)
  })
})

// ============================================================================
// Table Display Enhancements
// ============================================================================

test.describe('Test Runs - Enhanced Table Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)
  })

  test('displays all table columns including Environment and Executed By', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    await expect(page.getByText('Test Case').first()).toBeVisible()
    await expect(page.getByText('Status').first()).toBeVisible()
    await expect(page.getByText('Environment').first()).toBeVisible()
    await expect(page.getByText('Executed By').first()).toBeVisible()
    await expect(page.getByText('Date').first()).toBeVisible()
    await expect(page.getByText('Duration').first()).toBeVisible()
  })

  test('displays environment values in table rows', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Environment badges should be visible
    await expect(page.getByText('staging').first()).toBeVisible()
    await expect(page.getByText('production')).toBeVisible()
    await expect(page.getByText('development')).toBeVisible()
    await expect(page.getByText('qa')).toBeVisible()
  })

  test('displays executor name with avatar in table rows', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // User name should appear for each row
    const userNames = page.getByText('Test User')
    await expect(userNames.first()).toBeVisible()
  })

  test('displays all status badges correctly', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    await expect(page.getByText('Pass', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Fail', { exact: true })).toBeVisible()
    await expect(page.getByText('Blocked', { exact: true })).toBeVisible()
    await expect(page.getByText('Skipped', { exact: true })).toBeVisible()
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible()
  })

  test('displays formatted durations correctly', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // run-1: 45s
    await expect(page.getByText('45s')).toBeVisible()
    // run-2: 120s = 2m 0s
    await expect(page.getByText('2m 0s')).toBeVisible()
    // run-3, run-4, run-5: null = "--"
    const dashes = page.getByText('--')
    expect(await dashes.count()).toBeGreaterThanOrEqual(3)
  })

  test('table rows have cursor-pointer class (are clickable)', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    const tableRows = page.locator('table tbody tr')
    const firstRow = tableRows.first()
    await expect(firstRow).toHaveClass(/cursor-pointer/)
  })
})

// ============================================================================
// Row Click Navigation
// ============================================================================

test.describe('Test Runs - Row Click Navigation to Detail', () => {
  test('clicking a run row navigates to the run detail page', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)
    await mockTestRunDetailApi(page, 'run-1', {
      ...MOCK_RUNS[0],
      testCase: {
        id: 'tc-1',
        name: 'Login with valid credentials',
        description: 'Test login',
        testType: 'STEP_BASED',
        steps: [],
        gherkinSyntax: null,
        projectId: 'project-1',
        preconditions: [],
        createdBy: MOCK_USER,
        project: MOCK_PROJECT,
      },
      attachments: [],
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Click the first row
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    // Should navigate to the run detail page
    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\/run-1/)
  })

  test('clicking a different run row navigates to the correct detail page', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)
    await mockTestRunDetailApi(page, 'run-2', {
      ...MOCK_RUNS[1],
      testCase: {
        id: 'tc-2',
        name: 'Checkout flow',
        description: 'Test checkout',
        testType: 'STEP_BASED',
        steps: [],
        gherkinSyntax: null,
        projectId: 'project-1',
        preconditions: [],
        createdBy: MOCK_USER,
        project: MOCK_PROJECT,
      },
      attachments: [],
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Click the second row
    const secondRow = page.locator('table tbody tr').nth(1)
    await secondRow.click()

    // Should navigate to run-2
    await expect(page).toHaveURL(/\/projects\/project-1\/test-runs\/run-2/)
  })
})

// ============================================================================
// Empty State with Filters
// ============================================================================

test.describe('Test Runs - Empty State with Active Filters', () => {
  test('shows "No results match your filters" when filters return empty', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)

    // Initially show runs
    let returnEmpty = false
    await page.route('**/api/projects/project-1/test-runs*', async (route) => {
      const runs = returnEmpty ? [] : MOCK_RUNS
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: runs,
          total: runs.length,
          page: 1,
          limit: 20,
          totalPages: runs.length > 0 ? 1 : 0,
        }),
      })
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Table should be visible with runs
    await expect(page.getByText('Login with valid credentials')).toBeVisible()

    // Now set the filter to return empty results
    returnEmpty = true

    // Select a status filter that will return empty
    await page.getByText('All Statuses').first().click()
    await page.getByRole('option', { name: 'Not Run' }).click()

    // Should show the filtered empty state
    await expect(page.getByText('No results match your filters')).toBeVisible()
    await expect(page.getByText('Try adjusting your filters.')).toBeVisible()
  })

  test('shows "No test runs yet" when no runs exist at all', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', [])

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    await expect(runsPage.emptyState).toBeVisible()
    await expect(page.getByText('Run a test case to see results here.')).toBeVisible()
  })
})

// ============================================================================
// Test Case Filter Banner
// ============================================================================

test.describe('Test Runs - Test Case Filter Banner', () => {
  test('shows filter banner when testCaseId query param is present', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)

    await page.goto('/projects/project-1/runs?testCaseId=tc-1')

    // Filter banner should be visible
    await expect(page.getByText('Filtered by test case:')).toBeVisible()
    await expect(page.getByText('Login with valid credentials')).toBeVisible()
  })

  test('clear filter button in banner removes the testCaseId filter', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)

    await page.goto('/projects/project-1/runs?testCaseId=tc-1')

    // Click the "Clear Filter" button
    await page.getByRole('button', { name: 'Clear Filter' }).click()

    // The banner should disappear
    await expect(page.getByText('Filtered by test case:')).not.toBeVisible()
  })
})

// ============================================================================
// Pagination
// ============================================================================

test.describe('Test Runs - Pagination', () => {
  test('shows pagination controls when total exceeds page limit', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)

    // Create many runs to trigger pagination
    const manyRuns = Array.from({ length: 20 }, (_, i) => ({
      id: `run-${i + 1}`,
      testCaseId: 'tc-1',
      executedById: 'user-1',
      executedAt: new Date(Date.now() - i * 3600000).toISOString(),
      environment: 'staging',
      status: 'PASS',
      duration: 30 + i,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      testCase: { id: 'tc-1', name: 'Login test' },
      executedBy: MOCK_USER,
    }))

    // Mock with total of 40 but only 20 returned on page 1
    await page.route('**/api/projects/project-1/test-runs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: manyRuns,
          total: 40,
          page: 1,
          limit: 20,
          totalPages: 2,
        }),
      })
    })

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Pagination text showing counts
    await expect(page.getByText('Showing 1-20 of 40')).toBeVisible()

    // Previous and Next buttons
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()

    // Previous should be disabled on page 1
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()

    // Next should be enabled
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  test('hides pagination when all results fit on one page', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)

    const runsPage = new TestRunsPage(page)
    await runsPage.goto('project-1')

    // Pagination buttons should not be visible (5 runs fits in one page of 20)
    await expect(page.getByRole('button', { name: 'Previous' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).not.toBeVisible()
  })
})
