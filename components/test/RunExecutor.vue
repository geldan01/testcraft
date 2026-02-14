<script setup lang="ts">
import type { TestCase, TestStep, TestRunStatus, Attachment } from '~/types'

const props = defineProps<{
  testCase: TestCase
  open: boolean
  projectId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  completed: []
  'saved-for-later': []
}>()

const { startTestRun, completeTestRun, deleteRun } = useTestRun()

const environment = ref('')
const status = ref<TestRunStatus>('NOT_RUN')
const notes = ref('')
const submitting = ref(false)

// Timer state
const isRunning = ref(false)
const runStartTime = ref<Date | null>(null)
const elapsedMs = ref(0)
const activeRunId = ref<string | null>(null)

// Attachments state
const uploadedAttachments = ref<Attachment[]>([])

// Close confirmation state
const showCloseConfirmation = ref(false)
const discarding = ref(false)

const statusOptions: Array<{ label: string; value: TestRunStatus }> = [
  { label: 'Pass', value: 'PASS' },
  { label: 'Fail', value: 'FAIL' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Skipped', value: 'SKIPPED' },
]

const steps = computed<TestStep[]>(() => {
  if (props.testCase.testType === 'STEP_BASED' && props.testCase.steps) {
    return props.testCase.steps
  }
  return []
})

const canStart = computed(() => {
  return environment.value && !isRunning.value && !activeRunId.value
})

const canComplete = computed(() => {
  return activeRunId.value && status.value !== 'NOT_RUN' && !submitting.value
})

async function handleStart() {
  if (!environment.value) return

  submitting.value = true
  try {
    const result = await startTestRun({
      testCaseId: props.testCase.id,
      environment: environment.value,
    })

    if (result) {
      activeRunId.value = result.id
      runStartTime.value = new Date()
      isRunning.value = true
    }
  } finally {
    submitting.value = false
  }
}

async function handleComplete() {
  if (!activeRunId.value || status.value === 'NOT_RUN') return

  isRunning.value = false
  submitting.value = true

  try {
    const completionStatus = status.value as 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED'
    const result = await completeTestRun(activeRunId.value, {
      status: completionStatus,
      notes: notes.value || undefined,
      duration: elapsedMs.value || undefined,
    })

    if (result) {
      emit('completed')
      emit('update:open', false)
      resetForm()
    }
  } finally {
    submitting.value = false
  }
}

function onTimerTick(elapsed: number) {
  elapsedMs.value = elapsed
}

function onAttachmentUploaded(attachment: Attachment) {
  uploadedAttachments.value.push(attachment)
}

function onAttachmentDeleted(id: string) {
  uploadedAttachments.value = uploadedAttachments.value.filter((a) => a.id !== id)
}

function resetForm() {
  environment.value = ''
  status.value = 'NOT_RUN'
  notes.value = ''
  isRunning.value = false
  runStartTime.value = null
  elapsedMs.value = 0
  activeRunId.value = null
  uploadedAttachments.value = []
  showCloseConfirmation.value = false
}

function closeModal() {
  if (activeRunId.value) {
    showCloseConfirmation.value = true
    return
  }
  emit('update:open', false)
  resetForm()
}

async function handleContinueLater() {
  const runId = activeRunId.value
  if (!runId) return
  isRunning.value = false
  resetForm()
  emit('update:open', false)
  await navigateTo(`/projects/${props.projectId}/test-runs/${runId}`)
}

async function handleDiscard() {
  if (!activeRunId.value) return
  discarding.value = true
  try {
    await deleteRun(activeRunId.value)
    showCloseConfirmation.value = false
    emit('update:open', false)
    emit('saved-for-later')
    resetForm()
  } finally {
    discarding.value = false
  }
}

function handleGoBack() {
  showCloseConfirmation.value = false
}
</script>

<template>
  <UModal
    :open="open"
    title="Execute Test Run"
    :description="`Running: ${testCase.name}`"
    data-testid="run-executor-modal"
    @update:open="closeModal"
  >
    <template #body>
      <!-- Close confirmation (active run exists) -->
      <div v-if="showCloseConfirmation" class="space-y-4 py-2">
        <div data-testid="run-executor-close-warning" class="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <UIcon name="i-lucide-alert-triangle" class="text-xl text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              Test run in progress
            </p>
            <p class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You have an active run that hasn't been completed yet.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <UButton
            block
            variant="outline"
            icon="i-lucide-external-link"
            data-testid="run-executor-continue-later-button"
            @click="handleContinueLater"
          >
            Continue Later
          </UButton>
          <UButton
            block
            variant="outline"
            color="error"
            icon="i-lucide-trash-2"
            :loading="discarding"
            data-testid="run-executor-discard-button"
            @click="handleDiscard"
          >
            Discard Run
          </UButton>
          <UButton
            block
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
            data-testid="run-executor-go-back-button"
            @click="handleGoBack"
          >
            Go Back to Run
          </UButton>
        </div>
      </div>

      <!-- Normal run execution UI -->
      <div v-else class="space-y-6">
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

        <!-- Timer display (visible once run is started) -->
        <div
          v-if="runStartTime"
          data-testid="run-executor-elapsed-time"
          class="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3"
        >
          <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">Elapsed Time</span>
          <TestRunTimer
            :start-time="runStartTime"
            :running="isRunning"
            @tick="onTimerTick"
          />
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
          <TestEnvironmentSelector
            v-model="environment"
            :disabled="!!activeRunId"
          />
        </UFormField>

        <!-- Status (visible after run is started) -->
        <UFormField v-if="activeRunId" label="Result Status" required>
          <select
            :value="status"
            data-testid="run-executor-status-select"
            class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            @change="status = ($event.target as HTMLSelectElement).value as TestRunStatus"
          >
            <option value="NOT_RUN" disabled>Select result...</option>
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </UFormField>

        <!-- Notes -->
        <UFormField label="Notes">
          <UTextarea
            v-model="notes"
            placeholder="Add any observations, defect references, or notes..."
            :rows="3"
            class="w-full"
            data-testid="run-executor-notes-textarea"
          />
        </UFormField>

        <!-- Attachments -->
        <UFormField label="Attachments">
          <div class="space-y-3">
            <AttachmentFileUploader
              :test-run-id="activeRunId ?? undefined"
              @uploaded="onAttachmentUploaded"
              @error="() => {}"
            />
            <AttachmentList
              v-if="uploadedAttachments.length > 0"
              :attachments="uploadedAttachments"
              can-delete
              @deleted="onAttachmentDeleted"
            />
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div v-if="!showCloseConfirmation" class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          color="neutral"
          data-testid="run-executor-cancel-button"
          @click="closeModal"
        >
          Cancel
        </UButton>

        <!-- Start button (before run is started) -->
        <UButton
          v-if="!activeRunId"
          :disabled="!canStart"
          :loading="submitting"
          icon="i-lucide-play"
          data-testid="run-executor-start-button"
          @click="handleStart"
        >
          Start Run
        </UButton>

        <!-- Complete button (after run is started) -->
        <UButton
          v-else
          :disabled="!canComplete"
          :loading="submitting"
          icon="i-lucide-check"
          data-testid="run-executor-complete-button"
          @click="handleComplete"
        >
          Complete Run
        </UButton>
      </div>
    </template>
  </UModal>
</template>
