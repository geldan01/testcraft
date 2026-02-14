import { test, expect } from './fixtures'
import { DashboardPage } from './pages'
import { MOCK_USER, MOCK_PROJECT, MOCK_STATS } from './helpers'
import { mockDashboardApis, mockProjectStatsApi } from './helpers'

/**
 * E2E tests for the dashboard page.
 *
 * Tests cover stats cards, recent activity section, quick action buttons,
 * and quick links rendering.
 */

const DASHBOARD_PROJECT = {
  ...MOCK_PROJECT,
  _count: { testCases: 42, testPlans: 3, testSuites: 4, members: 5 },
}

const MOCK_ACTIVITY = [
  {
    id: 'act-1',
    userId: 'user-1',
    actionType: 'CREATED',
    objectType: 'TEST_CASE',
    objectId: 'tc-1',
    changes: null,
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    user: MOCK_USER,
  },
  {
    id: 'act-2',
    userId: 'user-1',
    actionType: 'UPDATED',
    objectType: 'TEST_PLAN',
    objectId: 'tp-1',
    changes: null,
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user: MOCK_USER,
  },
]

test.describe('Dashboard Page', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)
    await mockDashboardApis(page, {
      projects: [DASHBOARD_PROJECT],
      stats: MOCK_STATS,
      activity: MOCK_ACTIVITY,
    })
  })

  test('displays welcome message with user name', async () => {
    await dashboard.goto()

    await expect(dashboard.welcomeHeading).toBeVisible()
  })

  test('displays organization name in subtitle', async ({ page }) => {
    await dashboard.goto()

    // Real org name from the seeded database
    await expect(page.getByText('TestCraft Demo Org').first()).toBeVisible()
  })

  test('renders all four stats cards', async ({ page }) => {
    await dashboard.goto()

    // Total Test Cases
    await expect(dashboard.totalTestCasesLabel).toBeVisible()
    await expect(page.getByText('42')).toBeVisible()

    // Pass Rate
    await expect(dashboard.passRateLabel).toBeVisible()
    await expect(page.getByText('87%')).toBeVisible()

    // Recent Runs
    await expect(dashboard.recentRunsLabel).toBeVisible()
    await expect(page.getByText('15')).toBeVisible()

    // Debug Flagged
    await expect(dashboard.debugFlaggedLabel).toBeVisible()
    await expect(page.getByText('3').first()).toBeVisible()
  })

  test('renders recent activity section', async ({ page }) => {
    await dashboard.goto()

    await expect(dashboard.recentActivitySection).toBeVisible()
    await expect(dashboard.viewAllLink).toBeVisible()

    // Activity items should show the action and object type
    await expect(page.getByText('created').first()).toBeVisible()
    await expect(page.getByText('Test Case').first()).toBeVisible()
  })

  test('renders quick action buttons', async () => {
    await dashboard.goto()

    await expect(dashboard.newTestCaseButton).toBeVisible()
    await expect(dashboard.newTestPlanButton).toBeVisible()
    await expect(dashboard.viewReportsButton).toBeVisible()
  })

  test('renders quick links section', async () => {
    await dashboard.goto()

    await expect(dashboard.quickLinksSection).toBeVisible()

    // Quick link items
    await expect(dashboard.manageOrgsLink).toBeVisible()
    await expect(dashboard.rbacSettingsLink).toBeVisible()
  })

  test('quick action buttons are clickable', async ({ page }) => {
    await dashboard.goto()

    // Click "New Test Case" should navigate to projects (uses firstProjectId from mock)
    await dashboard.newTestCaseButton.click()
    await expect(page).toHaveURL(/\/projects/)
  })
})

test.describe('Dashboard - Empty State', () => {
  let dashboard: DashboardPage

  test('displays zero stats gracefully', async ({ page }) => {
    dashboard = new DashboardPage(page)
    await mockDashboardApis(page, {
      projects: [DASHBOARD_PROJECT],
    })
    await mockProjectStatsApi(page, {
      totalTestCases: 0,
      passRate: 0,
      recentRuns: 0,
      debugFlagged: 0,
    })

    await dashboard.goto()

    // Stats should show zeros
    await expect(dashboard.totalTestCasesLabel).toBeVisible()
    await expect(page.getByText('0%')).toBeVisible()

    // Activity should show empty state
    await expect(dashboard.noRecentActivity).toBeVisible()
  })
})
