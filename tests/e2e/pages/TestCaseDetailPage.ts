import type { Page, Locator } from '@playwright/test'
import { RunExecutorModal } from '../components/RunExecutorModal'
import { CommentsSection } from '../components/CommentsSection'

export class TestCaseDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, caseId: string) {
    await this.page.goto(`/projects/${projectId}/test-cases/${caseId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get statusBadge(): Locator { return this.page.getByTestId('test-case-detail-status') }
  get typeBadge(): Locator { return this.page.getByTestId('test-case-detail-type-badge') }

  get runTestButton(): Locator { return this.page.getByTestId('test-case-detail-run-test-button') }
  get editButton(): Locator { return this.page.getByTestId('test-case-detail-edit-button') }
  get debugToggle(): Locator { return this.page.getByTestId('test-case-detail-debug-toggle') }
  get debugInfo(): Locator { return this.page.getByTestId('test-case-detail-debug-info') }

  get stepsHeading(): Locator { return this.page.getByTestId('test-case-detail-steps-heading') }
  get stepsTable(): Locator { return this.page.getByTestId('test-case-detail-steps-table') }

  get runHistoryHeading(): Locator { return this.page.getByTestId('test-case-detail-run-history-heading') }
  get noRunsMessage(): Locator { return this.page.getByTestId('test-case-detail-no-runs-message') }

  get commentsSection(): CommentsSection { return new CommentsSection(this.page) }
  get attachmentsHeading(): Locator { return this.page.getByRole('heading', { name: /Attachments/ }) }
  get uploadButton(): Locator { return this.page.getByTestId('test-case-detail-upload-button') }
  get downloadButton(): Locator { return this.page.getByTestId('test-case-detail-download-button') }

  get plansHeading(): Locator { return this.page.getByTestId('test-case-detail-plans-heading') }
  get suitesHeading(): Locator { return this.page.getByTestId('test-case-detail-suites-heading') }
  get noPlanMessage(): Locator { return this.page.getByTestId('test-case-detail-no-plan-message') }
  get noSuiteMessage(): Locator { return this.page.getByTestId('test-case-detail-no-suite-message') }
  get removeFromPlanButtons(): Locator { return this.page.getByTestId('test-case-detail-remove-plan-button') }
  get removeFromSuiteButtons(): Locator { return this.page.getByTestId('test-case-detail-remove-suite-button') }
  get addPlanButton(): Locator { return this.page.getByTestId('test-case-detail-add-plan-button') }
  get addSuiteButton(): Locator { return this.page.getByTestId('test-case-detail-add-suite-button') }

  get notFoundMessage(): Locator { return this.page.getByTestId('test-case-detail-not-found-message') }
  get backButton(): Locator { return this.page.getByTestId('test-case-detail-back-button') }

  get runExecutorModal(): RunExecutorModal { return new RunExecutorModal(this.page) }
}
