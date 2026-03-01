import { test, expect } from './fixtures'
import { AdminUsersPage } from './pages'
import {
  MOCK_ADMIN_USERS,
  mockAdminUsersApi,
  mockAdminDeleteUserApi,
  mockAdminResetPasswordApi,
  clearServerState,
} from './helpers'

/**
 * E2E tests for the admin user management page (/admin/users).
 *
 * Covers user list, status badges, admin badges, action menus,
 * delete modal, and reset password modal.
 */

test.describe('Admin Users - List Page', () => {
  test.use({ userKey: 'admin' })

  let usersPage: AdminUsersPage

  test.beforeEach(async ({ page }) => {
    usersPage = new AdminUsersPage(page)
    await clearServerState(page)
    await mockAdminUsersApi(page, MOCK_ADMIN_USERS)
  })

  test('displays heading and description', async ({ page }) => {
    await usersPage.goto()

    await expect(usersPage.heading).toBeVisible()
    await expect(usersPage.heading).toHaveText('User Management')
    await expect(
      page.getByText('View and manage all users across the platform.'),
    ).toBeVisible()
  })

  test('shows user table with names and emails', async ({ page }) => {
    await usersPage.goto()

    // User names
    await expect(page.getByText('System Administrator')).toBeVisible()
    await expect(page.getByText('Jane Smith')).toBeVisible()
    await expect(page.getByText('Bob Johnson')).toBeVisible()

    // User emails
    await expect(page.getByText('admin@testcraft.io')).toBeVisible()
    await expect(page.getByText('jane@example.com')).toBeVisible()
    await expect(page.getByText('bob@example.com')).toBeVisible()
  })

  test('displays status badges with correct text', async ({ page }) => {
    await usersPage.goto()

    // ACTIVE and SUSPENDED badges
    await expect(page.getByText('ACTIVE').first()).toBeVisible()
    await expect(page.getByText('SUSPENDED')).toBeVisible()
  })

  test('displays Super Admin badge for admin users', async ({ page }) => {
    await usersPage.goto()

    await expect(page.getByText('Super Admin')).toBeVisible()
  })

  test('search input is visible', async () => {
    await usersPage.goto()

    await expect(usersPage.searchInput).toBeVisible()
  })

  test('status filter is visible', async () => {
    await usersPage.goto()

    await expect(usersPage.statusFilter).toBeVisible()
  })

  test('action menu button exists for each user', async () => {
    await usersPage.goto()

    await expect(usersPage.userActions('admin-user-1')).toBeVisible()
    await expect(usersPage.userActions('regular-user-2')).toBeVisible()
    await expect(usersPage.userActions('suspended-user-3')).toBeVisible()
  })
})

test.describe('Admin Users - Action Menus', () => {
  test.use({ userKey: 'admin' })

  let usersPage: AdminUsersPage

  test.beforeEach(async ({ page }) => {
    usersPage = new AdminUsersPage(page)
    await clearServerState(page)
    await mockAdminUsersApi(page, MOCK_ADMIN_USERS)
  })

  test('action menu for non-self user shows all options', async ({ page }) => {
    await usersPage.goto()

    // Click action menu for Jane Smith (non-self user)
    await usersPage.userActions('regular-user-2').click()

    // Should show all menu items
    await expect(page.getByText('View Details')).toBeVisible()
    await expect(page.getByText('Suspend User')).toBeVisible()
    await expect(page.getByText('Make Admin')).toBeVisible()
    await expect(page.getByText('Reset Password')).toBeVisible()
    await expect(page.getByText('Delete User')).toBeVisible()
  })

  test('action menu for suspended user shows Activate User', async ({ page }) => {
    await usersPage.goto()

    // Click action menu for Bob (suspended)
    await usersPage.userActions('suspended-user-3').click()

    await expect(page.getByText('Activate User')).toBeVisible()
  })
})

test.describe('Admin Users - Delete Modal', () => {
  test.use({ userKey: 'admin' })

  let usersPage: AdminUsersPage

  test.beforeEach(async ({ page }) => {
    usersPage = new AdminUsersPage(page)
    await clearServerState(page)
    await mockAdminUsersApi(page, MOCK_ADMIN_USERS)
  })

  test('delete action opens confirmation modal with user name', async ({ page }) => {
    await usersPage.goto()

    // Open action menu for Jane Smith
    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Delete User').click()

    // Modal should show with user name
    await expect(usersPage.deleteModal).toBeVisible()
    await expect(usersPage.deleteModal.getByText('Jane Smith')).toBeVisible()
  })

  test('cancel button closes delete modal', async ({ page }) => {
    await usersPage.goto()

    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Delete User').click()
    await expect(usersPage.deleteModal).toBeVisible()

    await usersPage.deleteCancelButton.click()
    await expect(usersPage.deleteModal).not.toBeVisible()
  })

  test('confirm delete button calls API', async ({ page }) => {
    await mockAdminDeleteUserApi(page, 'regular-user-2')
    await usersPage.goto()

    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Delete User').click()

    await usersPage.deleteConfirmButton.click()
    // Modal should close on success
    await expect(usersPage.deleteModal).not.toBeVisible()
  })
})

test.describe('Admin Users - Reset Password Modal', () => {
  test.use({ userKey: 'admin' })

  let usersPage: AdminUsersPage

  test.beforeEach(async ({ page }) => {
    usersPage = new AdminUsersPage(page)
    await clearServerState(page)
    await mockAdminUsersApi(page, MOCK_ADMIN_USERS)
  })

  test('reset password action opens modal', async ({ page }) => {
    await usersPage.goto()

    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Reset Password').click()

    await expect(usersPage.resetPasswordModal).toBeVisible()
    await expect(usersPage.resetPasswordInput).toBeVisible()
  })

  test('confirm button disabled when password is short', async ({ page }) => {
    await usersPage.goto()

    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Reset Password').click()

    // Button disabled when empty
    await expect(usersPage.resetPasswordConfirmButton).toBeDisabled()
  })

  test('submit calls API with password', async ({ page }) => {
    await mockAdminResetPasswordApi(page, 'regular-user-2')
    await usersPage.goto()

    await usersPage.userActions('regular-user-2').click()
    await page.getByText('Reset Password').click()

    // Type password - use placeholder to find the actual input element
    await page.getByPlaceholder('New password').fill('NewPass123!')
    await expect(usersPage.resetPasswordConfirmButton).toBeEnabled()
    await usersPage.resetPasswordConfirmButton.click()

    // Modal should close on success
    await expect(usersPage.resetPasswordModal).not.toBeVisible()
  })
})
