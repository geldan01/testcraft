<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string | number
  icon: string
  color?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}>()

const trendIcon = (direction: string) => {
  if (direction === 'up') return 'i-lucide-trending-up'
  if (direction === 'down') return 'i-lucide-trending-down'
  return 'i-lucide-minus'
}

const trendColor = (direction: string) => {
  if (direction === 'up') return 'text-green-600 dark:text-green-400'
  if (direction === 'down') return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

// Use explicit class maps so Tailwind can detect these at build time.
// Dynamic template literals like `bg-${color}-100` are NOT detectable by Tailwind's purge.
const iconBgClasses: Record<string, string> = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
  green: 'bg-green-100 dark:bg-green-900/30',
  blue: 'bg-blue-100 dark:bg-blue-900/30',
  red: 'bg-red-100 dark:bg-red-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  purple: 'bg-purple-100 dark:bg-purple-900/30',
  gray: 'bg-gray-100 dark:bg-gray-800',
}

const iconTextClasses: Record<string, string> = {
  indigo: 'text-indigo-600 dark:text-indigo-400',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  purple: 'text-purple-600 dark:text-purple-400',
  gray: 'text-gray-600 dark:text-gray-400',
}

const resolvedIconBg = computed(() => iconBgClasses[props.color ?? 'indigo'] ?? iconBgClasses.indigo)
const resolvedIconText = computed(() => iconTextClasses[props.color ?? 'indigo'] ?? iconTextClasses.indigo)
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div class="space-y-2">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ label }}
        </p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ value }}
        </p>
        <div v-if="trend" class="flex items-center gap-1" :class="trendColor(trend.direction)">
          <UIcon :name="trendIcon(trend.direction)" class="text-sm" />
          <span class="text-xs font-medium">
            {{ trend.direction === 'neutral' ? 'No change' : `${trend.value}%` }}
          </span>
        </div>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        :class="resolvedIconBg"
      >
        <UIcon
          :name="icon"
          class="text-2xl"
          :class="resolvedIconText"
        />
      </div>
    </div>
  </UCard>
</template>
