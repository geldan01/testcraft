import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class ProjectDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}`) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }
  get main(): Locator { return this.page.getByRole('main') }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  description(text: string): Locator { return this.page.getByText(text) }

  statLabel(label: string): Locator { return this.main.locator('p').filter({ hasText: label }) }
  statValue(value: string, exact = false): Locator { return this.main.getByText(value, { exact }) }

  get overviewTab(): Locator { return this.page.getByRole('tab', { name: 'Overview' }) }
  get testPlansTab(): Locator { return this.page.getByRole('tab', { name: 'Test Plans' }) }
  get testSuitesTab(): Locator { return this.page.getByRole('tab', { name: 'Test Suites' }) }
  get testCasesTab(): Locator { return this.page.getByRole('tab', { name: 'Test Cases' }) }

  get createTestCaseButton(): Locator { return this.page.getByRole('button', { name: 'Create Test Case' }) }
  get viewTestPlansButton(): Locator { return this.page.getByRole('button', { name: 'View Test Plans' }) }
  get viewRunHistoryButton(): Locator { return this.page.getByRole('button', { name: 'View Run History' }) }

  get projectDetailsCard(): Locator { return this.page.getByText('Project Details') }
  get createdLabel(): Locator { return this.page.getByText('Created') }
  get lastUpdatedLabel(): Locator { return this.page.getByText('Last Updated') }
  get organizationLabel(): Locator { return this.page.getByText('Organization', { exact: true }) }
  get projectSettingsButton(): Locator { return this.page.getByRole('button', { name: 'Project Settings' }) }

  get notFoundMessage(): Locator { return this.page.getByText('Project not found') }
  get backButton(): Locator { return this.page.getByRole('button', { name: 'Back to Organizations' }) }
}
