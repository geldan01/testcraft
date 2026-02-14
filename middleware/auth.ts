import { useAuthStore } from '~/stores/auth'
import { useOrganizationStore } from '~/stores/organization'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Restore token from cookie if Pinia state is empty (e.g., after page refresh).
  // useCookie works on both SSR and client, so this succeeds during SSR.
  if (!authStore.token) {
    authStore.initFromStorage()
  }

  // If we have a token but no user object (page refresh scenario),
  // fetch the current user to fully rehydrate auth state.
  // This also validates the token is still valid server-side.
  if (authStore.token && !authStore.user) {
    await authStore.fetchCurrentUser()
  }

  // If still not authenticated after rehydration attempts, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Ensure organizations are loaded for authenticated users.
  // This is idempotent — skips fetch if already loaded.
  const orgStore = useOrganizationStore()
  if (orgStore.organizations.length === 0) {
    await orgStore.fetchOrganizations()
  }
})
