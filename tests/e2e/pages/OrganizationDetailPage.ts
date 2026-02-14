import type { Page, Locator } from '@playwright/test'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export class OrganizationDetailPage {
  constructor(public readonly page: Page) {}

  async goto(orgId: string) { await this.page.goto(`/organizations/${orgId}`) }

  get sidebar(): Sidebar { return new Sidebar(this.page) }
  get topBar(): TopBar { return new TopBar(this.page) }

  heading(name: string): Locator { return this.page.getByRole('heading', { name }) }
  get settingsButton(): Locator { return this.page.getByTestId('org-detail-settings-button') }
  get inviteMemberButton(): Locator { return this.page.getByTestId('org-detail-invite-member-button') }
  get createProjectButton(): Locator { return this.page.getByTestId('org-detail-create-project-button') }

  // Tabs: scoped within org-detail-tabs container, using getByRole('tab') for accessibility
  private get tabsContainer(): Locator { return this.page.getByTestId('org-detail-tabs') }
  get projectsTab(): Locator { return this.tabsContainer.getByRole('tab', { name: 'Projects' }) }
  get membersTab(): Locator { return this.tabsContainer.getByRole('tab', { name: 'Members' }) }
  get rbacTab(): Locator { return this.tabsContainer.getByRole('tab', { name: /RBAC/ }) }

  projectCard(projectId: string): Locator { return this.page.getByTestId(`org-detail-project-card-${projectId}`) }
  memberRow(memberId: string): Locator { return this.page.getByTestId(`org-detail-member-${memberId}`) }

  get notFoundMessage(): Locator { return this.page.getByTestId('org-detail-not-found') }
  get backButton(): Locator { return this.page.getByTestId('org-detail-back-button') }
}
