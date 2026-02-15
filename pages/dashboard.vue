<script setup lang="ts">
import type { ActivityLog, DashboardStats } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Dashboard',
})

const { userName } = useAuth()
const { currentOrg } = useOrganization()
const { projects, fetchProjects } = useProject()

// Fetch projects for quick actions
if (currentOrg.value?.id) {
  await fetchProjects(currentOrg.value.id)
}

const firstProjectId = computed(() => projects.value?.[0]?.id)

function navigateToNewTestCase() {
  if (firstProjectId.value) {
    navigateTo(`/projects/${firstProjectId.value}/test-cases/new`)
  } else {
    navigateTo('/organizations')
  }
}

function navigateToNewTestPlan() {
  if (firstProjectId.value) {
    navigateTo(`/projects/${firstProjectId.value}/test-plans`)
  } else {
    navigateTo('/organizations')
  }
}

function navigateToReports() {
  if (firstProjectId.value) {
    navigateTo(`/projects/${firstProjectId.value}/reports`)
  } else {
    navigateTo('/organizations')
  }
}

// Fetch dashboard stats from project stats API
const defaultStats: DashboardStats = { totalTestCases: 0, passRate: 0, recentRuns: 0, debugFlagged: 0 }
const stats = ref<DashboardStats>({ ...defaultStats })

watch(firstProjectId, async (projectId) => {
  if (!projectId) {
    stats.value = { ...defaultStats }
    return
  }
  try {
    stats.value = await $fetch<DashboardStats>(`/api/projects/${projectId}/stats`)
  } catch {
    stats.value = { ...defaultStats }
  }
}, { immediate: true })

// Fetch recent activity
const activityLoading = ref(false)
const recentActivity = ref<ActivityLog[]>([])

async function fetchActivity() {
  activityLoading.value = true
  try {
    const result = await $fetch<{ data: ActivityLog[] }>('/api/activity', {
      query: { limit: 10 },
    })
    recentActivity.value = result.data
  } catch {
    recentActivity.value = []
  } finally {
    activityLoading.value = false
  }
}
await fetchActivity()

const statCards = computed(() => [
  {
    label: 'Total Test Cases',
    value: stats.value.totalTestCases,
    icon: 'i-lucide-test-tubes',
    color: 'indigo',
    testId: 'dashboard-stat-total-test-cases',
    trend: { value: 12, direction: 'up' as const },
  },
  {
    label: 'Pass Rate',
    value: `${stats.value.passRate}%`,
    icon: 'i-lucide-check-circle',
    color: 'green',
    testId: 'dashboard-stat-pass-rate',
    trend: { value: 3, direction: 'up' as const },
  },
  {
    label: 'Recent Runs',
    value: stats.value.recentRuns,
    icon: 'i-lucide-play-circle',
    color: 'blue',
    testId: 'dashboard-stat-recent-runs',
    trend: { value: 0, direction: 'neutral' as const },
  },
  {
    label: 'Debug Flagged',
    value: stats.value.debugFlagged,
    icon: 'i-lucide-bug',
    color: 'red',
    testId: 'dashboard-stat-debug-flagged',
    trend: stats.value.debugFlagged > 0
      ? { value: stats.value.debugFlagged, direction: 'up' as const }
      : undefined,
  },
])
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{{ userName ? `, ${userName}` : '' }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's what's happening in
          <span data-testid="dashboard-org-name" class="font-medium">{{ currentOrg?.name ?? 'your organization' }}</span>
        </p>
      </div>

      <!-- Quick actions -->
      <div class="flex items-center gap-2">
        <UButton
          data-testid="dashboard-new-test-case-btn"
          icon="i-lucide-plus"
          size="sm"
          :disabled="!firstProjectId"
          @click="navigateToNewTestCase"
        >
          New Test Case
        </UButton>
        <UButton
          data-testid="dashboard-new-test-plan-btn"
          icon="i-lucide-clipboard-list"
          variant="outline"
          color="neutral"
          size="sm"
          :disabled="!firstProjectId"
          @click="navigateToNewTestPlan"
        >
          New Test Plan
        </UButton>
        <UButton
          data-testid="dashboard-view-reports-btn"
          icon="i-lucide-bar-chart-3"
          variant="outline"
          color="neutral"
          size="sm"
          @click="navigateToReports"
        >
          View Reports
        </UButton>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardStatsCard
        v-for="stat in statCards"
        :key="stat.label"
        :data-testid="stat.testId"
        :label="stat.label"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
        :trend="stat.trend"
      />
    </div>

    <!-- Main content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent activity -->
      <div class="lg:col-span-2">
        <DashboardRecentActivity
          :activities="recentActivity"
          :loading="activityLoading"
        />
      </div>

      <!-- Quick links / Recent projects -->
      <div>
        <UCard>
          <template #header>
            <h3 data-testid="dashboard-quick-links" class="text-base font-semibold">
              Quick Links
            </h3>
          </template>

          <div class="space-y-2">
            <NuxtLink
              data-testid="dashboard-manage-orgs-link"
              to="/organizations"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-building-2" class="text-lg text-indigo-600 dark:text-indigo-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Organizations
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Manage your organizations
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-gray-400 dark:text-gray-500" />
            </NuxtLink>

            <NuxtLink
              data-testid="dashboard-rbac-settings-link"
              to="/settings"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-settings" class="text-lg text-gray-600 dark:text-gray-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Settings
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Organization & RBAC settings
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="text-gray-400 dark:text-gray-500" />
            </NuxtLink>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
