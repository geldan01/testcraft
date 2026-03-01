import type { Page, Locator } from '@playwright/test'

export class AdminUsersPage {
  readonly path = '/admin/users'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByTestId('admin-users-heading') }
  get searchInput(): Locator { return this.page.getByTestId('admin-users-search') }
  get statusFilter(): Locator { return this.page.getByTestId('admin-users-status-filter') }

  userName(userId: string): Locator { return this.page.getByTestId(`admin-user-name-${userId}`) }
  userStatus(userId: string): Locator { return this.page.getByTestId(`admin-user-status-${userId}`) }
  userAdminBadge(userId: string): Locator { return this.page.getByTestId(`admin-user-admin-badge-${userId}`) }
  userActions(userId: string): Locator { return this.page.getByTestId(`admin-user-actions-${userId}`) }

  // Delete modal
  get deleteModal(): Locator { return this.page.getByTestId('admin-users-delete-modal') }
  get deleteCancelButton(): Locator { return this.page.getByTestId('admin-users-delete-cancel') }
  get deleteConfirmButton(): Locator { return this.page.getByTestId('admin-users-delete-confirm') }

  // Reset password modal
  get resetPasswordModal(): Locator { return this.page.getByTestId('admin-users-reset-password-modal') }
  get resetPasswordInput(): Locator { return this.page.getByTestId('admin-users-reset-password-input') }
  get resetPasswordCancelButton(): Locator { return this.page.getByTestId('admin-users-reset-password-cancel') }
  get resetPasswordConfirmButton(): Locator { return this.page.getByTestId('admin-users-reset-password-confirm') }
}
