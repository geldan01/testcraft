<script setup lang="ts">
import type { TestRunStatus } from '~/types'

interface FilterValues {
  status: string
  environment: string
  dateFrom: string
  dateTo: string
}

const props = defineProps<{
  projectId: string
  modelValue: FilterValues
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
}>()

const statusOptions: Array<{ label: string; value: string }> = [
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

const localFilters = ref<FilterValues>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    localFilters.value = { ...val }
  },
  { deep: true },
)

function emitUpdate() {
  emit('update:modelValue', { ...localFilters.value })
}

function updateStatus(value: string) {
  localFilters.value.status = value
  emitUpdate()
}

function updateEnvironment(value: string) {
  localFilters.value.environment = value
  emitUpdate()
}

function updateDateFrom(event: Event) {
  const target = event.target as HTMLInputElement
  localFilters.value.dateFrom = target.value
  emitUpdate()
}

function updateDateTo(event: Event) {
  const target = event.target as HTMLInputElement
  localFilters.value.dateTo = target.value
  emitUpdate()
}

function clearFilters() {
  localFilters.value = {
    status: 'all',
    environment: 'all',
    dateFrom: '',
    dateTo: '',
  }
  emitUpdate()
}

const hasActiveFilters = computed(() => {
  return (
    localFilters.value.status !== 'all' ||
    localFilters.value.environment !== 'all' ||
    localFilters.value.dateFrom !== '' ||
    localFilters.value.dateTo !== ''
  )
})
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <!-- Status filter -->
    <UFormField label="Status" class="min-w-40">
      <USelect
        :model-value="localFilters.status"
        :items="statusOptions"
        value-key="value"
        class="w-full"
        @update:model-value="updateStatus"
      />
    </UFormField>

    <!-- Environment filter -->
    <UFormField label="Environment" class="min-w-40">
      <USelect
        :model-value="localFilters.environment"
        :items="environmentOptions"
        value-key="value"
        class="w-full"
        @update:model-value="updateEnvironment"
      />
    </UFormField>

    <!-- Date from -->
    <UFormField label="From" data-testid="test-runs-date-from" class="min-w-37.5">
      <UInput
        type="date"
        :model-value="localFilters.dateFrom"
        class="w-full"
        @change="updateDateFrom"
      />
    </UFormField>

    <!-- Date to -->
    <UFormField label="To" data-testid="test-runs-date-to" class="min-w-37.5">
      <UInput
        type="date"
        :model-value="localFilters.dateTo"
        class="w-full"
        @change="updateDateTo"
      />
    </UFormField>

    <!-- Clear button -->
    <UButton
      v-if="hasActiveFilters"
      icon="i-lucide-x"
      variant="ghost"
      color="neutral"
      size="sm"
      class="mb-0.5"
      @click="clearFilters"
    >
      Clear Filters
    </UButton>
  </div>
</template>
