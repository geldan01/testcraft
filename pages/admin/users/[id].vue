<script setup lang="ts">
import type { AdminUserDetail } from '~/types'

definePageMeta({
  middleware: 'admin',
})

const route = useRoute()
const { getUser, updateUser, deleteUser, resetUserPassword } = useAdmin()
const { currentUser } = useAuth()

const userId = route.params.id as string
const user = ref<AdminUserDetail | null>(null)
const loading = ref(true)

const showDeleteModal = ref(false)
const showResetPasswordModal = ref(false)
const newPassword = ref('')
const actionLoading = ref(false)

const isSelf = computed(() => user.value?.id === currentUser.value?.id)

useSeoMeta({
  title: computed(() => user.value ? `Admin - ${user.value.name}` : 'Admin - User Detail'),
})

async function loadUser() {
  loading.value = true
  user.value = await getUser(userId)
  loading.value = false
}

onMounted(() => loadUser())

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'SUSPENDED': return 'error'
    case 'PENDING_INVITATION': return 'warning'
    default: return 'neutral'
  }
}

function getRoleLabel(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function handleToggleStatus() {
  if (!user.value || isSelf.value) return
  const newStatus = user.value.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const result = await updateUser(user.value.id, { status: newStatus })
  if (result) await loadUser()
}

async function handleToggleAdmin() {
  if (!user.value || isSelf.value) return
  const result = await updateUser(user.value.id, { isAdmin: !user.value.isAdmin })
  if (result) await loadUser()
}

async function handleResetPassword() {
  if (!user.value || !newPassword.value) return
  actionLoading.value = true
  const success = await resetUserPassword(user.value.id, newPassword.value)
  actionLoading.value = false
  if (success) {
    showResetPasswordModal.value = false
    newPassword.value = ''
  }
}

async function handleDelete() {
  if (!user.value || isSelf.value) return
  actionLoading.value = true
  const success = await deleteUser(user.value.id)
  actionLoading.value = false
  if (success) {
    showDeleteModal.value = false
    navigateTo('/admin/users')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back link -->
    <UButton to="/admin/users" variant="link" icon="i-lucide-arrow-left" color="neutral" class="-ml-2" data-testid="admin-user-detail-back">
      Back to Users
    </UButton>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <UCard>
        <div class="animate-pulse space-y-3">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </UCard>
    </div>

    <!-- Not found -->
    <div v-else-if="!user" class="text-center py-16" data-testid="admin-user-detail-not-found">
      <p class="text-gray-500 dark:text-gray-400">User not found.</p>
    </div>

    <template v-else>
      <!-- User Info Card -->
      <UCard>
        <div class="flex items-start justify-between">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h1 data-testid="admin-user-detail-name" class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ user.name }}
              </h1>
              <UBadge v-if="user.isAdmin" color="primary" variant="subtle" data-testid="admin-user-detail-admin-badge">
                Admin
              </UBadge>
              <UBadge :color="getStatusColor(user.status)" variant="subtle" data-testid="admin-user-detail-status-badge">
                {{ user.status }}
              </UBadge>
            </div>
            <p data-testid="admin-user-detail-email" class="text-gray-600 dark:text-gray-400">{{ user.email }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Joined {{ formatDate(user.createdAt) }} &middot; Auth: {{ user.authProvider }}
            </p>
          </div>

          <!-- Actions -->
          <div v-if="!isSelf" class="flex gap-2" data-testid="admin-user-detail-actions">
            <UButton
              variant="outline"
              :icon="user.status === 'ACTIVE' ? 'i-lucide-user-x' : 'i-lucide-user-check'"
              :color="user.status === 'ACTIVE' ? 'error' : 'success'"
              size="sm"
              data-testid="admin-user-detail-suspend-btn"
              @click="handleToggleStatus"
            >
              {{ user.status === 'ACTIVE' ? 'Suspend' : 'Activate' }}
            </UButton>
            <UButton
              variant="outline"
              :icon="user.isAdmin ? 'i-lucide-shield-off' : 'i-lucide-shield'"
              size="sm"
              data-testid="admin-user-detail-admin-toggle-btn"
              @click="handleToggleAdmin"
            >
              {{ user.isAdmin ? 'Remove Admin' : 'Make Admin' }}
            </UButton>
            <UButton
              variant="outline"
              icon="i-lucide-key-round"
              size="sm"
              data-testid="admin-user-detail-reset-password-btn"
              @click="showResetPasswordModal = true"
            >
              Reset Password
            </UButton>
            <UButton
              variant="outline"
              icon="i-lucide-trash-2"
              color="error"
              size="sm"
              data-testid="admin-user-detail-delete-btn"
              @click="showDeleteModal = true"
            >
              Delete
            </UButton>
          </div>
          <UBadge v-else color="neutral" variant="subtle" data-testid="admin-user-detail-self-badge">
            This is you
          </UBadge>
        </div>
      </UCard>

      <!-- Organization Memberships -->
      <UCard data-testid="admin-user-detail-memberships">
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Organization Memberships ({{ user.organizationMemberships?.length ?? 0 }})
          </h2>
        </template>

        <div v-if="!user.organizationMemberships?.length" class="text-center py-8 text-gray-500 dark:text-gray-400">
          This user is not a member of any organization.
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
          <div
            v-for="membership in user.organizationMemberships"
            :key="membership.id"
            class="flex items-center justify-between py-3"
            :data-testid="`admin-user-detail-membership-${membership.id}`"
          >
            <div>
              <NuxtLink
                :to="`/organizations/${membership.organization.id}`"
                class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ membership.organization.name }}
              </NuxtLink>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Joined {{ formatDate(membership.joinedAt) }}
              </p>
            </div>
            <UBadge variant="subtle" color="neutral">
              {{ getRoleLabel(membership.role) }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Delete Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Delete User</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ user?.name }}</strong>? This cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" @click="showDeleteModal = false">Cancel</UButton>
            <UButton color="error" :loading="actionLoading" @click="handleDelete">Delete User</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Reset Password Modal -->
    <UModal v-model:open="showResetPasswordModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Reset Password</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Set a new password for <strong>{{ user?.name }}</strong>.
          </p>
          <UInput
            v-model="newPassword"
            type="password"
            placeholder="New password (min 8 chars, upper+lower+digit)"
          />
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" @click="showResetPasswordModal = false">Cancel</UButton>
            <UButton :loading="actionLoading" :disabled="newPassword.length < 8" @click="handleResetPassword">
              Reset Password
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
