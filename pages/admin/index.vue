<script setup lang="ts">
import type { AdminStats } from '~/types'

definePageMeta({
  middleware: 'admin',
})

useSeoMeta({
  title: 'Admin Dashboard',
})

const { fetchStats } = useAdmin()

const stats = ref<AdminStats | null>(null)
const loading = ref(true)

onMounted(async () => {
  stats.value = await fetchStats()
  loading.value = false
})

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Total Users', value: stats.value.totalUsers, icon: 'i-lucide-users', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Users', value: stats.value.activeUsers, icon: 'i-lucide-user-check', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Suspended Users', value: stats.value.suspendedUsers, icon: 'i-lucide-user-x', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Organizations', value: stats.value.totalOrganizations, icon: 'i-lucide-building-2', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Projects', value: stats.value.totalProjects, icon: 'i-lucide-folder', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Test Cases', value: stats.value.totalTestCases, icon: 'i-lucide-test-tubes', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 data-testid="admin-heading" class="text-2xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Platform-wide overview and management.
      </p>
    </div>

    <!-- Stats Grid -->
    <div v-if="loading" data-testid="admin-stats-loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="i in 6" :key="i">
        <div class="animate-pulse flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div class="space-y-2 flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      </UCard>
    </div>

    <div v-else data-testid="admin-stats-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="card in statCards" :key="card.label" :data-testid="`admin-stat-${card.label.toLowerCase().replace(/\s+/g, '-')}`">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="card.bg">
            <UIcon :name="card.icon" class="text-xl" :class="card.color" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ card.label }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ card.value }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Links -->
    <div class="flex gap-3">
      <UButton to="/admin/users" variant="outline" icon="i-lucide-users-round" data-testid="admin-manage-users-link">
        Manage Users
      </UButton>
      <UButton to="/admin/organizations" variant="outline" icon="i-lucide-building" data-testid="admin-manage-orgs-link">
        Manage Organizations
      </UButton>
    </div>
  </div>
</template>
