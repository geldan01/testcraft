/**
 * Unit tests for the useProject composable logic.
 *
 * The real composable depends on the project store (via Pinia) and $fetch.
 * These tests extract the $fetch-based logic, inject a mock fetch, and
 * mock the store's refresh behavior to test URL construction, request
 * method/body correctness, store interaction, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
} from '~/types'
import {
  createMockProject,
  resetFixtureCounter,
} from '~/tests/factories'

// ---------------------------------------------------------------------------
// Mock types
// ---------------------------------------------------------------------------

type MockFetch = ReturnType<typeof vi.fn>

interface MockProjectStore {
  fetchProjects: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Extracted logic from composables/useProject.ts
// ---------------------------------------------------------------------------

function createProjectLogic(fetchFn: MockFetch, projectStore: MockProjectStore) {
  async function getProject(projectId: string): Promise<Project | null> {
    try {
      return await fetchFn(`/api/projects/${projectId}`)
    } catch {
      return null
    }
  }

  async function createProject(data: CreateProjectInput): Promise<Project | null> {
    try {
      const project = await fetchFn('/api/projects', {
        method: 'POST',
        body: data,
      })
      if (data.organizationId) {
        await projectStore.fetchProjects(data.organizationId)
      }
      return project
    } catch {
      return null
    }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput): Promise<Project | null> {
    try {
      return await fetchFn(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    try {
      await fetchFn(`/api/projects/${projectId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  return {
    getProject,
    createProject,
    updateProject,
    deleteProject,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useProject Composable', () => {
  let mockFetch: MockFetch
  let mockProjectStore: MockProjectStore

  beforeEach(() => {
    resetFixtureCounter()
    mockFetch = vi.fn()
    mockProjectStore = {
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    }
  })

  // -------------------------------------------------------------------------
  // getProject
  // -------------------------------------------------------------------------

  describe('getProject', () => {
    it('fetches from correct URL with projectId', async () => {
      const project = createMockProject()
      mockFetch.mockResolvedValue(project)

      const { getProject } = createProjectLogic(mockFetch, mockProjectStore)
      await getProject('proj-42')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-42')
    })

    it('returns fetched project on success', async () => {
      const project = createMockProject({ name: 'My Project' })
      mockFetch.mockResolvedValue(project)

      const { getProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await getProject('proj-1')

      expect(result?.name).toBe('My Project')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { getProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await getProject('proj-missing')

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createProject
  // -------------------------------------------------------------------------

  describe('createProject', () => {
    it('posts to correct endpoint with body', async () => {
      const project = createMockProject()
      mockFetch.mockResolvedValue(project)

      const input: CreateProjectInput = {
        name: 'New Project',
        description: 'A new project',
        organizationId: 'org-1',
      }

      const { createProject } = createProjectLogic(mockFetch, mockProjectStore)
      await createProject(input)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        body: input,
      })
    })

    it('refreshes the store with organizationId after successful creation', async () => {
      const project = createMockProject()
      mockFetch.mockResolvedValue(project)

      const { createProject } = createProjectLogic(mockFetch, mockProjectStore)
      await createProject({
        name: 'New Project',
        organizationId: 'org-1',
      })

      expect(mockProjectStore.fetchProjects).toHaveBeenCalledWith('org-1')
    })

    it('returns created project on success', async () => {
      const project = createMockProject({ name: 'Created Project' })
      mockFetch.mockResolvedValue(project)

      const { createProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await createProject({
        name: 'Created Project',
        organizationId: 'org-1',
      })

      expect(result?.name).toBe('Created Project')
    })

    it('does not refresh store on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createProject } = createProjectLogic(mockFetch, mockProjectStore)
      await createProject({
        name: 'Bad Project',
        organizationId: 'org-1',
      })

      expect(mockProjectStore.fetchProjects).not.toHaveBeenCalled()
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'))

      const { createProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await createProject({
        name: 'Bad Project',
        organizationId: 'org-1',
      })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // updateProject
  // -------------------------------------------------------------------------

  describe('updateProject', () => {
    it('puts to correct URL with projectId', async () => {
      const project = createMockProject({ name: 'Updated' })
      mockFetch.mockResolvedValue(project)

      const input: UpdateProjectInput = { name: 'Updated' }

      const { updateProject } = createProjectLogic(mockFetch, mockProjectStore)
      await updateProject('proj-5', input)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-5', {
        method: 'PUT',
        body: input,
      })
    })

    it('returns updated project on success', async () => {
      const project = createMockProject({ name: 'Renamed Project' })
      mockFetch.mockResolvedValue(project)

      const { updateProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await updateProject('proj-5', { name: 'Renamed Project' })

      expect(result?.name).toBe('Renamed Project')
    })

    it('returns null on error', async () => {
      mockFetch.mockRejectedValue(new Error('Forbidden'))

      const { updateProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await updateProject('proj-5', { name: 'Nope' })

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // deleteProject
  // -------------------------------------------------------------------------

  describe('deleteProject', () => {
    it('deletes from correct URL', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteProject } = createProjectLogic(mockFetch, mockProjectStore)
      await deleteProject('proj-99')

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-99', { method: 'DELETE' })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValue(undefined)

      const { deleteProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await deleteProject('proj-99')

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'))

      const { deleteProject } = createProjectLogic(mockFetch, mockProjectStore)
      const result = await deleteProject('proj-missing')

      expect(result).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Return value contract
  // -------------------------------------------------------------------------

  describe('Return value', () => {
    it('returns all expected methods', () => {
      const logic = createProjectLogic(mockFetch, mockProjectStore)
      expect(logic).toHaveProperty('getProject')
      expect(logic).toHaveProperty('createProject')
      expect(logic).toHaveProperty('updateProject')
      expect(logic).toHaveProperty('deleteProject')
    })

    it('all methods are functions', () => {
      const logic = createProjectLogic(mockFetch, mockProjectStore)
      for (const value of Object.values(logic)) {
        expect(typeof value).toBe('function')
      }
    })
  })
})
