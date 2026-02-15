import type { Page, Locator } from '@playwright/test'

export class TestSuitesPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-suites`, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Suites' }) }
  get createButton(): Locator { return this.page.getByTestId('test-suites-create-button') }
  get emptyState(): Locator { return this.page.getByTestId('test-suites-empty-state') }

  suiteName(name: string): Locator { return this.page.getByRole('heading', { name }) }
  typeBadge(type: string): Locator { return this.page.getByTestId('test-suites-type-badge').filter({ hasText: type }) }

  get createModal(): Locator { return this.page.getByTestId('test-suites-create-modal') }
  get modalNameInput(): Locator { return this.page.getByTestId('test-suites-create-modal-name-input') }
  get modalDescInput(): Locator { return this.page.getByTestId('test-suites-create-modal-description-input') }
  get modalCreateButton(): Locator { return this.page.getByTestId('test-suites-create-modal-submit-button') }
  get modalCancelButton(): Locator { return this.page.getByTestId('test-suites-create-modal-cancel-button') }
}
