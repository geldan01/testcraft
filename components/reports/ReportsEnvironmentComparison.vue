<script setup lang="ts">
import type { EnvironmentComparisonResponse } from '~/types'

const props = defineProps<{
  data: EnvironmentComparisonResponse | null
  loading: boolean
}>()

function getBarColor(passRate: number): string {
  if (passRate >= 80) return '#22c55e'  // green
  if (passRate >= 60) return '#f59e0b'  // amber
  return '#ef4444'  // red
}

const chartOption = computed(() => {
  if (!props.data || props.data.environments.length === 0) return null

  const envNames = props.data.environments.map(e => e.environment)
  const passRates = props.data.environments.map(e => e.passRate)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number; dataIndex: number }[]) => {
        const p = params[0]
        const env = props.data!.environments[p.dataIndex]
        return `<strong>${p.name}</strong><br/>Pass Rate: ${p.value}%<br/>Total Runs: ${env.totalRuns}<br/>Pass: ${env.passCount} | Fail: ${env.failCount}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: envNames,
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      name: 'Pass Rate %',
      min: 0,
      max: 100,
      axisLabel: { color: '#9ca3af', formatter: '{value}%' },
      nameTextStyle: { color: '#9ca3af' },
    },
    series: [
      {
        type: 'bar',
        data: passRates.map(r => ({
          value: r,
          itemStyle: { color: getBarColor(r) },
        })),
        barMaxWidth: 60,
      },
    ],
  }
})
</script>

<template>
  <UCard data-testid="reports-environment-comparison">
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Environment Comparison</h3>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-pulse space-y-3 w-full">
        <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!chartOption" class="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      No environment data available
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
