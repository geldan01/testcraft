<script setup lang="ts">
import type { ExecutionTrendResponse } from '~/types'

const props = defineProps<{
  data: ExecutionTrendResponse | null
  loading: boolean
}>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const chartOption = computed(() => {
  if (!props.data || props.data.trend.length === 0) return null

  const dates = props.data.trend.map(t => formatDate(t.date))
  const executed = props.data.trend.map(t => t.totalExecuted)
  const passRate = props.data.trend.map(t => t.passRate)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['Tests Executed', 'Pass Rate'],
      bottom: 0,
      textStyle: { color: '#9ca3af' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Executed',
        position: 'left',
        axisLabel: { color: '#9ca3af' },
        nameTextStyle: { color: '#9ca3af' },
      },
      {
        type: 'value',
        name: 'Pass Rate %',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: { color: '#9ca3af', formatter: '{value}%' },
        nameTextStyle: { color: '#9ca3af' },
      },
    ],
    series: [
      {
        name: 'Tests Executed',
        type: 'bar',
        data: executed,
        itemStyle: { color: '#6366f1' },
        yAxisIndex: 0,
      },
      {
        name: 'Pass Rate',
        type: 'line',
        data: passRate,
        smooth: true,
        itemStyle: { color: '#22c55e' },
        lineStyle: { width: 2 },
        yAxisIndex: 1,
      },
    ],
  }
})
</script>

<template>
  <UCard data-testid="reports-execution-trend">
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Execution Trend</h3>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-pulse space-y-3 w-full">
        <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!chartOption" class="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
      No execution data available
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
