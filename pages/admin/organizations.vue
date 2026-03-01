<script setup lang="ts">
import type { Organization, PaginatedResponse } from '~/types'

definePageMeta({
  middleware: 'admin',
})

useSeoMeta({
  title: 'Admin - Organizations',
})

const { fetchAllOrganizations, createOrganizationForUser, deleteOrganization } = useAdmin()

const orgsData = ref<PaginatedResponse<Organization> | null>(null)
const loading = ref(true)
const search = ref('')
const page = ref(1)
const limit = 20

// Create modal
const showCreateModal = ref(false)
const newOrgName = ref('')
const managerEmail = ref('')
const createLoading = ref(false)

// Delete modal
const showDeleteModal = ref(false)
const selectedOrg = ref<Organization | null>(null)
const deleteLoading = ref(false)

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'members', header: 'Members' },
  { accessorKey: 'projects', header: 'Projects' },
  { accessorKey: 'maxProjects', header: 'Max Projects' },
  { accessorKey: 'createdAt', header: 'Created' },
  { accessorKey: 'actions', header: '' },
]

async function loadOrganizations() {
  loading.value = true
  const params: Record<string, unknown> = { page: page.value, limit }
  if (search.value) params.search = search.value
  orgsData.value = await fetchAllOrganizations(params as { page?: number; limit?: number; search?: string })
  loading.value = false
}

watch(search, () => {
  page.value = 1
  loadOrganizations()
})

watch(page, () => loadOrganizations())

onMounted(() => loadOrganizations())

function getMenuItems(org: Organization) {
  return [
    [{
      label: 'View Organization',
      icon: 'i-lucide-eye',
      onSelect: () => navigateTo(`/organizations/${org.id}`),
    }],
    [{
      label: 'Delete Organization',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => openDeleteModal(org),
    }],
  ]
}

async function handleCreate() {
  if (!newOrgName.value.trim() || !managerEmail.value.trim()) return
  createLoading.value = true
  const org = await createOrganizationForUser({
    name: newOrgName.value.trim(),
    managerEmail: managerEmail.value.trim(),
  })
  createLoading.value = false
  if (org) {
    showCreateModal.value = false
    newOrgName.value = ''
    managerEmail.value = ''
    await loadOrganizations()
  }
}

function openDeleteModal(org: Organization) {
  selectedOrg.value = org
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedOrg.value) return
  deleteLoading.value = true
  const success = await deleteOrganization(selectedOrg.value.id)
  deleteLoading.value = false
  if (success) {
    showDeleteModal.value = false
    await loadOrganizations()
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 data-testid="admin-orgs-heading" class="text-2xl font-bold text-gray-900 dark:text-white">
          Organization Management
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage all organizations across the platform.
        </p>
      </div>
      <UButton icon="i-lucide-plus" data-testid="admin-orgs-create-btn" @click="showCreateModal = true">
        Create Organization
      </UButton>
    </div>

    <!-- Search -->
    <div>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by name..."
        class="w-80"
        data-testid="admin-orgs-search"
      />
    </div>

    <!-- Table -->
    <UCard>
      <UTable
        :data="orgsData?.data ?? []"
        :columns="columns"
        :loading="loading"
      >
        <template #name-cell="{ row }">
          <NuxtLink
            :to="`/organizations/${row.original.id}`"
            class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            :data-testid="`admin-org-name-${row.original.id}`"
          >
            {{ row.original.name }}
          </NuxtLink>
        </template>

        <template #members-cell="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.original._count?.members ?? 0 }}</span>
        </template>

        <template #projects-cell="{ row }">
          <span class="text-gray-600 dark:text-gray-400">{{ row.original._count?.projects ?? 0 }}</span>
        </template>

        <template #maxProjects-cell="{ row }">
          <span class="text-gray-500 dark:text-gray-400">{{ row.original.maxProjects }}</span>
        </template>

        <template #createdAt-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(row.original.createdAt) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <UDropdownMenu :items="getMenuItems(row.original)">
            <UButton icon="i-lucide-more-horizontal" variant="ghost" size="sm" color="neutral" :data-testid="`admin-org-actions-${row.original.id}`" />
          </UDropdownMenu>
        </template>
      </UTable>

      <!-- Pagination -->
      <div v-if="orgsData && orgsData.totalPages > 1" class="flex justify-center mt-4">
        <UPagination
          v-model="page"
          :total="orgsData.total"
          :items-per-page="limit"
        />
      </div>
    </UCard>

    <!-- Create Organization Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <div class="p-6 space-y-4" data-testid="admin-orgs-create-modal">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Create Organization
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Create a new organization and assign an initial manager.
          </p>
          <UInput
            v-model="newOrgName"
            placeholder="Organization name"
            label="Name"
            data-testid="admin-orgs-create-name-input"
          />
          <UInput
            v-model="managerEmail"
            placeholder="manager@example.com"
            label="Manager Email"
            type="email"
            data-testid="admin-orgs-create-email-input"
          />
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" data-testid="admin-orgs-create-cancel" @click="showCreateModal = false">
              Cancel
            </UButton>
            <UButton
              :loading="createLoading"
              :disabled="!newOrgName.trim() || !managerEmail.trim()"
              data-testid="admin-orgs-create-confirm"
              @click="handleCreate"
            >
              Create
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4" data-testid="admin-orgs-delete-modal">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Delete Organization
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ selectedOrg?.name }}</strong>?
            This will permanently remove all projects, test cases, test runs, and other data in this organization.
          </p>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" data-testid="admin-orgs-delete-cancel" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="error" :loading="deleteLoading" data-testid="admin-orgs-delete-confirm" @click="handleDelete">
              Delete Organization
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
