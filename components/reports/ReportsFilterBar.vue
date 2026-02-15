<script setup lang="ts">
import type { ReportFilters, ReportTimeRange, ReportScope, TestPlan, TestSuite } from '~/types'

const props = defineProps<{
  modelValue: ReportFilters
  testPlans: TestPlan[]
  testSuites: TestSuite[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReportFilters]
}>()

const timeRangeOptions = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 3 days', value: '3d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'All time', value: 'all' },
  { label: 'Custom range', value: 'custom' },
]

const scopeOptions = [
  { label: 'All Test Cases', value: 'global' },
  { label: 'By Test Plan', value: 'test-plan' },
  { label: 'By Test Suite', value: 'test-suite' },
]

const entityOptions = computed(() => {
  if (props.modelValue.scope === 'test-plan') {
    return props.testPlans.map(p => ({ label: p.name, value: p.id }))
  }
  if (props.modelValue.scope === 'test-suite') {
    return props.testSuites.map(s => ({ label: s.name, value: s.id }))
  }
  return []
})

function update(partial: Partial<ReportFilters>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function onTimeRangeChange(value: string) {
  update({ timeRange: value as ReportTimeRange })
}

function onScopeChange(value: string) {
  update({ scope: value as ReportScope, scopeId: undefined })
}

function onScopeEntityChange(value: string) {
  update({ scopeId: value === 'all' ? undefined : value })
}
</script>

<template>
  <div data-testid="reports-filter-bar" class="flex flex-wrap items-end gap-4">
    <!-- Time Range -->
    <div class="w-44">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Time Range</label>
      <USelect
        data-testid="reports-time-range-select"
        :model-value="modelValue.timeRange"
        :items="timeRangeOptions"
        size="sm"
        @update:model-value="onTimeRangeChange"
      />
    </div>

    <!-- Custom Date From -->
    <div v-if="modelValue.timeRange === 'custom'" class="w-40">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
      <UInput
        data-testid="reports-date-from"
        type="date"
        size="sm"
        :model-value="modelValue.dateFrom ?? ''"
        @update:model-value="(v: string) => update({ dateFrom: v || undefined })"
      />
    </div>

    <!-- Custom Date To -->
    <div v-if="modelValue.timeRange === 'custom'" class="w-40">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
      <UInput
        data-testid="reports-date-to"
        type="date"
        size="sm"
        :model-value="modelValue.dateTo ?? ''"
        @update:model-value="(v: string) => update({ dateTo: v || undefined })"
      />
    </div>

    <!-- Scope -->
    <div class="w-44">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Scope</label>
      <USelect
        data-testid="reports-scope-select"
        :model-value="modelValue.scope"
        :items="scopeOptions"
        size="sm"
        @update:model-value="onScopeChange"
      />
    </div>

    <!-- Scope Entity (Test Plan or Test Suite) -->
    <div v-if="modelValue.scope !== 'global' && entityOptions.length > 0" class="w-52">
      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {{ modelValue.scope === 'test-plan' ? 'Test Plan' : 'Test Suite' }}
      </label>
      <USelect
        data-testid="reports-scope-entity-select"
        :model-value="modelValue.scopeId ?? 'all'"
        :items="[{ label: 'Select...', value: 'all' }, ...entityOptions]"
        size="sm"
        @update:model-value="onScopeEntityChange"
      />
    </div>
  </div>
</template>
