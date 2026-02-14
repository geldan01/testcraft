import type { Page, Locator } from '@playwright/test'

export class AddTestCasesModal {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.locator('[role="dialog"]') }
  get searchInput(): Locator { return this.container.getByPlaceholder(/Search test/) }
  get cancelButton(): Locator { return this.container.getByRole('button', { name: 'Cancel' }) }
  caseName(name: string): Locator { return this.container.getByText(name) }
  get selectionCount(): Locator { return this.container.getByText(/test case selected/) }
  linkButton(pattern: RegExp): Locator { return this.container.getByRole('button', { name: pattern }) }
  get allLinkedMessage(): Locator { return this.container.getByText(/All test cases are already/) }
}
