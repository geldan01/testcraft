import type { Page, Locator } from '@playwright/test'

export class RunExecutorModal {
  constructor(public readonly page: Page) {}

  // --- Container & header ---
  get container(): Locator { return this.page.getByTestId('run-executor-modal') }
  get modalTitle(): Locator { return this.container.getByRole('heading', { name: 'Execute Test Run' }) }
  heading(caseName: string): Locator { return this.container.getByRole('heading', { name: caseName }) }

  // --- Test case content ---
  get stepsHeading(): Locator { return this.container.getByRole('heading', { name: 'Steps to Execute' }) }
  get gherkinHeading(): Locator { return this.container.getByRole('heading', { name: 'Gherkin Scenario' }) }
  stepText(text: string | RegExp): Locator { return this.container.getByText(text) }

  // --- Phase 1: Pre-start controls ---
  get environmentSelect(): Locator { return this.container.getByTestId('run-executor-environment-select') }
  get notesField(): Locator { return this.container.getByTestId('run-executor-notes-textarea') }
  /** Disabled until environment is selected; creates an IN_PROGRESS run */
  get startRunButton(): Locator { return this.container.getByTestId('run-executor-start-button') }

  // --- Phase 2: Active run controls ---
  get elapsedTimeLabel(): Locator { return this.container.getByTestId('run-executor-elapsed-time') }
  get statusSelect(): Locator { return this.container.getByTestId('run-executor-status-select') }
  /** Completes the active run with the chosen status & notes */
  get completeRunButton(): Locator { return this.container.getByTestId('run-executor-complete-button') }

  // --- Close / cancel ---
  get cancelButton(): Locator { return this.container.getByTestId('run-executor-cancel-button') }
  get closeButton(): Locator { return this.container.getByRole('button', { name: 'Close' }) }

  // --- Close confirmation (shown when closing with an active run) ---
  get closeConfirmationWarning(): Locator { return this.container.getByTestId('run-executor-close-warning') }
  get continueLaterButton(): Locator { return this.container.getByTestId('run-executor-continue-later-button') }
  get discardRunButton(): Locator { return this.container.getByTestId('run-executor-discard-button') }
  get goBackButton(): Locator { return this.container.getByTestId('run-executor-go-back-button') }
}
