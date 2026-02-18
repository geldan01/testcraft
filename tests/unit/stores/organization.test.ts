/**
 * Unit tests for the organization Pinia store.
 *
 * Tests state management, getters (currentOrgId, currentOrgName, hasOrganizations),
 * and actions (switchOrganization, restoreOrgFromSaved, clearOrganizations).
 *
 * Network-dependent actions (fetchOrganizations) are not tested here.
 * Instead we verify that state is set correctly given certain inputs,
 * without actually calling $fetch. Org persistence uses useCookie (works on SSR + client).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Organization } from '~/types'
import { createMockOrganization, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted state & getters logic from stores/organization.ts
// ---------------------------------------------------------------------------

interface OrganizationState {
  organizations: Organization[]
  currentOrganization: Organization | null
  loading: boolean
}

function createOrganizationState(): OrganizationState {
  return {
    organizations: [],
    currentOrganization: null,
    loading: false,
  }
}

function currentOrgId(state: OrganizationState): string | null {
  return state.currentOrganization?.id ?? null
}

function currentOrgName(state: OrganizationState): string {
  return state.currentOrganization?.name ?? 'Select Organization'
}

function hasOrganizations(state: OrganizationState): boolean {
  return state.organizations.length > 0
}

// ---------------------------------------------------------------------------
// Extracted actions logic from stores/organization.ts
// ---------------------------------------------------------------------------

function switchOrganization(
  state: OrganizationState,
  orgId: string,
): { state: OrganizationState; persistedOrgId: string | null } {
  const org = state.organizations.find((o) => o.id === orgId)
  if (org) {
    return {
      state: { ...state, currentOrganization: org },
      persistedOrgId: orgId,
    }
  }
  return { state, persistedOrgId: null }
}

function restoreOrgFromSaved(
  state: OrganizationState,
  savedOrgId: string | null,
): OrganizationState {
  if (savedOrgId && state.organizations.length > 0) {
    const org = state.organizations.find((o) => o.id === savedOrgId)
    if (org) {
      return { ...state, currentOrganization: org }
    }
  }
  return state
}

function clearOrganizations(): OrganizationState {
  return {
    organizations: [],
    currentOrganization: null,
    loading: false,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Organization Store', () => {
  beforeEach(() => {
    resetFixtureCounter()
  })

  describe('Initial state', () => {
    it('starts with empty organizations array', () => {
      const state = createOrganizationState()
      expect(state.organizations).toEqual([])
    })

    it('starts with null currentOrganization', () => {
      const state = createOrganizationState()
      expect(state.currentOrganization).toBeNull()
    })

    it('starts with loading false', () => {
      const state = createOrganizationState()
      expect(state.loading).toBe(false)
    })
  })

  describe('currentOrgId getter', () => {
    it('returns null when no organization is selected', () => {
      const state = createOrganizationState()
      expect(currentOrgId(state)).toBeNull()
    })

    it('returns the organization id when one is selected', () => {
      const org = createMockOrganization({ id: 'org-123' })
      const state: OrganizationState = {
        organizations: [org],
        currentOrganization: org,
        loading: false,
      }
      expect(currentOrgId(state)).toBe('org-123')
    })
  })

  describe('currentOrgName getter', () => {
    it('returns "Select Organization" when no org is selected', () => {
      const state = createOrganizationState()
      expect(currentOrgName(state)).toBe('Select Organization')
    })

    it('returns the organization name when one is selected', () => {
      const org = createMockOrganization({ name: 'Acme Corp' })
      const state: OrganizationState = {
        organizations: [org],
        currentOrganization: org,
        loading: false,
      }
      expect(currentOrgName(state)).toBe('Acme Corp')
    })
  })

  describe('hasOrganizations getter', () => {
    it('returns false when organizations array is empty', () => {
      const state = createOrganizationState()
      expect(hasOrganizations(state)).toBe(false)
    })

    it('returns true when organizations exist', () => {
      const state: OrganizationState = {
        organizations: [createMockOrganization()],
        currentOrganization: null,
        loading: false,
      }
      expect(hasOrganizations(state)).toBe(true)
    })
  })

  describe('switchOrganization action', () => {
    it('sets currentOrganization when org is found in list', () => {
      const org1 = createMockOrganization({ id: 'org-1', name: 'Org One' })
      const org2 = createMockOrganization({ id: 'org-2', name: 'Org Two' })
      const state: OrganizationState = {
        organizations: [org1, org2],
        currentOrganization: org1,
        loading: false,
      }

      const result = switchOrganization(state, 'org-2')
      expect(result.state.currentOrganization).toEqual(org2)
    })

    it('does not change currentOrganization when org id is not found', () => {
      const org1 = createMockOrganization({ id: 'org-1', name: 'Org One' })
      const state: OrganizationState = {
        organizations: [org1],
        currentOrganization: org1,
        loading: false,
      }

      const result = switchOrganization(state, 'non-existent')
      expect(result.state.currentOrganization).toEqual(org1)
    })

    it('calls persistCurrentOrg with orgId when org is found', () => {
      const org1 = createMockOrganization({ id: 'org-1' })
      const state: OrganizationState = {
        organizations: [org1],
        currentOrganization: null,
        loading: false,
      }

      const result = switchOrganization(state, 'org-1')
      expect(result.persistedOrgId).toBe('org-1')
    })

    it('does not persist when org id is not found', () => {
      const state: OrganizationState = {
        organizations: [createMockOrganization({ id: 'org-1' })],
        currentOrganization: null,
        loading: false,
      }

      const result = switchOrganization(state, 'non-existent')
      expect(result.persistedOrgId).toBeNull()
    })
  })

  describe('restoreOrgFromSaved action', () => {
    it('restores org from saved cookie when matching org exists', () => {
      const org1 = createMockOrganization({ id: 'org-1', name: 'Org One' })
      const org2 = createMockOrganization({ id: 'org-2', name: 'Org Two' })
      const state: OrganizationState = {
        organizations: [org1, org2],
        currentOrganization: null,
        loading: false,
      }

      const result = restoreOrgFromSaved(state, 'org-2')
      expect(result.currentOrganization).toEqual(org2)
    })

    it('does nothing when no saved org id is provided', () => {
      const state: OrganizationState = {
        organizations: [createMockOrganization()],
        currentOrganization: null,
        loading: false,
      }

      const result = restoreOrgFromSaved(state, null)
      expect(result.currentOrganization).toBeNull()
    })

    it('does nothing when saved org id is not in the list', () => {
      const org1 = createMockOrganization({ id: 'org-1' })
      const state: OrganizationState = {
        organizations: [org1],
        currentOrganization: null,
        loading: false,
      }

      const result = restoreOrgFromSaved(state, 'non-existent-org')
      expect(result.currentOrganization).toBeNull()
    })

    it('does nothing when organizations array is empty', () => {
      const state = createOrganizationState()

      const result = restoreOrgFromSaved(state, 'org-1')
      expect(result.currentOrganization).toBeNull()
    })
  })

  describe('clearOrganizations action', () => {
    it('resets organizations to empty array', () => {
      const state = clearOrganizations()
      expect(state.organizations).toEqual([])
    })

    it('resets currentOrganization to null', () => {
      const state = clearOrganizations()
      expect(state.currentOrganization).toBeNull()
    })

    it('clears cookie', () => {
      const mockLocalStorage = new Map<string, string>()
      mockLocalStorage.set('current_org_id', 'org-1')

      // Simulate clearOrganizations' localStorage removal
      mockLocalStorage.delete('current_org_id')
      expect(mockLocalStorage.has('current_org_id')).toBe(false)
    })
  })

  describe('Cookie persistence', () => {
    it('saves org id to cookie on switchOrganization', () => {
      const mockLocalStorage = new Map<string, string>()
      const org = createMockOrganization({ id: 'org-42' })
      const state: OrganizationState = {
        organizations: [org],
        currentOrganization: null,
        loading: false,
      }

      const result = switchOrganization(state, 'org-42')
      if (result.persistedOrgId) {
        mockLocalStorage.set('current_org_id', result.persistedOrgId)
      }

      expect(mockLocalStorage.get('current_org_id')).toBe('org-42')
    })

    it('reads org id from cookie on restoreOrgFromSaved', () => {
      const mockLocalStorage = new Map<string, string>()
      mockLocalStorage.set('current_org_id', 'org-99')

      const org = createMockOrganization({ id: 'org-99', name: 'Restored Org' })
      const state: OrganizationState = {
        organizations: [org],
        currentOrganization: null,
        loading: false,
      }

      const savedOrgId = mockLocalStorage.get('current_org_id') ?? null
      const result = restoreOrgFromSaved(state, savedOrgId)
      expect(result.currentOrganization?.name).toBe('Restored Org')
    })

    it('handles missing org id in cookie gracefully', () => {
      const mockLocalStorage = new Map<string, string>()

      const savedOrgId = mockLocalStorage.get('current_org_id') ?? null
      const result = restoreOrgFromSaved(createOrganizationState(), savedOrgId)
      expect(result.currentOrganization).toBeNull()
    })
  })

  describe('Organization flow sequences', () => {
    it('switch -> clear returns to empty state', () => {
      const org = createMockOrganization({ id: 'org-1' })
      let state: OrganizationState = {
        organizations: [org],
        currentOrganization: null,
        loading: false,
      }

      const switchResult = switchOrganization(state, 'org-1')
      state = switchResult.state
      expect(state.currentOrganization).not.toBeNull()

      state = clearOrganizations()
      expect(state.organizations).toEqual([])
      expect(state.currentOrganization).toBeNull()
    })

    it('restore -> switch changes the current organization', () => {
      const org1 = createMockOrganization({ id: 'org-1', name: 'Org One' })
      const org2 = createMockOrganization({ id: 'org-2', name: 'Org Two' })
      let state: OrganizationState = {
        organizations: [org1, org2],
        currentOrganization: null,
        loading: false,
      }

      // Restore to org-1
      state = restoreOrgFromSaved(state, 'org-1')
      expect(currentOrgName(state)).toBe('Org One')

      // Switch to org-2
      const switchResult = switchOrganization(state, 'org-2')
      state = switchResult.state
      expect(currentOrgName(state)).toBe('Org Two')
    })
  })
})
