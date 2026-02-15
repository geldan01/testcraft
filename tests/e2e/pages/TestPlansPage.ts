import type { Page, Locator } from '@playwright/test'

export class TestPlansPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-plans`, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Plans' }) }
  get createButton(): Locator { return this.page.getByTestId('test-plans-create-button') }
  get emptyState(): Locator { return this.page.getByTestId('test-plans-empty-state') }

  planName(name: string): Locator { return this.page.getByTestId('test-plans-plan-name').filter({ hasText: name }) }
  caseCount(n: string): Locator { return this.page.getByTestId('test-plans-case-count').filter({ hasText: n }) }

  get createModal(): Locator { return this.page.getByTestId('test-plans-create-modal') }
  get modalNameInput(): Locator { return this.page.getByTestId('test-plans-create-modal-name-input') }
  get modalDescInput(): Locator { return this.page.getByTestId('test-plans-create-modal-description-input') }
  get modalCreateButton(): Locator { return this.page.getByTestId('test-plans-create-modal-submit-button') }
  get modalCancelButton(): Locator { return this.page.getByTestId('test-plans-create-modal-cancel-button') }
}
