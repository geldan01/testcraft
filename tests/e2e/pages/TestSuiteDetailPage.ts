import type { Page, Locator } from '@playwright/test'
import { AddTestCasesModal } from '../components/AddTestCasesModal'

export class TestSuiteDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, suiteId: string) {
    await this.page.goto(`/projects/${projectId}/test-suites/${suiteId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  typeBadge(type: string): Locator { return this.page.getByText(type, { exact: true }) }
  get editButton(): Locator { return this.page.getByRole('button', { name: 'Edit', exact: true }) }
  get addTestCasesButton(): Locator { return this.page.getByRole('button', { name: 'Add Test Cases' }) }

  linkedCaseName(name: string): Locator { return this.page.getByText(name) }
  get unlinkButtons(): Locator { return this.page.getByLabel('Unlink test case') }
  get emptyCasesMsg(): Locator { return this.page.getByText('No test cases in this suite yet.') }

  get addTestCasesModal(): AddTestCasesModal { return new AddTestCasesModal(this.page) }

  get notFoundMessage(): Locator { return this.page.getByText('Test Suite not found') }
  get backButton(): Locator { return this.page.getByRole('button', { name: 'Back to Test Suites' }) }
}
