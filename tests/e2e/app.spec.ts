import { test, expect } from '@playwright/test'

test.describe('App', () => {
  test('loads the home page successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('TestCraft')

    await expect(
      page.getByRole('heading', { name: 'TestCraft', level: 1 })
    ).toBeVisible()

    await expect(
      page.getByRole('heading', { name: 'Welcome to TestCraft', level: 2 })
    ).toBeVisible()
  })
})
