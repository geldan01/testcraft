<script setup lang="ts">
import type { Project } from '~/types'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { getProject, setCurrentProject } = useProject()

const project = ref<Project | null>(null)
const loading = ref(true)

async function loadProject() {
  loading.value = true
  try {
    project.value = await getProject(projectId.value)
    if (project.value) {
      setCurrentProject(project.value)
      useSeoMeta({ title: project.value.name })
    }
  } finally {
    loading.value = false
  }
}

await loadProject()

const tabs = [
  { label: 'Overview', value: 'overview', icon: 'i-lucide-layout-dashboard' },
  { label: 'Test Plans', value: 'test-plans', icon: 'i-lucide-clipboard-list' },
  { label: 'Test Suites', value: 'test-suites', icon: 'i-lucide-folder-tree' },
  { label: 'Test Cases', value: 'test-cases', icon: 'i-lucide-test-tubes' },
  { label: 'Test Runs', value: 'runs', icon: 'i-lucide-history' },
]

// Sync active tab with current route
const activeTab = computed(() => {
  const path = route.path
  if (path.includes('/test-cases')) return 'test-cases'
  if (path.includes('/test-plans')) return 'test-plans'
  if (path.includes('/test-suites')) return 'test-suites'
  if (path.includes('/runs')) return 'runs'
  return 'overview'
})

const isOverview = computed(() => activeTab.value === 'overview')

function navigateToSection(section: string) {
  if (section === 'overview') {
    navigateTo(`/projects/${projectId.value}`)
  } else {
    navigateTo(`/projects/${projectId.value}/${section}`)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>

    <template v-else-if="project">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ project.name }}
          </h1>
          <p
            v-if="project.description"
            class="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ project.description }}
          </p>
        </div>
        <UButton
          icon="i-lucide-settings"
          variant="outline"
          color="neutral"
          size="sm"
        >
          Project Settings
        </UButton>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatsCard
          label="Test Cases"
          :value="project._count?.testCases ?? 0"
          icon="i-lucide-test-tubes"
          color="indigo"
        />
        <DashboardStatsCard
          label="Test Plans"
          :value="project._count?.testPlans ?? 0"
          icon="i-lucide-clipboard-list"
          color="blue"
        />
        <DashboardStatsCard
          label="Test Suites"
          :value="project._count?.testSuites ?? 0"
          icon="i-lucide-folder-tree"
          color="green"
        />
        <DashboardStatsCard
          label="Members"
          :value="project._count?.members ?? 0"
          icon="i-lucide-users"
          color="amber"
        />
      </div>

      <!-- Tabs -->
      <UTabs
        :items="tabs"
        :model-value="activeTab"
        @update:model-value="(val) => navigateToSection(val as string)"
      />

      <!-- Child route content (test-cases, test-plans, etc.) -->
      <NuxtPage v-if="!isOverview" />

      <!-- Overview content -->
      <div v-if="isOverview" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Quick actions -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Quick Actions</h3>
          </template>
          <div class="space-y-2">
            <UButton
              block
              variant="soft"
              icon="i-lucide-plus"
              @click="navigateTo(`/projects/${projectId}/test-cases/new`)"
            >
              Create Test Case
            </UButton>
            <UButton
              block
              variant="soft"
              color="neutral"
              icon="i-lucide-clipboard-list"
              @click="navigateTo(`/projects/${projectId}/test-plans`)"
            >
              View Test Plans
            </UButton>
            <UButton
              block
              variant="soft"
              color="neutral"
              icon="i-lucide-history"
              @click="navigateTo(`/projects/${projectId}/runs`)"
            >
              View Run History
            </UButton>
          </div>
        </UCard>

        <!-- Project info -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Project Details</h3>
          </template>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Created</dt>
              <dd class="text-gray-900 dark:text-white font-medium">
                {{ new Date(project.createdAt).toLocaleDateString() }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd class="text-gray-900 dark:text-white font-medium">
                {{ new Date(project.updatedAt).toLocaleDateString() }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500 dark:text-gray-400">Organization</dt>
              <dd class="text-gray-900 dark:text-white font-medium">
                {{ project.organization?.name ?? 'N/A' }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="text-center py-16">
      <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-400 mb-3" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Project not found</h2>
      <UButton class="mt-4" variant="outline" @click="navigateTo('/organizations')">
        Back to Organizations
      </UButton>
    </div>
  </div>
</template>
