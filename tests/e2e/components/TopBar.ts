import type { Page, Locator } from '@playwright/test'

export class TopBar {
  constructor(public readonly page: Page) {}

  get container(): Locator { return this.page.locator('header') }
  breadcrumb(text: string): Locator { return this.container.getByText(text) }
  orgSwitcherText(orgName: string): Locator { return this.container.getByText(orgName) }
  get createOrgOption(): Locator { return this.page.getByText('Create Organization') }
  get notificationsButton(): Locator { return this.container.getByLabel('Notifications') }
  userAvatar(initials: string): Locator { return this.container.getByText(initials).or(this.container.getByAltText('Test User')) }
  avatarButton(initials: string): Locator { return this.container.locator('button').filter({ hasText: initials }) }
  get settingsMenuItem(): Locator { return this.page.getByRole('menuitem', { name: 'Settings' }) }
  get signOutMenuItem(): Locator { return this.page.getByRole('menuitem', { name: 'Sign out' }) }
}
