import type { Page, Locator } from '@playwright/test'

export class TestSuitesPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-suites`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Suites' }) }
  get createButton(): Locator { return this.page.getByRole('button', { name: 'Create Test Suite' }) }
  get emptyState(): Locator { return this.page.getByText('No test suites yet') }

  suiteName(name: string): Locator { return this.page.getByRole('heading', { name }) }
  typeBadge(type: string): Locator { return this.page.getByText(type, { exact: true }) }

  get createModal(): Locator { return this.page.locator('[role="dialog"]') }
  get modalNameInput(): Locator { return this.page.getByPlaceholder('e.g., Login Regression') }
  get modalDescInput(): Locator { return this.page.getByPlaceholder('Describe this test suite...') }
  get modalCreateButton(): Locator { return this.createModal.getByRole('button', { name: 'Create' }) }
  get modalCancelButton(): Locator { return this.createModal.getByRole('button', { name: 'Cancel' }) }
}
