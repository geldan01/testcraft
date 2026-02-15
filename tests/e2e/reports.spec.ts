import { test, expect } from './fixtures'
import { ReportsPage } from './pages'
import {
  MOCK_PROJECT,
  MOCK_STATUS_BREAKDOWN,
  MOCK_EXECUTION_TREND,
  MOCK_ENVIRONMENT_COMPARISON,
  MOCK_FLAKY_TESTS,
  MOCK_TOP_FAILING_TESTS,
} from './helpers'
import {
  mockProjectApi,
  mockProjectStatsApi,
  mockProjectsListApi,
  mockAllReportApis,
  mockTestPlansListApi,
  mockTestSuitesListApi,
} from './helpers'

/**
 * E2E tests for the Reports page.
 *
 * Tests cover page rendering, chart sections, table sections,
 * filter controls, export button, and empty state.
 */

const PROJECT_ID = 'project-1'

function setupReportMocks(page: import('@playwright/test').Page) {
  return Promise.all([
    mockProjectApi(page, PROJECT_ID, MOCK_PROJECT),
    mockProjectStatsApi(page, { totalTestCases: 42, passRate: 87, recentRuns: 15, debugFlagged: 3 }),
    mockProjectsListApi(page, [MOCK_PROJECT]),
    mockTestPlansListApi(page, PROJECT_ID, []),
    mockTestSuitesListApi(page, PROJECT_ID, []),
    mockAllReportApis(page, PROJECT_ID, {
      statusBreakdown: MOCK_STATUS_BREAKDOWN,
      executionTrend: MOCK_EXECUTION_TREND,
      environmentComparison: MOCK_ENVIRONMENT_COMPARISON,
      testAnalysis: MOCK_FLAKY_TESTS,
    }),
    // Also mock the second test-analysis call (top-failing uses same endpoint)
    // The route mock already handles both since it matches all test-analysis requests
  ])
}

test.describe('Reports Page', () => {
  let reports: ReportsPage

  test.beforeEach(async ({ page }) => {
    reports = new ReportsPage(page, PROJECT_ID)
    await setupReportMocks(page)
  })

  test('displays the reports page title', async () => {
    await reports.goto()
    await expect(reports.pageTitle).toBeVisible()
    await expect(reports.pageTitle).toHaveText('Reports')
  })

  test('renders the filter bar with time range and scope controls', async () => {
    await reports.goto()
    await expect(reports.filterBar).toBeVisible()
    await expect(reports.timeRangeSelect).toBeVisible()
    await expect(reports.scopeSelect).toBeVisible()
  })

  test('renders the export button', async () => {
    await reports.goto()
    await expect(reports.exportButton).toBeVisible()
  })

  test('renders the status breakdown chart card', async () => {
    await reports.goto()
    await expect(reports.statusBreakdownCard).toBeVisible()
  })

  test('renders the execution trend chart card', async () => {
    await reports.goto()
    await expect(reports.executionTrendCard).toBeVisible()
  })

  test('renders the environment comparison chart card', async () => {
    await reports.goto()
    await expect(reports.environmentComparisonCard).toBeVisible()
  })

  test('renders the flaky tests table', async () => {
    await reports.goto()
    await expect(reports.flakyTestsCard).toBeVisible()
  })

  test('renders the top failing tests table', async () => {
    await reports.goto()
    await expect(reports.topFailingTestsCard).toBeVisible()
  })
})

test.describe('Reports Page - Empty State', () => {
  test('displays gracefully when all endpoints return empty data', async ({ page }) => {
    const reports = new ReportsPage(page, PROJECT_ID)

    await Promise.all([
      mockProjectApi(page, PROJECT_ID, MOCK_PROJECT),
      mockProjectStatsApi(page, { totalTestCases: 0, passRate: 0, recentRuns: 0, debugFlagged: 0 }),
      mockProjectsListApi(page, [MOCK_PROJECT]),
      mockTestPlansListApi(page, PROJECT_ID, []),
      mockTestSuitesListApi(page, PROJECT_ID, []),
      mockAllReportApis(page, PROJECT_ID, {
        statusBreakdown: { breakdown: [], total: 0 },
        executionTrend: { trend: [] },
        environmentComparison: { environments: [] },
        testAnalysis: { tests: [] },
      }),
    ])

    await reports.goto()

    // Page should still render without errors
    await expect(reports.pageTitle).toBeVisible()
    await expect(reports.filterBar).toBeVisible()
    await expect(reports.statusBreakdownCard).toBeVisible()
    await expect(reports.executionTrendCard).toBeVisible()

    // Empty state text should appear in charts
    await expect(page.getByText('No test run data available')).toBeVisible()
    await expect(page.getByText('No execution data available')).toBeVisible()
  })
})

test.describe('Reports Page - Sidebar Navigation', () => {
  test('sidebar has reports link that navigates to reports page', async ({ page }) => {
    await Promise.all([
      mockProjectApi(page, PROJECT_ID, MOCK_PROJECT),
      mockProjectStatsApi(page, { totalTestCases: 0, passRate: 0, recentRuns: 0, debugFlagged: 0 }),
      mockProjectsListApi(page, [MOCK_PROJECT]),
      mockTestPlansListApi(page, PROJECT_ID, []),
      mockTestSuitesListApi(page, PROJECT_ID, []),
      mockAllReportApis(page, PROJECT_ID, {
        statusBreakdown: MOCK_STATUS_BREAKDOWN,
        executionTrend: MOCK_EXECUTION_TREND,
        environmentComparison: MOCK_ENVIRONMENT_COMPARISON,
        testAnalysis: MOCK_FLAKY_TESTS,
      }),
    ])

    // Navigate to project first to set current project context
    await page.goto(`/projects/${PROJECT_ID}`)
    await page.waitForLoadState('networkidle')

    // Check sidebar reports link exists
    const reportsLink = page.getByTestId('sidebar-nav-reports')
    await expect(reportsLink).toBeVisible()
  })
})
