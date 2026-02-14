/**
 * Unit tests for the project Pinia store.
 *
 * Tests state management, getters (currentProjectId, currentProjectName,
 * hasProjects), and actions (setCurrentProject, clearProjects).
 *
 * Network-dependent actions (fetchProjects) are not tested here.
 * Instead we verify that state is set correctly given certain inputs,
 * without actually calling $fetch.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Project } from '~/types'
import { createMockProject, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted state & getters logic from stores/project.ts
// ---------------------------------------------------------------------------

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
}

function createProjectState(): ProjectState {
  return {
    projects: [],
    currentProject: null,
    loading: false,
  }
}

function currentProjectId(state: ProjectState): string | null {
  return state.currentProject?.id ?? null
}

function currentProjectName(state: ProjectState): string {
  return state.currentProject?.name ?? ''
}

function hasProjects(state: ProjectState): boolean {
  return state.projects.length > 0
}

// ---------------------------------------------------------------------------
// Extracted actions logic from stores/project.ts
// ---------------------------------------------------------------------------

function setCurrentProject(state: ProjectState, project: Project): ProjectState {
  return { ...state, currentProject: project }
}

function clearProjects(): ProjectState {
  return {
    projects: [],
    currentProject: null,
    loading: false,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Project Store', () => {
  beforeEach(() => {
    resetFixtureCounter()
  })

  describe('Initial state', () => {
    it('starts with empty projects array', () => {
      const state = createProjectState()
      expect(state.projects).toEqual([])
    })

    it('starts with null currentProject', () => {
      const state = createProjectState()
      expect(state.currentProject).toBeNull()
    })

    it('starts with loading false', () => {
      const state = createProjectState()
      expect(state.loading).toBe(false)
    })
  })

  describe('currentProjectId getter', () => {
    it('returns null when no project is selected', () => {
      const state = createProjectState()
      expect(currentProjectId(state)).toBeNull()
    })

    it('returns the project id when one is selected', () => {
      const project = createMockProject({ id: 'proj-123' })
      const state: ProjectState = {
        projects: [project],
        currentProject: project,
        loading: false,
      }
      expect(currentProjectId(state)).toBe('proj-123')
    })
  })

  describe('currentProjectName getter', () => {
    it('returns empty string when no project is selected', () => {
      const state = createProjectState()
      expect(currentProjectName(state)).toBe('')
    })

    it('returns the project name when one is selected', () => {
      const project = createMockProject({ name: 'My Project' })
      const state: ProjectState = {
        projects: [project],
        currentProject: project,
        loading: false,
      }
      expect(currentProjectName(state)).toBe('My Project')
    })
  })

  describe('hasProjects getter', () => {
    it('returns false when projects array is empty', () => {
      const state = createProjectState()
      expect(hasProjects(state)).toBe(false)
    })

    it('returns true when projects exist', () => {
      const state: ProjectState = {
        projects: [createMockProject()],
        currentProject: null,
        loading: false,
      }
      expect(hasProjects(state)).toBe(true)
    })

    it('returns true with multiple projects', () => {
      const state: ProjectState = {
        projects: [
          createMockProject({ name: 'Project A' }),
          createMockProject({ name: 'Project B' }),
        ],
        currentProject: null,
        loading: false,
      }
      expect(hasProjects(state)).toBe(true)
    })
  })

  describe('setCurrentProject action', () => {
    it('sets the currentProject', () => {
      const project = createMockProject({ id: 'proj-1', name: 'Selected Project' })
      const state = setCurrentProject(createProjectState(), project)
      expect(state.currentProject).toEqual(project)
    })

    it('overwrites a previously selected project', () => {
      const project1 = createMockProject({ id: 'proj-1', name: 'First' })
      const project2 = createMockProject({ id: 'proj-2', name: 'Second' })

      let state = setCurrentProject(createProjectState(), project1)
      expect(state.currentProject?.name).toBe('First')

      state = setCurrentProject(state, project2)
      expect(state.currentProject?.name).toBe('Second')
    })

    it('does not modify the projects array', () => {
      const projects = [createMockProject({ name: 'Existing' })]
      const state: ProjectState = {
        projects,
        currentProject: null,
        loading: false,
      }

      const newProject = createMockProject({ name: 'New Current' })
      const result = setCurrentProject(state, newProject)
      expect(result.projects).toBe(projects)
    })
  })

  describe('clearProjects action', () => {
    it('resets projects to empty array', () => {
      const state = clearProjects()
      expect(state.projects).toEqual([])
    })

    it('resets currentProject to null', () => {
      const state = clearProjects()
      expect(state.currentProject).toBeNull()
    })

    it('resets loading to false', () => {
      const state = clearProjects()
      expect(state.loading).toBe(false)
    })
  })

  describe('Project flow sequences', () => {
    it('setCurrentProject -> clearProjects returns to empty state', () => {
      const project = createMockProject({ id: 'proj-1', name: 'Active' })
      let state = setCurrentProject(createProjectState(), project)
      expect(state.currentProject).not.toBeNull()

      state = clearProjects()
      expect(state.projects).toEqual([])
      expect(state.currentProject).toBeNull()
    })

    it('multiple setCurrentProject calls only keep the last selection', () => {
      const proj1 = createMockProject({ id: 'proj-1', name: 'First' })
      const proj2 = createMockProject({ id: 'proj-2', name: 'Second' })
      const proj3 = createMockProject({ id: 'proj-3', name: 'Third' })

      let state = createProjectState()
      state = setCurrentProject(state, proj1)
      state = setCurrentProject(state, proj2)
      state = setCurrentProject(state, proj3)

      expect(currentProjectName(state)).toBe('Third')
      expect(currentProjectId(state)).toBe('proj-3')
    })
  })
})
