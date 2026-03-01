import type { Page, Locator } from '@playwright/test'

export class AdminOrganizationsPage {
  readonly path = '/admin/organizations'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByTestId('admin-orgs-heading') }
  get searchInput(): Locator { return this.page.getByTestId('admin-orgs-search') }
  get createOrgButton(): Locator { return this.page.getByTestId('admin-orgs-create-btn') }

  orgName(orgId: string): Locator { return this.page.getByTestId(`admin-org-name-${orgId}`) }
  orgActions(orgId: string): Locator { return this.page.getByTestId(`admin-org-actions-${orgId}`) }

  // Create modal
  get createModal(): Locator { return this.page.getByTestId('admin-orgs-create-modal') }
  get createNameInput(): Locator { return this.page.getByTestId('admin-orgs-create-name-input') }
  get createEmailInput(): Locator { return this.page.getByTestId('admin-orgs-create-email-input') }
  get createCancelButton(): Locator { return this.page.getByTestId('admin-orgs-create-cancel') }
  get createConfirmButton(): Locator { return this.page.getByTestId('admin-orgs-create-confirm') }

  // Delete modal
  get deleteModal(): Locator { return this.page.getByTestId('admin-orgs-delete-modal') }
  get deleteCancelButton(): Locator { return this.page.getByTestId('admin-orgs-delete-cancel') }
  get deleteConfirmButton(): Locator { return this.page.getByTestId('admin-orgs-delete-confirm') }
}
