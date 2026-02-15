import { test, expect } from './fixtures'
import { LoginPage, RegisterPage, DashboardPage } from './pages'
import { TopBar } from './components'
import { MOCK_USER, MOCK_TOKEN } from './helpers'
import {
  mockLoginApi,
  mockLoginFailApi,
  mockRegisterApi,
  mockLogoutApi,
  mockDashboardApis,
  mockProjectsListApi,
  mockActivityApi,
} from './helpers'

/**
 * E2E tests for the authentication flow.
 *
 * These tests cover login, registration, error handling, and logout.
 * API calls are intercepted with page.route() to avoid needing a running database.
 */

test.describe('Authentication - Login Page', () => {
  test.use({ authenticate: false })

  test.beforeEach(async ({ page }) => {
    // Ensure no stored auth cookie so auth middleware redirects to login
    await page.context().clearCookies()
  })

  test('displays the login form with all expected elements', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    // Page heading
    await expect(loginPage.heading).toBeVisible()

    // Subtitle
    await expect(loginPage.subtitle).toBeVisible()

    // Form fields
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()

    // Sign in button
    await expect(loginPage.signInButton).toBeVisible()

    // Remember me checkbox
    await expect(loginPage.rememberMeCheckbox).toBeVisible()

    // OAuth buttons (disabled, with "Coming soon" notice)
    await expect(loginPage.googleOAuthButton).toBeVisible()
    await expect(loginPage.facebookOAuthButton).toBeVisible()

    // Sign up link
    await expect(loginPage.signUpLink).toBeVisible()
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.signInButton.click()

    // Client-side validation should display error
    await expect(loginPage.alertMessage).toBeVisible()
    await expect(page.getByText('Please enter your email and password.')).toBeVisible()
  })

  test('shows error when submitting with only email', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.emailInput.fill('test@example.com')
    await loginPage.signInButton.click()

    await expect(loginPage.alertMessage).toBeVisible()
    await expect(page.getByText('Please enter your email and password.')).toBeVisible()
  })

  test('shows error on invalid credentials from server', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // Intercept login API and return 401
    await mockLoginFailApi(page)

    await loginPage.goto()

    await loginPage.emailInput.fill('wrong@example.com')
    await loginPage.passwordInput.fill('wrongpassword')
    await loginPage.signInButton.click()

    // Should show error from server
    await expect(loginPage.alertMessage).toBeVisible()
  })

  test('redirects to dashboard on successful login', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // Mock auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    })

    // Mock successful login
    await mockLoginApi(page, { user: MOCK_USER, token: MOCK_TOKEN })

    // Mock organizations fetch (called after login in useAuth composable)
    await page.route('**/api/organizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock dashboard data fetches
    await mockProjectsListApi(page, [])
    await mockActivityApi(page, [])

    await loginPage.goto()

    await loginPage.emailInput.fill('test@example.com')
    await loginPage.passwordInput.fill('Password123!')
    await loginPage.signInButton.click()

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('navigates to register page via sign up link', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.signUpLink.click()

    await expect(page).toHaveURL(/\/auth\/register/)
  })
})

test.describe('Authentication - Register Page', () => {
  test.use({ authenticate: false })

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('displays the registration form with all expected elements', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    // Page heading
    await expect(registerPage.heading).toBeVisible()

    // Subtitle
    await expect(registerPage.subtitle).toBeVisible()

    // Form fields
    await expect(registerPage.nameInput).toBeVisible()
    await expect(registerPage.emailInput).toBeVisible()
    await expect(registerPage.passwordInput).toBeVisible()
    await expect(registerPage.confirmPasswordInput).toBeVisible()

    // Create account button
    await expect(registerPage.createAccountButton).toBeVisible()

    // OAuth buttons
    await expect(registerPage.googleOAuthButton).toBeVisible()
    await expect(registerPage.facebookOAuthButton).toBeVisible()

    // Sign in link
    await expect(registerPage.signInLink).toBeVisible()
  })

  test('shows validation error when submitting empty form', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    await registerPage.createAccountButton.click()

    await expect(registerPage.alertMessage).toBeVisible()
    await expect(page.getByText('Please fill in all fields.')).toBeVisible()
  })

  test('shows error for short password', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    await registerPage.nameInput.fill('Test User')
    await registerPage.emailInput.fill('test@example.com')
    await registerPage.passwordInput.fill('short')
    await registerPage.confirmPasswordInput.fill('short')
    await registerPage.createAccountButton.click()

    await expect(registerPage.alertMessage).toBeVisible()
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible()
  })

  test('shows error for mismatched passwords', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    await registerPage.nameInput.fill('Test User')
    await registerPage.emailInput.fill('test@example.com')
    await registerPage.passwordInput.fill('Password123!')
    await registerPage.confirmPasswordInput.fill('DifferentPassword!')
    await registerPage.createAccountButton.click()

    await expect(registerPage.alertMessage).toBeVisible()
    await expect(page.getByText('Passwords do not match.')).toBeVisible()
  })

  test('displays password strength indicator as user types', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    // Type a weak password
    await registerPage.passwordInput.fill('abc')
    await expect(registerPage.passwordStrengthText).toBeVisible()
    await expect(registerPage.passwordStrengthLevel('Weak')).toBeVisible()

    // Type a strong password
    await registerPage.passwordInput.fill('MyStr0ng!Pass')
    await expect(
      registerPage.passwordStrengthLevel('Strong').or(registerPage.passwordStrengthLevel('Very Strong')),
    ).toBeVisible()
  })

  test('redirects to dashboard on successful registration', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    // Mock successful registration
    await mockRegisterApi(page, { user: MOCK_USER, token: MOCK_TOKEN })

    // Mock auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    })

    // Mock organizations fetch (called after register in useAuth composable)
    await page.route('**/api/organizations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock dashboard data fetches
    await mockProjectsListApi(page, [])
    await mockActivityApi(page, [])

    await registerPage.goto()

    await registerPage.nameInput.fill('Test User')
    await registerPage.emailInput.fill('test@example.com')
    await registerPage.passwordInput.fill('Password123!')
    await registerPage.confirmPasswordInput.fill('Password123!')
    await registerPage.createAccountButton.click()

    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('navigates to login page via sign in link', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    await registerPage.signInLink.click()

    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('Authentication - Logout', () => {
  test('redirects to login page after logout', async ({ page, currentUser }) => {
    const dashboardPage = new DashboardPage(page)
    const topBar = new TopBar(page)

    await mockDashboardApis(page, { projects: [], activity: [] })
    await mockLogoutApi(page)

    await dashboardPage.goto()

    // Open user dropdown and click sign out
    // The avatar button contains the user initials derived from currentUser.name
    const initials = currentUser.name.split(' ').map(w => w[0]).join('')
    await topBar.avatarButton(initials).click()

    // Click sign out in the dropdown menu
    await topBar.signOutMenuItem.click()

    // Should redirect to login
    await page.waitForURL('**/auth/login')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('Authentication - Route Protection', () => {
  test.use({ authenticate: false })

  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/dashboard')

    // Auth middleware should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('index page redirects to login when not authenticated', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto('/')

    // Index page checks auth and redirects
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
