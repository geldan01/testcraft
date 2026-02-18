import { defineStore } from 'pinia'
import type { Organization } from '~/types'

const ORG_COOKIE_NAME = 'current_org_id'

export const useOrganizationStore = defineStore('organization', () => {
  // Cookie ref created once during store init (runs in setup/middleware context)
  const orgCookie = useCookie(ORG_COOKIE_NAME, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax' as const,
  })

  const organizations = ref<Organization[]>([])
  const currentOrganization = ref<Organization | null>(null)
  const loading = ref(false)

  const currentOrgId = computed(() => currentOrganization.value?.id ?? null)
  const currentOrgName = computed(() => currentOrganization.value?.name ?? 'Select Organization')
  const hasOrganizations = computed(() => organizations.value.length > 0)

  async function fetchOrganizations(): Promise<void> {
    loading.value = true
    try {
      const data = await $fetch<Organization[]>('/api/organizations')
      organizations.value = data

      if (!currentOrganization.value && data.length > 0) {
        const savedOrg = orgCookie.value ? data.find((o) => o.id === orgCookie.value) : null
        currentOrganization.value = savedOrg ?? data[0]
        orgCookie.value = currentOrganization.value.id
      }
    } catch {
      organizations.value = []
    } finally {
      loading.value = false
    }
  }

  function switchOrganization(orgId: string): void {
    const org = organizations.value.find((o) => o.id === orgId)
    if (org) {
      currentOrganization.value = org
      orgCookie.value = orgId
    }
  }

  function clearOrganizations(): void {
    organizations.value = []
    currentOrganization.value = null
    orgCookie.value = null
  }

  return {
    organizations,
    currentOrganization,
    loading,
    currentOrgId,
    currentOrgName,
    hasOrganizations,
    fetchOrganizations,
    switchOrganization,
    clearOrganizations,
  }
})
