<script setup lang="ts">
import type { StatusBreakdownResponse } from '~/types'

const props = defineProps<{
  data: StatusBreakdownResponse | null
  loading: boolean
}>()

const statusColors: Record<string, string> = {
  PASS: '#22c55e',
  FAIL: '#ef4444',
  BLOCKED: '#f59e0b',
  SKIPPED: '#94a3b8',
  NOT_RUN: '#64748b',
}

const statusLabels: Record<string, string> = {
  PASS: 'Pass',
  FAIL: 'Fail',
  BLOCKED: 'Blocked',
  SKIPPED: 'Skipped',
  NOT_RUN: 'Not Run',
}

const chartOption = computed(() => {
  if (!props.data || props.data.breakdown.length === 0) return null

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        color: '#9ca3af',
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '80%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { show: false },
        data: props.data.breakdown.map(s => ({
          name: statusLabels[s.status] ?? s.status,
          value: s.count,
          itemStyle: { color: statusColors[s.status] ?? '#6b7280' },
        })),
      },
    ],
  }
})
</script>

<template>
  <UCard data-testid="reports-status-breakdown">
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Pass/Fail Breakdown</h3>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-pulse space-y-3 w-full">
        <div class="h-40 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto w-40" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!chartOption" class="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      No test run data available
    </div>

    <!-- Chart -->
    <ClientOnly v-else>
      <VChart
        ref="chart"
        :option="chartOption"
        autoresize
        style="height: 256px; width: 100%"
      />
    </ClientOnly>
  </UCard>
</template>
