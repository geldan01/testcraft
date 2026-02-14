<script setup lang="ts">
import type { TestCase } from '~/types'

const props = defineProps<{
  projectId: string
}>()

const { getTestCases, toggleDebugFlag } = useTestCase()

const cases = ref<TestCase[]>([])
const loading = ref(true)
const unflagging = ref<string | null>(null)

async function loadDebugCases() {
  loading.value = true
  const result = await getTestCases(props.projectId, {
    debugFlag: true,
    limit: 50,
  })
  cases.value = result.data
  loading.value = false
}

async function handleUnflag(caseId: string) {
  unflagging.value = caseId
  const result = await toggleDebugFlag(caseId)
  if (result) {
    cases.value = cases.value.filter((c) => c.id !== caseId)
  }
  unflagging.value = null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(() => {
  loadDebugCases()
})

watch(() => props.projectId, () => {
  loadDebugCases()
})
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="text-xl text-gray-400 animate-spin" />
    </div>

    <div v-else-if="cases.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-bug-off" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
      <p data-testid="debug-queue-no-items" class="text-sm text-gray-500 dark:text-gray-400">No test cases flagged for debugging</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th data-testid="debug-queue-header-name" class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th data-testid="debug-queue-header-flagged-by" class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Flagged By
            </th>
            <th data-testid="debug-queue-header-flagged-at" class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Flagged At
            </th>
            <th data-testid="debug-queue-header-last-status" class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Last Status
            </th>
            <th data-testid="debug-queue-header-actions" class="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tc in cases"
            :key="tc.id"
            class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="py-2.5 px-3">
              <NuxtLink
                data-testid="debug-queue-case-link"
                :to="`/projects/${projectId}/test-cases/${tc.id}`"
                class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {{ tc.name }}
              </NuxtLink>
            </td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <UAvatar
                  v-if="tc.debugFlaggedBy"
                  :alt="tc.debugFlaggedBy.name"
                  size="xs"
                />
                <span class="text-gray-700 dark:text-gray-300">
                  {{ tc.debugFlaggedBy?.name ?? 'Unknown' }}
                </span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-gray-700 dark:text-gray-300">
              {{ formatDate(tc.debugFlaggedAt) }}
            </td>
            <td class="py-2.5 px-3">
              <TestStatusBadge :status="tc.lastRunStatus" />
            </td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-1">
                <NuxtLink :to="`/projects/${projectId}/test-cases/${tc.id}`">
                  <UButton
                    data-testid="debug-queue-view-button"
                    icon="i-lucide-eye"
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    aria-label="View test case"
                  />
                </NuxtLink>
                <UButton
                  data-testid="debug-queue-unflag-button"
                  icon="i-lucide-flag-off"
                  variant="ghost"
                  color="warning"
                  size="xs"
                  aria-label="Remove debug flag"
                  :loading="unflagging === tc.id"
                  @click="handleUnflag(tc.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
