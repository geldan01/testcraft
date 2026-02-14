import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class OrganizationsPage {
  readonly path = '/organizations'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Organizations' }) }
  get createOrgButton(): Locator { return this.page.getByRole('button', { name: 'Create Organization' }) }
  get emptyState(): Locator { return this.page.getByText('No organizations yet') }

  orgCard(name: string): Locator { return this.page.getByRole('link', { name: new RegExp(name) }).first() }

  get createModal(): Locator { return this.page.locator('[role="dialog"]') }
  get modalNameInput(): Locator { return this.page.getByPlaceholder('e.g., Acme Corp') }
  get modalCreateButton(): Locator { return this.createModal.getByRole('button', { name: 'Create' }) }
  get modalCancelButton(): Locator { return this.createModal.getByRole('button', { name: 'Cancel' }) }
}
