import type { Page, Locator } from '@playwright/test'
import { AddTestCasesModal } from '../components/AddTestCasesModal'

export class TestPlanDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, planId: string) {
    await this.page.goto(`/projects/${projectId}/test-plans/${planId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get editButton(): Locator { return this.page.getByTestId('test-plan-detail-edit-button') }
  get addTestCasesButton(): Locator { return this.page.getByTestId('test-plan-detail-add-cases-button') }

  get createdByText(): Locator { return this.page.getByTestId('test-plan-detail-created-by') }
  get scopeCard(): Locator { return this.page.getByTestId('test-plan-detail-scope-card') }
  get entryCriteriaCard(): Locator { return this.page.getByTestId('test-plan-detail-entry-criteria-card') }
  get exitCriteriaCard(): Locator { return this.page.getByTestId('test-plan-detail-exit-criteria-card') }

  get linkedCasesHeading(): Locator { return this.page.getByRole('heading', { name: /Linked Test Cases/ }) }
  linkedCaseName(name: string): Locator { return this.page.getByTestId('test-plan-detail-linked-case-name').filter({ hasText: name }) }
  get unlinkButtons(): Locator { return this.page.getByTestId('test-plan-detail-unlink-button') }
  get noCasesMessage(): Locator { return this.page.getByTestId('test-plan-detail-no-cases-message') }

  get addTestCasesModal(): AddTestCasesModal { return new AddTestCasesModal(this.page) }

  get notFoundMessage(): Locator { return this.page.getByTestId('test-plan-detail-not-found') }
  get backButton(): Locator { return this.page.getByTestId('test-plan-detail-back-button') }
}
