import type { Page, Locator } from '@playwright/test'

export class AddTestCasesModal {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.getByTestId('add-test-cases-modal') }
  get searchInput(): Locator { return this.page.getByTestId('add-test-cases-modal-search') }
  get cancelButton(): Locator { return this.page.getByTestId('add-test-cases-modal-cancel-button') }
  caseName(name: string): Locator { return this.page.getByTestId('add-test-cases-modal-case-name').filter({ hasText: name }) }
  get selectionCount(): Locator { return this.page.getByTestId('add-test-cases-modal-selection-count') }
  linkButton(_pattern?: RegExp): Locator { return this.page.getByTestId('add-test-cases-modal-submit') }
  get allLinkedMessage(): Locator { return this.page.getByTestId('add-test-cases-modal-all-linked-message') }
}
