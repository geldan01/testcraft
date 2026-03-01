import type { Page, Locator } from '@playwright/test'

export class AdminDashboardPage {
  readonly path = '/admin'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByTestId('admin-heading') }
  get statsLoading(): Locator { return this.page.getByTestId('admin-stats-loading') }
  get statsGrid(): Locator { return this.page.getByTestId('admin-stats-grid') }

  statCard(label: string): Locator {
    return this.page.getByTestId(`admin-stat-${label.toLowerCase().replace(/\s+/g, '-')}`)
  }

  get manageUsersLink(): Locator { return this.page.getByTestId('admin-manage-users-link') }
  get manageOrgsLink(): Locator { return this.page.getByTestId('admin-manage-orgs-link') }
}
