import type { Page, Locator } from '@playwright/test'
import { AddTestCasesModal } from '../components/AddTestCasesModal'

export class TestSuiteDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, suiteId: string) {
    await this.page.goto(`/projects/${projectId}/test-suites/${suiteId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  typeBadge(type: string): Locator { return this.page.getByTestId('test-suite-detail-type-badge').filter({ hasText: type }) }
  get editButton(): Locator { return this.page.getByTestId('test-suite-detail-edit-button') }
  get addTestCasesButton(): Locator { return this.page.getByTestId('test-suite-detail-add-cases-button') }

  linkedCaseName(name: string): Locator { return this.page.getByTestId('test-suite-detail-linked-case-name').filter({ hasText: name }) }
  get unlinkButtons(): Locator { return this.page.getByTestId('test-suite-detail-unlink-button') }
  get emptyCasesMsg(): Locator { return this.page.getByTestId('test-suite-detail-empty-cases-message') }

  get addTestCasesModal(): AddTestCasesModal { return new AddTestCasesModal(this.page) }

  get notFoundMessage(): Locator { return this.page.getByTestId('test-suite-detail-not-found') }
  get backButton(): Locator { return this.page.getByTestId('test-suite-detail-back-button') }
}
