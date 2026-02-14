<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    projectId?: string
    disabled?: boolean
  }>(),
  {
    projectId: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const predefinedEnvironments = [
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
  { label: 'QA', value: 'qa' },
  { label: 'Custom...', value: '__custom__' },
]

const showCustomInput = ref(false)
const customValue = ref('')

const selected = computed({
  get: () => props.modelValue,
  set: (val: string) => {
    if (val === '__custom__') {
      showCustomInput.value = true
      return
    }
    showCustomInput.value = false
    emit('update:modelValue', val)
  },
})

function submitCustom() {
  if (customValue.value.trim()) {
    emit('update:modelValue', customValue.value.trim().toLowerCase())
    showCustomInput.value = false
    customValue.value = ''
  }
}

function cancelCustom() {
  showCustomInput.value = false
  customValue.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <select
      v-if="!showCustomInput"
      :value="selected"
      :disabled="disabled"
      data-testid="run-executor-environment-select"
      class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      @change="selected = ($event.target as HTMLSelectElement).value"
    >
      <option value="" disabled>Select environment...</option>
      <option
        v-for="env in predefinedEnvironments"
        :key="env.value"
        :value="env.value"
      >
        {{ env.label }}
      </option>
    </select>

    <div v-else class="flex gap-2">
      <UInput
        v-model="customValue"
        placeholder="Enter custom environment..."
        class="flex-1"
        autofocus
        @keyup.enter="submitCustom"
        @keyup.escape="cancelCustom"
      />
      <UButton
        size="sm"
        :disabled="!customValue.trim()"
        @click="submitCustom"
      >
        Set
      </UButton>
      <UButton
        size="sm"
        variant="ghost"
        color="neutral"
        @click="cancelCustom"
      >
        Cancel
      </UButton>
    </div>
  </div>
</template>
