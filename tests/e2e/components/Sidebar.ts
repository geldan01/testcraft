import type { Page, Locator } from '@playwright/test'

export class Sidebar {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.getByTestId('sidebar') }
  get dashboardLink(): Locator { return this.page.getByTestId('sidebar-nav-dashboard') }
  get organizationsLink(): Locator { return this.page.getByTestId('sidebar-nav-organizations') }
  get settingsLink(): Locator { return this.page.getByTestId('sidebar-nav-settings') }
  get brandText(): Locator { return this.page.getByTestId('sidebar-brand') }
  get collapseButton(): Locator { return this.page.getByTestId('sidebar-collapse-toggle') }
  get expandButton(): Locator { return this.page.getByTestId('sidebar-collapse-toggle') }
}
