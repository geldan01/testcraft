import { defineStore } from 'pinia'
import type { Organization } from '~/types'

interface OrganizationState {
  organizations: Organization[]
  currentOrganization: Organization | null
  loading: boolean
}

export const useOrganizationStore = defineStore('organization', {
  state: (): OrganizationState => ({
    organizations: [],
    currentOrganization: null,
    loading: false,
  }),

  getters: {
    currentOrgId: (state): string | null => state.currentOrganization?.id ?? null,
    currentOrgName: (state): string => state.currentOrganization?.name ?? 'Select Organization',
    hasOrganizations: (state): boolean => state.organizations.length > 0,
  },

  actions: {
    async fetchOrganizations(): Promise<void> {
      this.loading = true
      try {
        const data = await $fetch<Organization[]>('/api/organizations')
        this.organizations = data

        // Auto-select first org if none selected
        if (!this.currentOrganization && data.length > 0) {
          this.currentOrganization = data[0]
          this.persistCurrentOrg(data[0].id)
        }
      } catch {
        this.organizations = []
      } finally {
        this.loading = false
      }
    },

    switchOrganization(orgId: string): void {
      const org = this.organizations.find((o) => o.id === orgId)
      if (org) {
        this.currentOrganization = org
        this.persistCurrentOrg(orgId)
      }
    },

    persistCurrentOrg(orgId: string): void {
      if (import.meta.client) {
        localStorage.setItem('current_org_id', orgId)
      }
    },

    restoreCurrentOrg(): void {
      if (import.meta.client) {
        const savedOrgId = localStorage.getItem('current_org_id')
        if (savedOrgId && this.organizations.length > 0) {
          const org = this.organizations.find((o) => o.id === savedOrgId)
          if (org) {
            this.currentOrganization = org
          }
        }
      }
    },

    clearOrganizations(): void {
      this.organizations = []
      this.currentOrganization = null
      if (import.meta.client) {
        localStorage.removeItem('current_org_id')
      }
    },
  },
})
