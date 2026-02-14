import { test, expect } from './fixtures'
import { ProjectDetailPage } from './pages'
import { MOCK_PROJECT, mockProjectApi, mockProjectNotFoundApi } from './helpers'

/**
 * E2E tests for the project detail / overview page.
 *
 * Covers project header, stats cards, tab navigation,
 * quick actions, project details card, and not-found state.
 */

test.describe('Project Detail - Overview Page', () => {
  let project: ProjectDetailPage

  test.beforeEach(async ({ page }) => {
    project = new ProjectDetailPage(page)
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('renders project detail page with name and description', async () => {
    await project.goto('project-1')

    await expect(project.heading('Web App')).toBeVisible()
    await expect(project.description).toBeVisible()
    await expect(project.description).toHaveText('Main web application')
  })

  test('stats cards render with correct counts', async () => {
    await project.goto('project-1')

    await expect(project.stat('test-cases')).toBeVisible()
    await expect(project.stat('test-cases')).toContainText('15')

    await expect(project.stat('test-plans')).toBeVisible()
    await expect(project.stat('test-plans')).toContainText('3')

    await expect(project.stat('test-suites')).toBeVisible()
    await expect(project.stat('test-suites')).toContainText('4')

    await expect(project.stat('members')).toBeVisible()
    await expect(project.stat('members')).toContainText('5')
  })

  test('tabs display correctly', async () => {
    await project.goto('project-1')

    await expect(project.overviewTab).toBeVisible()
    await expect(project.testPlansTab).toBeVisible()
    await expect(project.testSuitesTab).toBeVisible()
    await expect(project.testCasesTab).toBeVisible()
  })

  test('quick action buttons are visible on overview', async () => {
    await project.goto('project-1')

    await expect(project.createTestCaseButton).toBeVisible()
    await expect(project.viewTestPlansButton).toBeVisible()
    await expect(project.viewRunHistoryButton).toBeVisible()
  })

  test('Project Details card shows created/updated dates and organization name', async ({ page }) => {
    await project.goto('project-1')

    await expect(project.projectDetailsCard).toBeVisible()
    await expect(project.createdLabel).toBeVisible()
    await expect(project.lastUpdatedLabel).toBeVisible()
    await expect(project.organizationLabel).toBeVisible()
    await expect(page.getByText('Acme Corp').first()).toBeVisible()
  })

  test('Project Settings button is visible', async () => {
    await project.goto('project-1')

    await expect(project.projectSettingsButton).toBeVisible()
  })

  test('shows not found state for invalid project ID', async ({ page }) => {
    await mockProjectNotFoundApi(page, 'invalid-project')

    await page.goto('/projects/invalid-project')

    await expect(project.notFoundMessage).toBeVisible()
    await expect(project.backButton).toBeVisible()
  })
})
