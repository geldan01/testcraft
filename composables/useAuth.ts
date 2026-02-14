import type { LoginRequest, RegisterRequest } from '~/types'
import { useAuthStore } from '~/stores/auth'
import { useOrganizationStore } from '~/stores/organization'

export const useAuth = () => {
  const authStore = useAuthStore()
  const orgStore = useOrganizationStore()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.currentUser)
  const userName = computed(() => authStore.userName)
  const userInitials = computed(() => authStore.userInitials)

  async function login(credentials: LoginRequest): Promise<void> {
    await authStore.login(credentials)
    await orgStore.fetchOrganizations()
    orgStore.restoreCurrentOrg()
    await router.push('/dashboard')
  }

  async function register(data: RegisterRequest): Promise<void> {
    await authStore.register(data)
    await orgStore.fetchOrganizations()
    orgStore.restoreCurrentOrg()
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
