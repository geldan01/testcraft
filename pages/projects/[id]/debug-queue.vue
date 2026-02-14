<script setup lang="ts">
import type { TestCase } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Debug Queue',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getTestCases } = useTestCase()

const debugCount = ref(0)
const loading = ref(true)

async function loadDebugCount() {
  loading.value = true
  try {
    const response = await getTestCases(projectId.value, {
      debugFlag: true,
      limit: 1,
    })
    debugCount.value = response.total
  } finally {
    loading.value = false
  }
}

await loadDebugCount()
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-bug" class="text-2xl text-red-500" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Debug Queue</h1>
      </div>
      <p data-testid="debug-queue-subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Test cases flagged for debugging and investigation.
      </p>
    </div>

    <!-- Count -->
    <div v-if="!loading" class="flex items-center gap-2">
      <UBadge
        data-testid="debug-queue-count-badge"
        :color="debugCount > 0 ? 'error' : 'success'"
        variant="subtle"
        size="lg"
      >
        {{ debugCount }} flagged test case{{ debugCount !== 1 ? 's' : '' }}
      </UBadge>
    </div>

    <!-- Debug Queue Table or Empty State -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="animate-pulse h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <template v-else-if="debugCount > 0">
      <TestDebugQueueTable :project-id="projectId" />
    </template>

    <div
      v-else
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-check-circle-2" class="text-4xl text-green-500 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        No flagged test cases
      </h3>
      <p data-testid="debug-queue-empty-description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        All test cases are clear. Flag a test case for debugging from the test case detail page.
      </p>
      <UButton
        data-testid="debug-queue-back-button"
        class="mt-4"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="navigateTo(`/projects/${projectId}/test-cases`)"
      >
        Back to Test Cases
      </UButton>
    </div>
  </div>
</template>
