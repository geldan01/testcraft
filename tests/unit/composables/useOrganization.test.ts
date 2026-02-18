/**
 * Unit tests for the useOrganization composable logic.
 *
 * The real composable depends on the organization store (via Pinia) and
 * $fetch. These tests extract the $fetch-based logic, inject a mock fetch,
 * and mock the store's refresh behavior to test URL construction, request
 * method/body correctness, store interaction, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  Organization,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  InviteMemberInput,
  RbacPermission,
} from '~/types'
import {
  createMockOrganization,
  createMockMember,
  createMockRbacPermission,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock types
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

interface MockOrgStore {
  fetchOrganizations: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Extracted logic from composables/useOrganization.ts
// ---------------------------------------------------------------------------

function createOrganizationLogic(fetchFn: MockFetch, orgStore: MockOrgStore) {
  async function getOrganization(orgId: string): Promise<Organization | null> {
    try {
      return await fetchFn(`/api/organizations/${orgId}`)
    } catch {
      return null
    }
  }

  async function createOrganization(data: CreateOrganizationInput): Promise<Organization | null> {
    try {
      const org = await fetchFn('/api/organizations', {
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
      const org = await fetchFn(`/api/organizations/${orgId}`, {
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
      await fetchFn(`/api/organizations/${orgId}`, { method: 'DELETE' })
      await orgStore.fetchOrganizations()
      return true
    } catch {
      return false
    }
  }

  async function getMembers(orgId: string): Promise<OrganizationMember[]> {
    try {
      return await fetchFn(`/api/organizations/${orgId}/members`)
    } catch {
      return []
    }
  }

  async function inviteMember(orgId: string, data: InviteMemberInput): Promise<OrganizationMember | null> {
    try {
      return await fetchFn(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function removeMember(orgId: string, memberId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/organizations/${orgId}/members/${memberId}`, {
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
      return await fetchFn(
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

  async function getRbacPermissions(orgId: string): Promise<{ data: RbacPermission[]; accessDenied: boolean }> {
    try {
      const data = await fetchFn(`/api/organizations/${orgId}/rbac`)
      return { data, accessDenied: false }
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 403) {
        return { data: [], accessDenied: true }
      }
      return { data: [], accessDenied: false }
    }
  }

  async function updateRbacPermission(
    orgId: string,
    permissionId: string,
    allowed: boolean,
  ): Promise<RbacPermission | null> {
    try {
      return await fetchFn(
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrganization Composable', () => {
  let mockFetch: MockFetch
  let mockOrgStore: MockOrgStore

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
    mockOrgStore = {
      fetchOrganizations: vi.fn().mockResolvedValue(undefined),
    }
  })

  // -------------------------------------------------------------------------
  // getOrganization
  // -------------------------------------------------------------------------

  describe('getOrganization', () => {
    it('fetches from correct URL with orgId', async () => {
      const org = createMockOrganization()
      mockFetch.mockResolvedValue(org)

      const { getOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await getOrganization('org-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-42')
    })

    it('returns fetched organization on success', async () => {
      const org = createMockOrganization({ name: 'Acme Inc' })
      mockFetch.mockResolvedValue(org)

      const { getOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getOrganization('org-1')

      expect(result?.name).toBe('Acme Inc')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getOrganization('org-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createOrganization
  // -------------------------------------------------------------------------

  describe('createOrganization', () => {
    it('posts to correct endpoint with body', async () => {
      const org = createMockOrganization()
      mockFetch.mockResolvedValue(org)

      const input: CreateOrganizationInput = { name: 'New Org' }

      const { createOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await createOrganization(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations', {
        method: 'POST',
        body: input,
      })
    })

    it('refreshes the store after successful creation', async () => {
      const org = createMockOrganization()
      mockFetch.mockResolvedValue(org)

      const { createOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await createOrganization({ name: 'New Org' })

      expect(mockOrgStore.fetchOrganizations).toHaveBeenCalled()
    })

    it('returns created organization on success', async () => {
      const org = createMockOrganization({ name: 'Created Org' })
      mockFetch.mockResolvedValue(org)

      const { createOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await createOrganization({ name: 'Created Org' })

      expect(result?.name).toBe('Created Org')
    })

    it('does not refresh store on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await createOrganization({ name: 'Bad Org' })

      expect(mockOrgStore.fetchOrganizations).not.toHaveBeenCalled()
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await createOrganization({ name: 'Bad Org' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // updateOrganization
  // -------------------------------------------------------------------------

  describe('updateOrganization', () => {
    it('puts to correct URL with orgId', async () => {
      const org = createMockOrganization({ name: 'Updated' })
      mockFetch.mockResolvedValue(org)

      const input: UpdateOrganizationInput = { name: 'Updated' }

      const { updateOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateOrganization('org-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('refreshes the store after successful update', async () => {
      const org = createMockOrganization()
      mockFetch.mockResolvedValue(org)

      const { updateOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateOrganization('org-5', { name: 'Updated' })

      expect(mockOrgStore.fetchOrganizations).toHaveBeenCalled()
    })

    it('returns updated organization on success', async () => {
      const org = createMockOrganization({ name: 'Renamed Org' })
      mockFetch.mockResolvedValue(org)

      const { updateOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateOrganization('org-5', { name: 'Renamed Org' })

      expect(result?.name).toBe('Renamed Org')
    })

    it('does not refresh store on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateOrganization('org-5', { name: 'Nope' })

      expect(mockOrgStore.fetchOrganizations).not.toHaveBeenCalled()
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateOrganization('org-5', { name: 'Nope' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteOrganization
  // -------------------------------------------------------------------------

  describe('deleteOrganization', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await deleteOrganization('org-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-99', { method: 'DELETE' })
    })

    it('refreshes the store after successful deletion', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await deleteOrganization('org-99')

      expect(mockOrgStore.fetchOrganizations).toHaveBeenCalled()
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await deleteOrganization('org-99')

      expect(result).toBe(true)
    })

    it('does not refresh store on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      await deleteOrganization('org-missing')

      expect(mockOrgStore.fetchOrganizations).not.toHaveBeenCalled()
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteOrganization } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await deleteOrganization('org-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // getMembers
  // -------------------------------------------------------------------------

  describe('getMembers', () => {
    it('fetches from correct URL with orgId', async () => {
      mockFetch.mockResolvedValue([])

      const { getMembers } = createOrganizationLogic(mockFetch, mockOrgStore)
      await getMembers('org-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-10/members')
    })

    it('returns members on success', async () => {
      const members = [
        createMockMember({ role: 'ORGANIZATION_MANAGER' }),
        createMockMember({ role: 'QA_ENGINEER' }),
      ]
      mockFetch.mockResolvedValue(members)

      const { getMembers } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getMembers('org-10')

      expect(result).toHaveLength(2)
      expect(result[0].role).toBe('ORGANIZATION_MANAGER')
    })

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { getMembers } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getMembers('org-10')

      expect(result).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // inviteMember
  // -------------------------------------------------------------------------

  describe('inviteMember', () => {
    it('posts to correct URL with invitation data', async () => {
      const member = createMockMember()
      mockFetch.mockResolvedValue(member)

      const input: InviteMemberInput = {
        email: 'newuser@example.com',
        role: 'QA_ENGINEER',
      }

      const { inviteMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      await inviteMember('org-10', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-10/members', {
        method: 'POST',
        body: input,
      })
    })

    it('returns created member on success', async () => {
      const member = createMockMember({ role: 'DEVELOPER' })
      mockFetch.mockResolvedValue(member)

      const { inviteMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await inviteMember('org-10', {
        email: 'dev@example.com',
        role: 'DEVELOPER',
      })

      expect(result?.role).toBe('DEVELOPER')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('User already a member'))

      const { inviteMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await inviteMember('org-10', {
        email: 'existing@example.com',
        role: 'QA_ENGINEER',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // removeMember
  // -------------------------------------------------------------------------

  describe('removeMember', () => {
    it('deletes from correct URL with orgId and memberId', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { removeMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      await removeMember('org-10', 'member-5')

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-10/members/member-5', {
        method: 'DELETE',
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { removeMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await removeMember('org-10', 'member-5')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Cannot remove last admin'))

      const { removeMember } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await removeMember('org-10', 'member-last')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // updateMemberRole
  // -------------------------------------------------------------------------

  describe('updateMemberRole', () => {
    it('puts to correct URL with role in body', async () => {
      const member = createMockMember({ role: 'PROJECT_MANAGER' })
      mockFetch.mockResolvedValue(member)

      const { updateMemberRole } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateMemberRole('org-10', 'member-5', 'PROJECT_MANAGER')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/organizations/org-10/members/member-5',
        {
          method: 'PUT',
          body: { role: 'PROJECT_MANAGER' },
        },
      )
    })

    it('returns updated member on success', async () => {
      const member = createMockMember({ role: 'PRODUCT_OWNER' })
      mockFetch.mockResolvedValue(member)

      const { updateMemberRole } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateMemberRole('org-10', 'member-5', 'PRODUCT_OWNER')

      expect(result?.role).toBe('PRODUCT_OWNER')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateMemberRole } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateMemberRole('org-10', 'member-5', 'ORGANIZATION_MANAGER')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // getRbacPermissions
  // -------------------------------------------------------------------------

  describe('getRbacPermissions', () => {
    it('fetches from correct URL with orgId', async () => {
      mockFetch.mockResolvedValue([])

      const { getRbacPermissions } = createOrganizationLogic(mockFetch, mockOrgStore)
      await getRbacPermissions('org-10')

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations/org-10/rbac')
    })

    it('returns permissions on success', async () => {
      const perms = [
        createMockRbacPermission({ action: 'READ', allowed: true }),
        createMockRbacPermission({ action: 'EDIT', allowed: false }),
      ]
      mockFetch.mockResolvedValue(perms)

      const { getRbacPermissions } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getRbacPermissions('org-10')

      expect(result.data).toHaveLength(2)
      expect(result.data[0].allowed).toBe(true)
      expect(result.data[1].allowed).toBe(false)
      expect(result.accessDenied).toBe(false)
    })

    it('returns accessDenied true on 403 error', async () => {
      const err = new Error('Forbidden') as Error & { statusCode: number }
      err.statusCode = 403
      mockFetch.mockRejectedValue(err)

      const { getRbacPermissions } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getRbacPermissions('org-10')

      expect(result.data).toEqual([])
      expect(result.accessDenied).toBe(true)
    })

    it('returns accessDenied false on other errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { getRbacPermissions } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await getRbacPermissions('org-10')

      expect(result.data).toEqual([])
      expect(result.accessDenied).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // updateRbacPermission
  // -------------------------------------------------------------------------

  describe('updateRbacPermission', () => {
    it('puts to correct URL with allowed in body', async () => {
      const perm = createMockRbacPermission({ allowed: true })
      mockFetch.mockResolvedValue(perm)

      const { updateRbacPermission } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateRbacPermission('org-10', 'perm-3', true)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/organizations/org-10/rbac/perm-3',
        {
          method: 'PUT',
          body: { allowed: true },
        },
      )
    })

    it('sends allowed=false correctly', async () => {
      const perm = createMockRbacPermission({ allowed: false })
      mockFetch.mockResolvedValue(perm)

      const { updateRbacPermission } = createOrganizationLogic(mockFetch, mockOrgStore)
      await updateRbacPermission('org-10', 'perm-3', false)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/organizations/org-10/rbac/perm-3',
        {
          method: 'PUT',
          body: { allowed: false },
        },
      )
    })

    it('returns updated permission on success', async () => {
      const perm = createMockRbacPermission({ allowed: true })
      mockFetch.mockResolvedValue(perm)

      const { updateRbacPermission } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateRbacPermission('org-10', 'perm-3', true)

      expect(result?.allowed).toBe(true)
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateRbacPermission } = createOrganizationLogic(mockFetch, mockOrgStore)
      const result = await updateRbacPermission('org-10', 'perm-3', true)

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createOrganizationLogic(mockFetch, mockOrgStore)
      expect(logic).toHaveProperty('getOrganization')
      expect(logic).toHaveProperty('createOrganization')
      expect(logic).toHaveProperty('updateOrganization')
      expect(logic).toHaveProperty('deleteOrganization')
      expect(logic).toHaveProperty('getMembers')
      expect(logic).toHaveProperty('inviteMember')
      expect(logic).toHaveProperty('removeMember')
      expect(logic).toHaveProperty('updateMemberRole')
      expect(logic).toHaveProperty('getRbacPermissions')
      expect(logic).toHaveProperty('updateRbacPermission')
    })

    it('all methods are functions', () => {
      const logic = createOrganizationLogic(mockFetch, mockOrgStore)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
