<script setup lang="ts">
import type { TestCase, TestStep, TestRunStatus, CreateTestRunInput } from '~/types'

const props = defineProps<{
  testCase: TestCase
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  completed: []
}>()

const { startRun } = useTestRun()

const environment = ref('')
const status = ref<TestRunStatus>('NOT_RUN')
const notes = ref('')
const submitting = ref(false)

const environments = [
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
  { label: 'QA', value: 'qa' },
]

const statusOptions: Array<{ label: string; value: TestRunStatus }> = [
  { label: 'Pass', value: 'PASS' },
  { label: 'Fail', value: 'FAIL' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
]

const steps = computed<TestStep[]>(() => {
  if (props.testCase.testType === 'STEP_BASED' && props.testCase.steps) {
    return props.testCase.steps
  }
  return []
})

const isValid = computed(() => {
  return environment.value && status.value !== 'NOT_RUN'
})

async function submitRun() {
  if (!isValid.value) return

  submitting.value = true
  try {
    const data: CreateTestRunInput = {
      testCaseId: props.testCase.id,
      environment: environment.value,
      status: status.value,
      notes: notes.value || undefined,
    }

    const result = await startRun(data)
    if (result) {
      emit('completed')
      emit('update:open', false)
      resetForm()
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  environment.value = ''
  status.value = 'NOT_RUN'
  notes.value = ''
}

function closeModal() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <UModal
    :open="open"
    title="Execute Test Run"
    :description="`Running: ${testCase.name}`"
    @update:open="closeModal"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Test case info -->
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {{ testCase.name }}
          </h4>
          <p v-if="testCase.description" class="text-sm text-gray-600 dark:text-gray-400">
            {{ testCase.description }}
          </p>
          <UBadge
            :color="testCase.testType === 'STEP_BASED' ? 'primary' : 'info'"
            size="xs"
            variant="subtle"
            class="mt-2"
          >
            {{ testCase.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
          </UBadge>
        </div>

        <!-- Test steps display (for step-based tests) -->
        <div v-if="steps.length > 0" class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Steps to Execute</h4>
          <div
            v-for="step in steps"
            :key="step.stepNumber"
            class="flex gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0">
              {{ step.stepNumber }}.
            </span>
            <div class="flex-1 text-sm">
              <p class="text-gray-900 dark:text-white">{{ step.action }}</p>
              <p v-if="step.data" class="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                Data: {{ step.data }}
              </p>
              <p class="text-green-600 dark:text-green-400 text-xs mt-0.5">
                Expected: {{ step.expectedResult }}
              </p>
            </div>
          </div>
        </div>

        <!-- Gherkin display -->
        <div v-if="testCase.testType === 'GHERKIN' && testCase.gherkinSyntax">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Gherkin Scenario</h4>
          <pre class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ testCase.gherkinSyntax }}</pre>
        </div>

        <!-- Environment -->
        <UFormField label="Environment" required>
          <USelect
            v-model="environment"
            :items="environments"
            placeholder="Select environment..."
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <!-- Status -->
        <UFormField label="Result Status" required>
          <USelect
            v-model="status"
            :items="statusOptions"
            placeholder="Select result..."
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <!-- Notes -->
        <UFormField label="Notes">
          <UTextarea
            v-model="notes"
            placeholder="Add any observations, defect references, or notes..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Attachments placeholder -->
        <UFormField label="Attachments">
          <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <UIcon name="i-lucide-upload" class="text-2xl text-gray-400 dark:text-gray-400 mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Drag and drop files here, or click to upload
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-400 mt-1">
              Screenshots, logs, or other evidence
            </p>
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          @click="closeModal"
        >
          Cancel
        </UButton>
        <UButton
          :disabled="!isValid"
          :loading="submitting"
          @click="submitRun"
        >
          Submit Result
        </UButton>
      </div>
    </template>
  </UModal>
</template>
