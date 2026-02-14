import type { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly path = '/auth/login'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Sign in to your account' }) }
  get subtitle(): Locator { return this.page.getByText('Welcome back! Enter your credentials to continue.') }
  get emailInput(): Locator { return this.page.getByPlaceholder('you@example.com') }
  get passwordInput(): Locator { return this.page.getByPlaceholder('Enter your password') }
  get signInButton(): Locator { return this.page.getByRole('button', { name: 'Sign in' }) }
  get rememberMeCheckbox(): Locator { return this.page.getByText('Remember me') }
  get forgotPasswordLink(): Locator { return this.page.getByRole('link', { name: 'Forgot password?' }) }
  get googleOAuthButton(): Locator { return this.page.getByRole('button', { name: 'Google' }) }
  get facebookOAuthButton(): Locator { return this.page.getByRole('button', { name: 'Facebook' }) }
  get signUpLink(): Locator { return this.page.getByRole('link', { name: 'Sign up' }) }
  get alertMessage(): Locator { return this.page.getByRole('alert') }
}
