<script setup lang="ts">
import type { User } from '~/types'

const props = defineProps<{
  debugFlag: boolean
  debugFlaggedBy?: User | null
  debugFlaggedAt?: string | null
}>()

const emit = defineEmits<{
  toggle: []
}>()

const flaggedDate = computed(() => {
  if (!props.debugFlaggedAt) return null
  return new Date(props.debugFlaggedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      :icon="debugFlag ? 'i-lucide-bug' : 'i-lucide-bug-off'"
      :color="debugFlag ? 'error' : 'neutral'"
      :variant="debugFlag ? 'soft' : 'ghost'"
      size="sm"
      :aria-label="debugFlag ? 'Remove debug flag' : 'Flag for debug'"
      @click="emit('toggle')"
    >
      {{ debugFlag ? 'Flagged' : 'Flag for Debug' }}
    </UButton>

    <span
      v-if="debugFlag && (debugFlaggedBy || flaggedDate)"
      class="text-xs text-gray-500 dark:text-gray-400"
    >
      <template v-if="debugFlaggedBy">by {{ debugFlaggedBy.name }}</template>
      <template v-if="flaggedDate"> on {{ flaggedDate }}</template>
    </span>
  </div>
</template>
