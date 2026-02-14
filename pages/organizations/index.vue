<script setup lang="ts">
import type { CreateOrganizationInput } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Organizations',
})

const { organizations, loading, fetchOrganizations, createOrganization, switchOrg } = useOrganization()

const showCreateModal = ref(false)
const newOrgName = ref('')
const creating = ref(false)

async function handleCreate() {
  if (!newOrgName.value.trim()) return

  creating.value = true
  try {
    const data: CreateOrganizationInput = { name: newOrgName.value.trim() }
    const org = await createOrganization(data)
    if (org) {
      switchOrg(org.id)
      showCreateModal.value = false
      newOrgName.value = ''
    }
  } finally {
    creating.value = false
  }
}

// Fetch organizations on mount
await fetchOrganizations()
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Organizations
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your organizations and their projects.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        Create Organization
      </UButton>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="i in 3" :key="i">
        <div class="animate-pulse space-y-3">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div class="flex gap-4 mt-4">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="organizations.length === 0"
      class="text-center py-16"
    >
      <div class="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <UIcon name="i-lucide-building-2" class="text-3xl text-gray-400 dark:text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No organizations yet
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Create your first organization to start managing test cases.
      </p>
      <UButton
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        Create Organization
      </UButton>
    </div>

    <!-- Organizations grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="org in organizations"
        :key="org.id"
        :to="`/organizations/${org.id}`"
        class="group"
      >
        <UCard class="h-full hover:shadow-md transition-shadow cursor-pointer">
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-building-2" class="text-lg text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {{ org.name }}
                </h3>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
              />
            </div>

            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-users" class="text-base" />
                {{ org._count?.members ?? 0 }} members
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-folder" class="text-base" />
                {{ org._count?.projects ?? 0 }} projects
              </span>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Create Organization Modal -->
    <UModal
      v-model:open="showCreateModal"
      title="Create Organization"
      description="Organizations help you group projects and team members."
    >
      <template #body>
        <form @submit.prevent="handleCreate">
          <UFormField label="Organization name" required>
            <UInput
              v-model="newOrgName"
              placeholder="e.g., Acme Corp"
              autofocus
              class="w-full"
            />
          </UFormField>
        </form>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showCreateModal = false"
          >
            Cancel
          </UButton>
          <UButton
            :loading="creating"
            :disabled="!newOrgName.trim()"
            @click="handleCreate"
          >
            Create
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
