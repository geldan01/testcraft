import type { Page, Locator } from '@playwright/test'

export class TestCaseCreatePage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-cases/new`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Create Test Case' }) }
  get subtitle(): Locator { return this.page.getByTestId('test-case-create-subtitle') }
  get nameInput(): Locator { return this.page.getByTestId('test-case-create-name-input') }
  get descriptionInput(): Locator { return this.page.getByTestId('test-case-create-description-input') }

  get stepBasedButton(): Locator { return this.page.getByTestId('test-case-create-step-based-button') }
  get gherkinButton(): Locator { return this.page.getByTestId('test-case-create-gherkin-button') }

  get preconditionsHeading(): Locator { return this.page.getByRole('heading', { name: 'Preconditions' }) }
  get preconditionInput(): Locator { return this.page.getByTestId('test-case-create-precondition-input') }
  get addPreconditionButton(): Locator { return this.page.getByTestId('test-case-create-add-precondition-button') }

  get testStepsHeading(): Locator { return this.page.getByRole('heading', { name: 'Test Steps' }) }
  get addStepButton(): Locator { return this.page.getByTestId('test-case-create-add-step-button') }
  get noStepsMessage(): Locator { return this.page.getByTestId('test-case-create-no-steps-message') }
  get stepActionInput(): Locator { return this.page.getByTestId('test-case-create-step-action-input') }
  get stepDataInput(): Locator { return this.page.getByTestId('test-case-create-step-data-input') }
  get stepExpectedInput(): Locator { return this.page.getByTestId('test-case-create-step-expected-input') }

  get gherkinSyntaxHeading(): Locator { return this.page.getByRole('heading', { name: 'Gherkin Syntax' }) }
  get gherkinTextarea(): Locator { return this.page.getByTestId('test-case-create-gherkin-textarea') }
  get previewButton(): Locator { return this.page.getByTestId('test-case-create-preview-button') }

  get createButton(): Locator { return this.page.getByTestId('test-case-create-submit-button') }
  get cancelButtons(): Locator { return this.page.getByTestId('test-case-create-cancel-button') }
}
