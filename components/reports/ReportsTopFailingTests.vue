<script setup lang="ts">
import type { TopFailingTest, TopFailingTestResponse } from '~/types'

defineProps<{
  data: TopFailingTestResponse | null
  loading: boolean
  projectId: string
}>()

function getFailRateColor(rate: number): string {
  if (rate > 50) return 'error'
  if (rate > 25) return 'warning'
  return 'neutral'
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const columns = [
  { accessorKey: 'testCaseName', header: 'Test Case' },
  { accessorKey: 'failCount', header: 'Fails' },
  { accessorKey: 'totalRuns', header: 'Runs' },
  { accessorKey: 'failRate', header: 'Fail Rate' },
  { accessorKey: 'debugFlag', header: 'Debug' },
  { accessorKey: 'lastFailedAt', header: 'Last Failed' },
]
</script>

<template>
  <UCard data-testid="reports-top-failing-tests">
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Top Failing Tests</h3>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="!data || data.tests.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      No failing tests in this time range.
    </div>

    <!-- Table -->
    <UTable
      v-else
      :columns="columns"
      :data="data.tests"
    >
      <template #testCaseName-cell="{ row }">
        <NuxtLink
          :to="`/projects/${projectId}/test-cases/${(row.original as TopFailingTest).testCaseId}`"
          class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          {{ (row.original as TopFailingTest).testCaseName }}
        </NuxtLink>
      </template>

      <template #failRate-cell="{ row }">
        <UBadge :color="getFailRateColor((row.original as TopFailingTest).failRate)" variant="subtle" size="xs">
          {{ (row.original as TopFailingTest).failRate }}%
        </UBadge>
      </template>

      <template #debugFlag-cell="{ row }">
        <UIcon
          v-if="(row.original as TopFailingTest).debugFlag"
          name="i-lucide-bug"
          class="text-red-500"
        />
      </template>

      <template #lastFailedAt-cell="{ row }">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatRelativeTime((row.original as TopFailingTest).lastFailedAt) }}
        </span>
      </template>
    </UTable>
  </UCard>
</template>
