import type {
  AdminStats,
  AdminUserListItem,
  AdminUserDetail,
  UpdateUserInput,
  AdminCreateOrganizationInput,
  Organization,
  User,
  PaginatedResponse,
} from '~/types'

export const useAdmin = () => {
  const toast = useToast()

  // ---- Stats ----

  async function fetchStats(): Promise<AdminStats | null> {
    try {
      return await $fetch<AdminStats>('/api/admin/stats')
    } catch {
      toast.add({ title: 'Failed to load admin stats', color: 'error' })
      return null
    }
  }

  // ---- Users ----

  async function fetchUsers(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<PaginatedResponse<AdminUserListItem> | null> {
    try {
      return await $fetch<PaginatedResponse<AdminUserListItem>>('/api/admin/users', { params })
    } catch {
      toast.add({ title: 'Failed to load users', color: 'error' })
      return null
    }
  }

  async function getUser(userId: string): Promise<AdminUserDetail | null> {
    try {
      return await $fetch<AdminUserDetail>(`/api/admin/users/${userId}`)
    } catch {
      toast.add({ title: 'Failed to load user', color: 'error' })
      return null
    }
  }

  async function updateUser(userId: string, data: UpdateUserInput): Promise<User | null> {
    try {
      const user = await $fetch<User>(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: data,
      })
      toast.add({ title: 'User updated', color: 'success' })
      return user
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update user'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function deleteUser(userId: string): Promise<boolean> {
    try {
      await $fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      toast.add({ title: 'User deleted', color: 'success' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete user'
      toast.add({ title: message, color: 'error' })
      return false
    }
  }

  async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      await $fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: { newPassword },
      })
      toast.add({ title: 'Password reset successfully', color: 'success' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to reset password'
      toast.add({ title: message, color: 'error' })
      return false
    }
  }

  // ---- Organizations ----

  async function fetchAllOrganizations(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<PaginatedResponse<Organization> | null> {
    try {
      return await $fetch<PaginatedResponse<Organization>>('/api/admin/organizations', { params })
    } catch {
      toast.add({ title: 'Failed to load organizations', color: 'error' })
      return null
    }
  }

  async function createOrganizationForUser(data: AdminCreateOrganizationInput): Promise<Organization | null> {
    try {
      const org = await $fetch<Organization>('/api/admin/organizations', {
        method: 'POST',
        body: data,
      })
      toast.add({ title: 'Organization created', color: 'success' })
      return org
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create organization'
      toast.add({ title: message, color: 'error' })
      return null
    }
  }

  async function deleteOrganization(orgId: string): Promise<boolean> {
    try {
      await $fetch(`/api/admin/organizations/${orgId}`, { method: 'DELETE' })
      toast.add({ title: 'Organization deleted', color: 'success' })
      return true
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete organization'
      toast.add({ title: message, color: 'error' })
      return false
    }
  }

  return {
    fetchStats,
    fetchUsers,
    getUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    fetchAllOrganizations,
    createOrganizationForUser,
    deleteOrganization,
  }
}
