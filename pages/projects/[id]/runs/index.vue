<script setup lang="ts">
import type { TestRun, TestRunFilters, TestRunStatus } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Test Runs',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getRuns } = useTestRun()

const runs = ref<TestRun[]>([])
const total = ref(0)
const loading = ref(true)

// Filters - support testCaseId query param for pre-filtering
const testCaseIdFilter = ref((route.query.testCaseId as string) ?? '')
const statusFilter = ref<TestRunStatus | 'all'>('all')
const environmentFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = 20

// TestRunFilters component v-model
const filterModel = computed({
  get: () => ({
    status: statusFilter.value,
    environment: environmentFilter.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
  }),
  set: (val: { status: string; environment: string; dateFrom: string; dateTo: string }) => {
    statusFilter.value = val.status as TestRunStatus | 'all'
    environmentFilter.value = val.environment
    dateFrom.value = val.dateFrom
    dateTo.value = val.dateTo
  },
})

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pass', value: 'PASS' },
  { label: 'Fail', value: 'FAIL' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Not Run', value: 'NOT_RUN' },
]

const environmentOptions = [
  { label: 'All Environments', value: 'all' },
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
  { label: 'QA', value: 'qa' },
]

async function loadRuns() {
  loading.value = true
  try {
    const filters: TestRunFilters = {
      page: page.value,
      limit,
    }
    if (statusFilter.value !== 'all') filters.status = statusFilter.value as TestRunStatus
    if (environmentFilter.value !== 'all') filters.environment = environmentFilter.value
    if (dateFrom.value) filters.dateFrom = dateFrom.value
    if (dateTo.value) filters.dateTo = dateTo.value

    const response = await getRuns(projectId.value, filters)
    // If testCaseId filter is active, filter client-side
    if (testCaseIdFilter.value) {
      runs.value = response.data.filter((r) => r.testCaseId === testCaseIdFilter.value)
      total.value = runs.value.length
    } else {
      runs.value = response.data
      total.value = response.total
    }
  } finally {
    loading.value = false
  }
}

watch([statusFilter, environmentFilter, dateFrom, dateTo], () => {
  page.value = 1
  loadRuns()
})

await loadRuns()

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function navigateToRun(runId: string) {
  navigateTo(`/projects/${projectId.value}/test-runs/${runId}`)
}

function clearTestCaseFilter() {
  testCaseIdFilter.value = ''
  loadRuns()
}

const totalPages = computed(() => Math.ceil(total.value / limit))

// Find the test case name from the first matching run for display
const filteredTestCaseName = computed(() => {
  if (!testCaseIdFilter.value || runs.value.length === 0) return null
  return runs.value[0]?.testCase?.name ?? null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Runs History</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        View all test execution results for this project.
      </p>
    </div>

    <!-- Test case filter banner -->
    <div
      v-if="testCaseIdFilter"
      class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between"
    >
      <span class="text-sm text-indigo-700 dark:text-indigo-300">
        <UIcon name="i-lucide-filter" class="inline mr-1" />
        Filtered by test case: <strong>{{ filteredTestCaseName ?? testCaseIdFilter }}</strong>
      </span>
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="clearTestCaseFilter">
        Clear Filter
      </UButton>
    </div>

    <!-- Filters -->
    <TestRunFilters :project-id="projectId" v-model="filterModel" />

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 10" :key="i" class="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="runs.length === 0"
      data-testid="test-runs-empty-state"
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-history" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ statusFilter !== 'all' || environmentFilter !== 'all' || dateFrom || dateTo || testCaseIdFilter ? 'No results match your filters' : 'No test runs yet' }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ statusFilter !== 'all' || environmentFilter !== 'all' || dateFrom || dateTo || testCaseIdFilter ? 'Try adjusting your filters.' : 'Run a test case to see results here.' }}
      </p>
    </div>

    <!-- Runs table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table data-testid="test-runs-table" class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Test Case</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Environment</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Executed By</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="run in runs"
              :key="run.id"
              :data-testid="`test-run-row-${run.id}`"
              :class="[
                'border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer transition-colors',
                run.status === 'IN_PROGRESS'
                  ? 'bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              ]"
              @click="navigateToRun(run.id)"
            >
              <td class="py-3 px-4">
                <span
                  v-if="run.testCase"
                  data-testid="test-runs-test-case-name"
                  class="font-medium text-gray-900 dark:text-white"
                >
                  {{ run.testCase.name }}
                </span>
                <span v-else class="text-gray-500 dark:text-gray-400">Unknown</span>
              </td>
              <td data-testid="test-runs-status-badge" class="py-3 px-4">
                <TestStatusBadge :status="run.status" />
              </td>
              <td class="py-3 px-4">
                <TestEnvironmentBadge :environment="run.environment" />
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <UAvatar
                    :text="run.executedBy?.name?.charAt(0) ?? '?'"
                    :src="run.executedBy?.avatarUrl ?? undefined"
                    size="2xs"
                  />
                  <span class="text-gray-700 dark:text-gray-300">
                    {{ run.executedBy?.name ?? 'Unknown' }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                {{ new Date(run.executedAt).toLocaleString() }}
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400">
                {{ formatDuration(run.duration) }}
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
          Showing {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} of {{ total }}
        </p>
        <div class="flex gap-2">
          <UButton
            variant="outline"
            color="neutral"
            size="xs"
            :disabled="page <= 1"
            @click="page--; loadRuns()"
          >
            Previous
          </UButton>
          <UButton
            variant="outline"
            color="neutral"
            size="xs"
            :disabled="page >= totalPages"
            @click="page++; loadRuns()"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
