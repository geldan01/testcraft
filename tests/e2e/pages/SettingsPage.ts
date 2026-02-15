import type { Page, Locator } from '@playwright/test'

export class SettingsPage {
  readonly path = '/settings'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  // Headings - keep getByRole for accessibility validation
  get heading(): Locator { return this.page.getByRole('heading', { name: 'Settings' }) }
  get orgDetailsHeading(): Locator { return this.page.getByRole('heading', { name: 'Organization Details' }) }
  get dangerZone(): Locator { return this.page.getByRole('heading', { name: 'Danger Zone' }) }
  get rbacHeading(): Locator { return this.page.getByRole('heading', { name: 'Role-Based Access Control' }) }

  // Tabs - keep getByRole('tab') because UTabs renders triggers internally
  // and does not support passing data-testid through the items array
  get organizationTab(): Locator { return this.page.getByRole('tab', { name: 'Organization' }) }
  get membersTab(): Locator { return this.page.getByRole('tab', { name: 'Members' }) }
  get rbacTab(): Locator { return this.page.getByRole('tab', { name: 'RBAC' }) }

  // Organization tab
  get saveChangesButton(): Locator { return this.page.getByTestId('settings-save-button') }
  get deleteOrgButton(): Locator { return this.page.getByTestId('settings-delete-org-button') }

  // Members tab
  memberName(name: string): Locator { return this.page.getByTestId('settings-member-name').filter({ hasText: name }) }
  get inviteMemberButton(): Locator { return this.page.getByTestId('settings-invite-member-button') }
  get removeMemberButtons(): Locator { return this.page.getByTestId('settings-remove-member-button') }
  get inviteEmailInput(): Locator { return this.page.getByTestId('settings-invite-email-input') }

  // RBAC tab
  get noRbacMessage(): Locator { return this.page.getByTestId('settings-no-rbac-message') }
}
