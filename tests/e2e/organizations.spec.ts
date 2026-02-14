import { test, expect } from './fixtures'
import { OrganizationsPage, OrganizationDetailPage } from './pages'
import { MOCK_USER, mockOrgDetailApis } from './helpers'

/**
 * E2E tests for organization management.
 *
 * Covers the organizations list page, create modal, organization detail
 * page with tabs (Projects, Members, RBAC), and member management.
 */

const MOCK_ORGS = [
  {
    id: 'org-1',
    name: 'Acme Corp',
    maxProjects: 10,
    maxTestCasesPerProject: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { members: 5, projects: 3 },
  },
  {
    id: 'org-2',
    name: 'Beta Inc',
    maxProjects: 5,
    maxTestCasesPerProject: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { members: 2, projects: 1 },
  },
]

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
]

const MOCK_PROJECTS = [
  {
    id: 'project-1',
    name: 'Web App',
    description: 'Main web application',
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { testCases: 15, members: 4 },
  },
]

/**
 * Helper to mock GET /api/organizations to return custom org data.
 * Needed because the fixture provides real auth but tests need specific org lists.
 */
async function mockOrganizationsList(page: import('@playwright/test').Page, orgs: typeof MOCK_ORGS) {
  await page.route('**/api/organizations', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orgs),
      })
    } else {
      await route.continue()
    }
  })
}

test.describe('Organizations - List Page', () => {
  let orgsPage: OrganizationsPage

  test.beforeEach(async ({ page }) => {
    orgsPage = new OrganizationsPage(page)
    await mockOrganizationsList(page, MOCK_ORGS)
  })

  test('renders organizations page with header', async ({ page }) => {
    await orgsPage.goto()

    await expect(orgsPage.heading).toBeVisible()
    await expect(
      page.getByText('Manage your organizations and their projects.'),
    ).toBeVisible()
  })

  test('displays create organization button', async () => {
    await orgsPage.goto()

    await expect(orgsPage.createOrgButton).toBeVisible()
  })

  test('renders organization cards with name and counts', async ({ page }) => {
    await orgsPage.goto()

    // Org names
    await expect(page.getByText('Acme Corp').first()).toBeVisible()
    await expect(page.getByText('Beta Inc')).toBeVisible()

    // Member counts
    await expect(page.getByText('5 members')).toBeVisible()
    await expect(page.getByText('2 members')).toBeVisible()

    // Project counts
    await expect(page.getByText('3 projects')).toBeVisible()
    await expect(page.getByText('1 projects')).toBeVisible()
  })

  test('organization cards link to detail pages', async () => {
    await orgsPage.goto()

    // Org cards are NuxtLinks
    const acmeLink = orgsPage.orgCard('org-1')
    await expect(acmeLink).toHaveAttribute('href', '/organizations/org-1')
  })

  test('opens create organization modal', async ({ page }) => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()

    // Modal should show
    await expect(page.getByText('Organizations help you group projects and team members.')).toBeVisible()
    await expect(orgsPage.modalNameInput).toBeVisible()
  })

  test('create button is disabled with empty name', async () => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()

    await expect(orgsPage.modalCreateButton).toBeDisabled()
  })

  test('can cancel create modal', async () => {
    await orgsPage.goto()

    await orgsPage.createOrgButton.click()
    await expect(orgsPage.modalNameInput).toBeVisible()

    await orgsPage.modalCancelButton.click()
    await expect(orgsPage.modalNameInput).not.toBeVisible()
  })
})

test.describe('Organizations - Empty State', () => {
  test('shows empty state when user has no organizations', async ({ page }) => {
    const orgsPage = new OrganizationsPage(page)
    await mockOrganizationsList(page, [])

    await orgsPage.goto()

    await expect(orgsPage.emptyState).toBeVisible()
    await expect(
      page.getByText('Create your first organization to start managing test cases.'),
    ).toBeVisible()
  })
})

test.describe('Organizations - Detail Page', () => {
  let orgDetail: OrganizationDetailPage

  test.beforeEach(async ({ page }) => {
    orgDetail = new OrganizationDetailPage(page)
    await mockOrganizationsList(page, MOCK_ORGS)
    await mockOrgDetailApis(page, 'org-1', {
      org: MOCK_ORGS[0],
      members: MOCK_MEMBERS,
      rbac: [],
      projects: MOCK_PROJECTS,
    })
  })

  test('renders organization detail with name and counts', async ({ page }) => {
    await orgDetail.goto('org-1')

    // Org name heading
    await expect(orgDetail.heading('Acme Corp')).toBeVisible()

    // Member and project counts in subtitle
    await expect(page.getByText(/2 members.*1 projects/)).toBeVisible()

    // Settings button
    await expect(orgDetail.settingsButton).toBeVisible()
  })

  test('displays Projects tab with project cards', async ({ page }) => {
    await orgDetail.goto('org-1')

    // Projects tab should be active by default
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()

    // Project card
    await expect(orgDetail.projectCard('project-1')).toBeVisible()
    await expect(page.getByText('Main web application')).toBeVisible()
    await expect(page.getByText('15 cases')).toBeVisible()
  })

  test('shows create project button', async () => {
    await orgDetail.goto('org-1')

    await expect(orgDetail.createProjectButton).toBeVisible()
  })

  test('shows Members tab with member list', async ({ page }) => {
    await orgDetail.goto('org-1')

    // Click Members tab
    await orgDetail.membersTab.click()

    // Member rows should be visible
    await expect(orgDetail.memberRow('member-1')).toBeVisible()
    await expect(orgDetail.memberRow('member-2')).toBeVisible()

    // Roles should be displayed as badges
    await expect(page.getByText('Organization Manager')).toBeVisible()
    await expect(page.getByText('Qa Engineer')).toBeVisible()

    // Invite Member button
    await expect(orgDetail.inviteMemberButton).toBeVisible()
  })

  test('shows RBAC tab with empty permissions', async ({ page }) => {
    await orgDetail.goto('org-1')

    // Click RBAC tab
    await orgDetail.rbacTab.click()

    // RBAC section heading
    await expect(page.getByText('RBAC Configuration')).toBeVisible()
    await expect(
      page.getByText('No RBAC permissions configured.'),
    ).toBeVisible()
  })

  test('shows not found state for invalid org ID', async ({ page }) => {
    await page.route('**/api/organizations/invalid-org', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 404, message: 'Not found' }),
        })
      }
    })

    await page.route('**/api/organizations/invalid-org/members', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.route('**/api/organizations/invalid-org/rbac', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.route('**/api/organizations/invalid-org/projects', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.goto('/organizations/invalid-org')

    await expect(orgDetail.notFoundMessage).toBeVisible()
    await expect(orgDetail.backButton).toBeVisible()
  })
})
