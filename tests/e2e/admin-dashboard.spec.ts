import { test, expect } from './fixtures'
import { AdminDashboardPage } from './pages'
import { MOCK_ADMIN_STATS, mockAdminStatsApi, clearServerState } from './helpers'

/**
 * E2E tests for the admin dashboard page (/admin).
 *
 * Covers stat cards, quick links, and loading state.
 */

test.describe('Admin Dashboard', () => {
  test.use({ userKey: 'admin' })

  let adminDashboard: AdminDashboardPage

  test.beforeEach(async ({ page }) => {
    adminDashboard = new AdminDashboardPage(page)
    await clearServerState(page)
    await mockAdminStatsApi(page, MOCK_ADMIN_STATS)
  })

  test('displays heading and description', async ({ page }) => {
    await adminDashboard.goto()

    await expect(adminDashboard.heading).toBeVisible()
    await expect(adminDashboard.heading).toHaveText('Admin Dashboard')
    await expect(
      page.getByText('Platform-wide overview and management.'),
    ).toBeVisible()
  })

  test('renders all six stat cards with correct values', async () => {
    await adminDashboard.goto()

    await expect(adminDashboard.statsGrid).toBeVisible()

    // Verify each stat card renders with its value
    const expectedStats = [
      { label: 'Total Users', value: '25' },
      { label: 'Active Users', value: '22' },
      { label: 'Suspended Users', value: '3' },
      { label: 'Organizations', value: '5' },
      { label: 'Projects', value: '12' },
      { label: 'Test Cases', value: '340' },
    ]

    for (const stat of expectedStats) {
      const card = adminDashboard.statCard(stat.label)
      await expect(card).toBeVisible()
      await expect(card.getByText(stat.value)).toBeVisible()
    }
  })

  test('Manage Users link navigates to /admin/users', async ({ page }) => {
    await adminDashboard.goto()

    await expect(adminDashboard.manageUsersLink).toBeVisible()
    await adminDashboard.manageUsersLink.click()
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('Manage Organizations link navigates to /admin/organizations', async ({ page }) => {
    await adminDashboard.goto()

    await expect(adminDashboard.manageOrgsLink).toBeVisible()
    await adminDashboard.manageOrgsLink.click()
    await expect(page).toHaveURL(/\/admin\/organizations/)
  })
})
