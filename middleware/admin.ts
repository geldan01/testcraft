import { useAuthStore } from '~/stores/auth'
import { useOrganizationStore } from '~/stores/organization'

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  // Restore token from cookie if Pinia state is empty
  if (!authStore.token) {
    authStore.initFromStorage()
  }

  // Rehydrate user if needed
  if (authStore.token && !authStore.user) {
    await authStore.fetchCurrentUser()
  }

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login', { replace: true })
  }

  // Redirect non-admins to dashboard
  if (!authStore.isAdmin) {
    return navigateTo('/dashboard', { replace: true })
  }

  // Ensure organizations are loaded
  const orgStore = useOrganizationStore()
  if (orgStore.organizations.length === 0) {
    await orgStore.fetchOrganizations()
  }
})
