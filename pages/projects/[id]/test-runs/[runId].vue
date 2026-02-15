<script setup lang="ts">
import type { TestRun, Comment, Attachment } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const runId = computed(() => route.params.runId as string)

const { getRun, completeTestRun, deleteRun } = useTestRun()
const authStore = useAuthStore()
const toast = useToast()

const run = ref<TestRun | null>(null)
const loading = ref(true)

// Completion form state
const isInProgress = computed(() => run.value?.status === 'IN_PROGRESS')
const isOwner = computed(() => {
  const userId = authStore.currentUser?.id
  if (!userId) return false
  return run.value?.executedById === userId || run.value?.executedBy?.id === userId
})
const canComplete = computed(() => isInProgress.value && isOwner.value)

const completionStatus = ref<'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | ''>('')
const completionNotes = ref('')
const submitting = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function loadData() {
  loading.value = true
  try {
    run.value = await getRun(runId.value)
    if (run.value) {
      useSeoMeta({ title: `Run - ${run.value.testCase?.name ?? 'Test Run'}` })
      if (run.value.notes) {
        completionNotes.value = run.value.notes
      }
    }
  } finally {
    loading.value = false
  }
}

await loadData()

async function handleComplete() {
  if (!completionStatus.value || !run.value) return
  submitting.value = true
  try {
    const result = await completeTestRun(run.value.id, {
      status: completionStatus.value,
      notes: completionNotes.value || undefined,
    })
    if (result) {
      toast.add({ title: 'Run completed', color: 'success' })
      await loadData()
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!run.value) return
  deleting.value = true
  try {
    const success = await deleteRun(run.value.id)
    if (success) {
      toast.add({ title: 'Run discarded', color: 'success' })
      await navigateTo(`/projects/${projectId.value}/runs`)
    }
  } finally {
    deleting.value = false
  }
}

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: 'Projects', to: '/organizations' },
  { label: 'Runs', to: `/projects/${projectId.value}/runs` },
  { label: run.value?.testCase?.name ?? 'Test Run' },
])

// Helpers
function formatDuration(seconds: number | null): string {
  if (!seconds) return '--'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainMins = mins % 60
  return `${hours}h ${remainMins}m`
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return 'just now'
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`
  return `${Math.floor(diffMonths / 12)}y ago`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div class="h-60 bg-gray-200 dark:bg-gray-700 rounded" />
      <div class="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>

    <template v-else-if="run">
      <!-- Breadcrumb -->
      <UBreadcrumb data-testid="test-run-detail-breadcrumb" :items="breadcrumbItems" />

      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Test Run
            </h1>
            <TestStatusBadge :status="run.status" />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Executed {{ formatRelativeTime(run.executedAt) }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            data-testid="test-run-detail-back-button"
            icon="i-lucide-arrow-left"
            variant="outline"
            color="neutral"
            size="sm"
            @click="navigateTo(`/projects/${projectId}/runs`)"
          >
            Back to Runs
          </UButton>
        </div>
      </div>

      <!-- Complete Run Card (only for IN_PROGRESS runs owned by current user) -->
      <UCard v-if="canComplete">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-play-circle" class="text-amber-600 dark:text-amber-400" />
            <h3 class="text-sm font-semibold text-black dark:text-white">Complete This Run</h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            This test run is still in progress. Select a result status to complete it.
          </p>

          <UFormField label="Result Status" required>
            <select
              v-model="completionStatus"
              data-testid="test-run-detail-completion-status"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="" disabled>Select result...</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="BLOCKED">Blocked</option>
              <option value="SKIPPED">Skipped</option>
            </select>
          </UFormField>

          <UFormField label="Notes">
            <UTextarea
              v-model="completionNotes"
              data-testid="test-run-detail-completion-notes"
              placeholder="Add any observations, defect references, or notes..."
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center gap-3">
            <UButton
              data-testid="test-run-detail-complete-button"
              :disabled="!completionStatus || submitting"
              :loading="submitting"
              icon="i-lucide-check"
              @click="handleComplete"
            >
              Complete Run
            </UButton>
            <UButton
              v-if="!showDeleteConfirm"
              data-testid="test-run-detail-discard-button"
              variant="outline"
              color="error"
              size="sm"
              icon="i-lucide-trash-2"
              @click="showDeleteConfirm = true"
            >
              Discard Run
            </UButton>
            <template v-else>
              <span class="text-sm text-gray-500">Are you sure?</span>
              <UButton
                data-testid="test-run-detail-confirm-discard"
                color="error"
                size="sm"
                :loading="deleting"
                @click="handleDelete"
              >
                Yes, discard
              </UButton>
              <UButton
                data-testid="test-run-detail-cancel-discard"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showDeleteConfirm = false"
              >
                Cancel
              </UButton>
            </template>
          </div>
        </div>
      </UCard>

      <!-- Info banner for IN_PROGRESS runs not owned by current user -->
      <div
        v-else-if="isInProgress && !isOwner"
        data-testid="test-run-detail-in-progress-banner"
        class="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2"
      >
        <UIcon name="i-lucide-info" class="text-amber-600 dark:text-amber-400 shrink-0" />
        <p class="text-sm text-amber-700 dark:text-amber-300">
          This run is in progress. Only {{ run?.executedBy?.name ?? 'the original executor' }} can complete it.
        </p>
      </div>

      <!-- Card 1: Run Info -->
      <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 data-testid="test-run-detail-info-heading" class="text-sm font-semibold text-black dark:text-white">Run Information</h3>
        </template>

        <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <!-- Status -->
          <div data-testid="test-run-detail-status">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Status</dt>
            <dd>
              <TestStatusBadge :status="run.status" />
            </dd>
          </div>

          <!-- Environment -->
          <div data-testid="test-run-detail-environment">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Environment</dt>
            <dd>
              <TestEnvironmentBadge :environment="run.environment" />
            </dd>
          </div>

          <!-- Duration -->
          <div data-testid="test-run-detail-duration">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Duration</dt>
            <dd class="text-gray-900 dark:text-white font-medium">
              {{ formatDuration(run.duration) }}
            </dd>
          </div>

          <!-- Executed By -->
          <div data-testid="test-run-detail-executed-by">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Executed By</dt>
            <dd class="flex items-center gap-2">
              <UAvatar
                :text="run.executedBy?.name?.charAt(0) ?? '?'"
                :src="run.executedBy?.avatarUrl ?? undefined"
                size="xs"
              />
              <span class="text-gray-900 dark:text-white font-medium">
                {{ run.executedBy?.name ?? 'Unknown' }}
              </span>
            </dd>
          </div>

          <!-- Executed At -->
          <div data-testid="test-run-detail-date">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Date</dt>
            <dd class="text-gray-900 dark:text-white font-medium">
              {{ formatDateTime(run.executedAt) }}
            </dd>
          </div>

          <!-- Notes -->
          <div v-if="run.notes" data-testid="test-run-detail-notes" class="sm:col-span-2 lg:col-span-3">
            <dt class="text-gray-500 dark:text-gray-400 mb-1">Notes</dt>
            <dd class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              {{ run.notes }}
            </dd>
          </div>
        </dl>
      </UCard>

      <!-- Card 2: Test Case Info -->
      <UCard v-if="run.testCase" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 data-testid="test-run-detail-test-case-heading" class="text-sm font-semibold text-black dark:text-white">Test Case</h3>
            <NuxtLink
              data-testid="test-run-detail-view-full-details"
              :to="`/projects/${projectId}/test-cases/${run.testCaseId}`"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Full Details
            </NuxtLink>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Test case name and type -->
          <div class="flex items-center gap-3 flex-wrap">
            <NuxtLink
              data-testid="test-run-detail-test-case-name"
              :to="`/projects/${projectId}/test-cases/${run.testCaseId}`"
              class="text-base font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {{ run.testCase.name }}
            </NuxtLink>
            <UBadge
              :color="run.testCase.testType === 'STEP_BASED' ? 'primary' : 'info'"
              variant="subtle"
              size="sm"
            >
              {{ run.testCase.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
            </UBadge>
          </div>

          <p v-if="run.testCase.description" class="text-sm text-gray-500 dark:text-gray-400">
            {{ run.testCase.description }}
          </p>

          <!-- Steps table for step-based tests -->
          <div v-if="run.testCase.testType === 'STEP_BASED' && run.testCase.steps && run.testCase.steps.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-12">#</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Test Data</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Expected Result</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="step in run.testCase.steps"
                  :key="step.stepNumber"
                  class="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td class="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                    {{ step.stepNumber }}
                  </td>
                  <td class="py-2 px-3 text-gray-900 dark:text-white">{{ step.action }}</td>
                  <td class="py-2 px-3 text-gray-600 dark:text-gray-400">{{ step.data || '--' }}</td>
                  <td class="py-2 px-3 text-gray-600 dark:text-gray-400">{{ step.expectedResult }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Gherkin display -->
          <pre
            v-if="run.testCase.testType === 'GHERKIN' && run.testCase.gherkinSyntax"
            class="font-mono text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
          >{{ run.testCase.gherkinSyntax }}</pre>
        </div>
      </UCard>

      <!-- Card 3: Attachments -->
      <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 data-testid="test-run-detail-attachments-heading" class="text-sm font-semibold text-black dark:text-white">Attachments</h3>
        </template>

        <div class="space-y-4">
          <AttachmentFileUploader :test-run-id="run.id" :test-case-id="run.testCaseId" />
          <AttachmentList
            v-if="run.attachments && run.attachments.length > 0"
            :attachments="run.attachments"
            :can-delete="true"
          />
          <p v-else data-testid="test-run-detail-no-attachments" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No attachments yet. Upload files above.
          </p>
        </div>
      </UCard>

      <!-- Card 4: Comments placeholder -->
      <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 data-testid="test-run-detail-comments-heading" class="text-sm font-semibold text-black dark:text-white">Comments</h3>
        </template>
        <p data-testid="test-run-detail-comments-coming-soon" class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Comments for test runs coming soon.
        </p>
      </UCard>
    </template>

    <!-- Not found -->
    <div v-else data-testid="test-run-detail-not-found" class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Test Run not found</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        The test run you're looking for doesn't exist or has been deleted.
      </p>
      <UButton
        data-testid="test-run-detail-not-found-back-button"
        class="mt-4"
        variant="outline"
        @click="navigateTo(`/projects/${projectId}/runs`)"
      >
        Back to Runs
      </UButton>
    </div>
  </div>
</template>
