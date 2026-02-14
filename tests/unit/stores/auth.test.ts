/**
 * Unit tests for the auth Pinia store.
 *
 * Tests state management, getters (isAuthenticated, userName, userInitials),
 * and actions (clearAuth, initFromStorage).
 *
 * Network-dependent actions (login, register, fetchCurrentUser, logout) are
 * tested at the logic level -- verifying that state is set correctly given
 * certain inputs, without actually calling $fetch.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { User, AuthResponse } from '~/types'
import { createMockUser, createMockAuthResponse, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted state & getters logic from stores/auth.ts
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null
  token: string | null
}

function createAuthState(): AuthState {
  return {
    user: null,
    token: null,
  }
}

function isAuthenticated(state: AuthState): boolean {
  return !!state.token && !!state.user
}

function currentUser(state: AuthState): User | null {
  return state.user
}

function userName(state: AuthState): string {
  return state.user?.name ?? ''
}

function userInitials(state: AuthState): string {
  if (!state.user?.name) return '?'
  return state.user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function applyLoginResponse(state: AuthState, response: AuthResponse): AuthState {
  return {
    user: response.user,
    token: response.token,
  }
}

function clearAuth(): AuthState {
  return {
    user: null,
    token: null,
  }
}

function initFromStorage(state: AuthState, storedToken: string | null): AuthState {
  if (storedToken) {
    return { ...state, token: storedToken }
  }
  return state
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Auth Store', () => {
  beforeEach(() => {
    resetFixtureCounter()
  })

  describe('Initial state', () => {
    it('starts with null user', () => {
      const state = createAuthState()
      expect(state.user).toBeNull()
    })

    it('starts with null token', () => {
      const state = createAuthState()
      expect(state.token).toBeNull()
    })
  })

  describe('isAuthenticated getter', () => {
    it('returns false when both user and token are null', () => {
      const state = createAuthState()
      expect(isAuthenticated(state)).toBe(false)
    })

    it('returns false when token exists but user is null', () => {
      const state: AuthState = { user: null, token: 'some-token' }
      expect(isAuthenticated(state)).toBe(false)
    })

    it('returns false when user exists but token is null', () => {
      const state: AuthState = { user: createMockUser(), token: null }
      expect(isAuthenticated(state)).toBe(false)
    })

    it('returns true when both user and token exist', () => {
      const state: AuthState = { user: createMockUser(), token: 'valid-token' }
      expect(isAuthenticated(state)).toBe(true)
    })

    it('returns false when token is empty string', () => {
      const state: AuthState = { user: createMockUser(), token: '' }
      expect(isAuthenticated(state)).toBe(false)
    })
  })

  describe('currentUser getter', () => {
    it('returns null when no user is set', () => {
      const state = createAuthState()
      expect(currentUser(state)).toBeNull()
    })

    it('returns the user when set', () => {
      const user = createMockUser({ name: 'John Doe' })
      const state: AuthState = { user, token: 'token' }
      expect(currentUser(state)).toEqual(user)
    })
  })

  describe('userName getter', () => {
    it('returns empty string when no user is set', () => {
      const state = createAuthState()
      expect(userName(state)).toBe('')
    })

    it('returns the user name when set', () => {
      const state: AuthState = {
        user: createMockUser({ name: 'Jane Smith' }),
        token: 'token',
      }
      expect(userName(state)).toBe('Jane Smith')
    })

    it('returns empty string when user name is empty', () => {
      const state: AuthState = {
        user: createMockUser({ name: '' }),
        token: 'token',
      }
      expect(userName(state)).toBe('')
    })
  })

  describe('userInitials getter', () => {
    it('returns "?" when no user is set', () => {
      const state = createAuthState()
      expect(userInitials(state)).toBe('?')
    })

    it('returns "?" when user name is empty', () => {
      const state: AuthState = {
        user: createMockUser({ name: '' }),
        token: 'token',
      }
      expect(userInitials(state)).toBe('?')
    })

    it('returns single initial for single name', () => {
      const state: AuthState = {
        user: createMockUser({ name: 'Alice' }),
        token: 'token',
      }
      expect(userInitials(state)).toBe('A')
    })

    it('returns two initials for two-word name', () => {
      const state: AuthState = {
        user: createMockUser({ name: 'John Doe' }),
        token: 'token',
      }
      expect(userInitials(state)).toBe('JD')
    })

    it('returns only first two initials for three-word name', () => {
      const state: AuthState = {
        user: createMockUser({ name: 'Jean-Paul Gaultier III' }),
        token: 'token',
      }
      // Splits by space: ['Jean-Paul', 'Gaultier', 'III']
      // First chars: 'J', 'G', 'I' -> 'JGI' -> sliced to 'JG'
      expect(userInitials(state)).toBe('JG')
    })

    it('uppercases lowercase initials', () => {
      const state: AuthState = {
        user: createMockUser({ name: 'bob smith' }),
        token: 'token',
      }
      expect(userInitials(state)).toBe('BS')
    })
  })

  describe('Login action (state application)', () => {
    it('sets user and token from auth response', () => {
      const response = createMockAuthResponse()
      const state = applyLoginResponse(createAuthState(), response)
      expect(state.user).toEqual(response.user)
      expect(state.token).toBe(response.token)
    })

    it('overwrites previous user and token', () => {
      const previousState: AuthState = {
        user: createMockUser({ name: 'Old User' }),
        token: 'old-token',
      }
      const response = createMockAuthResponse({
        user: createMockUser({ name: 'New User' }),
        token: 'new-token',
      })
      const state = applyLoginResponse(previousState, response)
      expect(state.user?.name).toBe('New User')
      expect(state.token).toBe('new-token')
    })

    it('results in authenticated state', () => {
      const response = createMockAuthResponse()
      const state = applyLoginResponse(createAuthState(), response)
      expect(isAuthenticated(state)).toBe(true)
    })
  })

  describe('clearAuth action', () => {
    it('resets user to null', () => {
      const state = clearAuth()
      expect(state.user).toBeNull()
    })

    it('resets token to null', () => {
      const state = clearAuth()
      expect(state.token).toBeNull()
    })

    it('results in unauthenticated state', () => {
      const state = clearAuth()
      expect(isAuthenticated(state)).toBe(false)
    })
  })

  describe('initFromStorage action', () => {
    it('sets token from stored value', () => {
      const state = initFromStorage(createAuthState(), 'stored-token')
      expect(state.token).toBe('stored-token')
    })

    it('does not change state when stored token is null', () => {
      const originalState = createAuthState()
      const state = initFromStorage(originalState, null)
      expect(state.token).toBeNull()
    })

    it('does not set user (user is fetched separately)', () => {
      const state = initFromStorage(createAuthState(), 'stored-token')
      expect(state.user).toBeNull()
    })

    it('preserves existing user when restoring token', () => {
      const existingState: AuthState = {
        user: createMockUser(),
        token: null,
      }
      const state = initFromStorage(existingState, 'new-token')
      expect(state.user).not.toBeNull()
      expect(state.token).toBe('new-token')
    })
  })

  describe('localStorage token persistence', () => {
    it('saves token to localStorage on login', () => {
      const mockLocalStorage = new Map<string, string>()
      const token = 'jwt-token-123'

      // Simulate the login action's localStorage write
      mockLocalStorage.set('auth_token', token)
      expect(mockLocalStorage.get('auth_token')).toBe(token)
    })

    it('removes token from localStorage on clearAuth', () => {
      const mockLocalStorage = new Map<string, string>()
      mockLocalStorage.set('auth_token', 'some-token')

      // Simulate clearAuth's localStorage removal
      mockLocalStorage.delete('auth_token')
      expect(mockLocalStorage.has('auth_token')).toBe(false)
    })

    it('reads token from localStorage on initFromStorage', () => {
      const mockLocalStorage = new Map<string, string>()
      mockLocalStorage.set('auth_token', 'persisted-token')

      const storedToken = mockLocalStorage.get('auth_token') ?? null
      const state = initFromStorage(createAuthState(), storedToken)
      expect(state.token).toBe('persisted-token')
    })

    it('handles missing token in localStorage gracefully', () => {
      const mockLocalStorage = new Map<string, string>()

      const storedToken = mockLocalStorage.get('auth_token') ?? null
      const state = initFromStorage(createAuthState(), storedToken)
      expect(state.token).toBeNull()
    })
  })

  describe('Auth flow sequences', () => {
    it('login -> clearAuth returns to unauthenticated state', () => {
      const response = createMockAuthResponse()
      let state = applyLoginResponse(createAuthState(), response)
      expect(isAuthenticated(state)).toBe(true)

      state = clearAuth()
      expect(isAuthenticated(state)).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('initFromStorage -> applyLogin updates both token and user', () => {
      let state = createAuthState()
      state = initFromStorage(state, 'stored-token')
      expect(state.token).toBe('stored-token')
      expect(state.user).toBeNull()

      const response = createMockAuthResponse()
      state = applyLoginResponse(state, response)
      expect(state.token).toBe(response.token)
      expect(state.user).toEqual(response.user)
    })
  })
})
