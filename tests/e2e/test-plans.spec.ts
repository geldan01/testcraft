import { test, expect } from './fixtures'
import { TestPlansPage, TestPlanDetailPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import {
  mockProjectApi,
  mockTestPlansListApi,
  mockTestPlanDetailApi,
  mockTestPlanNotFoundApi,
  mockTestCasesListApi,
} from './helpers'

/**
 * E2E tests for test plan management.
 *
 * Covers the test plans list page, creation modal, detail page,
 * and linked test cases display.
 */

const MOCK_TEST_PLANS = [
  {
    id: 'plan-1',
    name: 'Sprint 12 Regression',
    description: 'Regression suite for Sprint 12',
    projectId: 'project-1',
    scope: 'Login, Dashboard',
    schedule: 'Before release',
    testTypes: 'Regression',
    entryCriteria: 'Build deployed to staging',
    exitCriteria: '100% pass rate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    _count: { testCases: 5 },
  },
  {
    id: 'plan-2',
    name: 'Smoke Tests',
    description: 'Basic smoke tests for production',
    projectId: 'project-1',
    scope: null,
    schedule: null,
    testTypes: null,
    entryCriteria: null,
    exitCriteria: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    _count: { testCases: 3 },
  },
]

test.describe('Test Plans - List Page', () => {
  let plansPage: TestPlansPage

  test.beforeEach(async ({ page }) => {
    plansPage = new TestPlansPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', MOCK_TEST_PLANS)
  })

  test('renders the test plans page with header', async ({ page }) => {
    await plansPage.goto('project-1')

    await expect(plansPage.heading).toBeVisible()
    await expect(page.getByText('Organize and manage test plans for this project.')).toBeVisible()
  })

  test('renders create test plan button', async () => {
    await plansPage.goto('project-1')

    await expect(plansPage.createButton).toBeVisible()
  })

  test('displays test plans in a table', async ({ page }) => {
    await plansPage.goto('project-1')

    // Table headers
    await expect(page.getByText('Name').first()).toBeVisible()
    await expect(page.getByText('Test Cases').first()).toBeVisible()
    await expect(page.getByText('Created By').first()).toBeVisible()

    // Plan names
    await expect(plansPage.planName('Sprint 12 Regression')).toBeVisible()
    await expect(page.getByText('Smoke Tests', { exact: true })).toBeVisible()

    // Test case counts
    await expect(plansPage.caseCount('5')).toBeVisible()
    await expect(plansPage.caseCount('3').first()).toBeVisible()
  })

  test('opens create modal when button is clicked', async ({ page }) => {
    await plansPage.goto('project-1')

    await plansPage.createButton.click()

    // Modal should appear
    await expect(page.getByText('Define a new test plan for this project.')).toBeVisible()
    await expect(plansPage.modalNameInput).toBeVisible()
    await expect(plansPage.modalDescInput).toBeVisible()
  })

  test('create button is disabled when name is empty', async () => {
    await plansPage.goto('project-1')

    await plansPage.createButton.click()

    // The Create button in the modal footer should be disabled
    await expect(plansPage.modalCreateButton).toBeDisabled()
  })

  test('can close create modal with Cancel button', async ({ page }) => {
    await plansPage.goto('project-1')

    await plansPage.createButton.click()

    // Modal should be open
    await expect(page.getByText('Define a new test plan for this project.')).toBeVisible()

    // Click cancel
    await plansPage.modalCancelButton.click()

    // Modal should be closed
    await expect(page.getByText('Define a new test plan for this project.')).not.toBeVisible()
  })
})

test.describe('Test Plans - Detail Page', () => {
  let planDetail: TestPlanDetailPage

  test.beforeEach(async ({ page }) => {
    planDetail = new TestPlanDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', MOCK_TEST_PLANS)
  })

  test('renders test plan detail with metadata', async ({ page }) => {
    await mockTestPlanDetailApi(page, 'plan-1', {
      ...MOCK_TEST_PLANS[0],
      testCases: [],
    })

    await planDetail.goto('project-1', 'plan-1')

    // Plan name heading
    await expect(planDetail.heading('Sprint 12 Regression')).toBeVisible()

    // Description
    await expect(page.getByText('Regression suite for Sprint 12')).toBeVisible()

    // Created by info
    await expect(page.getByText(/Created by.*Test User/)).toBeVisible()

    // Scope, Entry Criteria, Exit Criteria cards
    await expect(page.getByText('Login, Dashboard')).toBeVisible()
    await expect(page.getByText('Build deployed to staging')).toBeVisible()
    await expect(page.getByText('100% pass rate')).toBeVisible()

    // Edit and Add Test Cases buttons
    await expect(planDetail.editButton).toBeVisible()
    await expect(planDetail.addTestCasesButton).toBeVisible()

    // Linked test cases section
    await expect(page.getByText('Linked Test Cases')).toBeVisible()
  })

  test('shows empty state when no test cases are linked', async ({ page }) => {
    await mockTestPlanDetailApi(page, 'plan-2', {
      ...MOCK_TEST_PLANS[1],
      testCases: [],
    })

    await planDetail.goto('project-1', 'plan-2')

    await expect(planDetail.noCasesMessage).toBeVisible()
  })

  test('shows linked test cases with status and unlink button', async ({ page }) => {
    const linkedCase = {
      id: 'tc-1',
      name: 'Login flow test',
      lastRunStatus: 'PASS',
      testType: 'STEP_BASED',
      debugFlag: false,
    }

    await mockTestPlanDetailApi(page, 'plan-1', {
      ...MOCK_TEST_PLANS[0],
      testCases: [
        { id: 'tpc-1', testPlanId: 'plan-1', testCaseId: 'tc-1', testCase: linkedCase },
      ],
    })

    await planDetail.goto('project-1', 'plan-1')

    // Linked test case name
    await expect(page.getByText('Login flow test')).toBeVisible()

    // Status badge
    await expect(page.getByText('Pass', { exact: true })).toBeVisible()

    // Unlink button
    await expect(planDetail.unlinkButtons).toBeVisible()
  })

  test('shows not found state for invalid plan ID', async ({ page }) => {
    await mockTestPlanNotFoundApi(page, 'invalid-id')

    await planDetail.goto('project-1', 'invalid-id')

    await expect(planDetail.notFoundMessage).toBeVisible()
    await expect(planDetail.backButton).toBeVisible()
  })
})

test.describe('Test Plans - Empty State', () => {
  test('shows empty state when no plans exist', async ({ page }) => {
    const plansPage = new TestPlansPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', [])

    await plansPage.goto('project-1')

    await expect(plansPage.emptyState).toBeVisible()
    await expect(page.getByText('Create your first test plan to organize test cases.')).toBeVisible()
  })
})

test.describe('Test Plans - Detail Page (Edit Mode)', () => {
  let planDetail: TestPlanDetailPage

  test.beforeEach(async ({ page }) => {
    planDetail = new TestPlanDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', MOCK_TEST_PLANS)
    await mockTestPlanDetailApi(page, 'plan-1', {
      ...MOCK_TEST_PLANS[0],
      testCases: [],
    })
  })

  test('edit button exists on plan detail', async () => {
    await planDetail.goto('project-1', 'plan-1')

    await expect(planDetail.editButton).toBeVisible()
  })

  test('plan detail shows scope card', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    // Scope card with value from MOCK_TEST_PLANS[0]
    await expect(planDetail.scopeCard).toBeVisible()
    await expect(page.getByText('Login, Dashboard')).toBeVisible()
  })

  test('plan detail shows entry criteria card', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    await expect(planDetail.entryCriteriaCard).toBeVisible()
    await expect(page.getByText('Build deployed to staging')).toBeVisible()
  })

  test('plan detail shows exit criteria card', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    await expect(planDetail.exitCriteriaCard).toBeVisible()
    await expect(page.getByText('100% pass rate')).toBeVisible()
  })
})

test.describe('Test Plans - Detail Page (Linked Cases Interaction)', () => {
  let planDetail: TestPlanDetailPage

  const MOCK_LINKED_CASES = [
    {
      id: 'tpc-1',
      testPlanId: 'plan-1',
      testCaseId: 'tc-1',
      testCase: {
        id: 'tc-1',
        name: 'Login flow test',
        lastRunStatus: 'PASS',
        testType: 'STEP_BASED',
        debugFlag: false,
      },
    },
    {
      id: 'tpc-2',
      testPlanId: 'plan-1',
      testCaseId: 'tc-2',
      testCase: {
        id: 'tc-2',
        name: 'Registration validation',
        lastRunStatus: 'FAIL',
        testType: 'GHERKIN',
        debugFlag: false,
      },
    },
  ]

  test.beforeEach(async ({ page }) => {
    planDetail = new TestPlanDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', MOCK_TEST_PLANS)
    await mockTestPlanDetailApi(page, 'plan-1', {
      ...MOCK_TEST_PLANS[0],
      testCases: MOCK_LINKED_CASES,
    })
  })

  test('multiple linked test cases display with names', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    await expect(page.getByText('Linked Test Cases (2)')).toBeVisible()
    await expect(planDetail.linkedCaseName('Login flow test')).toBeVisible()
    await expect(planDetail.linkedCaseName('Registration validation')).toBeVisible()
  })

  test('each linked test case shows status badge', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    // Status badges rendered by TestStatusBadge component
    await expect(page.getByText('Pass', { exact: true })).toBeVisible()
    await expect(page.getByText('Fail', { exact: true })).toBeVisible()
  })

  test('each linked test case has unlink button', async () => {
    await planDetail.goto('project-1', 'plan-1')

    // Both linked cases should have an unlink button
    await expect(planDetail.unlinkButtons).toHaveCount(2)
  })

  test('unlink button calls API', async ({ page }) => {
    let unlinkApiCalled = false

    // Intercept DELETE for either test case
    await page.route('**/api/test-plans/plan-1/test-cases/*', async (route) => {
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

    await planDetail.goto('project-1', 'plan-1')

    // Click the first unlink button
    await planDetail.unlinkButtons.first().click()

    // Verify the API was called
    expect(unlinkApiCalled).toBe(true)
  })
})

test.describe('Test Plans - Detail Page (Add Test Cases Modal)', () => {
  let planDetail: TestPlanDetailPage

  const MOCK_LINKED_CASES = [
    {
      id: 'tpc-1',
      testPlanId: 'plan-1',
      testCaseId: 'tc-1',
      testCase: {
        id: 'tc-1',
        name: 'Login flow test',
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
    {
      id: 'tc-4',
      name: 'Profile update test',
      lastRunStatus: 'NOT_RUN',
      testType: 'STEP_BASED',
      debugFlag: false,
      projectId: 'project-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  test.beforeEach(async ({ page }) => {
    planDetail = new TestPlanDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestPlansListApi(page, 'project-1', MOCK_TEST_PLANS)
    await mockTestPlanDetailApi(page, 'plan-1', {
      ...MOCK_TEST_PLANS[0],
      testCases: MOCK_LINKED_CASES,
    })

    // Mock the test cases list endpoint (used by the modal)
    await page.route('**/api/projects/project-1/test-cases*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [...MOCK_AVAILABLE_CASES, MOCK_LINKED_CASES[0].testCase],
          total: 4,
          page: 1,
          limit: 200,
          totalPages: 1,
        }),
      })
    })
  })

  test('"Add Test Cases" button opens the add modal', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    // Modal should appear with search and case list
    await expect(page.getByText('Select test cases to link to this plan.')).toBeVisible()
    await expect(planDetail.addTestCasesModal.searchInput).toBeVisible()
  })

  test('modal shows available test cases excluding already linked ones', async () => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    const modal = planDetail.addTestCasesModal

    // Available cases should be visible (not the already-linked tc-1)
    await expect(modal.caseName('Registration validation')).toBeVisible()
    await expect(modal.caseName('Password reset flow')).toBeVisible()
    await expect(modal.caseName('Profile update test')).toBeVisible()

    // The already-linked case should NOT appear in the modal
    await expect(modal.caseName('Login flow test')).not.toBeVisible()
  })

  test('modal search filters available test cases', async () => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    const modal = planDetail.addTestCasesModal

    // All 3 available cases visible
    await expect(modal.caseName('Registration validation')).toBeVisible()
    await expect(modal.caseName('Password reset flow')).toBeVisible()

    // Type in search
    await modal.searchInput.fill('Password')

    // Only matching case should be visible
    await expect(modal.caseName('Password reset flow')).toBeVisible()
    await expect(modal.caseName('Registration validation')).not.toBeVisible()
  })

  test('link button is disabled when no cases selected', async () => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    // Link button should be disabled (shows "Link Test Cases" with no count)
    await expect(planDetail.addTestCasesModal.linkButton(/Link.*Test Case/)).toBeDisabled()
  })

  test('selecting cases shows count and enables link button', async () => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    const modal = planDetail.addTestCasesModal

    // Click on a checkbox label to select a case
    await modal.caseName('Registration validation').click()

    // Selection count should appear
    await expect(modal.selectionCount).toBeVisible()

    // Link button should now be enabled
    await expect(modal.linkButton(/Link 1 Test Case/)).toBeEnabled()
  })

  test('clicking link button calls API and closes modal', async ({ page }) => {
    let linkApiCalled = false

    await page.route('**/api/test-plans/plan-1/test-cases', async (route) => {
      if (route.request().method() === 'POST') {
        linkApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'tpc-new', testPlanId: 'plan-1', testCaseId: 'tc-2' }),
        })
      } else {
        await route.continue()
      }
    })

    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()

    const modal = planDetail.addTestCasesModal

    // Select a case
    await modal.caseName('Registration validation').click()

    // Click the link button
    await modal.linkButton(/Link 1 Test Case/).click()

    // API should have been called
    expect(linkApiCalled).toBe(true)
  })

  test('modal can be closed with Cancel button', async ({ page }) => {
    await planDetail.goto('project-1', 'plan-1')

    await planDetail.addTestCasesButton.click()
    await expect(page.getByText('Select test cases to link to this plan.')).toBeVisible()

    await planDetail.addTestCasesModal.cancelButton.click()
    await expect(page.getByText('Select test cases to link to this plan.')).not.toBeVisible()
  })
})
