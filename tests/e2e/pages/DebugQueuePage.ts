import type { Page, Locator } from '@playwright/test'

export class DebugQueuePage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/debug-queue`, { waitUntil: 'networkidle' })
  }

  // Header
  get heading(): Locator { return this.page.getByRole('heading', { name: 'Debug Queue' }) }
  get subtitle(): Locator { return this.page.getByTestId('debug-queue-subtitle') }

  // Count badge
  get flaggedCountBadge(): Locator { return this.page.getByTestId('debug-queue-count-badge') }

  // Empty state
  get emptyStateHeading(): Locator { return this.page.getByRole('heading', { name: 'No flagged test cases' }) }
  get emptyStateDescription(): Locator { return this.page.getByTestId('debug-queue-empty-description') }
  get backToTestCasesButton(): Locator { return this.page.getByTestId('debug-queue-back-button') }

  // Table headers
  get tableHeaders(): { name: Locator; flaggedBy: Locator; flaggedAt: Locator; lastStatus: Locator; actions: Locator } {
    return {
      name: this.page.getByTestId('debug-queue-header-name'),
      flaggedBy: this.page.getByTestId('debug-queue-header-flagged-by'),
      flaggedAt: this.page.getByTestId('debug-queue-header-flagged-at'),
      lastStatus: this.page.getByTestId('debug-queue-header-last-status'),
      actions: this.page.getByTestId('debug-queue-header-actions'),
    }
  }

  // Debug table - no data state
  get noDebugFlaggedMessage(): Locator { return this.page.getByTestId('debug-queue-no-items') }

  // Table rows
  testCaseLink(name: string): Locator {
    return this.page.getByTestId('debug-queue-case-link').filter({ hasText: name })
  }
  get viewButtons(): Locator { return this.page.getByTestId('debug-queue-view-button') }
  get unflagButtons(): Locator { return this.page.getByTestId('debug-queue-unflag-button') }
}
