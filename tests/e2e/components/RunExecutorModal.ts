import type { Page, Locator } from '@playwright/test'

export class RunExecutorModal {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.locator('[role="dialog"]') }
  get modalTitle(): Locator { return this.page.getByText('Execute Test Run') }
  heading(caseName: string): Locator { return this.container.getByRole('heading', { name: caseName }) }
  get stepsHeading(): Locator { return this.container.getByText('Steps to Execute') }
  get gherkinHeading(): Locator { return this.container.getByText('Gherkin Scenario') }
  stepText(text: string | RegExp): Locator { return this.container.getByText(text) }
  get environmentSelect(): Locator { return this.container.getByText('Select environment...') }
  environmentOption(env: string): Locator { return this.page.getByText(env) }
  get statusSelect(): Locator { return this.container.getByRole('combobox').nth(1) }
  statusOption(status: string): Locator { return this.page.getByRole('option', { name: status }) }
  get notesField(): Locator { return this.container.getByPlaceholder('Add any observations, defect references, or notes...') }
  get submitButton(): Locator { return this.container.getByRole('button', { name: 'Submit Result' }) }
  get cancelButton(): Locator { return this.container.getByRole('button', { name: 'Cancel' }) }
}
