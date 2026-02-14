<script setup lang="ts">
import type { TestPlan, TestCase } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const planId = computed(() => route.params.planId as string)

const { getTestPlan, updateTestPlan, linkTestCase, unlinkTestCase } = useTestPlan()
const { getTestCases } = useTestCase()

const plan = ref<TestPlan | null>(null)
const loading = ref(true)
const editing = ref(false)
const editName = ref('')
const editDescription = ref('')

// Add test cases modal
const showAddCasesModal = ref(false)
const availableCases = ref<TestCase[]>([])
const selectedCaseIds = ref<Set<string>>(new Set())
const searchQuery = ref('')
const loadingCases = ref(false)
const linking = ref(false)

async function loadPlan() {
  loading.value = true
  try {
    plan.value = await getTestPlan(planId.value)
    if (plan.value) {
      useSeoMeta({ title: plan.value.name })
      editName.value = plan.value.name
      editDescription.value = plan.value.description ?? ''
    }
  } finally {
    loading.value = false
  }
}

await loadPlan()

const linkedTestCases = computed<TestCase[]>(() => {
  return plan.value?.testCases?.map((tc) => tc.testCase).filter(Boolean) as TestCase[] ?? []
})

const linkedCaseIds = computed(() => new Set(linkedTestCases.value.map((tc) => tc.id)))

const filteredAvailableCases = computed(() => {
  if (!searchQuery.value.trim()) return availableCases.value
  const q = searchQuery.value.toLowerCase()
  return availableCases.value.filter((tc) => tc.name.toLowerCase().includes(q))
})

async function openAddCasesModal() {
  showAddCasesModal.value = true
  selectedCaseIds.value = new Set()
  searchQuery.value = ''
  loadingCases.value = true
  try {
    const result = await getTestCases(projectId.value, { limit: 200 })
    availableCases.value = result.data.filter((tc) => !linkedCaseIds.value.has(tc.id))
  } finally {
    loadingCases.value = false
  }
}

function toggleCase(caseId: string) {
  const next = new Set(selectedCaseIds.value)
  if (next.has(caseId)) {
    next.delete(caseId)
  } else {
    next.add(caseId)
  }
  selectedCaseIds.value = next
}

async function handleLinkSelected() {
  if (selectedCaseIds.value.size === 0) return
  linking.value = true
  try {
    const promises = [...selectedCaseIds.value].map((caseId) =>
      linkTestCase(planId.value, caseId),
    )
    await Promise.all(promises)
    showAddCasesModal.value = false
    await loadPlan()
  } finally {
    linking.value = false
  }
}

async function saveEdit() {
  if (!editName.value.trim()) return

  const updated = await updateTestPlan(planId.value, {
    name: editName.value,
    description: editDescription.value || undefined,
  })

  if (updated) {
    plan.value = updated
    editing.value = false
  }
}

async function handleUnlinkCase(caseId: string) {
  const success = await unlinkTestCase(planId.value, caseId)
  if (success) {
    await loadPlan()
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>

    <template v-else-if="plan">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div v-if="!editing" class="space-y-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ plan.name }}
          </h1>
          <p v-if="plan.description" class="text-sm text-gray-500 dark:text-gray-400">
            {{ plan.description }}
          </p>
          <p data-testid="test-plan-detail-created-by" class="text-xs text-gray-400 dark:text-gray-400">
            Created by {{ plan.createdBy?.name ?? 'Unknown' }} on
            {{ new Date(plan.createdAt).toLocaleDateString() }}
          </p>
        </div>

        <!-- Edit form -->
        <div v-else class="space-y-3 flex-1 max-w-lg">
          <UFormField label="Plan Name" required>
            <UInput v-model="editName" class="w-full" />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="editDescription" :rows="2" class="w-full" />
          </UFormField>
          <div class="flex gap-2">
            <UButton size="sm" @click="saveEdit">Save</UButton>
            <UButton size="sm" variant="ghost" color="neutral" @click="editing = false">Cancel</UButton>
          </div>
        </div>

        <div v-if="!editing" class="flex gap-2">
          <UButton
            data-testid="test-plan-detail-edit-button"
            icon="i-lucide-pencil"
            variant="outline"
            color="neutral"
            size="sm"
            @click="editing = true"
          >
            Edit
          </UButton>
          <UButton
            data-testid="test-plan-detail-add-cases-button"
            icon="i-lucide-plus"
            size="sm"
            @click="openAddCasesModal"
          >
            Add Test Cases
          </UButton>
        </div>
      </div>

      <!-- Plan details -->
      <div v-if="plan.scope || plan.entryCriteria || plan.exitCriteria" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard v-if="plan.scope" data-testid="test-plan-detail-scope-card" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
          <template #header>
            <h3 class="text-sm font-semibold text-black dark:text-white">Scope</h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ plan.scope }}</p>
        </UCard>
        <UCard v-if="plan.entryCriteria" data-testid="test-plan-detail-entry-criteria-card" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
          <template #header>
            <h3 class="text-sm font-semibold text-black dark:text-white">Entry Criteria</h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ plan.entryCriteria }}</p>
        </UCard>
        <UCard v-if="plan.exitCriteria" data-testid="test-plan-detail-exit-criteria-card" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
          <template #header>
            <h3 class="text-sm font-semibold text-black dark:text-white">Exit Criteria</h3>
          </template>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ plan.exitCriteria }}</p>
        </UCard>
      </div>

      <!-- Linked test cases -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Linked Test Cases ({{ linkedTestCases.length }})
        </h2>

        <div
          v-if="linkedTestCases.length === 0"
          class="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <UIcon name="i-lucide-link" class="text-3xl text-gray-400 dark:text-gray-400 mb-2" />
          <p data-testid="test-plan-detail-no-cases-message" class="text-sm text-gray-500 dark:text-gray-400">
            No test cases linked to this plan yet.
          </p>
        </div>

        <UCard v-else>
          <div class="divide-y divide-gray-200 dark:divide-gray-800">
            <div
              v-for="tc in linkedTestCases"
              :key="tc.id"
              class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <NuxtLink
                :to="`/projects/${projectId}/test-cases/${tc.id}`"
                data-testid="test-plan-detail-linked-case-name"
                class="flex items-center gap-3 min-w-0 flex-1 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <TestStatusBadge :status="tc.lastRunStatus" size="sm" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ tc.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ tc.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
                  </p>
                </div>
              </NuxtLink>
              <UButton
                data-testid="test-plan-detail-unlink-button"
                icon="i-lucide-unlink"
                variant="ghost"
                color="error"
                size="xs"
                aria-label="Unlink test case"
                @click.stop="handleUnlinkCase(tc.id)"
              />
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <!-- Not found -->
    <div v-else data-testid="test-plan-detail-not-found" class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Test Plan not found</h2>
      <UButton data-testid="test-plan-detail-back-button" class="mt-4" variant="outline" @click="navigateTo(`/projects/${projectId}/test-plans`)">
        Back to Test Plans
      </UButton>
    </div>

    <!-- Add Test Cases Modal -->
    <UModal
      v-model:open="showAddCasesModal"
      title="Add Test Cases"
      description="Select test cases to link to this plan."
      data-testid="add-test-cases-modal"
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="searchQuery"
            data-testid="add-test-cases-modal-search"
            icon="i-lucide-search"
            placeholder="Search test cases..."
            class="w-full"
          />

          <div v-if="loadingCases" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-gray-400" />
          </div>

          <div v-else-if="filteredAvailableCases.length === 0" class="text-center py-8">
            <p data-testid="add-test-cases-modal-all-linked-message" class="text-sm text-gray-500 dark:text-gray-400">
              {{ availableCases.length === 0 ? 'All test cases are already linked to this plan.' : 'No test cases match your search.' }}
            </p>
          </div>

          <div v-else class="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label
              v-for="tc in filteredAvailableCases"
              :key="tc.id"
              data-testid="add-test-cases-modal-case-name"
              class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <UCheckbox
                :model-value="selectedCaseIds.has(tc.id)"
                @update:model-value="toggleCase(tc.id)"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ tc.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ tc.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
                </p>
              </div>
              <TestStatusBadge :status="tc.lastRunStatus" size="sm" />
            </label>
          </div>

          <p v-if="selectedCaseIds.size > 0" data-testid="add-test-cases-modal-selection-count" class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedCaseIds.size }} test case{{ selectedCaseIds.size === 1 ? '' : 's' }} selected
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton data-testid="add-test-cases-modal-cancel-button" variant="ghost" color="neutral" @click="showAddCasesModal = false">Cancel</UButton>
          <UButton data-testid="add-test-cases-modal-submit" :disabled="selectedCaseIds.size === 0 || linking" :loading="linking" @click="handleLinkSelected">
            Link {{ selectedCaseIds.size || '' }} Test Case{{ selectedCaseIds.size === 1 ? '' : 's' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
