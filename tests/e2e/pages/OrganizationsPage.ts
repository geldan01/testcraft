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
  get createOrgButton(): Locator { return this.page.getByTestId('organizations-create-button') }
  get emptyState(): Locator { return this.page.getByTestId('organizations-empty-state') }

  orgCard(orgId: string): Locator { return this.page.getByTestId(`organizations-org-card-${orgId}`) }

  get createModal(): Locator { return this.page.getByTestId('organizations-create-modal') }
  get modalNameInput(): Locator { return this.page.getByTestId('organizations-create-modal-name-input') }
  get modalCreateButton(): Locator { return this.page.getByTestId('organizations-create-modal-submit-button') }
  get modalCancelButton(): Locator { return this.page.getByTestId('organizations-create-modal-cancel-button') }
}
