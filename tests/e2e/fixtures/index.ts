import { test as base } from '@playwright/test'
import { TestUsers, type TestUser, type TestUserKey } from './users'

type CustomFixtures = {
  currentUser: TestUser
}

type CustomOptions = {
  authenticate: boolean
  userKey: TestUserKey
}

export const test = base.extend<CustomFixtures & CustomOptions>({
  authenticate: [true, { option: true }],
  userKey: ['qa', { option: true }],

  currentUser: async ({ userKey }, use) => {
    await use(TestUsers[userKey])
  },

  page: async ({ page, authenticate, currentUser }, use) => {
    if (authenticate) {
      const response = await page.request.post('/api/auth/login', {
        data: { email: currentUser.email, password: currentUser.password },
      })
      if (!response.ok()) {
        throw new Error(
          `Login failed for ${currentUser.email}: ${response.status()} ${response.statusText()}`,
        )
      }
      const { token } = await response.json()
      await page.context().addCookies([
        {
          name: 'auth_token',
          value: token,
          domain: 'localhost',
          path: '/',
          sameSite: 'Lax',
        },
      ])
    }
    await use(page)
  },
})

export { expect } from '@playwright/test'
export { TestUsers, type TestUser, type TestUserKey } from './users'
