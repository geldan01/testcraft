<script setup lang="ts">
import type { TestRunStatus } from '~/types'

const props = defineProps<{
  status: TestRunStatus
  size?: 'sm' | 'md' | 'lg'
}>()

const statusConfig = computed(() => {
  const configs: Record<TestRunStatus, { label: string; color: string; icon: string }> = {
    PASS: { label: 'Pass', color: 'success', icon: 'i-lucide-check-circle' },
    FAIL: { label: 'Fail', color: 'error', icon: 'i-lucide-x-circle' },
    BLOCKED: { label: 'Blocked', color: 'warning', icon: 'i-lucide-ban' },
    SKIPPED: { label: 'Skipped', color: 'neutral', icon: 'i-lucide-skip-forward' },
    IN_PROGRESS: { label: 'In Progress', color: 'info', icon: 'i-lucide-loader' },
    NOT_RUN: { label: 'Not Run', color: 'neutral', icon: 'i-lucide-circle-dashed' },
  }
  return configs[props.status] ?? configs.NOT_RUN
})
</script>

<template>
  <UBadge
    :color="statusConfig.color as any"
    :size="size ?? 'sm'"
    variant="subtle"
    class="inline-flex items-center gap-1"
  >
    <UIcon :name="statusConfig.icon" class="text-xs" />
    {{ statusConfig.label }}
  </UBadge>
</template>
