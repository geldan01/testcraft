import type { Page, Locator } from '@playwright/test'

export class TestCasesPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-cases`, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Cases' }) }
  get createButton(): Locator { return this.page.getByTestId('test-cases-create-button') }
  get searchInput(): Locator { return this.page.getByPlaceholder('Search test cases...') }
  get emptyState(): Locator { return this.page.getByTestId('test-cases-empty-state') }
  get emptyStateDescription(): Locator { return this.page.getByTestId('test-cases-empty-state-description') }
  get countText(): Locator { return this.page.getByTestId('test-cases-count') }
  get table(): Locator { return this.page.getByTestId('test-cases-table') }

  row(id: string): Locator { return this.page.getByTestId(`test-case-row-${id}`) }
  rowName(id: string): Locator { return this.page.getByTestId(`test-case-row-${id}-name`) }
  debugToggle(id: string): Locator { return this.page.getByTestId(`test-case-row-${id}-debug-toggle`) }
}
