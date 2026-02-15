import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class DashboardPage {
  readonly path = '/dashboard'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }
  get main(): Locator { return this.page.getByRole('main') }

  get welcomeHeading(): Locator { return this.page.getByRole('heading', { name: /Welcome back/ }) }
  get orgName(): Locator { return this.page.getByTestId('dashboard-org-name') }

  get totalTestCasesLabel(): Locator { return this.page.getByTestId('dashboard-stat-total-test-cases') }
  get passRateLabel(): Locator { return this.page.getByTestId('dashboard-stat-pass-rate') }
  get recentRunsLabel(): Locator { return this.page.getByTestId('dashboard-stat-recent-runs') }
  get debugFlaggedLabel(): Locator { return this.page.getByTestId('dashboard-stat-debug-flagged') }

  get recentActivitySection(): Locator { return this.page.getByTestId('dashboard-recent-activity') }
  get viewAllLink(): Locator { return this.page.getByTestId('dashboard-view-all-activity') }
  get noRecentActivity(): Locator { return this.page.getByTestId('dashboard-no-recent-activity') }

  get newTestCaseButton(): Locator { return this.page.getByTestId('dashboard-new-test-case-btn') }
  get newTestPlanButton(): Locator { return this.page.getByTestId('dashboard-new-test-plan-btn') }
  get viewReportsButton(): Locator { return this.page.getByTestId('dashboard-view-reports-btn') }

  get quickLinksSection(): Locator { return this.page.getByTestId('dashboard-quick-links') }
  get manageOrgsLink(): Locator { return this.page.getByTestId('dashboard-manage-orgs-link') }
  get rbacSettingsLink(): Locator { return this.page.getByTestId('dashboard-rbac-settings-link') }
}
