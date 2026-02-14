import { test, expect } from './fixtures'
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  OrganizationDetailPage,
  ProjectDetailPage,
  TestCaseDetailPage,
  TestSuiteDetailPage,
  SettingsPage,
} from './pages'
import { MOCK_USER, MOCK_ORG, MOCK_PROJECT, MOCK_STATS } from './helpers'
import {
  mockProjectApi,
  mockDashboardApis,
  mockProjectsListApi,
  mockOrgDetailApis,
  mockTestCaseDetailApis,
  mockTestSuiteDetailApi,
  mockSettingsApis,
} from './helpers'

/**
 * E2E tests that DOCUMENT known broken/placeholder features.
 *
 * These tests verify that buttons and interactive elements EXIST and are
 * VISIBLE but currently have no click handlers or functional behavior.
 * The purpose is to track features that need implementation.
 *
 * When a feature gets implemented, the corresponding test here should
 * be updated to verify the new behavior or moved to the appropriate
 * feature-specific test file.
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
]

const MOCK_TEST_CASE = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Validates the login flow',
  projectId: 'project-1',
  preconditions: [],
  testType: 'STEP_BASED',
  steps: [
    { stepNumber: 1, action: 'Enter username', data: 'user@test.com', expectedResult: 'Field populated' },
  ],
  gherkinSyntax: null,
  debugFlag: false,
  debugFlaggedAt: null,
  debugFlaggedById: null,
  lastRunStatus: 'NOT_RUN',
  lastRunAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  debugFlaggedBy: null,
}

const MOCK_TEST_SUITE = {
  id: 'suite-1',
  name: 'Login Regression',
  description: 'Regression tests for login flows',
  projectId: 'project-1',
  suiteType: 'regression',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  _count: { testCases: 3 },
  testCases: [],
}

const MOCK_ATTACHMENT = {
  id: 'att-1',
  fileName: 'screenshot.png',
  fileUrl: '/uploads/screenshot.png',
  fileSize: 51200,
  mimeType: 'image/png',
  testCaseId: 'tc-1',
  uploadedById: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// Login page - OAuth placeholder buttons
// ---------------------------------------------------------------------------
test.describe('Broken Features - Login Page', () => {
  test.use({ authenticate: false })

  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await page.context().clearCookies()
  })

  test('Google OAuth button exists but is a non-functional placeholder', async ({ page }) => {
    await loginPage.goto()

    await expect(loginPage.googleOAuthButton).toBeVisible()

    // Clicking should not navigate away from the login page
    const urlBefore = page.url()
    await loginPage.googleOAuthButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })

  test('Facebook OAuth button exists but is a non-functional placeholder', async ({ page }) => {
    await loginPage.goto()

    await expect(loginPage.facebookOAuthButton).toBeVisible()

    // Clicking should not navigate away from the login page
    const urlBefore = page.url()
    await loginPage.facebookOAuthButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Register page - OAuth placeholder buttons
// ---------------------------------------------------------------------------
test.describe('Broken Features - Register Page', () => {
  test.use({ authenticate: false })

  let registerPage: RegisterPage

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page)
    await page.context().clearCookies()
  })

  test('Google OAuth button exists but is a non-functional placeholder', async ({ page }) => {
    await registerPage.goto()

    await expect(registerPage.googleOAuthButton).toBeVisible()

    const urlBefore = page.url()
    await registerPage.googleOAuthButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })

  test('Facebook OAuth button exists but is a non-functional placeholder', async ({ page }) => {
    await registerPage.goto()

    await expect(registerPage.facebookOAuthButton).toBeVisible()

    const urlBefore = page.url()
    await registerPage.facebookOAuthButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Dashboard - View Reports button
// ---------------------------------------------------------------------------
test.describe('Broken Features - Dashboard', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page)

    await mockDashboardApis(page, {
      projects: [{ id: 'project-1', name: 'Web App', organizationId: 'org-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { testCases: 42, testPlans: 3, testSuites: 4, members: 5 } }],
      stats: MOCK_STATS,
    })
  })

  test('"View Reports" quick action button has no handler', async ({ page }) => {
    await dashboard.goto()

    await expect(dashboard.viewReportsButton).toBeVisible()

    // Clicking should not navigate anywhere
    const urlBefore = page.url()
    await dashboard.viewReportsButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Organization detail - Settings and Invite Member buttons
// ---------------------------------------------------------------------------
test.describe('Broken Features - Organization Detail', () => {
  let orgDetail: OrganizationDetailPage

  test.beforeEach(async ({ page }) => {
    orgDetail = new OrganizationDetailPage(page)

    await mockOrgDetailApis(page, 'org-1', {
      org: MOCK_ORG,
      members: MOCK_MEMBERS,
      projects: [],
    })
  })

  test('"Settings" button has no handler', async ({ page }) => {
    await orgDetail.goto('org-1')

    await expect(orgDetail.settingsButton).toBeVisible()

    // Clicking should not navigate anywhere
    const urlBefore = page.url()
    await orgDetail.settingsButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })

  test('"Invite Member" button in members tab has no handler', async ({ page }) => {
    await orgDetail.goto('org-1')

    // Click Members tab
    await orgDetail.membersTab.click()

    await expect(orgDetail.inviteMemberButton).toBeVisible()

    // Clicking should not open a modal or navigate (no handler wired up on org detail page)
    const urlBefore = page.url()
    await orgDetail.inviteMemberButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Project detail - Project Settings button
// ---------------------------------------------------------------------------
test.describe('Broken Features - Project Detail', () => {
  let project: ProjectDetailPage

  test.beforeEach(async ({ page }) => {
    project = new ProjectDetailPage(page)

    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('"Project Settings" button has no handler', async ({ page }) => {
    await project.goto('project-1')

    await expect(project.projectSettingsButton).toBeVisible()

    // Clicking should not navigate anywhere
    const urlBefore = page.url()
    await project.projectSettingsButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Test case detail - Edit, Upload, Download buttons
// ---------------------------------------------------------------------------
test.describe('Broken Features - Test Case Detail', () => {
  let detail: TestCaseDetailPage

  test('"Edit" button has no handler', async ({ page }) => {
    detail = new TestCaseDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: [],
    })

    await detail.goto('project-1', 'tc-1')

    await expect(detail.editButton).toBeVisible()

    // Clicking should not navigate anywhere
    const urlBefore = page.url()
    await detail.editButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })

  test('attachment "Upload" button has no handler', async ({ page }) => {
    detail = new TestCaseDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: [],
    })

    await detail.goto('project-1', 'tc-1')

    await expect(detail.uploadButton).toBeVisible()

    // Clicking should not open a file picker or navigate
    const urlBefore = page.url()
    await detail.uploadButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })

  test('attachment "Download" button renders for existing attachments', async ({ page }) => {
    detail = new TestCaseDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: [MOCK_ATTACHMENT],
    })

    await detail.goto('project-1', 'tc-1')

    // Attachment file name should be visible
    await expect(page.getByText('screenshot.png')).toBeVisible()

    // Download button (aria-label="Download")
    await expect(detail.downloadButton).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Test plan detail - "Add Test Cases" is now functional (moved to test-plans.spec.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test suite detail - Edit button (Add Test Cases is now functional)
// ---------------------------------------------------------------------------
test.describe('Broken Features - Test Suite Detail', () => {
  let suiteDetail: TestSuiteDetailPage

  test('"Edit" button has no handler', async ({ page }) => {
    suiteDetail = new TestSuiteDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestSuiteDetailApi(page, 'suite-1', MOCK_TEST_SUITE)

    await suiteDetail.goto('project-1', 'suite-1')

    await expect(suiteDetail.editButton).toBeVisible()

    // Clicking should not navigate
    const urlBefore = page.url()
    await suiteDetail.editButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})

// ---------------------------------------------------------------------------
// Settings page - Delete Organization button
// ---------------------------------------------------------------------------
test.describe('Broken Features - Settings Page', () => {
  let settingsPage: SettingsPage

  test('"Delete Organization" button has no handler', async ({ page }) => {
    settingsPage = new SettingsPage(page)

    await mockSettingsApis(page, 'demo-org-id', { members: MOCK_MEMBERS })

    await mockOrgDetailApis(page, 'org-1', {
      org: MOCK_ORG,
      projects: [],
    })

    // Visit organizations page first to populate the org store (it calls fetchOrganizations)
    await page.goto('/organizations')
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible()

    // Navigate to settings via client-side link (preserves Pinia store state)
    await page.getByRole('link', { name: 'Settings' }).first().click()
    await expect(settingsPage.orgDetailsHeading).toBeVisible({ timeout: 5000 })

    // The danger zone Delete button
    await expect(settingsPage.deleteOrgButton).toBeVisible()

    // Also verify the context text is present
    await expect(page.getByText('Delete Organization')).toBeVisible()
    await expect(page.getByText('This will permanently delete the organization')).toBeVisible()

    // Clicking should not navigate or show a confirmation dialog
    const urlBefore = page.url()
    await settingsPage.deleteOrgButton.click()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(urlBefore)
  })
})
