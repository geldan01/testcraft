import type { Page, Locator } from '@playwright/test'

export class TestCasesPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-cases`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Cases' }) }
  get createButton(): Locator { return this.page.getByRole('button', { name: 'Create Test Case' }) }
  get searchInput(): Locator { return this.page.getByPlaceholder('Search test cases...') }
  get emptyState(): Locator { return this.page.getByText('No test cases yet') }
  get emptyStateDescription(): Locator { return this.page.getByText('Create your first test case to start testing.') }
  countText(n: number): Locator { return this.page.getByText(`${n} test cases in this project`) }

  testCaseName(name: string): Locator { return this.page.getByText(name) }
  get debugFlagButtons(): Locator { return this.page.locator('button[title="Remove debug flag"]') }
  get unflaggedButtons(): Locator { return this.page.locator('button[title="Flag for debug"]') }
}
