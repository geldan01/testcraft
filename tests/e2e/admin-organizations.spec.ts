import { test, expect } from './fixtures'
import { AdminOrganizationsPage } from './pages'
import {
  MOCK_ADMIN_ORGS,
  mockAdminOrganizationsApi,
  mockAdminDeleteOrgApi,
  clearServerState,
} from './helpers'

/**
 * E2E tests for the admin organization management page (/admin/organizations).
 *
 * Covers organization list, create modal, delete modal, and search.
 */

test.describe('Admin Organizations - List Page', () => {
  test.use({ userKey: 'admin' })

  let orgsPage: AdminOrganizationsPage

  test.beforeEach(async ({ page }) => {
    orgsPage = new AdminOrganizationsPage(page)
    await clearServerState(page)
    await mockAdminOrganizationsApi(page, MOCK_ADMIN_ORGS)
  })

  test('displays heading, description, and create button', async ({ page }) => {
    await orgsPage.goto()

    await expect(orgsPage.heading).toBeVisible()
    await expect(orgsPage.heading).toHaveText('Organization Management')
    await expect(
      page.getByText('View and manage all organizations across the platform.'),
    ).toBeVisible()
    await expect(orgsPage.createOrgButton).toBeVisible()
  })

  test('shows organization table with names', async ({ page }) => {
    await orgsPage.goto()

    await expect(page.getByText('Acme Corp')).toBeVisible()
    await expect(page.getByText('Beta Inc')).toBeVisible()
  })

  test('org name links to organization detail page', async () => {
    await orgsPage.goto()

    const acmeLink = orgsPage.orgName('org-admin-1')
    await expect(acmeLink).toBeVisible()
    await expect(acmeLink).toHaveAttribute('href', '/organizations/org-admin-1')
  })

  test('search input is visible', async () => {
    await orgsPage.goto()

    await expect(orgsPage.searchInput).toBeVisible()
  })

  test('action menu button exists for each org', async () => {
    await orgsPage.goto()

    await expect(orgsPage.orgActions('org-admin-1')).toBeVisible()
    await expect(orgsPage.orgActions('org-admin-2')).toBeVisible()
  })

  test('action menu shows View Organization and Delete Organization', async ({ page }) => {
    await orgsPage.goto()

    await orgsPage.orgActions('org-admin-1').click()

    await expect(page.getByText('View Organization')).toBeVisible()
    await expect(page.getByText('Delete Organization')).toBeVisible()
  })
})

test.describe('Admin Organizations - Create Modal', () => {
  test.use({ userKey: 'admin' })

  let orgsPage: AdminOrganizationsPage

  test.beforeEach(async ({ page }) => {
    orgsPage = new AdminOrganizationsPage(page)
    await clearServerState(page)
    await mockAdminOrganizationsApi(page, MOCK_ADMIN_ORGS)
  })

  test('Create Organization button opens modal', async () => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()

    await expect(orgsPage.createModal).toBeVisible()
    await expect(orgsPage.createNameInput).toBeVisible()
    await expect(orgsPage.createEmailInput).toBeVisible()
  })

  test('create button disabled when inputs empty', async () => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()

    await expect(orgsPage.createConfirmButton).toBeDisabled()
  })

  test('cancel closes create modal', async () => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()
    await expect(orgsPage.createModal).toBeVisible()

    await orgsPage.createCancelButton.click()
    await expect(orgsPage.createModal).not.toBeVisible()
  })
})

test.describe('Admin Organizations - Delete Modal', () => {
  test.use({ userKey: 'admin' })

  let orgsPage: AdminOrganizationsPage

  test.beforeEach(async ({ page }) => {
    orgsPage = new AdminOrganizationsPage(page)
    await clearServerState(page)
    await mockAdminOrganizationsApi(page, MOCK_ADMIN_ORGS)
  })

  test('delete action opens confirmation modal with org name', async ({ page }) => {
    await orgsPage.goto()

    await orgsPage.orgActions('org-admin-1').click()
    await page.getByText('Delete Organization').click()

    await expect(orgsPage.deleteModal).toBeVisible()
    await expect(orgsPage.deleteModal.getByText('Acme Corp')).toBeVisible()
  })

  test('cancel closes delete modal', async ({ page }) => {
    await orgsPage.goto()

    await orgsPage.orgActions('org-admin-1').click()
    await page.getByText('Delete Organization').click()
    await expect(orgsPage.deleteModal).toBeVisible()

    await orgsPage.deleteCancelButton.click()
    await expect(orgsPage.deleteModal).not.toBeVisible()
  })

  test('confirm delete calls API', async ({ page }) => {
    await mockAdminDeleteOrgApi(page, 'org-admin-1')
    await orgsPage.goto()

    await orgsPage.orgActions('org-admin-1').click()
    await page.getByText('Delete Organization').click()

    await orgsPage.deleteConfirmButton.click()
    await expect(orgsPage.deleteModal).not.toBeVisible()
  })
})
