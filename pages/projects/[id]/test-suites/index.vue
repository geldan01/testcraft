<script setup lang="ts">
import type { TestSuite, CreateTestSuiteInput } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Test Suites',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getTestSuites, createTestSuite } = useTestSuite()

const suites = ref<TestSuite[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const filterType = ref('all')

// Create form
const newSuite = reactive<CreateTestSuiteInput>({
  name: '',
  description: '',
  projectId: '',
  suiteType: '',
})

const suiteTypes = [
  { label: 'Regression', value: 'regression' },
  { label: 'Smoke', value: 'smoke' },
  { label: 'Integration', value: 'integration' },
  { label: 'E2E', value: 'e2e' },
  { label: 'Performance', value: 'performance' },
  { label: 'Security', value: 'security' },
  { label: 'Other', value: 'other' },
]

const filteredSuites = computed(() => {
  if (filterType.value === 'all') return suites.value
  return suites.value.filter((s) => s.suiteType === filterType.value)
})

async function loadSuites() {
  loading.value = true
  try {
    const response = await getTestSuites(projectId.value)
    suites.value = response.data
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!newSuite.name.trim() || !newSuite.suiteType) return

  const result = await createTestSuite({
    ...newSuite,
    projectId: projectId.value,
  })

  if (result) {
    showCreateModal.value = false
    newSuite.name = ''
    newSuite.description = ''
    newSuite.suiteType = ''
    await loadSuites()
  }
}

await loadSuites()

function getSuiteTypeColor(type: string): string {
  const colors: Record<string, string> = {
    regression: 'primary',
    smoke: 'warning',
    integration: 'info',
    e2e: 'success',
    performance: 'error',
    security: 'neutral',
  }
  return colors[type] ?? 'neutral'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Suites</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Group test cases into logical suites.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- View toggle -->
        <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            class="p-2 rounded-l-lg transition-colors"
            :class="viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
            aria-label="Grid view"
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-lucide-layout-grid" />
          </button>
          <button
            class="p-2 rounded-r-lg transition-colors"
            :class="viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
            aria-label="List view"
            @click="viewMode = 'list'"
          >
            <UIcon name="i-lucide-list" />
          </button>
        </div>

        <!-- Filter by type -->
        <USelect
          v-model="filterType"
          :items="[{ label: 'All Types', value: 'all' }, ...suiteTypes]"
          placeholder="Filter type"
          value-key="value"
          size="sm"
        />

        <UButton icon="i-lucide-plus" @click="showCreateModal = true">
          Create Test Suite
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredSuites.length === 0"
      class="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <UIcon name="i-lucide-folder-tree" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ filterType !== 'all' ? 'No suites match this filter' : 'No test suites yet' }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
        {{ filterType !== 'all' ? 'Try changing the filter.' : 'Create your first test suite to get started.' }}
      </p>
      <UButton v-if="filterType === 'all'" icon="i-lucide-plus" @click="showCreateModal = true">
        Create Test Suite
      </UButton>
    </div>

    <!-- Grid view -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="suite in filteredSuites"
        :key="suite.id"
        :to="`/projects/${projectId}/test-suites/${suite.id}`"
        class="group"
      >
        <UCard class="h-full hover:shadow-md transition-shadow">
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {{ suite.name }}
              </h3>
              <UBadge :color="getSuiteTypeColor(suite.suiteType) as any" variant="subtle" size="xs">
                {{ suite.suiteType }}
              </UBadge>
            </div>
            <p v-if="suite.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {{ suite.description }}
            </p>
            <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-test-tubes" />
                {{ suite._count?.testCases ?? 0 }} cases
              </span>
              <span>{{ new Date(suite.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- List view -->
    <UCard v-else>
      <div class="divide-y divide-gray-200 dark:divide-gray-800">
        <NuxtLink
          v-for="suite in filteredSuites"
          :key="suite.id"
          :to="`/projects/${projectId}/test-suites/${suite.id}`"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-lucide-folder-tree" class="text-lg text-gray-400 dark:text-gray-500 shrink-0" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ suite.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ suite._count?.testCases ?? 0 }} test cases
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge :color="getSuiteTypeColor(suite.suiteType) as any" variant="subtle" size="xs">
              {{ suite.suiteType }}
            </UBadge>
            <UIcon name="i-lucide-chevron-right" class="text-gray-400 dark:text-gray-500" />
          </div>
        </NuxtLink>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal
      v-model:open="showCreateModal"
      title="Create Test Suite"
      description="Group related test cases into a suite."
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField label="Suite name" required>
            <UInput v-model="newSuite.name" placeholder="e.g., Login Regression" autofocus class="w-full" />
          </UFormField>
          <UFormField label="Suite type" required>
            <USelect
              v-model="newSuite.suiteType"
              :items="suiteTypes"
              placeholder="Select type..."
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="newSuite.description" placeholder="Describe this test suite..." :rows="3" class="w-full" />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" color="neutral" @click="showCreateModal = false">Cancel</UButton>
          <UButton :disabled="!newSuite.name.trim() || !newSuite.suiteType" @click="handleCreate">Create</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
