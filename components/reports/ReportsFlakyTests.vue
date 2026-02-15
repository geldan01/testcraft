<script setup lang="ts">
import type { FlakyTest, FlakyTestResponse } from '~/types'

defineProps<{
  data: FlakyTestResponse | null
  loading: boolean
  projectId: string
}>()

function getScoreColor(score: number): string {
  if (score > 50) return 'error'
  if (score > 25) return 'warning'
  return 'success'
}

const columns = [
  { accessorKey: 'testCaseName', header: 'Test Case' },
  { accessorKey: 'totalRuns', header: 'Runs' },
  { accessorKey: 'passCount', header: 'Pass' },
  { accessorKey: 'failCount', header: 'Fail' },
  { accessorKey: 'flakinessScore', header: 'Flakiness' },
  { accessorKey: 'debugFlag', header: 'Debug' },
]
</script>

<template>
  <UCard data-testid="reports-flaky-tests">
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Flaky Tests</h3>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>

    <!-- Empty -->
    <div v-else-if="!data || data.tests.length === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      No flaky tests detected in this time range.
    </div>

    <!-- Table -->
    <UTable
      v-else
      :columns="columns"
      :data="data.tests"
    >
      <template #testCaseName-cell="{ row }">
        <NuxtLink
          :to="`/projects/${projectId}/test-cases/${(row.original as FlakyTest).testCaseId}`"
          class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          {{ (row.original as FlakyTest).testCaseName }}
        </NuxtLink>
      </template>

      <template #flakinessScore-cell="{ row }">
        <UBadge :color="getScoreColor((row.original as FlakyTest).flakinessScore)" variant="subtle" size="xs">
          {{ (row.original as FlakyTest).flakinessScore }}%
        </UBadge>
      </template>

      <template #debugFlag-cell="{ row }">
        <UIcon
          v-if="(row.original as FlakyTest).debugFlag"
          name="i-lucide-bug"
          class="text-red-500"
        />
      </template>
    </UTable>
  </UCard>
</template>
