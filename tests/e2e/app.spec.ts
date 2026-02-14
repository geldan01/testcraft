import { test, expect } from './fixtures'

test.use({ authenticate: false })

test.describe('App', () => {
  test('redirects unauthenticated users to login from home page', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/')

    // Index page should redirect to login when not authenticated
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
