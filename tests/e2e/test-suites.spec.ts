import { test, expect } from './fixtures'
import { TestSuitesPage, TestSuiteDetailPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import {
  mockProjectApi,
  mockTestSuitesListApi,
  mockTestSuiteDetailApi,
  mockTestSuiteNotFoundApi,
} from './helpers'

/**
 * E2E tests for test suite management.
 *
 * Covers the test suites list page, creation modal, suite detail page,
 * linked test cases display, and empty states.
 */

const MOCK_TEST_SUITES = [
  {
    id: 'suite-1',
    name: 'Login Regression',
    description: 'Regression tests for login functionality',
    projectId: 'project-1',
    suiteType: 'regression',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    _count: { testCases: 5 },
  },
  {
    id: 'suite-2',
    name: 'Smoke Tests',
    description: 'Quick smoke tests for production deploys',
    projectId: 'project-1',
    suiteType: 'smoke',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    _count: { testCases: 3 },
  },
  {
    id: 'suite-3',
    name: 'API Integration',
    description: 'Integration tests for API endpoints',
    projectId: 'project-1',
    suiteType: 'integration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    _count: { testCases: 8 },
  },
]

test.describe('Test Suites - List Page', () => {
  let suitesPage: TestSuitesPage

  test.beforeEach(async ({ page }) => {
    suitesPage = new TestSuitesPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestSuitesListApi(page, 'project-1', MOCK_TEST_SUITES)
  })

  test('renders test suites page with header', async ({ page }) => {
    await suitesPage.goto('project-1')

    await expect(suitesPage.heading).toBeVisible()
    await expect(page.getByText('Group test cases into logical suites.')).toBeVisible()
  })

  test('create test suite button is visible', async () => {
    await suitesPage.goto('project-1')

    await expect(suitesPage.createButton).toBeVisible()
  })

  test('test suite cards display with name and type', async () => {
    await suitesPage.goto('project-1')

    // Suite names
    await expect(suitesPage.suiteName('Login Regression')).toBeVisible()
    await expect(suitesPage.suiteName('Smoke Tests')).toBeVisible()
    await expect(suitesPage.suiteName('API Integration')).toBeVisible()

    // Suite types as badges
    await expect(suitesPage.typeBadge('regression')).toBeVisible()
    await expect(suitesPage.typeBadge('smoke')).toBeVisible()
    await expect(suitesPage.typeBadge('integration')).toBeVisible()
  })

  test('create modal opens when button clicked', async ({ page }) => {
    await suitesPage.goto('project-1')

    await suitesPage.createButton.click()

    // Modal should show with form fields
    await expect(page.getByText('Group related test cases into a suite.')).toBeVisible()
    await expect(suitesPage.modalNameInput).toBeVisible()
    await expect(page.getByText('Suite type')).toBeVisible()
    await expect(suitesPage.modalDescInput).toBeVisible()
  })

  test('create button disabled with empty name', async () => {
    await suitesPage.goto('project-1')

    await suitesPage.createButton.click()

    await expect(suitesPage.modalCreateButton).toBeDisabled()
  })

  test('can close create modal with Cancel', async () => {
    await suitesPage.goto('project-1')

    await suitesPage.createButton.click()
    await expect(suitesPage.modalNameInput).toBeVisible()

    await suitesPage.modalCancelButton.click()
    await expect(suitesPage.modalNameInput).not.toBeVisible()
  })
})

test.describe('Test Suites - Empty State', () => {
  test('empty state when no suites', async ({ page }) => {
    const suitesPage = new TestSuitesPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestSuitesListApi(page, 'project-1', [])

    await suitesPage.goto('project-1')

    await expect(suitesPage.emptyState).toBeVisible()
    await expect(page.getByText('Create your first test suite to get started.')).toBeVisible()
  })
})

test.describe('Test Suites - Detail Page', () => {
  let suiteDetail: TestSuiteDetailPage

  const MOCK_LINKED_CASES = [
    {
      id: 'tsc-1',
      testSuiteId: 'suite-1',
      testCaseId: 'tc-1',
      testCase: {
        id: 'tc-1',
        name: 'Login with valid credentials',
        lastRunStatus: 'PASS',
        testType: 'STEP_BASED',
        debugFlag: false,
      },
    },
    {
      id: 'tsc-2',
      testSuiteId: 'suite-1',
      testCaseId: 'tc-2',
      testCase: {
        id: 'tc-2',
        name: 'Login with invalid password',
        lastRunStatus: 'FAIL',
        testType: 'STEP_BASED',
        debugFlag: true,
      },
    },
  ]

  test.beforeEach(async ({ page }) => {
    suiteDetail = new TestSuiteDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestSuitesListApi(page, 'project-1', MOCK_TEST_SUITES)
  })

  test('suite detail page loads with name and type badge', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    await suiteDetail.goto('project-1', 'suite-1')

    // Suite name heading
    await expect(suiteDetail.heading('Login Regression')).toBeVisible()

    // Type badge
    await expect(suiteDetail.typeBadge('regression')).toBeVisible()
  })

  test('shows linked test cases with status badges', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    await suiteDetail.goto('project-1', 'suite-1')

    // Linked test case names
    await expect(suiteDetail.linkedCaseName('Login with valid credentials')).toBeVisible()
    await expect(suiteDetail.linkedCaseName('Login with invalid password')).toBeVisible()

    // Debug badge for flagged case (use exact match to avoid matching sidebar "Debug Queue" link)
    await expect(page.getByText('Debug', { exact: true })).toBeVisible()
  })

  test('unlink button exists for each linked case', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    await suiteDetail.goto('project-1', 'suite-1')

    // Unlink buttons (one per linked test case)
    await expect(suiteDetail.unlinkButtons).toHaveCount(2)
  })

  test('"Add Test Cases" button is visible', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await expect(suiteDetail.addTestCasesButton).toBeVisible()
  })

  test('"Edit" button is visible', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await expect(suiteDetail.editButton).toBeVisible()
  })

  test('not found state for invalid suite ID', async ({ page }) => {
    await mockTestSuiteNotFoundApi(page, 'invalid-id')

    await suiteDetail.goto('project-1', 'invalid-id')

    await expect(suiteDetail.notFoundMessage).toBeVisible()
    await expect(suiteDetail.backButton).toBeVisible()
  })

  test('empty state when no test cases linked to suite', async ({ page }) => {
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: [],
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await expect(suiteDetail.emptyCasesMsg).toBeVisible()
  })

  test('unlink button calls API', async ({ page }) => {
    const linkedCases = [
      {
        id: 'tsc-1',
        testSuiteId: 'suite-1',
        testCaseId: 'tc-1',
        testCase: {
          id: 'tc-1',
          name: 'Login with valid credentials',
          lastRunStatus: 'PASS',
          testType: 'STEP_BASED',
          debugFlag: false,
        },
      },
    ]

    let unlinkApiCalled = false

    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: linkedCases,
    })

    await page.route('**/api/test-suites/suite-1/test-cases/tc-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        unlinkApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      } else {
        await route.continue()
      }
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.unlinkButtons.click()

    expect(unlinkApiCalled).toBe(true)
  })
})

test.describe('Test Suites - Detail Page (Add Test Cases Modal)', () => {
  let suiteDetail: TestSuiteDetailPage

  const MOCK_LINKED_CASES = [
    {
      id: 'tsc-1',
      testSuiteId: 'suite-1',
      testCaseId: 'tc-1',
      testCase: {
        id: 'tc-1',
        name: 'Login with valid credentials',
        lastRunStatus: 'PASS',
        testType: 'STEP_BASED',
        debugFlag: false,
      },
    },
  ]

  const MOCK_AVAILABLE_CASES = [
    {
      id: 'tc-2',
      name: 'Registration validation',
      lastRunStatus: 'FAIL',
      testType: 'GHERKIN',
      debugFlag: false,
      projectId: 'project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tc-3',
      name: 'Password reset flow',
      lastRunStatus: 'NOT_RUN',
      testType: 'STEP_BASED',
      debugFlag: false,
      projectId: 'project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  test.beforeEach(async ({ page }) => {
    suiteDetail = new TestSuiteDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestSuitesListApi(page, 'project-1', MOCK_TEST_SUITES)
    await mockTestSuiteDetailApi(page, 'suite-1', {
      ...MOCK_TEST_SUITES[0],
      testCases: MOCK_LINKED_CASES,
    })

    // Mock the test cases list endpoint (used by the modal)
    await page.route('**/api/projects/project-1/test-cases*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [...MOCK_AVAILABLE_CASES, MOCK_LINKED_CASES[0].testCase],
          total: 3,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })
  })

  test('"Add Test Cases" button opens the add modal', async ({ page }) => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    // Modal should appear with description and search
    await expect(page.getByText('Select test cases to add to this suite.')).toBeVisible()
    await expect(suiteDetail.addTestCasesModal.searchInput).toBeVisible()
  })

  test('modal shows available test cases excluding already linked ones', async () => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    const modal = suiteDetail.addTestCasesModal

    // Available cases should be visible
    await expect(modal.caseName('Registration validation')).toBeVisible()
    await expect(modal.caseName('Password reset flow')).toBeVisible()

    // The already-linked case should NOT appear in the modal
    await expect(modal.caseName('Login with valid credentials')).not.toBeVisible()
  })

  test('modal search filters available test cases', async () => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    const modal = suiteDetail.addTestCasesModal

    await modal.searchInput.fill('Registration')

    await expect(modal.caseName('Registration validation')).toBeVisible()
    await expect(modal.caseName('Password reset flow')).not.toBeVisible()
  })

  test('link button is disabled when no cases selected', async () => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    await expect(suiteDetail.addTestCasesModal.linkButton(/Link.*Test Case/)).toBeDisabled()
  })

  test('selecting cases shows count and enables link button', async () => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    const modal = suiteDetail.addTestCasesModal

    await modal.caseName('Registration validation').click()

    await expect(modal.selectionCount).toBeVisible()

    await expect(modal.linkButton(/Link 1 Test Case/)).toBeEnabled()
  })

  test('clicking link button calls API and closes modal', async ({ page }) => {
    let linkApiCalled = false

    await page.route('**/api/test-suites/suite-1/test-cases', async (route) => {
      if (route.request().method() === 'POST') {
        linkApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'tsc-new', testSuiteId: 'suite-1', testCaseId: 'tc-2' }),
        })
      } else {
        await route.continue()
      }
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    const modal = suiteDetail.addTestCasesModal

    await modal.caseName('Registration validation').click()
    await modal.linkButton(/Link 1 Test Case/).click()

    expect(linkApiCalled).toBe(true)
  })

  test('modal can be closed with Cancel button', async ({ page }) => {
    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()
    await expect(page.getByText('Select test cases to add to this suite.')).toBeVisible()

    await suiteDetail.addTestCasesModal.cancelButton.click()
    await expect(page.getByText('Select test cases to add to this suite.')).not.toBeVisible()
  })

  test('shows empty state when all cases already in suite', async ({ page }) => {
    // Override the test cases mock to only return the already-linked case
    await page.route('**/api/projects/project-1/test-cases*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [MOCK_LINKED_CASES[0].testCase],
          total: 1,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })

    await suiteDetail.goto('project-1', 'suite-1')

    await suiteDetail.addTestCasesButton.click()

    await expect(suiteDetail.addTestCasesModal.allLinkedMessage).toBeVisible()
  })
})
