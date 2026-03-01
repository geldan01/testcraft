import type { Page, Locator } from '@playwright/test'

export class AdminUserDetailPage {
  constructor(public readonly page: Page) {}

  async goto(userId: string) { await this.page.goto(`/admin/users/${userId}`, { waitUntil: 'networkidle' }) }

  get backButton(): Locator { return this.page.getByTestId('admin-user-detail-back') }
  get notFound(): Locator { return this.page.getByTestId('admin-user-detail-not-found') }
  get userName(): Locator { return this.page.getByTestId('admin-user-detail-name') }
  get userEmail(): Locator { return this.page.getByTestId('admin-user-detail-email') }
  get statusBadge(): Locator { return this.page.getByTestId('admin-user-detail-status-badge') }
  get adminBadge(): Locator { return this.page.getByTestId('admin-user-detail-admin-badge') }
  get selfBadge(): Locator { return this.page.getByTestId('admin-user-detail-self-badge') }

  // Actions (hidden for self)
  get actions(): Locator { return this.page.getByTestId('admin-user-detail-actions') }
  get suspendButton(): Locator { return this.page.getByTestId('admin-user-detail-suspend-btn') }
  get adminToggleButton(): Locator { return this.page.getByTestId('admin-user-detail-admin-toggle-btn') }
  get resetPasswordButton(): Locator { return this.page.getByTestId('admin-user-detail-reset-password-btn') }
  get deleteButton(): Locator { return this.page.getByTestId('admin-user-detail-delete-btn') }

  // Memberships
  get memberships(): Locator { return this.page.getByTestId('admin-user-detail-memberships') }
  membership(membershipId: string): Locator { return this.page.getByTestId(`admin-user-detail-membership-${membershipId}`) }
}
