<script setup lang="ts">
import type { Project } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Project Settings',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getProject, updateProject, deleteProject } = useProject()

const project = ref<Project | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

// Form state
const projectName = ref('')
const projectDescription = ref('')

async function loadProject() {
  loading.value = true
  try {
    project.value = await getProject(projectId.value)
    if (project.value) {
      projectName.value = project.value.name
      projectDescription.value = project.value.description ?? ''
    }
  } finally {
    loading.value = false
  }
}

await loadProject()

async function handleSave() {
  if (!projectName.value.trim()) return
  saving.value = true
  try {
    const updated = await updateProject(projectId.value, {
      name: projectName.value.trim(),
      description: projectDescription.value.trim() || undefined,
    })
    if (updated) {
      project.value = updated
    }
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    const success = await deleteProject(projectId.value)
    if (success) {
      const orgId = project.value?.organizationId
      await navigateTo(orgId ? `/organizations/${orgId}` : '/organizations')
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div class="flex items-center gap-3">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        size="sm"
        data-testid="project-settings-back-button"
        @click="navigateTo(`/projects/${projectId}`)"
      />
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Project Settings</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage project name, description, and other settings.
        </p>
      </div>
    </div>

    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <template v-else-if="project">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">General</h3>
        </template>
        <form class="space-y-4" @submit.prevent="handleSave">
          <UFormField label="Project name" required>
            <UInput
              v-model="projectName"
              class="w-full"
              data-testid="project-settings-name-input"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="projectDescription"
              placeholder="Describe this project..."
              :rows="3"
              class="w-full"
              data-testid="project-settings-description-input"
            />
          </UFormField>
          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="saving"
              data-testid="project-settings-save-button"
            >
              Save Changes
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Danger zone -->
      <UCard class="border-red-200 dark:border-red-800">
        <template #header>
          <h3 class="text-base font-semibold text-red-300">Danger Zone</h3>
        </template>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Delete Project</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              This will permanently delete the project and all its test cases, plans, and runs.
            </p>
          </div>
          <UButton
            color="error"
            variant="outline"
            size="sm"
            data-testid="project-settings-delete-button"
            @click="showDeleteConfirm = true"
          >
            Delete
          </UButton>
        </div>
      </UCard>

      <!-- Delete confirmation modal -->
      <UModal v-model:open="showDeleteConfirm" title="Delete Project">
        <template #body>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{{ project.name }}</strong>? This action cannot be undone.
          </p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" color="neutral" @click="showDeleteConfirm = false">Cancel</UButton>
            <UButton
              color="error"
              :loading="deleting"
              data-testid="project-settings-confirm-delete-button"
              @click="handleDelete"
            >
              Delete Project
            </UButton>
          </div>
        </template>
      </UModal>
    </template>

    <!-- Not found -->
    <div v-else class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Project not found</h2>
      <UButton class="mt-4" variant="outline" @click="navigateTo('/organizations')">
        Back to Organizations
      </UButton>
    </div>
  </div>
</template>
