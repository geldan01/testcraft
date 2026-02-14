import type { Page } from '@playwright/test'
import { MOCK_USER, MOCK_ORG } from './mock-data'

export interface AuthSetupOptions {
  user?: typeof MOCK_USER
  orgs?: (typeof MOCK_ORG)[]
}

export async function setupAuthenticatedSession(page: Page, options?: AuthSetupOptions) {
  const user = options?.user ?? MOCK_USER
  const orgs = options?.orgs ?? [MOCK_ORG]

  await page.context().addCookies([
    { name: 'auth_token', value: 'mock-token', domain: 'localhost', path: '/', sameSite: 'Lax' },
  ])

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  })

  await page.route('**/api/organizations', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(orgs),
      })
    } else {
      await route.continue()
    }
  })
}
