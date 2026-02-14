import type { Page, Locator } from '@playwright/test'

export class TestPlansPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-plans`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Plans' }) }
  get createButton(): Locator { return this.page.getByRole('button', { name: 'Create Test Plan' }) }
  get emptyState(): Locator { return this.page.getByText('No test plans yet') }

  planName(name: string): Locator { return this.page.getByText(name) }
  caseCount(n: string): Locator { return this.page.getByRole('cell', { name: n }) }

  get createModal(): Locator { return this.page.locator('[role="dialog"]') }
  get modalNameInput(): Locator { return this.page.getByPlaceholder('e.g., Sprint 12 Regression') }
  get modalDescInput(): Locator { return this.page.getByPlaceholder('Describe the purpose and scope of this test plan...') }
  get modalCreateButton(): Locator { return this.createModal.getByRole('button', { name: 'Create' }) }
  get modalCancelButton(): Locator { return this.createModal.getByRole('button', { name: 'Cancel' }) }
}
