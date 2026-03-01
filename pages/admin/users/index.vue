<script setup lang="ts">
import type { AdminUserListItem, PaginatedResponse } from '~/types'

definePageMeta({
  middleware: 'admin',
})

useSeoMeta({
  title: 'Admin - Users',
})

const { fetchUsers, updateUser, deleteUser, resetUserPassword } = useAdmin()
const { currentUser } = useAuth()

const usersData = ref<PaginatedResponse<AdminUserListItem> | null>(null)
const loading = ref(true)
const search = ref('')
const statusFilter = ref('all')
const page = ref(1)
const limit = 20

// Modals
const showDeleteModal = ref(false)
const showResetPasswordModal = ref(false)
const selectedUser = ref<AdminUserListItem | null>(null)
const newPassword = ref('')
const actionLoading = ref(false)

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'isAdmin', header: 'Admin' },
  { accessorKey: '_count', header: 'Orgs' },
  { accessorKey: 'createdAt', header: 'Created' },
  { accessorKey: 'actions', header: '' },
]

async function loadUsers() {
  loading.value = true
  const params: Record<string, unknown> = { page: page.value, limit }
  if (search.value) params.search = search.value
  if (statusFilter.value !== 'all') params.status = statusFilter.value
  usersData.value = await fetchUsers(params as { page?: number; limit?: number; search?: string; status?: string })
  loading.value = false
}

// Watch filters
watch([search, statusFilter], () => {
  page.value = 1
  loadUsers()
})

watch(page, () => loadUsers())

onMounted(() => loadUsers())

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'SUSPENDED': return 'error'
    case 'PENDING_INVITATION': return 'warning'
    default: return 'neutral'
  }
}

function getMenuItems(user: AdminUserListItem) {
  const items = [
    [{
      label: 'View Details',
      icon: 'i-lucide-eye',
      onSelect: () => navigateTo(`/admin/users/${user.id}`),
    }],
    [{
      label: user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User',
      icon: user.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check',
      onSelect: () => handleToggleStatus(user),
    },
    {
      label: user.isAdmin ? 'Remove Admin' : 'Make Admin',
      icon: user.isAdmin ? 'i-lucide-shield-off' : 'i-lucide-shield',
      onSelect: () => handleToggleAdmin(user),
    },
    {
      label: 'Reset Password',
      icon: 'i-lucide-key-round',
      onSelect: () => openResetPassword(user),
    }],
    [{
      label: 'Delete User',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => openDeleteModal(user),
    }],
  ]

  // Remove actions that target the current user
  if (user.id === currentUser.value?.id) {
    return [[items[0][0]]]
  }

  return items
}

async function handleToggleStatus(user: AdminUserListItem) {
  const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const result = await updateUser(user.id, { status: newStatus })
  if (result) await loadUsers()
}

async function handleToggleAdmin(user: AdminUserListItem) {
  const result = await updateUser(user.id, { isAdmin: !user.isAdmin })
  if (result) await loadUsers()
}

function openResetPassword(user: AdminUserListItem) {
  selectedUser.value = user
  newPassword.value = ''
  showResetPasswordModal.value = true
}

async function handleResetPassword() {
  if (!selectedUser.value || !newPassword.value) return
  actionLoading.value = true
  const success = await resetUserPassword(selectedUser.value.id, newPassword.value)
  actionLoading.value = false
  if (success) {
    showResetPasswordModal.value = false
  }
}

function openDeleteModal(user: AdminUserListItem) {
  selectedUser.value = user
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedUser.value) return
  actionLoading.value = true
  const success = await deleteUser(selectedUser.value.id)
  actionLoading.value = false
  if (success) {
    showDeleteModal.value = false
    await loadUsers()
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending', value: 'PENDING_INVITATION' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 data-testid="admin-users-heading" class="text-2xl font-bold text-gray-900 dark:text-white">
        User Management
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        View and manage all users across the platform.
      </p>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by name or email..."
        class="w-80"
        data-testid="admin-users-search"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        class="w-44"
        data-testid="admin-users-status-filter"
      />
    </div>

    <!-- Table -->
    <UCard>
      <UTable
        :data="usersData?.data ?? []"
        :columns="columns"
        :loading="loading"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-white">{{ row.original.name }}</span>
          </div>
        </template>

        <template #email-cell="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.original.email }}</span>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #isAdmin-cell="{ row }">
          <UBadge v-if="row.original.isAdmin" color="primary" variant="subtle" size="sm">
            Admin
          </UBadge>
          <span v-else class="text-gray-400">-</span>
        </template>

        <template #_count-cell="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.original._count?.organizationMemberships ?? 0 }}</span>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getMenuItems(row.original)">
            <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" color="neutral" :data-testid="`admin-user-actions-${row.original.id}`" />
          </UDropdownMenu>
        </template>
      </UTable>

      <!-- Pagination -->
      <div v-if="usersData && usersData.totalPages > 1" class="flex justify-center mt-4">
        <UPagination
          v-model="page"
          :total="usersData.total"
          :items-per-page="limit"
        />
      </div>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4" data-testid="admin-users-delete-modal">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Delete User
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ selectedUser?.name }}</strong> ({{ selectedUser?.email }})?
            This action cannot be undone and will remove all their data.
          </p>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" data-testid="admin-users-delete-cancel" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="actionLoading" data-testid="admin-users-delete-confirm" @click="handleDelete">
              Delete User
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Reset Password Modal -->
    <UModal v-model:open="showResetPasswordModal">
      <template #content>
        <div class="p-6 space-y-4" data-testid="admin-users-reset-password-modal">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Reset Password
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Set a new password for <strong>{{ selectedUser?.name }}</strong>.
          </p>
          <UInput
            v-model="newPassword"
            type="password"
            placeholder="New password (min 8 chars, upper+lower+digit)"
            data-testid="admin-users-reset-password-input"
          />
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" data-testid="admin-users-reset-password-cancel" @click="showResetPasswordModal = false">
              Cancel
            </UButton>
            <UButton :loading="actionLoading" :disabled="newPassword.length < 8" data-testid="admin-users-reset-password-confirm" @click="handleResetPassword">
              Reset Password
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
