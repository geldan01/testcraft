import { defineStore } from 'pinia'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '~/types'

interface AuthState {
  user: User | null
  token: string | null
}

const TOKEN_COOKIE_NAME = 'auth_token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days, matching JWT expiry

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token && !!state.user,
    currentUser: (state): User | null => state.user,
    userName: (state): string => state.user?.name ?? '',
    userInitials: (state): string => {
      if (!state.user?.name) return '?'
      return state.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    },
  },

  actions: {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
      try {
        const response = await $fetch<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: credentials,
        })

        this.user = response.user
        this.token = response.token
        this._persistToken(response.token)

        return response
      } catch (error: unknown) {
        this.clearAuth()
        throw error
      }
    },

    async register(data: RegisterRequest): Promise<AuthResponse> {
      try {
        const response = await $fetch<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: data,
        })

        this.user = response.user
        this.token = response.token
        this._persistToken(response.token)

        return response
      } catch (error: unknown) {
        this.clearAuth()
        throw error
      }
    },

    async fetchCurrentUser(): Promise<void> {
      try {
        const user = await $fetch<User>('/api/auth/me', {
          headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        })
        this.user = user
      } catch {
        this.clearAuth()
      }
    },

    async logout(): Promise<void> {
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
        })
      } catch {
        // Logout even if API call fails
      } finally {
        this.clearAuth()
      }
    },

    clearAuth(): void {
      this.user = null
      this.token = null
      this._persistToken(null)
    },

    /**
     * Restore the JWT token from the cookie into Pinia state.
     * Uses `useCookie()` which works on both SSR (reads from request headers)
     * and client-side (reads from document.cookie).
     */
    initFromStorage(): void {
      const tokenCookie = useCookie(TOKEN_COOKIE_NAME)
      if (tokenCookie.value) {
        this.token = tokenCookie.value
      }
    },

    /**
     * Persist or clear the JWT token in a cookie.
     * Uses `useCookie()` for universal SSR/client compatibility.
     */
    _persistToken(token: string | null): void {
      const tokenCookie = useCookie(TOKEN_COOKIE_NAME, {
        maxAge: token ? TOKEN_MAX_AGE : -1,
        path: '/',
        sameSite: 'lax',
      })
      tokenCookie.value = token
    },
  },
})
