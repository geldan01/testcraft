import type { Page, Locator } from '@playwright/test'

export class SettingsPage {
  readonly path = '/settings'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Settings' }) }

  get organizationTab(): Locator { return this.page.getByRole('tab', { name: 'Organization' }) }
  get membersTab(): Locator { return this.page.getByRole('tab', { name: 'Members' }) }
  get rbacTab(): Locator { return this.page.getByRole('tab', { name: 'RBAC' }) }

  get orgDetailsHeading(): Locator { return this.page.getByText('Organization Details') }
  get saveChangesButton(): Locator { return this.page.getByRole('button', { name: 'Save Changes' }) }
  get dangerZone(): Locator { return this.page.getByText('Danger Zone') }
  get deleteOrgButton(): Locator { return this.page.getByRole('button', { name: 'Delete' }) }

  memberName(name: string): Locator { return this.page.getByText(name) }
  get inviteMemberButton(): Locator { return this.page.getByRole('button', { name: 'Invite Member' }) }
  get removeMemberButtons(): Locator { return this.page.getByLabel('Remove member') }
  get inviteEmailInput(): Locator { return this.page.getByPlaceholder('colleague@example.com') }

  get rbacHeading(): Locator { return this.page.getByText('Role-Based Access Control') }
  get noRbacMessage(): Locator { return this.page.getByText('No custom RBAC permissions configured.') }
}
