<script setup lang="ts">
import type { TestStep } from '~/types'

const props = defineProps<{
  modelValue: TestStep[]
}>()

const emit = defineEmits<{
  'update:modelValue': [steps: TestStep[]]
}>()

const steps = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function addStep() {
  const newStep: TestStep = {
    stepNumber: steps.value.length + 1,
    action: '',
    data: '',
    expectedResult: '',
  }
  steps.value = [...steps.value, newStep]
}

function removeStep(index: number) {
  const updated = steps.value.filter((_, i) => i !== index)
  // Re-number steps
  steps.value = updated.map((step, i) => ({
    ...step,
    stepNumber: i + 1,
  }))
}

function moveStep(index: number, direction: 'up' | 'down') {
  const newSteps = [...steps.value]
  const targetIndex = direction === 'up' ? index - 1 : index + 1

  if (targetIndex < 0 || targetIndex >= newSteps.length) return

  const temp = newSteps[targetIndex]
  newSteps[targetIndex] = newSteps[index]
  newSteps[index] = temp

  // Re-number steps
  steps.value = newSteps.map((step, i) => ({
    ...step,
    stepNumber: i + 1,
  }))
}

function updateStep(index: number, field: keyof TestStep, value: string) {
  const updated = [...steps.value]
  updated[index] = { ...updated[index], [field]: value }
  steps.value = updated
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Test Steps
      </h3>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        variant="soft"
        @click="addStep"
      >
        Add Step
      </UButton>
    </div>

    <!-- Empty state -->
    <div
      v-if="steps.length === 0"
      class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center"
    >
      <UIcon name="i-lucide-list-plus" class="text-3xl text-gray-400 dark:text-gray-400 mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No test steps yet. Click "Add Step" to get started.
      </p>
    </div>

    <!-- Steps list -->
    <div v-else class="space-y-3">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      >
        <div class="flex items-start gap-3">
          <!-- Step number -->
          <div
            class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0 mt-1"
          >
            {{ step.stepNumber }}
          </div>

          <!-- Step fields -->
          <div class="flex-1 space-y-3">
            <UFormField label="Action" required>
              <UTextarea
                :model-value="step.action"
                placeholder="Describe the action to perform..."
                :rows="2"
                autoresize
                class="w-full"
                @update:model-value="updateStep(index, 'action', $event)"
              />
            </UFormField>

            <UFormField label="Test Data">
              <UInput
                :model-value="step.data"
                placeholder="Input data for this step (optional)"
                class="w-full"
                @update:model-value="updateStep(index, 'data', $event)"
              />
            </UFormField>

            <UFormField label="Expected Result" required>
              <UTextarea
                :model-value="step.expectedResult"
                placeholder="What should happen after this step..."
                :rows="2"
                autoresize
                class="w-full"
                @update:model-value="updateStep(index, 'expectedResult', $event)"
              />
            </UFormField>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-up"
              variant="ghost"
              color="neutral"
              size="xs"
              :disabled="index === 0"
              aria-label="Move step up"
              @click="moveStep(index, 'up')"
            />
            <UButton
              icon="i-lucide-chevron-down"
              variant="ghost"
              color="neutral"
              size="xs"
              :disabled="index === steps.length - 1"
              aria-label="Move step down"
              @click="moveStep(index, 'down')"
            />
            <UButton
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              aria-label="Remove step"
              @click="removeStep(index)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
