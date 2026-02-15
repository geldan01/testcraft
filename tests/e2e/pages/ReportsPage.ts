import type { Page, Locator } from '@playwright/test'

export class ReportsPage {
  readonly path: string

  constructor(public readonly page: Page, projectId: string) {
    this.path = `/projects/${projectId}/reports`
  }

  async goto() {
    await this.page.goto(this.path, { waitUntil: 'networkidle' })
  }

  // Page header
  get pageTitle(): Locator {
    return this.page.getByTestId('reports-title')
  }

  // Filter bar
  get filterBar(): Locator {
    return this.page.getByTestId('reports-filter-bar')
  }

  get timeRangeSelect(): Locator {
    return this.page.getByTestId('reports-time-range-select')
  }

  get scopeSelect(): Locator {
    return this.page.getByTestId('reports-scope-select')
  }

  get scopeEntitySelect(): Locator {
    return this.page.getByTestId('reports-scope-entity-select')
  }

  // Export
  get exportButton(): Locator {
    return this.page.getByTestId('reports-export-btn')
  }

  // Chart sections
  get statusBreakdownCard(): Locator {
    return this.page.getByTestId('reports-status-breakdown')
  }

  get executionTrendCard(): Locator {
    return this.page.getByTestId('reports-execution-trend')
  }

  get environmentComparisonCard(): Locator {
    return this.page.getByTestId('reports-environment-comparison')
  }

  // Table sections
  get flakyTestsCard(): Locator {
    return this.page.getByTestId('reports-flaky-tests')
  }

  get topFailingTestsCard(): Locator {
    return this.page.getByTestId('reports-top-failing-tests')
  }
}
