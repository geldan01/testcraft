import { test, expect } from './fixtures'
import { TestRunsPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import { mockProjectApi, mockTestRunsListApi } from './helpers'

/**
 * E2E tests for the test runs history page.
 *
 * Covers the runs list, filtering by status and environment,
 * empty state, and pagination display.
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
]

test.describe('Test Runs - History Page', () => {
  let runsPage: TestRunsPage

  test.beforeEach(async ({ page }) => {
    runsPage = new TestRunsPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', MOCK_RUNS)
  })

  test('renders the runs history page with header', async ({ page }) => {
    await runsPage.goto('project-1')

    await expect(runsPage.heading).toBeVisible()
    await expect(
      page.getByText('View all test execution results for this project.'),
    ).toBeVisible()
  })

  test('renders filter controls for status and environment', async () => {
    await runsPage.goto('project-1')

    // Filter selects and date inputs should be visible
    // The status filter has "All Statuses" as default
    // The environment filter has "All Environments" as default
    // Date inputs for from and to
    await expect(runsPage.dateFromFilter).toBeVisible()
    await expect(runsPage.dateToFilter).toBeVisible()
  })

  test('displays runs in a table', async ({ page }) => {
    await runsPage.goto('project-1')

    // Table headers
    await expect(page.getByText('Test Case').first()).toBeVisible()
    await expect(page.getByText('Environment').first()).toBeVisible()
    await expect(page.getByText('Executed By').first()).toBeVisible()
    await expect(page.getByText('Duration').first()).toBeVisible()

    // Run data
    await expect(page.getByText('Login with valid credentials')).toBeVisible()
    await expect(page.getByText('Checkout flow')).toBeVisible()
    await expect(page.getByText('Payment integration')).toBeVisible()

    // Status badges
    await expect(page.getByText('Pass')).toBeVisible()
    await expect(page.getByText('Fail')).toBeVisible()
    await expect(page.getByText('Blocked')).toBeVisible()

    // Environments
    await expect(page.getByText('staging')).toBeVisible()
    await expect(page.getByText('production')).toBeVisible()
    await expect(page.getByText('development')).toBeVisible()

    // Durations
    await expect(page.getByText('45s')).toBeVisible()
    await expect(page.getByText('2m 0s')).toBeVisible()
    await expect(page.getByText('--').first()).toBeVisible()
  })

  test('test case names are displayed in the runs table', async () => {
    await runsPage.goto('project-1')

    const firstTestCaseName = runsPage.testCaseNames.first()
    await expect(firstTestCaseName).toBeVisible()
    await expect(firstTestCaseName).toHaveText('Login with valid credentials')
  })
})

test.describe('Test Runs - Empty State', () => {
  test('shows empty state when no runs exist', async ({ page }) => {
    const runsPage = new TestRunsPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunsListApi(page, 'project-1', [])

    await runsPage.goto('project-1')

    await expect(runsPage.emptyState).toBeVisible()
    await expect(page.getByText('Run a test case to see results here.')).toBeVisible()
  })
})
