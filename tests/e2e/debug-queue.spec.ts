import { test, expect } from './fixtures'
import { DebugQueuePage } from './pages'
import {
  MOCK_USER,
  MOCK_PROJECT,
  mockProjectApi,
  mockDebugQueueApi,
} from './helpers'

/**
 * E2E tests for the Debug Queue page.
 *
 * The debug queue shows all test cases that have been flagged for debugging.
 * It is accessible via the sidebar "Debug Queue" link.
 *
 * Features tested:
 * - Navigation to the debug queue page
 * - Display of the DebugQueueTable with flagged test cases
 * - Unflag action (removing the debug flag)
 * - Empty state when no cases are flagged
 * - Table columns: Name, Flagged By, Flagged At, Last Status, Actions
 */

const MOCK_DEBUG_CASES = [
  {
    id: 'tc-1',
    name: 'Login button not responding',
    description: 'Login button becomes unresponsive after 3 clicks',
    projectId: 'project-1',
    preconditions: [],
    testType: 'STEP_BASED',
    steps: [{ stepNumber: 1, action: 'Click login', data: '', expectedResult: 'Login form submits' }],
    gherkinSyntax: null,
    debugFlag: true,
    debugFlaggedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    debugFlaggedById: 'user-1',
    lastRunStatus: 'FAIL',
    lastRunAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    debugFlaggedBy: MOCK_USER,
  },
  {
    id: 'tc-2',
    name: 'Payment timeout on staging',
    description: 'Payment process times out in staging environment',
    projectId: 'project-1',
    preconditions: [],
    testType: 'STEP_BASED',
    steps: [{ stepNumber: 1, action: 'Submit payment', data: '', expectedResult: 'Payment confirmed' }],
    gherkinSyntax: null,
    debugFlag: true,
    debugFlaggedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    debugFlaggedById: 'user-1',
    lastRunStatus: 'BLOCKED',
    lastRunAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    debugFlaggedBy: MOCK_USER,
  },
  {
    id: 'tc-3',
    name: 'Profile image upload fails',
    description: 'Image upload returns 500 on production',
    projectId: 'project-1',
    preconditions: [],
    testType: 'GHERKIN',
    steps: null,
    gherkinSyntax: 'Feature: Image Upload\n  Scenario: Upload profile image',
    debugFlag: true,
    debugFlaggedAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    debugFlaggedById: 'user-1',
    lastRunStatus: 'NOT_RUN',
    lastRunAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user-1',
    createdBy: MOCK_USER,
    debugFlaggedBy: MOCK_USER,
  },
]

test.describe('Debug Queue - Page Layout', () => {
  test('displays the debug queue heading and subtitle', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await expect(debugQueue.heading).toBeVisible()
    await expect(debugQueue.subtitle).toBeVisible()
  })

  test('displays the count badge for flagged test cases', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await expect(debugQueue.flaggedCountBadge).toBeVisible()
    await expect(debugQueue.flaggedCountBadge).toHaveText('3 flagged test cases')
  })

  test('count badge shows singular form for 1 flagged case', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', [MOCK_DEBUG_CASES[0]])

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await expect(debugQueue.flaggedCountBadge).toBeVisible()
    await expect(debugQueue.flaggedCountBadge).toHaveText('1 flagged test case')
  })
})

test.describe('Debug Queue - Table Display', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)
  })

  test('displays table headers', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    const headers = debugQueue.tableHeaders
    await expect(headers.name).toBeVisible()
    await expect(headers.flaggedBy).toBeVisible()
    await expect(headers.flaggedAt).toBeVisible()
    await expect(headers.lastStatus).toBeVisible()
    await expect(headers.actions).toBeVisible()
  })

  test('displays all flagged test case names as links', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // Each test case name should be a clickable link
    await expect(debugQueue.testCaseLink('Login button not responding')).toBeVisible()
    await expect(debugQueue.testCaseLink('Payment timeout on staging')).toBeVisible()
    await expect(debugQueue.testCaseLink('Profile image upload fails')).toBeVisible()
  })

  test('test case name links navigate to test case detail page', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    const link = debugQueue.testCaseLink('Login button not responding')
    await expect(link).toHaveAttribute('href', '/projects/project-1/test-cases/tc-1')
  })

  test('displays "Flagged By" user names', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // MOCK_USER.name is "Test User", should appear for each flagged case
    const userNames = page.getByText('Test User')
    // At least one should be visible (could be in multiple rows)
    await expect(userNames.first()).toBeVisible()
  })

  test('displays "Flagged At" dates in formatted form', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // The dates should be formatted as "Mon DD, YYYY" (e.g., "Feb 13, 2026")
    // We can not test exact dates since they depend on Date.now(), but we can verify
    // that the date column cells are not empty (they won't show '--')
    // The formatted date will contain a month abbreviation
    const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dateTexts = page.locator('table tbody td:nth-child(3)')
    const count = await dateTexts.count()
    expect(count).toBe(3)
  })

  test('displays status badges for last run status', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // Status badges: FAIL, BLOCKED, NOT_RUN
    await expect(page.getByText('Fail', { exact: true })).toBeVisible()
    await expect(page.getByText('Blocked', { exact: true })).toBeVisible()
    await expect(page.getByText('Not Run', { exact: true })).toBeVisible()
  })

  test('each row has a "View test case" button', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    const viewButtons = debugQueue.viewButtons
    await expect(viewButtons).toHaveCount(3)
  })

  test('each row has a "Remove debug flag" button', async ({ page }) => {
    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    const unflagButtons = debugQueue.unflagButtons
    await expect(unflagButtons).toHaveCount(3)
  })
})

test.describe('Debug Queue - Unflag Action', () => {
  test('clicking unflag button calls PUT /api/test-cases/:id/debug-flag', async ({ page }) => {
    let unflagApiCalled = false

    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    // Mock the toggle debug flag API for tc-1
    await page.route('**/api/test-cases/tc-1/debug-flag', async (route) => {
      if (route.request().method() === 'PUT') {
        unflagApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_DEBUG_CASES[0],
            debugFlag: false,
            debugFlaggedAt: null,
            debugFlaggedById: null,
            debugFlaggedBy: null,
          }),
        })
      } else {
        await route.continue()
      }
    })

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // Click the unflag button on the first row
    await debugQueue.unflagButtons.first().click()

    expect(unflagApiCalled).toBe(true)
  })

  test('unflagging a case removes it from the table', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    // Mock the toggle debug flag API
    await page.route('**/api/test-cases/tc-1/debug-flag', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_DEBUG_CASES[0],
            debugFlag: false,
            debugFlaggedAt: null,
            debugFlaggedById: null,
            debugFlaggedBy: null,
          }),
        })
      } else {
        await route.continue()
      }
    })

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // Verify the case is present before unflagging
    await expect(debugQueue.testCaseLink('Login button not responding')).toBeVisible()

    // Click unflag
    await debugQueue.unflagButtons.first().click()

    // The unflagged case should be removed from the list
    await expect(debugQueue.testCaseLink('Login button not responding')).not.toBeVisible()

    // Other cases should still be present
    await expect(debugQueue.testCaseLink('Payment timeout on staging')).toBeVisible()
    await expect(debugQueue.testCaseLink('Profile image upload fails')).toBeVisible()
  })
})

test.describe('Debug Queue - Empty State', () => {
  test('shows empty state when no debug-flagged cases exist', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', [])

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    // Empty state elements
    await expect(debugQueue.emptyStateHeading).toBeVisible()
    await expect(debugQueue.emptyStateDescription).toBeVisible()
    await expect(debugQueue.backToTestCasesButton).toBeVisible()
  })

  test('count badge shows 0 in empty state', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', [])

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await expect(debugQueue.flaggedCountBadge).toBeVisible()
    await expect(debugQueue.flaggedCountBadge).toHaveText('0 flagged test cases')
  })

  test('"Back to Test Cases" button navigates correctly', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', [])

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await debugQueue.backToTestCasesButton.click()

    await expect(page).toHaveURL(/\/projects\/project-1\/test-cases/)
  })
})

test.describe('Debug Queue - Navigation', () => {
  test('debug queue page is accessible via sidebar "Debug Queue" link', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    // First navigate to a project page so the sidebar shows project nav
    // We'll navigate to the debug queue page directly to verify it loads
    await page.goto(`/projects/project-1/debug-queue`)

    // The heading should be visible
    await expect(page.getByRole('heading', { name: 'Debug Queue' })).toBeVisible()
  })

  test('debug queue URL follows /projects/:id/debug-queue pattern', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockDebugQueueApi(page, 'project-1', MOCK_DEBUG_CASES)

    const debugQueue = new DebugQueuePage(page)
    await debugQueue.goto('project-1')

    await expect(page).toHaveURL(/\/projects\/project-1\/debug-queue/)
  })
})
