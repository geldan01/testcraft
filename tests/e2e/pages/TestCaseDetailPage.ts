import type { Page, Locator } from '@playwright/test'
import { RunExecutorModal } from '../components/RunExecutorModal'
import { CommentsSection } from '../components/CommentsSection'

export class TestCaseDetailPage {
  constructor(public readonly page: Page) {}

  async goto(projectId: string, caseId: string) {
    await this.page.goto(`/projects/${projectId}/test-cases/${caseId}`)
  }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  statusText(status: string): Locator { return this.page.getByText(status) }
  typeBadge(type: string): Locator { return this.page.getByText(type) }

  get runTestButton(): Locator { return this.page.getByRole('button', { name: 'Run Test' }) }
  get editButton(): Locator { return this.page.getByRole('button', { name: 'Edit', exact: true }) }
  get flagForDebugText(): Locator { return this.page.getByText('Flag for Debug') }
  get flaggedText(): Locator { return this.page.getByText('Flagged') }
  flaggedByText(name: string): Locator { return this.page.getByText(`by ${name}`).first() }

  get testStepsHeading(): Locator { return this.page.getByText('Test Steps') }
  get stepsTable(): Locator { return this.page.locator('table').first() }

  get runHistoryHeading(): Locator { return this.page.getByText(/Run History/) }
  runHistoryCount(n: number): Locator { return this.page.getByText(`Run History (${n})`) }
  get noRunsMessage(): Locator { return this.page.getByText('No test runs recorded yet.') }

  get commentsSection(): CommentsSection { return new CommentsSection(this.page) }
  get attachmentsHeading(): Locator { return this.page.getByRole('heading', { name: /Attachments/ }) }
  get uploadButton(): Locator { return this.page.getByRole('button', { name: 'Upload' }) }
  get downloadButton(): Locator { return this.page.getByLabel('Download') }

  plansSectionCount(n: number): Locator { return this.page.getByText(`Test Plans (${n})`) }
  suitesSectionCount(n: number): Locator { return this.page.getByText(`Test Suites (${n})`) }
  get noPlanMessage(): Locator { return this.page.getByText('Not part of any test plan.') }
  get noSuiteMessage(): Locator { return this.page.getByText('Not part of any test suite.') }
  get removeFromPlanButtons(): Locator { return this.page.getByLabel('Remove from plan') }
  get removeFromSuiteButtons(): Locator { return this.page.getByLabel('Remove from suite') }
  get addButtons(): Locator { return this.page.getByRole('button', { name: 'Add' }) }

  get notFoundMessage(): Locator { return this.page.getByText('Test Case not found') }
  get backButton(): Locator { return this.page.getByRole('button', { name: 'Back to Test Cases' }) }

  get runExecutorModal(): RunExecutorModal { return new RunExecutorModal(this.page) }
}
