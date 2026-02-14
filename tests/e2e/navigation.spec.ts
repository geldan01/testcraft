import { test, expect } from './fixtures'
import { DashboardPage } from './pages'
import { MOCK_STATS } from './helpers'
import { mockDashboardApis, mockSettingsApis, mockLogoutApi } from './helpers'

/**
 * E2E tests for navigation, sidebar, top bar, and layout structure.
 *
 * These tests verify that the main app shell renders correctly
 * when a user is authenticated, including sidebar items,
 * breadcrumbs, org switcher, and sidebar collapse behavior.
 */

const NAV_PROJECT = {
  id: 'project-1',
  name: 'Web App',
  organizationId: 'org-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  _count: { testCases: 42, testPlans: 3, testSuites: 4, members: 5 },
}

test.describe('Navigation - Sidebar', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)
    await mockDashboardApis(page, {
      projects: [NAV_PROJECT],
      stats: MOCK_STATS,
      activity: [],
    })
  })

  test('sidebar renders with main navigation items', async () => {
    await dashboard.goto()

    await expect(dashboard.sidebar.container).toBeVisible()

    // Main navigation items
    await expect(dashboard.sidebar.dashboardLink).toBeVisible()
    await expect(dashboard.sidebar.organizationsLink).toBeVisible()

    // Bottom navigation items
    await expect(dashboard.sidebar.settingsLink).toBeVisible()

    // App name / brand
    await expect(dashboard.sidebar.brandText).toBeVisible()
  })

  test('sidebar shows collapse/expand button', async () => {
    await dashboard.goto()

    // Collapse button should be visible when sidebar is expanded
    await expect(dashboard.sidebar.collapseButton).toBeVisible()
  })

  test('sidebar can be collapsed and expanded', async () => {
    await dashboard.goto()

    // Initially expanded (w-64)
    await expect(dashboard.sidebar.container).toHaveClass(/w-64/)

    // Click collapse button
    await dashboard.sidebar.collapseButton.click()

    // Should now be collapsed (w-16)
    await expect(dashboard.sidebar.container).toHaveClass(/w-16/)

    // Click expand button (the toggle button with panel-left-open icon)
    await dashboard.sidebar.expandButton.click()

    // Should be expanded again
    await expect(dashboard.sidebar.container).toHaveClass(/w-64/)
  })

  test('sidebar navigation links work - Dashboard', async () => {
    await dashboard.goto()

    // Dashboard link should be active (has indigo styling)
    await expect(dashboard.sidebar.dashboardLink).toBeVisible()
  })

  test('sidebar navigation links work - Organizations', async ({ page }) => {
    // Mock organizations page data
    await mockSettingsApis(page, 'org-1', {})

    await dashboard.goto()

    await dashboard.sidebar.organizationsLink.click()

    await expect(page).toHaveURL(/\/organizations/)
  })

  test('sidebar navigation links work - Settings', async ({ page }) => {
    // Mock settings page data
    await mockSettingsApis(page, 'org-1', {})

    await dashboard.goto()

    await dashboard.sidebar.settingsLink.click()

    await expect(page).toHaveURL(/\/settings/)
  })
})

test.describe('Navigation - Top Bar', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)
    await mockDashboardApis(page, {
      projects: [NAV_PROJECT],
      stats: MOCK_STATS,
      activity: [],
    })
  })

  test('top bar renders with expected elements', async ({ currentUser }) => {
    await dashboard.goto()

    await expect(dashboard.topBar.container).toBeVisible()

    // Org switcher button shows real org name from DB
    await expect(dashboard.topBar.orgSwitcherText('TestCraft Demo Org')).toBeVisible()

    // Notifications bell button
    await expect(dashboard.topBar.notificationsButton).toBeVisible()

    // User avatar with initials from the logged-in user
    const initials = currentUser.name.split(' ').map(w => w[0]).join('')
    await expect(dashboard.topBar.userAvatar(initials)).toBeVisible()
  })

  test('breadcrumbs display for dashboard page', async () => {
    await dashboard.goto()

    // Breadcrumb should show "Dashboard"
    await expect(dashboard.topBar.breadcrumb('Dashboard')).toBeVisible()
  })

  test('org switcher shows organization list', async () => {
    await dashboard.goto()

    // Click the org switcher button
    await dashboard.topBar.orgSwitcherText('TestCraft Demo Org').click()

    // Dropdown should show the current org with a checkmark and "Create Organization" option
    await expect(dashboard.topBar.createOrgOption).toBeVisible()
  })

  test('user menu shows sign out option', async ({ page, currentUser }) => {
    // Mock logout
    await mockLogoutApi(page)

    await dashboard.goto()

    // Click user avatar/menu button
    const initials = currentUser.name.split(' ').map(w => w[0]).join('')
    await dashboard.topBar.avatarButton(initials).click()

    // User menu should show Settings and Sign out (use menuitem role to avoid sidebar/dashboard matches)
    await expect(dashboard.topBar.settingsMenuItem).toBeVisible()
    await expect(dashboard.topBar.signOutMenuItem).toBeVisible()
  })
})

test.describe('Navigation - Page Transitions', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)
    await mockDashboardApis(page, {
      projects: [NAV_PROJECT],
      stats: MOCK_STATS,
      activity: [],
    })

    // Mock common API routes for org pages
    await mockSettingsApis(page, 'org-1', {})
  })

  test('can navigate from dashboard to organizations and back', async ({ page }) => {
    await dashboard.goto()

    // Navigate to organizations
    await dashboard.sidebar.organizationsLink.click()
    await expect(page).toHaveURL(/\/organizations/)

    // Navigate back to dashboard
    await dashboard.sidebar.dashboardLink.click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
