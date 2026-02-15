import type { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly path = '/auth/login'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path, { waitUntil: 'networkidle' }) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Sign in to your account' }) }
  get subtitle(): Locator { return this.page.getByTestId('login-subtitle') }
  get emailInput(): Locator { return this.page.getByTestId('login-email-input') }
  get passwordInput(): Locator { return this.page.getByTestId('login-password-input') }
  get signInButton(): Locator { return this.page.getByTestId('login-submit-button') }
  get rememberMeCheckbox(): Locator { return this.page.getByTestId('login-remember-checkbox') }
  get googleOAuthButton(): Locator { return this.page.getByTestId('login-oauth-google') }
  get facebookOAuthButton(): Locator { return this.page.getByTestId('login-oauth-facebook') }
  get signUpLink(): Locator { return this.page.getByTestId('login-signup-link') }
  get alertMessage(): Locator { return this.page.getByRole('alert') }
}
