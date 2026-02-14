import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class DashboardPage {
  readonly path = '/dashboard'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }
  get main(): Locator { return this.page.getByRole('main') }

  get welcomeHeading(): Locator { return this.page.getByRole('heading', { name: /Welcome back/ }) }
  orgName(name: string): Locator { return this.main.getByText(name) }

  get totalTestCasesLabel(): Locator { return this.page.getByText('Total Test Cases') }
  get passRateLabel(): Locator { return this.page.getByText('Pass Rate') }
  get recentRunsLabel(): Locator { return this.page.getByText('Recent Runs') }
  get debugFlaggedLabel(): Locator { return this.page.getByText('Debug Flagged') }

  get recentActivitySection(): Locator { return this.page.getByText('Recent Activity') }
  get viewAllLink(): Locator { return this.page.getByText('View all') }
  get noRecentActivity(): Locator { return this.page.getByText('No recent activity') }

  get newTestCaseButton(): Locator { return this.page.getByRole('button', { name: 'New Test Case' }) }
  get newTestPlanButton(): Locator { return this.page.getByRole('button', { name: 'New Test Plan' }) }
  get viewReportsButton(): Locator { return this.page.getByRole('button', { name: 'View Reports' }) }

  get quickLinksSection(): Locator { return this.page.getByText('Quick Links') }
  get manageOrgsLink(): Locator { return this.page.getByText('Manage your organizations') }
  get rbacSettingsLink(): Locator { return this.page.getByText('Organization & RBAC settings') }
}
