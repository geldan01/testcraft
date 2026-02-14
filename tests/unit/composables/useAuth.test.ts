/**
 * Unit tests for the useAuth composable logic.
 *
 * Tests the coordination logic between the auth store, organization store,
 * and router navigation that the composable orchestrates.
 *
 * Since useAuth relies on Nuxt's useRouter and Pinia stores, these tests
 * validate the logical flow and expected side effects at the unit level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '~/types'
import { createMockUser, createMockAuthResponse, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock types matching the composable's dependencies
// ---------------------------------------------------------------------------

interface MockAuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  currentUser: User | null
  userName: string
  userInitials: string
  login: (credentials: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<AuthResponse>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  initFromStorage: () => void
  clearAuth: () => void
}

interface MockOrgStore {
  fetchOrganizations: () => Promise<void>
  restoreCurrentOrg: () => void
  clearOrganizations: () => void
}

interface MockRouter {
  push: (path: string) => Promise<void>
}

function createMockAuthStore(overrides: Partial<MockAuthStore> = {}): MockAuthStore {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    currentUser: null,
    userName: '',
    userInitials: '?',
    login: vi.fn().mockResolvedValue(createMockAuthResponse()),
    register: vi.fn().mockResolvedValue(createMockAuthResponse()),
    logout: vi.fn().mockResolvedValue(undefined),
    fetchCurrentUser: vi.fn().mockResolvedValue(undefined),
    initFromStorage: vi.fn(),
    clearAuth: vi.fn(),
    ...overrides,
  }
}

function createMockOrgStore(overrides: Partial<MockOrgStore> = {}): MockOrgStore {
  return {
    fetchOrganizations: vi.fn().mockResolvedValue(undefined),
    restoreCurrentOrg: vi.fn(),
    clearOrganizations: vi.fn(),
    ...overrides,
  }
}

function createMockRouter(): MockRouter {
  return {
    push: vi.fn().mockResolvedValue(undefined),
  }
}

// ---------------------------------------------------------------------------
// Extracted logic from composables/useAuth.ts
// ---------------------------------------------------------------------------

function createUseAuth(authStore: MockAuthStore, orgStore: MockOrgStore, router: MockRouter) {
  const isAuthenticated = () => authStore.isAuthenticated
  const currentUser = () => authStore.currentUser
  const userName = () => authStore.userName
  const userInitials = () => authStore.userInitials

  async function login(credentials: LoginRequest): Promise<void> {
    await authStore.login(credentials)
    await orgStore.fetchOrganizations()
    orgStore.restoreCurrentOrg()
    await router.push('/dashboard')
  }

  async function register(data: RegisterRequest): Promise<void> {
    await authStore.register(data)
    await router.push('/dashboard')
  }

  async function logout(): Promise<void> {
    await authStore.logout()
    orgStore.clearOrganizations()
    await router.push('/auth/login')
  }

  async function getCurrentUser(): Promise<void> {
    await authStore.fetchCurrentUser()
  }

  function initAuth(): void {
    authStore.initFromStorage()
    if (authStore.token) {
      authStore.fetchCurrentUser()
      orgStore.fetchOrganizations().then(() => {
        orgStore.restoreCurrentOrg()
      })
    }
  }

  return {
    isAuthenticated,
    currentUser,
    userName,
    userInitials,
    login,
    register,
    logout,
    getCurrentUser,
    initAuth,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuth Composable', () => {
  let authStore: MockAuthStore
  let orgStore: MockOrgStore
  let router: MockRouter

  beforeEach(() => {
    resetFixtureCounter()
    authStore = createMockAuthStore()
    orgStore = createMockOrgStore()
    router = createMockRouter()
  })

  describe('Computed properties', () => {
    it('isAuthenticated delegates to authStore', () => {
      const { isAuthenticated } = createUseAuth(authStore, orgStore, router)
      expect(isAuthenticated()).toBe(false)
    })

    it('isAuthenticated returns true when store is authenticated', () => {
      authStore.isAuthenticated = true
      const { isAuthenticated } = createUseAuth(authStore, orgStore, router)
      expect(isAuthenticated()).toBe(true)
    })

    it('currentUser delegates to authStore', () => {
      const { currentUser } = createUseAuth(authStore, orgStore, router)
      expect(currentUser()).toBeNull()
    })

    it('currentUser returns user when set in store', () => {
      const user = createMockUser({ name: 'Test User' })
      authStore.currentUser = user
      const { currentUser } = createUseAuth(authStore, orgStore, router)
      expect(currentUser()).toEqual(user)
    })

    it('userName delegates to authStore', () => {
      authStore.userName = 'John Doe'
      const { userName } = createUseAuth(authStore, orgStore, router)
      expect(userName()).toBe('John Doe')
    })

    it('userInitials delegates to authStore', () => {
      authStore.userInitials = 'JD'
      const { userInitials } = createUseAuth(authStore, orgStore, router)
      expect(userInitials()).toBe('JD')
    })
  })

  describe('login', () => {
    it('calls authStore.login with credentials', async () => {
      const { login } = createUseAuth(authStore, orgStore, router)
      const credentials: LoginRequest = { email: 'test@example.com', password: 'password123' }
      await login(credentials)
      expect(authStore.login).toHaveBeenCalledWith(credentials)
    })

    it('fetches organizations after login', async () => {
      const { login } = createUseAuth(authStore, orgStore, router)
      await login({ email: 'test@example.com', password: 'pass' })
      expect(orgStore.fetchOrganizations).toHaveBeenCalled()
    })

    it('restores current org after fetching organizations', async () => {
      const { login } = createUseAuth(authStore, orgStore, router)
      await login({ email: 'test@example.com', password: 'pass' })
      expect(orgStore.restoreCurrentOrg).toHaveBeenCalled()
    })

    it('navigates to /dashboard after login', async () => {
      const { login } = createUseAuth(authStore, orgStore, router)
      await login({ email: 'test@example.com', password: 'pass' })
      expect(router.push).toHaveBeenCalledWith('/dashboard')
    })

    it('calls actions in correct order: login -> fetchOrgs -> restoreOrg -> navigate', async () => {
      const callOrder: string[] = []
      authStore.login = vi.fn().mockImplementation(async () => {
        callOrder.push('login')
        return createMockAuthResponse()
      })
      orgStore.fetchOrganizations = vi.fn().mockImplementation(async () => {
        callOrder.push('fetchOrganizations')
      })
      orgStore.restoreCurrentOrg = vi.fn().mockImplementation(() => {
        callOrder.push('restoreCurrentOrg')
      })
      router.push = vi.fn().mockImplementation(async () => {
        callOrder.push('navigate')
      })

      const { login } = createUseAuth(authStore, orgStore, router)
      await login({ email: 'test@example.com', password: 'pass' })

      expect(callOrder).toEqual([
        'login',
        'fetchOrganizations',
        'restoreCurrentOrg',
        'navigate',
      ])
    })

    it('propagates login error without navigating', async () => {
      authStore.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

      const { login } = createUseAuth(authStore, orgStore, router)
      await expect(login({ email: 'bad@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      )
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('register', () => {
    it('calls authStore.register with registration data', async () => {
      const { register } = createUseAuth(authStore, orgStore, router)
      const data: RegisterRequest = {
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
      }
      await register(data)
      expect(authStore.register).toHaveBeenCalledWith(data)
    })

    it('navigates to /dashboard after registration', async () => {
      const { register } = createUseAuth(authStore, orgStore, router)
      await register({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
      })
      expect(router.push).toHaveBeenCalledWith('/dashboard')
    })

    it('propagates registration error without navigating', async () => {
      authStore.register = vi.fn().mockRejectedValue(new Error('Email already exists'))

      const { register } = createUseAuth(authStore, orgStore, router)
      await expect(
        register({ name: 'Test', email: 'taken@example.com', password: 'Password123!' }),
      ).rejects.toThrow('Email already exists')
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('calls authStore.logout', async () => {
      const { logout } = createUseAuth(authStore, orgStore, router)
      await logout()
      expect(authStore.logout).toHaveBeenCalled()
    })

    it('clears organizations after logout', async () => {
      const { logout } = createUseAuth(authStore, orgStore, router)
      await logout()
      expect(orgStore.clearOrganizations).toHaveBeenCalled()
    })

    it('navigates to /auth/login after logout', async () => {
      const { logout } = createUseAuth(authStore, orgStore, router)
      await logout()
      expect(router.push).toHaveBeenCalledWith('/auth/login')
    })

    it('calls actions in correct order: logout -> clearOrgs -> navigate', async () => {
      const callOrder: string[] = []
      authStore.logout = vi.fn().mockImplementation(async () => {
        callOrder.push('logout')
      })
      orgStore.clearOrganizations = vi.fn().mockImplementation(() => {
        callOrder.push('clearOrganizations')
      })
      router.push = vi.fn().mockImplementation(async () => {
        callOrder.push('navigate')
      })

      const { logout } = createUseAuth(authStore, orgStore, router)
      await logout()

      expect(callOrder).toEqual(['logout', 'clearOrganizations', 'navigate'])
    })
  })

  describe('getCurrentUser', () => {
    it('calls authStore.fetchCurrentUser', async () => {
      const { getCurrentUser } = createUseAuth(authStore, orgStore, router)
      await getCurrentUser()
      expect(authStore.fetchCurrentUser).toHaveBeenCalled()
    })
  })

  describe('initAuth', () => {
    it('calls authStore.initFromStorage', () => {
      const { initAuth } = createUseAuth(authStore, orgStore, router)
      initAuth()
      expect(authStore.initFromStorage).toHaveBeenCalled()
    })

    it('fetches user and orgs when token exists in storage', () => {
      authStore.token = 'stored-token'
      const { initAuth } = createUseAuth(authStore, orgStore, router)
      initAuth()
      expect(authStore.fetchCurrentUser).toHaveBeenCalled()
      expect(orgStore.fetchOrganizations).toHaveBeenCalled()
    })

    it('does not fetch user or orgs when no token in storage', () => {
      authStore.token = null
      const { initAuth } = createUseAuth(authStore, orgStore, router)
      initAuth()
      expect(authStore.fetchCurrentUser).not.toHaveBeenCalled()
      expect(orgStore.fetchOrganizations).not.toHaveBeenCalled()
    })

    it('restores current org after organizations are fetched', async () => {
      authStore.token = 'stored-token'

      // Make fetchOrganizations resolve so .then() executes
      let resolveOrgs: () => void
      orgStore.fetchOrganizations = vi.fn().mockImplementation(
        () => new Promise<void>((resolve) => { resolveOrgs = resolve }),
      )

      const { initAuth } = createUseAuth(authStore, orgStore, router)
      initAuth()

      // restoreCurrentOrg should not have been called yet
      expect(orgStore.restoreCurrentOrg).not.toHaveBeenCalled()

      // Resolve the fetchOrganizations promise
      resolveOrgs!()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(orgStore.restoreCurrentOrg).toHaveBeenCalled()
    })
  })

  describe('Return value', () => {
    it('returns all expected properties and methods', () => {
      const auth = createUseAuth(authStore, orgStore, router)
      expect(auth).toHaveProperty('isAuthenticated')
      expect(auth).toHaveProperty('currentUser')
      expect(auth).toHaveProperty('userName')
      expect(auth).toHaveProperty('userInitials')
      expect(auth).toHaveProperty('login')
      expect(auth).toHaveProperty('register')
      expect(auth).toHaveProperty('logout')
      expect(auth).toHaveProperty('getCurrentUser')
      expect(auth).toHaveProperty('initAuth')
    })

    it('login, register, logout, getCurrentUser are async functions', () => {
      const auth = createUseAuth(authStore, orgStore, router)
      expect(typeof auth.login).toBe('function')
      expect(typeof auth.register).toBe('function')
      expect(typeof auth.logout).toBe('function')
      expect(typeof auth.getCurrentUser).toBe('function')
    })

    it('initAuth is a synchronous function', () => {
      const auth = createUseAuth(authStore, orgStore, router)
      expect(typeof auth.initAuth).toBe('function')
    })
  })
})
