import type { Page, Locator } from '@playwright/test'

export class TestCaseCreatePage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string) { await this.page.goto(`/projects/${projectId}/test-cases/new`) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Create Test Case' }) }
  get subtitle(): Locator { return this.page.getByText('Define a new test case with steps or Gherkin syntax.') }
  get nameInput(): Locator { return this.page.getByPlaceholder('e.g., Verify user login with valid credentials') }
  get descriptionInput(): Locator { return this.page.getByPlaceholder('Describe what this test case validates...') }

  get stepBasedButton(): Locator { return this.page.getByRole('button', { name: 'Step-Based' }) }
  get gherkinButton(): Locator { return this.page.getByRole('button', { name: 'Gherkin (BDD)' }) }

  get preconditionsHeading(): Locator { return this.page.getByRole('heading', { name: 'Preconditions' }) }
  get preconditionInput(): Locator { return this.page.getByPlaceholder('Add a precondition...') }
  get addPreconditionButton(): Locator { return this.page.getByRole('button', { name: 'Add', exact: true }) }

  get testStepsHeading(): Locator { return this.page.getByRole('heading', { name: 'Test Steps' }) }
  get addStepButton(): Locator { return this.page.getByRole('button', { name: 'Add Step' }) }
  get noStepsMessage(): Locator { return this.page.getByText('No test steps yet.') }
  get stepActionInput(): Locator { return this.page.getByPlaceholder('Describe the action to perform...') }
  get stepDataInput(): Locator { return this.page.getByPlaceholder('Input data for this step (optional)') }
  get stepExpectedInput(): Locator { return this.page.getByPlaceholder('What should happen after this step...') }

  get gherkinSyntaxHeading(): Locator { return this.page.getByRole('heading', { name: 'Gherkin Syntax' }) }
  get gherkinTextarea(): Locator { return this.page.getByPlaceholder(/Feature: User Login/) }
  get previewButton(): Locator { return this.page.getByRole('button', { name: 'Preview' }) }

  get createButton(): Locator { return this.page.getByRole('button', { name: 'Create Test Case' }) }
  get cancelButtons(): Locator { return this.page.getByRole('button', { name: 'Cancel' }) }
}
