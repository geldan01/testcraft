import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class OrganizationDetailPage {
  constructor(public readonly page: Page) {}

  async goto(orgId: string) { await this.page.goto(`/organizations/${orgId}`) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get settingsButton(): Locator { return this.page.getByRole('button', { name: 'Settings' }) }
  get inviteMemberButton(): Locator { return this.page.getByRole('button', { name: 'Invite Member' }) }
  get createProjectButton(): Locator { return this.page.getByRole('button', { name: 'Create Project' }) }

  get projectsTab(): Locator { return this.page.getByRole('tab', { name: 'Projects' }) }
  get membersTab(): Locator { return this.page.getByRole('tab', { name: 'Members' }) }
  get rbacTab(): Locator { return this.page.getByRole('tab', { name: /RBAC/ }) }

  projectCard(name: string): Locator { return this.page.getByText(name, { exact: true }) }
  memberName(name: string): Locator { return this.page.getByText(name) }

  get notFoundMessage(): Locator { return this.page.getByText('Organization not found') }
  get backButton(): Locator { return this.page.getByRole('button', { name: 'Back to Organizations' }) }
}
