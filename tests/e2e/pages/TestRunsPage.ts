import type { Page, Locator } from '@playwright/test'

export class TestRunsPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/runs`, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Runs History' }) }
  get dateFromFilter(): Locator { return this.page.getByTestId('test-runs-date-from').locator('input') }
  get dateToFilter(): Locator { return this.page.getByTestId('test-runs-date-to').locator('input') }
  get emptyState(): Locator { return this.page.getByTestId('test-runs-empty-state') }
  get table(): Locator { return this.page.getByTestId('test-runs-table') }

  testRunRow(runId: string): Locator { return this.page.getByTestId(`test-run-row-${runId}`) }
  get testCaseNames(): Locator { return this.page.getByTestId('test-runs-test-case-name') }
  get statusBadges(): Locator { return this.page.getByTestId('test-runs-status-badge') }
}
