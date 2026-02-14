import { defineStore } from 'pinia'
import type { Project } from '~/types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    projects: [],
    currentProject: null,
    loading: false,
  }),

  getters: {
    currentProjectId: (state): string | null => state.currentProject?.id ?? null,
    currentProjectName: (state): string => state.currentProject?.name ?? '',
    hasProjects: (state): boolean => state.projects.length > 0,
  },

  actions: {
    async fetchProjects(orgId: string): Promise<void> {
      this.loading = true
      try {
        const data = await $fetch<Project[]>(`/api/organizations/${orgId}/projects`)
        this.projects = data
      } catch {
        this.projects = []
      } finally {
        this.loading = false
      }
    },

    setCurrentProject(project: Project): void {
      this.currentProject = project
    },

    clearProjects(): void {
      this.projects = []
      this.currentProject = null
    },
  },
})
