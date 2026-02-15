<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { TestCase, TestCaseFilters, TestRunStatus, TestType } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Test Cases',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getTestCases, deleteTestCase, toggleDebugFlag } = useTestCase()

const testCases = ref<TestCase[]>([])
const total = ref(0)
const loading = ref(true)

// Filters
const search = ref('')
const statusFilter = ref<TestRunStatus | 'all'>('all')
const typeFilter = ref<TestType | 'all'>('all')
const debugFilter = ref<'all' | 'true' | 'false'>('all')
const page = ref(1)
const limit = 20

// Selected for bulk actions
const selectedIds = ref<Set<string>>(new Set())

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pass', value: 'PASS' },
  { label: 'Fail', value: 'FAIL' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Not Run', value: 'NOT_RUN' },
]

const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Step-Based', value: 'STEP_BASED' },
  { label: 'Gherkin', value: 'GHERKIN' },
]

const debugOptions = [
  { label: 'All', value: 'all' },
  { label: 'Flagged', value: 'true' },
  { label: 'Not Flagged', value: 'false' },
]

async function loadTestCases() {
  loading.value = true
  try {
    const filters: TestCaseFilters = {
      page: page.value,
      limit,
    }
    if (search.value) filters.search = search.value
    if (statusFilter.value !== 'all') filters.status = statusFilter.value as TestRunStatus
    if (typeFilter.value !== 'all') filters.testType = typeFilter.value as TestType
    if (debugFilter.value !== 'all') filters.debugFlag = debugFilter.value === 'true'

    const response = await getTestCases(projectId.value, filters)
    testCases.value = response.data
    total.value = response.total
  } finally {
    loading.value = false
  }
}

// Debounce search input to avoid excessive API calls
watchDebounced(search, () => {
  page.value = 1
  loadTestCases()
}, { debounce: 300 })

// Filters apply immediately
watch([statusFilter, typeFilter, debugFilter], () => {
  page.value = 1
  loadTestCases()
})

await loadTestCases()

async function handleDelete(caseId: string) {
  const success = await deleteTestCase(caseId)
  if (success) {
    await loadTestCases()
  }
}

async function handleToggleDebug(caseId: string) {
  const result = await toggleDebugFlag(caseId)
  if (result) {
    const index = testCases.value.findIndex((tc) => tc.id === caseId)
    if (index !== -1) {
      testCases.value[index] = result
    }
  }
}

async function handleBulkDelete() {
  const ids = Array.from(selectedIds.value)
  let deleted = 0
  for (const id of ids) {
    const success = await deleteTestCase(id)
    if (success) deleted++
  }
  selectedIds.value.clear()
  if (deleted > 0) {
    await loadTestCases()
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.size === testCases.value.length) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(testCases.value.map((tc) => tc.id))
  }
}

const allSelected = computed(() => {
  return testCases.value.length > 0 && selectedIds.value.size === testCases.value.length
})

const totalPages = computed(() => Math.ceil(total.value / limit))

// Count of debug-flagged test cases for the button badge
const debugFlaggedCount = computed(() => {
  return testCases.value.filter((tc) => tc.debugFlag).length
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Cases</h1>
        <p data-testid="test-cases-count" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ total }} test case{{ total !== 1 ? 's' : '' }} in this project
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-bug"
          variant="outline"
          color="neutral"
          @click="navigateTo(`/projects/${projectId}/debug-queue`)"
        >
          Debug Queue
        </UButton>
        <UButton
          data-testid="test-cases-create-button"
          icon="i-lucide-plus"
          @click="navigateTo(`/projects/${projectId}/test-cases/new`)"
        >
          Create Test Case
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        data-testid="test-cases-search-input"
        icon="i-lucide-search"
        placeholder="Search test cases..."
        class="flex-1"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        size="sm"
        class="w-40"
      />
      <USelect
        v-model="typeFilter"
        :items="typeOptions"
        value-key="value"
        size="sm"
        class="w-36"
      />
      <USelect
        v-model="debugFilter"
        :items="debugOptions"
        value-key="value"
        size="sm"
        class="w-32"
      />
    </div>

    <!-- Bulk actions -->
    <div
      v-if="selectedIds.size > 0"
      class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between"
    >
      <span class="text-sm text-indigo-700 dark:text-indigo-300">
        {{ selectedIds.size }} test case{{ selectedIds.size !== 1 ? 's' : '' }} selected
      </span>
      <div class="flex gap-2">
        <UButton size="xs" variant="soft" color="error" icon="i-lucide-trash-2" @click="handleBulkDelete">
          Delete Selected
        </UButton>
        <UButton size="xs" variant="ghost" color="neutral" @click="selectedIds.clear()">
          Clear Selection
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 8" :key="i" class="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="testCases.length === 0"
      data-testid="test-cases-empty-state"
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-test-tubes" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ search || statusFilter !== 'all' || typeFilter !== 'all' || debugFilter !== 'all' ? 'No results found' : 'No test cases yet' }}
      </h3>
      <p data-testid="test-cases-empty-state-description" class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
        {{ search || statusFilter !== 'all' || typeFilter !== 'all' || debugFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first test case to start testing.' }}
      </p>
      <UButton
        v-if="!search && statusFilter === 'all' && typeFilter === 'all' && debugFilter === 'all'"
        icon="i-lucide-plus"
        @click="navigateTo(`/projects/${projectId}/test-cases/new`)"
      >
        Create Test Case
      </UButton>
    </div>

    <!-- Test cases table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table data-testid="test-cases-table" class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 w-8">
                <UCheckbox
                  :model-value="allSelected"
                  @update:model-value="toggleSelectAll"
                />
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Debug</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Last Run</th>
              <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tc in testCases"
              :key="tc.id"
              :data-testid="`test-case-row-${tc.id}`"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="py-3 px-4" @click.stop>
                <UCheckbox
                  :model-value="selectedIds.has(tc.id)"
                  @update:model-value="toggleSelect(tc.id)"
                />
              </td>
              <td class="py-3 px-4">
                <NuxtLink
                  :to="`/projects/${projectId}/test-cases/${tc.id}`"
                  :data-testid="`test-case-row-${tc.id}-name`"
                  class="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {{ tc.name }}
                </NuxtLink>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="tc.testType === 'STEP_BASED' ? 'primary' : 'info'"
                  variant="subtle"
                  size="xs"
                >
                  {{ tc.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <TestStatusBadge :status="tc.lastRunStatus" />
              </td>
              <td class="py-3 px-4 text-center" @click.stop>
                <button
                  class="inline-flex"
                  :data-testid="`test-case-row-${tc.id}-debug-toggle`"
                  :title="tc.debugFlag ? 'Remove debug flag' : 'Flag for debug'"
                  @click="handleToggleDebug(tc.id)"
                >
                  <UIcon
                    :name="tc.debugFlag ? 'i-lucide-bug' : 'i-lucide-bug-off'"
                    :class="tc.debugFlag ? 'text-red-500' : 'text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'"
                    class="text-lg transition-colors"
                  />
                </button>
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                {{ tc.lastRunAt ? new Date(tc.lastRunAt).toLocaleDateString() : 'Never' }}
              </td>
              <td class="py-3 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <UButton
                    icon="i-lucide-eye"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="View test case"
                    @click="navigateTo(`/projects/${projectId}/test-cases/${tc.id}`)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    variant="ghost"
                    color="error"
                    size="xs"
                    aria-label="Delete test case"
                    @click="handleDelete(tc.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800 mt-4"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ page }} of {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <UButton
            variant="outline"
            color="neutral"
            size="xs"
            :disabled="page <= 1"
            @click="page--; loadTestCases()"
          >
            Previous
          </UButton>
          <UButton
            variant="outline"
            color="neutral"
            size="xs"
            :disabled="page >= totalPages"
            @click="page++; loadTestCases()"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
