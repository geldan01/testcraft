<script setup lang="ts">
import type { ActivityLog } from '~/types'

defineProps<{
  activities: ActivityLog[]
  loading?: boolean
}>()

function getActivityIcon(actionType: string): string {
  switch (actionType) {
    case 'CREATED':
      return 'i-lucide-plus-circle'
    case 'UPDATED':
      return 'i-lucide-pencil'
    case 'DELETED':
      return 'i-lucide-trash-2'
    default:
      return 'i-lucide-activity'
  }
}

function getActivityColor(actionType: string): string {
  switch (actionType) {
    case 'CREATED':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    case 'UPDATED':
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    case 'DELETED':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
}

function formatObjectType(type: string): string {
  return type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getObjectName(activity: ActivityLog): string | null {
  const changes = activity.changes
  if (!changes) return null

  if (typeof changes.name === 'string') return changes.name
  if (typeof changes.fileName === 'string') return changes.fileName

  return null
}

function getActivityVerb(activity: ActivityLog): string {
  const action = activity.actionType?.toLowerCase()
  if (activity.objectType === 'TestRun' && activity.changes) {
    const runAction = activity.changes.action as string | undefined
    if (runAction === 'started') return 'started'
    if (runAction === 'completed') return 'completed'
  }
  return action ?? 'performed action on'
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 data-testid="dashboard-recent-activity" class="text-base font-semibold">
          Recent Activity
        </h3>
        <UButton
          data-testid="dashboard-view-all-activity"
          variant="link"
          color="neutral"
          size="xs"
          trailing-icon="i-lucide-arrow-right"
        >
          View all
        </UButton>
      </div>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="flex items-start gap-3 animate-pulse">
        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="activities.length === 0"
      data-testid="dashboard-no-recent-activity"
      class="text-center py-8"
    >
      <UIcon name="i-lucide-activity" class="text-3xl text-gray-400 dark:text-gray-400 mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No recent activity
      </p>
    </div>

    <!-- Activity list -->
    <div v-else class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          :class="getActivityColor(activity.actionType ?? '')"
        >
          <UIcon :name="getActivityIcon(activity.actionType ?? '')" class="text-sm" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-900 dark:text-white">
            <span class="font-medium">{{ activity.user?.name ?? 'Unknown' }}</span>
            {{ ' ' }}
            <span class="text-gray-600 dark:text-gray-400">
              {{ getActivityVerb(activity) }}
            </span>
            {{ ' ' }}
            <span class="font-medium">
              {{ activity.objectType ? formatObjectType(activity.objectType) : 'item' }}
            </span>
            <template v-if="getObjectName(activity)">
              {{ ' ' }}
              <span class="text-gray-500 dark:text-gray-400">&ldquo;{{ getObjectName(activity) }}&rdquo;</span>
            </template>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ formatTimestamp(activity.timestamp) }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
