<script setup lang="ts">
import type { TestCase, TestPlan, TestSuite, TestRun, Comment, Attachment } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const caseId = computed(() => route.params.caseId as string)

const { getTestCase, toggleDebugFlag, getComments, addComment, getAttachments } = useTestCase()
const { getRunsForTestCase } = useTestRun()
const { getTestPlans, linkTestCase: linkToPlan, unlinkTestCase: unlinkFromPlan } = useTestPlan()
const { getTestSuites, linkTestCase: linkToSuite, unlinkTestCase: unlinkFromSuite } = useTestSuite()

const testCase = ref<TestCase | null>(null)
const runs = ref<TestRun[]>([])
const comments = ref<Comment[]>([])
const attachments = ref<Attachment[]>([])
const loading = ref(true)
const showRunExecutor = ref(false)
const newComment = ref('')
const submittingComment = ref(false)

// Test plans modal
const showAddPlansModal = ref(false)
const availablePlans = ref<TestPlan[]>([])
const selectedPlanIds = ref<Set<string>>(new Set())
const planSearchQuery = ref('')
const loadingPlans = ref(false)
const linkingPlans = ref(false)

// Test suites modal
const showAddSuitesModal = ref(false)
const availableSuites = ref<TestSuite[]>([])
const selectedSuiteIds = ref<Set<string>>(new Set())
const suiteSearchQuery = ref('')
const loadingSuites = ref(false)
const linkingSuites = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [tc, runsData, commentsData, attachmentsData] = await Promise.all([
      getTestCase(caseId.value),
      getRunsForTestCase(caseId.value),
      getComments(caseId.value),
      getAttachments(caseId.value),
    ])
    testCase.value = tc
    runs.value = runsData
    comments.value = commentsData
    attachments.value = attachmentsData

    if (tc) {
      useSeoMeta({ title: tc.name })
    }
  } finally {
    loading.value = false
  }
}

await loadData()

// Linked plans & suites
const linkedPlans = computed(() =>
  testCase.value?.testPlans?.map((tp) => tp.testPlan).filter(Boolean) as TestPlan[] ?? [],
)
const linkedSuites = computed(() =>
  testCase.value?.testSuites?.map((ts) => ts.testSuite).filter(Boolean) as TestSuite[] ?? [],
)

const linkedPlanIds = computed(() => new Set(linkedPlans.value.map((p) => p.id)))
const linkedSuiteIds = computed(() => new Set(linkedSuites.value.map((s) => s.id)))

const filteredAvailablePlans = computed(() => {
  if (!planSearchQuery.value.trim()) return availablePlans.value
  const q = planSearchQuery.value.toLowerCase()
  return availablePlans.value.filter((p) => p.name.toLowerCase().includes(q))
})

const filteredAvailableSuites = computed(() => {
  if (!suiteSearchQuery.value.trim()) return availableSuites.value
  const q = suiteSearchQuery.value.toLowerCase()
  return availableSuites.value.filter((s) => s.name.toLowerCase().includes(q))
})

// Test plans actions
async function openAddPlansModal() {
  showAddPlansModal.value = true
  selectedPlanIds.value = new Set()
  planSearchQuery.value = ''
  loadingPlans.value = true
  try {
    const result = await getTestPlans(projectId.value, 1, 200)
    availablePlans.value = result.data.filter((p) => !linkedPlanIds.value.has(p.id))
  } finally {
    loadingPlans.value = false
  }
}

function togglePlan(planId: string) {
  const next = new Set(selectedPlanIds.value)
  if (next.has(planId)) next.delete(planId)
  else next.add(planId)
  selectedPlanIds.value = next
}

async function handleLinkPlans() {
  if (selectedPlanIds.value.size === 0) return
  linkingPlans.value = true
  try {
    await Promise.all([...selectedPlanIds.value].map((planId) => linkToPlan(planId, caseId.value)))
    showAddPlansModal.value = false
    await loadData()
  } finally {
    linkingPlans.value = false
  }
}

async function handleUnlinkPlan(planId: string) {
  const success = await unlinkFromPlan(planId, caseId.value)
  if (success) await loadData()
}

// Test suites actions
async function openAddSuitesModal() {
  showAddSuitesModal.value = true
  selectedSuiteIds.value = new Set()
  suiteSearchQuery.value = ''
  loadingSuites.value = true
  try {
    const result = await getTestSuites(projectId.value, 1, 200)
    availableSuites.value = result.data.filter((s) => !linkedSuiteIds.value.has(s.id))
  } finally {
    loadingSuites.value = false
  }
}

function toggleSuite(suiteId: string) {
  const next = new Set(selectedSuiteIds.value)
  if (next.has(suiteId)) next.delete(suiteId)
  else next.add(suiteId)
  selectedSuiteIds.value = next
}

async function handleLinkSuites() {
  if (selectedSuiteIds.value.size === 0) return
  linkingSuites.value = true
  try {
    await Promise.all([...selectedSuiteIds.value].map((suiteId) => linkToSuite(suiteId, caseId.value)))
    showAddSuitesModal.value = false
    await loadData()
  } finally {
    linkingSuites.value = false
  }
}

async function handleUnlinkSuite(suiteId: string) {
  const success = await unlinkFromSuite(suiteId, caseId.value)
  if (success) await loadData()
}

async function handleToggleDebug() {
  if (!testCase.value) return
  const result = await toggleDebugFlag(caseId.value)
  if (result) {
    testCase.value = result
  }
}

async function handleAddComment() {
  if (!newComment.value.trim()) return

  submittingComment.value = true
  try {
    const comment = await addComment({
      content: newComment.value,
      commentableType: 'TEST_CASE',
      commentableId: caseId.value,
    })
    if (comment) {
      comments.value.unshift(comment)
      newComment.value = ''
    }
  } finally {
    submittingComment.value = false
  }
}

async function handleRunCompleted() {
  await loadData()
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--'
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
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

const recentRuns = computed(() => runs.value.slice(0, 5))
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div class="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>

    <template v-else-if="testCase">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ testCase.name }}
            </h1>
            <TestStatusBadge :status="testCase.lastRunStatus" data-testid="test-case-detail-status" />
            <UBadge
              :color="testCase.testType === 'STEP_BASED' ? 'primary' : 'info'"
              variant="subtle"
              size="sm"
              data-testid="test-case-detail-type-badge"
            >
              {{ testCase.testType === 'STEP_BASED' ? 'Step-Based' : 'Gherkin' }}
            </UBadge>
          </div>
          <p v-if="testCase.description" class="text-sm text-gray-500 dark:text-gray-400">
            {{ testCase.description }}
          </p>
          <div class="flex items-center gap-3 flex-wrap text-xs text-gray-400 dark:text-gray-400">
            <span>
              Created by {{ testCase.createdBy?.name ?? 'Unknown' }} on
              {{ new Date(testCase.createdAt).toLocaleDateString() }}
            </span>
            <span v-if="testCase.lastRunAt" class="flex items-center gap-1">
              <UIcon name="i-lucide-clock" class="text-sm" />
              Last run: {{ formatRelativeTime(testCase.lastRunAt) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <TestDebugFlagToggle
            :debug-flag="testCase.debugFlag"
            :debug-flagged-by="testCase.debugFlaggedBy"
            :debug-flagged-at="testCase.debugFlaggedAt"
            @toggle="handleToggleDebug"
          />
          <UButton
            icon="i-lucide-play"
            data-testid="test-case-detail-run-test-button"
            @click="showRunExecutor = true"
          >
            Run Test
          </UButton>
          <UButton
            icon="i-lucide-pencil"
            variant="outline"
            color="neutral"
            size="sm"
            data-testid="test-case-detail-edit-button"
          >
            Edit
          </UButton>
        </div>
      </div>

      <!-- Preconditions -->
      <UCard v-if="testCase.preconditions && testCase.preconditions.length > 0" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 class="text-sm font-semibold text-black dark:text-white">Preconditions</h3>
        </template>
        <ul class="space-y-1">
          <li
            v-for="(precondition, index) in testCase.preconditions"
            :key="index"
            class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <UIcon name="i-lucide-check-square" class="text-green-500 mt-0.5 shrink-0" />
            {{ precondition }}
          </li>
        </ul>
      </UCard>

      <!-- Test Steps (Step-Based) -->
      <UCard v-if="testCase.testType === 'STEP_BASED' && testCase.steps && testCase.steps.length > 0" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 class="text-sm font-semibold text-black dark:text-white" data-testid="test-case-detail-steps-heading">
            Test Steps ({{ testCase.steps.length }})
          </h3>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm" data-testid="test-case-detail-steps-table">
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
                v-for="step in testCase.steps"
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
      </UCard>

      <!-- Gherkin Syntax -->
      <UCard v-if="testCase.testType === 'GHERKIN' && testCase.gherkinSyntax" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 class="text-sm font-semibold text-black dark:text-white">Gherkin Syntax</h3>
        </template>
        <pre class="font-mono text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">{{ testCase.gherkinSyntax }}</pre>
      </UCard>

      <!-- Linked Test Plans & Suites -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Test Plans -->
        <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-black dark:text-white" data-testid="test-case-detail-plans-heading">
                Test Plans ({{ linkedPlans.length }})
              </h3>
              <UButton icon="i-lucide-plus" size="xs" color="neutral" variant="link" data-testid="test-case-detail-add-plan-button" @click="openAddPlansModal">
                Add
              </UButton>
            </div>
          </template>

          <div v-if="linkedPlans.length === 0" class="text-center py-6 text-sm text-gray-500 dark:text-gray-400" data-testid="test-case-detail-no-plan-message">
            Not part of any test plan.
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
            <div
              v-for="plan in linkedPlans"
              :key="plan.id"
              class="flex items-center justify-between py-2 first:pt-0 last:pb-0"
            >
              <NuxtLink
                :to="`/projects/${projectId}/test-plans/${plan.id}`"
                class="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate min-w-0 flex-1"
              >
                {{ plan.name }}
              </NuxtLink>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="error"
                size="xs"
                aria-label="Remove from plan"
                data-testid="test-case-detail-remove-plan-button"
                @click="handleUnlinkPlan(plan.id)"
              />
            </div>
          </div>
        </UCard>

        <!-- Test Suites -->
        <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-black dark:text-white" data-testid="test-case-detail-suites-heading">
                Test Suites ({{ linkedSuites.length }})
              </h3>
              <UButton icon="i-lucide-plus" size="xs" color="neutral" variant="link" data-testid="test-case-detail-add-suite-button" @click="openAddSuitesModal">
                Add
              </UButton>
            </div>
          </template>

          <div v-if="linkedSuites.length === 0" class="text-center py-6 text-sm text-gray-500 dark:text-gray-400" data-testid="test-case-detail-no-suite-message">
            Not part of any test suite.
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
            <div
              v-for="suite in linkedSuites"
              :key="suite.id"
              class="flex items-center justify-between py-2 first:pt-0 last:pb-0"
            >
              <NuxtLink
                :to="`/projects/${projectId}/test-suites/${suite.id}`"
                class="flex items-center gap-2 min-w-0 flex-1 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ suite.name }}
                </span>
                <UBadge v-if="suite.suiteType" variant="subtle" size="xs">
                  {{ suite.suiteType }}
                </UBadge>
              </NuxtLink>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="error"
                size="xs"
                aria-label="Remove from suite"
                data-testid="test-case-detail-remove-suite-button"
                @click="handleUnlinkSuite(suite.id)"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Test Run History (compact, last 5 runs) -->
      <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-black dark:text-white" data-testid="test-case-detail-run-history-heading">
              Run History ({{ runs.length }})
            </h3>
            <div class="flex items-center gap-2">
              <NuxtLink
                v-if="runs.length > 5"
                :to="`/projects/${projectId}/runs?testCaseId=${caseId}`"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All Runs
              </NuxtLink>
              <UButton
                icon="i-lucide-play"
                size="xs"
                color="neutral"
                variant="link"
                @click="showRunExecutor = true"
              >
                New Run
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="runs.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400" data-testid="test-case-detail-no-runs-message">
          No test runs recorded yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Environment</th>
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Executed By</th>
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Duration</th>
                <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="run in recentRuns"
                :key="run.id"
                class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                @click="navigateTo(`/projects/${projectId}/test-runs/${run.id}`)"
              >
                <td class="py-2 px-3">
                  <TestStatusBadge :status="run.status" />
                </td>
                <td class="py-2 px-3">
                  <TestEnvironmentBadge :environment="run.environment" />
                </td>
                <td class="py-2 px-3 text-gray-700 dark:text-gray-300">
                  {{ run.executedBy?.name ?? 'Unknown' }}
                </td>
                <td class="py-2 px-3 text-gray-500 dark:text-gray-400 text-xs">
                  {{ formatRelativeTime(run.executedAt) }}
                </td>
                <td class="py-2 px-3 text-gray-500 dark:text-gray-400">
                  {{ formatDuration(run.duration) }}
                </td>
                <td class="py-2 px-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {{ run.notes || '--' }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- View All link at bottom when there are more than 5 runs -->
          <div v-if="runs.length > 5" class="text-center pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
            <NuxtLink
              :to="`/projects/${projectId}/runs?testCaseId=${caseId}`"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all {{ runs.length }} runs
            </NuxtLink>
          </div>
        </div>
      </UCard>

      <!-- Comments -->
      <UCard data-testid="comments-section" :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <h3 class="text-sm font-semibold text-black dark:text-white" data-testid="comments-count">
            Comments ({{ comments.length }})
          </h3>
        </template>

        <!-- Add comment -->
        <form data-testid="comments-form" class="flex gap-2 mb-4" @submit.prevent="handleAddComment">
          <UTextarea
            v-model="newComment"
            data-testid="comments-input"
            placeholder="Add a comment..."
            :rows="1"
            autoresize
            class="flex-1"
          />
          <UButton
            data-testid="comments-submit-button"
            type="submit"
            icon="i-lucide-send"
            size="sm"
            :loading="submittingComment"
            :disabled="!newComment.trim()"
          />
        </form>

        <!-- Comments list -->
        <div v-if="comments.length > 0" class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="flex gap-3"
          >
            <UAvatar
              :text="comment.author?.name?.charAt(0) ?? '?'"
              :src="comment.author?.avatarUrl ?? undefined"
              size="xs"
              class="mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span data-testid="comments-author-name" class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ comment.author?.name ?? 'Unknown' }}
                </span>
                <span class="text-xs text-gray-400 dark:text-gray-400">
                  {{ new Date(comment.createdAt).toLocaleString() }}
                </span>
              </div>
              <p data-testid="comments-comment-text" class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {{ comment.content }}
              </p>
            </div>
          </div>
        </div>
        <p v-else data-testid="comments-empty-message" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No comments yet.
        </p>
      </UCard>

      <!-- Attachments -->
      <UCard :ui="{ header: 'bg-gray-500/20 dark:bg-gray-500/10' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-black dark:text-white">
              Attachments ({{ attachments.length }})
            </h3>
            <UButton icon="i-lucide-upload" size="xs" color="neutral" variant="link" data-testid="test-case-detail-upload-button">
              Upload
            </UButton>
          </div>
        </template>

        <div v-if="attachments.length === 0" class="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          No attachments yet.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="attachment in attachments"
            :key="attachment.id"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <UIcon name="i-lucide-paperclip" class="text-gray-400 dark:text-gray-500 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ attachment.fileName }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ (attachment.fileSize / 1024).toFixed(1) }} KB
              </p>
            </div>
            <UButton
              icon="i-lucide-download"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Download"
              data-testid="test-case-detail-download-button"
            />
          </div>
        </div>
      </UCard>

      <!-- Run Executor Modal -->
      <TestRunExecutor
        v-if="testCase"
        :test-case="testCase"
        :project-id="projectId"
        :open="showRunExecutor"
        @update:open="showRunExecutor = $event"
        @completed="handleRunCompleted"
        @saved-for-later="handleRunCompleted"
      />
    </template>

    <!-- Not found -->
    <div v-else class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white" data-testid="test-case-detail-not-found-message">Test Case not found</h2>
      <UButton class="mt-4" variant="outline" data-testid="test-case-detail-back-button" @click="navigateTo(`/projects/${projectId}/test-cases`)">
        Back to Test Cases
      </UButton>
    </div>

    <!-- Add to Test Plans Modal -->
    <UModal
      v-model:open="showAddPlansModal"
      title="Add to Test Plans"
      description="Select test plans to link this test case to."
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="planSearchQuery"
            icon="i-lucide-search"
            placeholder="Search test plans..."
            class="w-full"
          />

          <div v-if="loadingPlans" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-gray-400" />
          </div>

          <div v-else-if="filteredAvailablePlans.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ availablePlans.length === 0 ? 'This test case is already in all test plans.' : 'No test plans match your search.' }}
            </p>
          </div>

          <div v-else class="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label
              v-for="plan in filteredAvailablePlans"
              :key="plan.id"
              class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <UCheckbox
                :model-value="selectedPlanIds.has(plan.id)"
                @update:model-value="togglePlan(plan.id)"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ plan.name }}
                </p>
                <p v-if="plan.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ plan.description }}
                </p>
              </div>
            </label>
          </div>

          <p v-if="selectedPlanIds.size > 0" class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedPlanIds.size }} plan{{ selectedPlanIds.size === 1 ? '' : 's' }} selected
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="showAddPlansModal = false">Cancel</UButton>
          <UButton :disabled="selectedPlanIds.size === 0 || linkingPlans" :loading="linkingPlans" @click="handleLinkPlans">
            Add to {{ selectedPlanIds.size || '' }} Plan{{ selectedPlanIds.size === 1 ? '' : 's' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add to Test Suites Modal -->
    <UModal
      v-model:open="showAddSuitesModal"
      title="Add to Test Suites"
      description="Select test suites to link this test case to."
    >
      <template #body>
        <div class="space-y-4">
          <UInput
            v-model="suiteSearchQuery"
            icon="i-lucide-search"
            placeholder="Search test suites..."
            class="w-full"
          />

          <div v-if="loadingSuites" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl text-gray-400" />
          </div>

          <div v-else-if="filteredAvailableSuites.length === 0" class="text-center py-8">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ availableSuites.length === 0 ? 'This test case is already in all test suites.' : 'No test suites match your search.' }}
            </p>
          </div>

          <div v-else class="max-h-80 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label
              v-for="suite in filteredAvailableSuites"
              :key="suite.id"
              class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <UCheckbox
                :model-value="selectedSuiteIds.has(suite.id)"
                @update:model-value="toggleSuite(suite.id)"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ suite.name }}
                </p>
                <p v-if="suite.suiteType" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ suite.suiteType }}
                </p>
              </div>
            </label>
          </div>

          <p v-if="selectedSuiteIds.size > 0" class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedSuiteIds.size }} suite{{ selectedSuiteIds.size === 1 ? '' : 's' }} selected
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="showAddSuitesModal = false">Cancel</UButton>
          <UButton :disabled="selectedSuiteIds.size === 0 || linkingSuites" :loading="linkingSuites" @click="handleLinkSuites">
            Add to {{ selectedSuiteIds.size || '' }} Suite{{ selectedSuiteIds.size === 1 ? '' : 's' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
