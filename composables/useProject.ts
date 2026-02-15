import type { Project, CreateProjectInput, UpdateProjectInput } from '~/types'
import { useProjectStore } from '~/stores/project'

export const useProject = () => {
  const toast = useToast()
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
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create project'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function updateProject(projectId: string, data: UpdateProjectInput): Promise<Project | null> {
    try {
      return await $fetch<Project>(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: data,
      })
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update project'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    try {
      await $fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete project'
      toast.add({ title: message, color: 'error' })
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
