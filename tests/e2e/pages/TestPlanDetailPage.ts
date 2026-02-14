import type { Page, Locator } from '@playwright/test'
import { AddTestCasesModal } from '../components/AddTestCasesModal'

export class TestPlanDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, planId: string) {
    await this.page.goto(`/projects/${projectId}/test-plans/${planId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get editButton(): Locator { return this.page.getByRole('button', { name: 'Edit', exact: true }) }
  get addTestCasesButton(): Locator { return this.page.getByRole('button', { name: 'Add Test Cases' }) }

  get createdByText(): Locator { return this.page.getByText(/Created by/) }
  get scopeCard(): Locator { return this.page.getByText('Scope') }
  get entryCriteriaCard(): Locator { return this.page.getByText('Entry Criteria') }
  get exitCriteriaCard(): Locator { return this.page.getByText('Exit Criteria') }

  get linkedCasesHeading(): Locator { return this.page.getByText(/Linked Test Cases/) }
  linkedCaseName(name: string): Locator { return this.page.getByText(name) }
  get unlinkButtons(): Locator { return this.page.getByLabel('Unlink test case') }
  get noCasesMessage(): Locator { return this.page.getByText('No test cases linked to this plan yet.') }

  get addTestCasesModal(): AddTestCasesModal { return new AddTestCasesModal(this.page) }

  get notFoundMessage(): Locator { return this.page.getByText('Test Plan not found') }
  get backButton(): Locator { return this.page.getByRole('button', { name: 'Back to Test Plans' }) }
}
