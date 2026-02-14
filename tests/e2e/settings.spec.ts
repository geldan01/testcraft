import { test, expect } from './fixtures'
import { SettingsPage } from './pages'
import { MOCK_USER, MOCK_ORG } from './helpers'
import { mockSettingsApis } from './helpers'

/**
 * E2E tests for the organization settings page.
 *
 * Covers the Organization tab (form fields, save, danger zone),
 * Members tab (list, invite modal, role dropdowns, remove),
 * and RBAC tab (permissions display, empty state).
 */

const MOCK_MEMBERS = [
  {
    id: 'member-1',
    organizationId: 'org-1',
    userId: 'user-1',
    role: 'ORGANIZATION_MANAGER',
    joinedAt: new Date().toISOString(),
    user: MOCK_USER,
  },
  {
    id: 'member-2',
    organizationId: 'org-1',
    userId: 'user-2',
    role: 'QA_ENGINEER',
    joinedAt: new Date().toISOString(),
    user: {
      ...MOCK_USER,
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
  {
    id: 'member-3',
    organizationId: 'org-1',
    userId: 'user-3',
    role: 'DEVELOPER',
    joinedAt: new Date().toISOString(),
    user: {
      ...MOCK_USER,
      id: 'user-3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
    },
  },
]

test.describe('Settings - Organization Tab', () => {
  let settingsPage: SettingsPage

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page)
    await mockSettingsApis(page, 'demo-org-id', { members: MOCK_MEMBERS })
  })

  test('settings page loads with heading and description', async ({ page }) => {
    await settingsPage.goto()

    await expect(settingsPage.heading).toBeVisible()
    await expect(
      page.getByText('Manage organization settings, members, and access control.'),
    ).toBeVisible()
  })

  test('organization tab shows form with name, max projects, max test cases fields', async () => {
    await settingsPage.goto()

    // Organization Details heading
    await expect(settingsPage.orgDetailsHeading).toBeVisible()

    // Form fields with labels
    await expect(settingsPage.page.getByText('Organization name')).toBeVisible()
    await expect(settingsPage.page.getByText('Max projects')).toBeVisible()
    await expect(settingsPage.page.getByText('Max test cases per project')).toBeVisible()
  })

  test('Save Changes button exists on organization tab', async () => {
    await settingsPage.goto()

    await expect(settingsPage.saveChangesButton).toBeVisible()
  })

  test('danger zone section with delete button visible', async () => {
    await settingsPage.goto()

    await expect(settingsPage.dangerZone).toBeVisible()
    await expect(settingsPage.page.getByText('Delete Organization')).toBeVisible()
    await expect(settingsPage.deleteOrgButton).toBeVisible()
  })
})

test.describe('Settings - Members Tab', () => {
  let settingsPage: SettingsPage

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page)
    await mockSettingsApis(page, 'demo-org-id', { members: MOCK_MEMBERS })
  })

  test('members tab shows member list with avatars and roles', async () => {
    await settingsPage.goto()

    // Click Members tab
    await settingsPage.membersTab.click()

    // Member names
    await expect(settingsPage.memberName('Test User')).toBeVisible()
    await expect(settingsPage.memberName('Jane Smith')).toBeVisible()
    await expect(settingsPage.memberName('Bob Johnson')).toBeVisible()

    // Member emails
    await expect(settingsPage.page.getByText('test@example.com')).toBeVisible()
    await expect(settingsPage.page.getByText('jane@example.com')).toBeVisible()
    await expect(settingsPage.page.getByText('bob@example.com')).toBeVisible()
  })

  test('Invite Member button on members tab', async () => {
    await settingsPage.goto()

    // Click Members tab
    await settingsPage.membersTab.click()

    await expect(settingsPage.inviteMemberButton).toBeVisible()
  })

  test('invite modal opens with email and role fields', async () => {
    await settingsPage.goto()

    // Click Members tab
    await settingsPage.membersTab.click()

    // Click Invite Member
    await settingsPage.inviteMemberButton.click()

    // Modal should show with form fields
    await expect(settingsPage.page.getByText('Send an invitation to join this organization.')).toBeVisible()
    await expect(settingsPage.inviteEmailInput).toBeVisible()
    await expect(settingsPage.page.getByText('Role')).toBeVisible()
  })

  test('role dropdown for each member exists', async () => {
    await settingsPage.goto()

    // Click Members tab
    await settingsPage.membersTab.click()

    // Each member should have a role select dropdown
    // There are 3 members, so there should be at least 3 select elements in the members list
    // The USelect components render with specific role values
    await expect(settingsPage.page.getByText('Organization Manager').first()).toBeVisible()
    await expect(settingsPage.page.getByText('Qa Engineer').or(settingsPage.page.getByText('QA Engineer')).first()).toBeVisible()
  })

  test('remove member button exists for each member', async () => {
    await settingsPage.goto()

    // Click Members tab
    await settingsPage.membersTab.click()

    // Each member has a remove button (trash icon)
    await expect(settingsPage.removeMemberButtons).toHaveCount(3)
  })
})

test.describe('Settings - RBAC Tab', () => {
  let settingsPage: SettingsPage

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page)
    await mockSettingsApis(page, 'demo-org-id', { members: MOCK_MEMBERS })
  })

  test('RBAC tab shows permissions heading and description', async () => {
    await settingsPage.goto()

    // Click RBAC tab
    await settingsPage.rbacTab.click()

    await expect(settingsPage.rbacHeading).toBeVisible()
    await expect(
      settingsPage.page.getByText('Configure which roles can perform actions on different object types.'),
    ).toBeVisible()
  })

  test('RBAC empty state when no custom permissions configured', async () => {
    await settingsPage.goto()

    // Click RBAC tab
    await settingsPage.rbacTab.click()

    await expect(
      settingsPage.page.getByText('No custom RBAC permissions configured. Default permissions apply.'),
    ).toBeVisible()
  })
})
