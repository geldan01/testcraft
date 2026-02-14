import type { Page, Locator } from '@playwright/test'

export class Sidebar {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.locator('aside[role="navigation"]') }
  get dashboardLink(): Locator { return this.container.getByText('Dashboard').first() }
  get organizationsLink(): Locator { return this.container.getByText('Organizations') }
  get settingsLink(): Locator { return this.container.getByText('Settings') }
  get brandText(): Locator { return this.container.getByText('TestCraft') }
  get collapseButton(): Locator { return this.container.getByText('Collapse') }
  get expandButton(): Locator { return this.container.getByTitle('Expand sidebar') }
}
