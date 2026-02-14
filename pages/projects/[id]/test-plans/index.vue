<script setup lang="ts">
import type { TestPlan, CreateTestPlanInput } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Test Plans',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getTestPlans, createTestPlan } = useTestPlan()

const plans = ref<TestPlan[]>([])
const loading = ref(true)
const showCreateModal = ref(false)

// Create form
const newPlan = reactive<CreateTestPlanInput>({
  name: '',
  description: '',
  projectId: '',
})

async function loadPlans() {
  loading.value = true
  try {
    const response = await getTestPlans(projectId.value)
    plans.value = response.data
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newPlan.name.trim()) return

  const result = await createTestPlan({
    ...newPlan,
    projectId: projectId.value,
  })

  if (result) {
    showCreateModal.value = false
    newPlan.name = ''
    newPlan.description = ''
    await loadPlans()
  }
}

await loadPlans()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'testCaseCount', label: 'Test Cases' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Created' },
  { key: 'actions', label: '' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Plans</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Organize and manage test plans for this project.
        </p>
      </div>
      <UButton data-testid="test-plans-create-button" icon="i-lucide-plus" @click="showCreateModal = true">
        Create Test Plan
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="plans.length === 0"
      data-testid="test-plans-empty-state"
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-clipboard-list" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">No test plans yet</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
        Create your first test plan to organize test cases.
      </p>
      <UButton icon="i-lucide-plus" @click="showCreateModal = true">
        Create Test Plan
      </UButton>
    </div>

    <!-- Plans table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th
                v-for="col in columns"
                :key="col.key"
                class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="plan in plans"
              :key="plan.id"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              @click="navigateTo(`/projects/${projectId}/test-plans/${plan.id}`)"
            >
              <td class="py-3 px-4" data-testid="test-plans-plan-name">
                <p class="font-medium text-gray-900 dark:text-white">{{ plan.name }}</p>
                <p v-if="plan.description" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {{ plan.description }}
                </p>
              </td>
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400" data-testid="test-plans-case-count">
                {{ plan._count?.testCases ?? 0 }}
              </td>
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                {{ plan.createdBy?.name ?? 'Unknown' }}
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400">
                {{ new Date(plan.createdAt).toLocaleDateString() }}
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  icon="i-lucide-chevron-right"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal
      v-model:open="showCreateModal"
      title="Create Test Plan"
      description="Define a new test plan for this project."
      data-testid="test-plans-create-modal"
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField label="Plan name" required>
            <UInput
              v-model="newPlan.name"
              data-testid="test-plans-create-modal-name-input"
              placeholder="e.g., Sprint 12 Regression"
              autofocus
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="newPlan.description"
              data-testid="test-plans-create-modal-description-input"
              placeholder="Describe the purpose and scope of this test plan..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton data-testid="test-plans-create-modal-cancel-button" variant="ghost" color="neutral" @click="showCreateModal = false">Cancel</UButton>
          <UButton data-testid="test-plans-create-modal-submit-button" :disabled="!newPlan.name.trim()" @click="handleCreate">Create</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
