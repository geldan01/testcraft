import { test, expect } from './fixtures'
import { DashboardPage } from './pages'
import { Sidebar } from './components/Sidebar'

/**
 * E2E tests for admin access control.
 *
 * Tests admin middleware (non-admin redirect) and sidebar
 * admin section visibility.
 */

test.describe('Admin Access - Non-Admin Redirect', () => {
  // Uses default 'qa' user (non-admin)

  test('non-admin user navigating to /admin is redirected to /dashboard', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('non-admin user navigating to /admin/users is redirected to /dashboard', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Admin Access - Sidebar for Admin', () => {
  test.use({ userKey: 'admin' })

  test('admin user sees Admin nav section with links', async ({ page }) => {
    const sidebar = new Sidebar(page)
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    await expect(sidebar.adminSection).toBeVisible()
    await expect(sidebar.adminLink).toBeVisible()
    await expect(sidebar.usersLink).toBeVisible()
    await expect(sidebar.allOrgsLink).toBeVisible()
  })
})

test.describe('Admin Access - Sidebar for Non-Admin', () => {
  // Uses default 'qa' user (non-admin)

  test('non-admin user does not see Admin nav section', async ({ page }) => {
    const sidebar = new Sidebar(page)
    const dashboard = new DashboardPage(page)
    await dashboard.goto()

    await expect(sidebar.adminSection).not.toBeVisible()
  })
})
