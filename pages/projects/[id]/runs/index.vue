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

// Filters
const statusFilter = ref<TestRunStatus | 'all'>('all')
const environmentFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = 20

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
    runs.value = response.data
    total.value = response.total
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

const totalPages = computed(() => Math.ceil(total.value / limit))
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

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        value-key="value"
        size="sm"
        class="w-40"
      />
      <USelect
        v-model="environmentFilter"
        :items="environmentOptions"
        value-key="value"
        size="sm"
        class="w-44"
      />
      <UInput
        v-model="dateFrom"
        type="date"
        placeholder="From date"
        size="sm"
        class="w-40"
      />
      <UInput
        v-model="dateTo"
        type="date"
        placeholder="To date"
        size="sm"
        class="w-40"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 10" :key="i" class="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="runs.length === 0"
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-history" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ statusFilter !== 'all' || environmentFilter !== 'all' || dateFrom || dateTo ? 'No results match your filters' : 'No test runs yet' }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ statusFilter !== 'all' || environmentFilter !== 'all' || dateFrom || dateTo ? 'Try adjusting your filters.' : 'Run a test case to see results here.' }}
      </p>
    </div>

    <!-- Runs table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
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
              class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="py-3 px-4">
                <NuxtLink
                  v-if="run.testCase"
                  :to="`/projects/${projectId}/test-cases/${run.testCaseId}`"
                  class="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {{ run.testCase.name }}
                </NuxtLink>
                <span v-else class="text-gray-500 dark:text-gray-400">Unknown</span>
              </td>
              <td class="py-3 px-4">
                <TestStatusBadge :status="run.status" />
              </td>
              <td class="py-3 px-4 text-gray-700 dark:text-gray-300 capitalize">
                {{ run.environment }}
              </td>
              <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                {{ run.executedBy?.name ?? 'Unknown' }}
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
