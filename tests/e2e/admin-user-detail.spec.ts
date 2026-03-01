import { test, expect } from './fixtures'
import { AdminUserDetailPage } from './pages'
import {
  MOCK_ADMIN_USER_DETAIL,
  MOCK_ADMIN_USERS,
  mockAdminUserDetailApi,
  clearServerState,
} from './helpers'

/**
 * E2E tests for the admin user detail page (/admin/users/[id]).
 *
 * Covers user info display, action buttons, self-protection,
 * organization memberships, and not-found state.
 */

test.describe('Admin User Detail - Display', () => {
  test.use({ userKey: 'admin' })

  let userDetail: AdminUserDetailPage

  test.beforeEach(async ({ page }) => {
    userDetail = new AdminUserDetailPage(page)
    await clearServerState(page)
  })

  test('displays user name, email, status badge', async () => {
    await mockAdminUserDetailApi(userDetail.page, 'regular-user-2', MOCK_ADMIN_USER_DETAIL)
    await userDetail.goto('regular-user-2')

    await expect(userDetail.userName).toBeVisible()
    await expect(userDetail.userName).toHaveText('Jane Smith')
    await expect(userDetail.userEmail).toBeVisible()
    await expect(userDetail.userEmail).toHaveText('jane@example.com')
    await expect(userDetail.statusBadge).toBeVisible()
    await expect(userDetail.statusBadge).toHaveText('ACTIVE')
  })

  test('shows Back to Users button that navigates', async ({ page }) => {
    await mockAdminUserDetailApi(page, 'regular-user-2', MOCK_ADMIN_USER_DETAIL)
    await userDetail.goto('regular-user-2')

    await expect(userDetail.backButton).toBeVisible()
    await userDetail.backButton.click()
    await expect(page).toHaveURL(/\/admin\/users/)
  })

  test('shows organization memberships with role badges', async ({ page }) => {
    await mockAdminUserDetailApi(page, 'regular-user-2', MOCK_ADMIN_USER_DETAIL)
    await userDetail.goto('regular-user-2')

    await expect(userDetail.memberships).toBeVisible()
    await expect(page.getByText('Organization Memberships (1)')).toBeVisible()
    await expect(page.getByText('Acme Corp')).toBeVisible()
    await expect(page.getByText('Qa Engineer')).toBeVisible()
  })

  test('not found state when user does not exist', async () => {
    await mockAdminUserDetailApi(userDetail.page, 'nonexistent', null)
    await userDetail.goto('nonexistent')

    await expect(userDetail.notFound).toBeVisible()
    await expect(userDetail.page.getByText('User not found.')).toBeVisible()
  })
})

test.describe('Admin User Detail - Actions', () => {
  test.use({ userKey: 'admin' })

  let userDetail: AdminUserDetailPage

  test.beforeEach(async ({ page }) => {
    userDetail = new AdminUserDetailPage(page)
    await clearServerState(page)
  })

  test('action buttons visible for non-self user', async () => {
    await mockAdminUserDetailApi(userDetail.page, 'regular-user-2', MOCK_ADMIN_USER_DETAIL)
    await userDetail.goto('regular-user-2')

    await expect(userDetail.actions).toBeVisible()
    await expect(userDetail.suspendButton).toBeVisible()
    await expect(userDetail.suspendButton).toHaveText('Suspend')
    await expect(userDetail.adminToggleButton).toBeVisible()
    await expect(userDetail.adminToggleButton).toHaveText('Make Admin')
    await expect(userDetail.resetPasswordButton).toBeVisible()
    await expect(userDetail.deleteButton).toBeVisible()
  })

  test('shows "This is you" badge and hides actions for self', async ({ page }) => {
    // Create a mock where the user's ID matches the current admin user's ID
    // The admin user from the seed is admin@testcraft.io
    // We need to use the real admin user ID — let's get it from the auth
    // Actually, the fixture logs in as admin@testcraft.io. We can mock a user detail
    // with the same ID as the logged-in user.

    // First fetch the current user's ID from the me endpoint
    const meResponse = await page.request.get('/api/auth/me')
    const currentUser = await meResponse.json()

    const selfUser = {
      ...MOCK_ADMIN_USER_DETAIL,
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      isAdmin: true,
    }

    await mockAdminUserDetailApi(page, currentUser.id, selfUser)
    await userDetail.goto(currentUser.id)

    await expect(userDetail.selfBadge).toBeVisible()
    await expect(userDetail.selfBadge).toHaveText('This is you')
    await expect(userDetail.actions).not.toBeVisible()
  })

  test('Suspend button shows "Activate" for suspended users', async () => {
    const suspendedUser = {
      ...MOCK_ADMIN_USER_DETAIL,
      id: 'suspended-user',
      status: 'SUSPENDED',
    }
    await mockAdminUserDetailApi(userDetail.page, 'suspended-user', suspendedUser)
    await userDetail.goto('suspended-user')

    await expect(userDetail.suspendButton).toHaveText('Activate')
  })

  test('admin toggle shows "Remove Admin" for admin users', async () => {
    const adminUser = {
      ...MOCK_ADMIN_USER_DETAIL,
      id: 'another-admin',
      isAdmin: true,
    }
    await mockAdminUserDetailApi(userDetail.page, 'another-admin', adminUser)
    await userDetail.goto('another-admin')

    await expect(userDetail.adminToggleButton).toHaveText('Remove Admin')
    await expect(userDetail.adminBadge).toBeVisible()
  })
})
