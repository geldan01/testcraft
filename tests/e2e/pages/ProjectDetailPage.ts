import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class ProjectDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}`, { waitUntil: 'networkidle' }) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }
  get main(): Locator { return this.page.getByRole('main') }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get description(): Locator { return this.page.getByTestId('project-detail-description') }

  get statsContainer(): Locator { return this.page.getByTestId('project-detail-stats') }
  stat(name: 'test-cases' | 'test-plans' | 'test-suites' | 'members'): Locator {
    return this.page.getByTestId(`project-detail-stat-${name}`)
  }

  get overviewTab(): Locator { return this.page.getByRole('tab', { name: 'Overview' }) }
  get testPlansTab(): Locator { return this.page.getByRole('tab', { name: 'Test Plans' }) }
  get testSuitesTab(): Locator { return this.page.getByRole('tab', { name: 'Test Suites' }) }
  get testCasesTab(): Locator { return this.page.getByRole('tab', { name: 'Test Cases' }) }

  get createTestCaseButton(): Locator { return this.page.getByTestId('project-detail-create-test-case') }
  get viewTestPlansButton(): Locator { return this.page.getByTestId('project-detail-view-test-plans') }
  get viewRunHistoryButton(): Locator { return this.page.getByTestId('project-detail-view-run-history') }

  get projectDetailsCard(): Locator { return this.page.getByTestId('project-detail-info-card') }
  get createdLabel(): Locator { return this.page.getByTestId('project-detail-created') }
  get lastUpdatedLabel(): Locator { return this.page.getByTestId('project-detail-last-updated') }
  get organizationLabel(): Locator { return this.page.getByTestId('project-detail-organization') }
  get projectSettingsButton(): Locator { return this.page.getByTestId('project-detail-settings-button') }

  get notFoundMessage(): Locator { return this.page.getByTestId('project-detail-not-found') }
  get backButton(): Locator { return this.page.getByTestId('project-detail-back-button') }
}
