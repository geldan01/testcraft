import type { Page, Locator } from '@playwright/test'

export class RegisterPage {
  readonly path = '/auth/register'
  constructor(public readonly page: Page) {}

  async goto() { await this.page.goto(this.path) }

  get heading(): Locator { return this.page.getByRole('heading', { name: 'Create your account' }) }
  get subtitle(): Locator { return this.page.getByText('Get started with TestCraft in seconds.') }
  get nameInput(): Locator { return this.page.getByPlaceholder('John Doe') }
  get emailInput(): Locator { return this.page.getByPlaceholder('you@example.com') }
  get passwordInput(): Locator { return this.page.getByPlaceholder('Create a strong password') }
  get confirmPasswordInput(): Locator { return this.page.getByPlaceholder('Confirm your password') }
  get createAccountButton(): Locator { return this.page.getByRole('button', { name: 'Create account' }) }
  get googleOAuthButton(): Locator { return this.page.getByRole('button', { name: 'Google' }) }
  get facebookOAuthButton(): Locator { return this.page.getByRole('button', { name: 'Facebook' }) }
  get signInLink(): Locator { return this.page.getByRole('link', { name: 'Sign in' }) }
  get alertMessage(): Locator { return this.page.getByRole('alert') }
  get passwordStrengthText(): Locator { return this.page.getByText('Password strength:') }
  passwordStrengthLevel(level: string): Locator { return this.page.getByText(level) }
}
