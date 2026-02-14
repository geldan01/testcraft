import type { Pinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore(nuxtApp.$pinia as Pinia)

  // Add a global interceptor to attach the auth token to all API requests
  globalThis.$fetch = globalThis.$fetch.create({
    onRequest({ options }) {
      if (authStore.token) {
        const headers = options.headers || {}
        if (Array.isArray(headers)) {
          // Check if Authorization header already exists
          const hasAuth = headers.some(
            (h) => (Array.isArray(h) ? h[0] : '').toLowerCase() === 'authorization',
          )
          if (!hasAuth) {
            headers.push(['Authorization', `Bearer ${authStore.token}`])
          }
          options.headers = headers
        } else if (headers instanceof Headers) {
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${authStore.token}`)
          }
        } else {
          // Plain object
          if (!(headers as Record<string, string>).Authorization) {
            ;(headers as Record<string, string>).Authorization = `Bearer ${authStore.token}`
          }
          options.headers = headers
        }
      }
    },
    onResponseError({ response }) {
      // If we get a 401, clear auth state and redirect to login
      if (response.status === 401 && authStore.token) {
        authStore.clearAuth()
        if (import.meta.client) {
          navigateTo('/auth/login', { replace: true })
        }
      }
    },
  })
})
