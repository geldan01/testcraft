import type { Page, Locator } from '@playwright/test'

export class RegisterPage {
  readonly path = '/auth/register'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Create your account' }) }
  get subtitle(): Locator { return this.page.getByTestId('register-subtitle') }
  get nameInput(): Locator { return this.page.getByTestId('register-name-input') }
  get emailInput(): Locator { return this.page.getByTestId('register-email-input') }
  get passwordInput(): Locator { return this.page.getByTestId('register-password-input') }
  get confirmPasswordInput(): Locator { return this.page.getByTestId('register-confirm-password-input') }
  get createAccountButton(): Locator { return this.page.getByTestId('register-submit-button') }
  get googleOAuthButton(): Locator { return this.page.getByTestId('register-oauth-google') }
  get facebookOAuthButton(): Locator { return this.page.getByTestId('register-oauth-facebook') }
  get signInLink(): Locator { return this.page.getByTestId('register-signin-link') }
  get alertMessage(): Locator { return this.page.getByRole('alert') }
  get passwordStrengthText(): Locator { return this.page.getByTestId('register-password-strength') }
  passwordStrengthLevel(level: string): Locator { return this.page.getByText(level) }
}
