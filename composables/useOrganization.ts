import type {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  InviteMemberInput,
  RbacPermission,
} from '~/types'
import { useOrganizationStore } from '~/stores/organization'

export const useOrganization = () => {
  const orgStore = useOrganizationStore()

  const organizations = computed(() => orgStore.organizations)
  const currentOrg = computed(() => orgStore.currentOrganization)
  const currentOrgId = computed(() => orgStore.currentOrgId)
  const loading = computed(() => orgStore.loading)

  async function fetchOrganizations(): Promise<void> {
    await orgStore.fetchOrganizations()
  }

  function switchOrg(orgId: string): void {
    orgStore.switchOrganization(orgId)
  }

  async function getOrganization(orgId: string): Promise<Organization | null> {
    try {
      return await $fetch<Organization>(`/api/organizations/${orgId}`)
    } catch {
      return null
    }
  }

  async function createOrganization(data: CreateOrganizationInput): Promise<Organization | null> {
    try {
      const org = await $fetch<Organization>('/api/organizations', {
        method: 'POST',
        body: data,
      })
      await orgStore.fetchOrganizations()
      return org
    } catch {
      return null
    }
  }

  async function updateOrganization(orgId: string, data: UpdateOrganizationInput): Promise<Organization | null> {
    try {
      const org = await $fetch<Organization>(`/api/organizations/${orgId}`, {
        method: 'PUT',
        body: data,
      })
      await orgStore.fetchOrganizations()
      return org
    } catch {
      return null
    }
  }

  async function deleteOrganization(orgId: string): Promise<boolean> {
    try {
      await $fetch(`/api/organizations/${orgId}`, { method: 'DELETE' as 'GET' })
      await orgStore.fetchOrganizations()
      return true
    } catch {
      return false
    }
  }

  async function getMembers(orgId: string): Promise<OrganizationMember[]> {
    try {
      return await $fetch<OrganizationMember[]>(`/api/organizations/${orgId}/members`)
    } catch {
      return []
    }
  }

  async function inviteMember(orgId: string, data: InviteMemberInput): Promise<OrganizationMember | null> {
    try {
      return await $fetch<OrganizationMember>(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function removeMember(orgId: string, memberId: string): Promise<boolean> {
    try {
      await $fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  }

  async function updateMemberRole(
    orgId: string,
    memberId: string,
    role: string,
  ): Promise<OrganizationMember | null> {
    try {
      return await $fetch<OrganizationMember>(
        `/api/organizations/${orgId}/members/${memberId}`,
        {
          method: 'PUT',
          body: { role },
        },
      )
    } catch {
      return null
    }
  }

  async function getRbacPermissions(orgId: string): Promise<RbacPermission[]> {
    try {
      return await $fetch<RbacPermission[]>(`/api/organizations/${orgId}/rbac`)
    } catch {
      return []
    }
  }

  async function updateRbacPermission(
    orgId: string,
    permissionId: string,
    allowed: boolean,
  ): Promise<RbacPermission | null> {
    try {
      return await $fetch<RbacPermission>(
        `/api/organizations/${orgId}/rbac/${permissionId}`,
        {
          method: 'PUT',
          body: { allowed },
        },
      )
    } catch {
      return null
    }
  }

  return {
    organizations,
    currentOrg,
    currentOrgId,
    loading,
    fetchOrganizations,
    switchOrg,
    getOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    getRbacPermissions,
    updateRbacPermission,
  }
}
