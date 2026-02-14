import type { Page, Locator } from '@playwright/test'

export class TestRunDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, runId: string) {
    await this.page.goto(`/projects/${projectId}/test-runs/${runId}`)
  }

  // Header
  get heading(): Locator { return this.page.getByRole('heading', { name: 'Test Run' }) }
  get backToRunsButton(): Locator { return this.page.getByTestId('test-run-detail-back-button') }

  // Breadcrumb
  get breadcrumb(): Locator { return this.page.getByTestId('test-run-detail-breadcrumb') }

  // Run Information card
  get runInfoHeading(): Locator { return this.page.getByTestId('test-run-detail-info-heading') }
  get statusField(): Locator { return this.page.getByTestId('test-run-detail-status') }
  get environmentField(): Locator { return this.page.getByTestId('test-run-detail-environment') }
  get durationField(): Locator { return this.page.getByTestId('test-run-detail-duration') }
  get executedByField(): Locator { return this.page.getByTestId('test-run-detail-executed-by') }
  get dateField(): Locator { return this.page.getByTestId('test-run-detail-date') }
  get notesField(): Locator { return this.page.getByTestId('test-run-detail-notes') }

  // Test Case card
  get testCaseHeading(): Locator { return this.page.getByTestId('test-run-detail-test-case-heading') }
  get viewFullDetailsLink(): Locator { return this.page.getByTestId('test-run-detail-view-full-details') }
  get testCaseName(): Locator { return this.page.getByTestId('test-run-detail-test-case-name') }

  // Attachments card
  get attachmentsHeading(): Locator { return this.page.getByTestId('test-run-detail-attachments-heading') }
  get noAttachmentsMessage(): Locator { return this.page.getByTestId('test-run-detail-no-attachments') }
  get fileUploaderZone(): Locator { return this.page.getByTestId('test-run-detail-file-uploader-zone') }

  // Comments card
  get commentsHeading(): Locator { return this.page.getByTestId('test-run-detail-comments-heading') }
  get commentsComingSoon(): Locator { return this.page.getByTestId('test-run-detail-comments-coming-soon') }

  // Complete This Run card (only for IN_PROGRESS runs owned by current user)
  get completeThisRunHeading(): Locator { return this.page.getByRole('heading', { name: 'Complete This Run' }) }
  get completionStatusSelect(): Locator { return this.page.getByTestId('test-run-detail-completion-status') }
  get completionNotesField(): Locator { return this.page.getByTestId('test-run-detail-completion-notes') }
  get completeRunButton(): Locator { return this.page.getByTestId('test-run-detail-complete-button') }
  get discardRunButton(): Locator { return this.page.getByTestId('test-run-detail-discard-button') }
  get confirmDiscardButton(): Locator { return this.page.getByTestId('test-run-detail-confirm-discard') }
  get cancelDiscardButton(): Locator { return this.page.getByTestId('test-run-detail-cancel-discard') }

  // Info banner for non-owner IN_PROGRESS runs
  get inProgressBanner(): Locator { return this.page.getByTestId('test-run-detail-in-progress-banner') }

  // Not found state
  get notFoundMessage(): Locator { return this.page.getByTestId('test-run-detail-not-found') }
  get notFoundBackButton(): Locator { return this.page.getByTestId('test-run-detail-not-found-back-button') }
}
