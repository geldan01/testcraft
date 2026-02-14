import type { Project, CreateProjectInput, UpdateProjectInput } from '~/types'
import { useProjectStore } from '~/stores/project'

export const useProject = () => {
  const projectStore = useProjectStore()

  const projects = computed(() => projectStore.projects)
  const currentProject = computed(() => projectStore.currentProject)
  const loading = computed(() => projectStore.loading)

  async function fetchProjects(orgId: string): Promise<void> {
    await projectStore.fetchProjects(orgId)
  }

  async function getProject(projectId: string): Promise<Project | null> {
    try {
      return await $fetch<Project>(`/api/projects/${projectId}`)
    } catch {
      return null
    }
  }

  async function createProject(data: CreateProjectInput): Promise<Project | null> {
    try {
      const project = await $fetch<Project>('/api/projects', {
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
      return await $fetch<Project>(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: data,
      })
    } catch {
      return null
    }
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    try {
      await $fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  function setCurrentProject(project: Project): void {
    projectStore.setCurrentProject(project)
  }

  return {
    projects,
    currentProject,
    loading,
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  }
}
