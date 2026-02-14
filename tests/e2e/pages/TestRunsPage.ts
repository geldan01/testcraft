import type { Page, Locator } from '@playwright/test'

export class TestRunsPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/runs`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Runs History' }) }
  get dateInputs(): Locator { return this.page.locator('input[type="date"]') }
  get emptyState(): Locator { return this.page.getByText('No test runs yet') }

  testCaseLink(name: string): Locator { return this.page.getByRole('link', { name }) }
  statusBadge(status: string): Locator { return this.page.getByText(status, { exact: true }) }
}
