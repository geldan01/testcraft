<script setup lang="ts">
import type { TestRun } from '~/types'

const props = defineProps<{
  testCaseId: string
  projectId: string
}>()

const { getRunsForTestCase } = useTestRun()

const runs = ref<TestRun[]>([])
const loading = ref(true)

const columns = [
  { key: 'executedAt', label: 'Date' },
  { key: 'executedBy', label: 'Executor' },
  { key: 'environment', label: 'Environment' },
  { key: 'status', label: 'Status' },
  { key: 'duration', label: 'Duration' },
  { key: 'actions', label: '' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '--'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

async function loadRuns() {
  loading.value = true
  runs.value = await getRunsForTestCase(props.testCaseId)
  loading.value = false
}

onMounted(() => {
  loadRuns()
})

watch(() => props.testCaseId, () => {
  loadRuns()
})
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="text-xl text-gray-400 animate-spin" />
    </div>

    <div v-else-if="runs.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-history" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">No test runs recorded yet</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th
              v-for="col in columns"
              :key="col.key"
              class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="run in runs"
            :key="run.id"
            class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300">
              {{ formatDate(run.executedAt) }}
            </td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <UAvatar
                  v-if="run.executedBy"
                  :alt="run.executedBy.name"
                  size="xs"
                />
                <span class="text-gray-700 dark:text-gray-300">
                  {{ run.executedBy?.name ?? 'Unknown' }}
                </span>
              </div>
            </td>
            <td class="py-2.5 px-3">
              <TestEnvironmentBadge :environment="run.environment" />
            </td>
            <td class="py-2.5 px-3">
              <TestStatusBadge :status="run.status" />
            </td>
            <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
              {{ formatDuration(run.duration) }}
            </td>
            <td class="py-2.5 px-3">
              <NuxtLink :to="`/projects/${projectId}/runs/${run.id}`">
                <UButton
                  icon="i-lucide-external-link"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  aria-label="View run"
                />
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
