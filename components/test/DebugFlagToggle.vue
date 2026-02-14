<script setup lang="ts">
import type { User } from '~/types'

const props = defineProps<{
  debugFlag: boolean
  debugFlaggedBy?: User | null
  debugFlaggedAt?: string | null
}>()

const emit = defineEmits<{
  toggle: [comment?: string]
}>()

const showCommentInput = ref(false)
const comment = ref('')

const flaggedDate = computed(() => {
  if (!props.debugFlaggedAt) return null
  return new Date(props.debugFlaggedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

function handleToggle() {
  if (props.debugFlag) {
    // Unflagging: emit immediately, no comment needed
    emit('toggle')
  } else {
    // Flagging: show comment input
    showCommentInput.value = true
  }
}

function submitFlag() {
  emit('toggle', comment.value.trim() || undefined)
  showCommentInput.value = false
  comment.value = ''
}

function cancelFlag() {
  showCommentInput.value = false
  comment.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <UButton
        :icon="debugFlag ? 'i-lucide-bug' : 'i-lucide-bug-off'"
        :color="debugFlag ? 'error' : 'neutral'"
        :variant="debugFlag ? 'soft' : 'ghost'"
        size="sm"
        :aria-label="debugFlag ? 'Remove debug flag' : 'Flag for debug'"
        data-testid="test-case-detail-debug-toggle"
        @click="handleToggle"
      >
        {{ debugFlag ? 'Flagged' : 'Flag for Debug' }}
      </UButton>

      <span
        v-if="debugFlag && (debugFlaggedBy || flaggedDate)"
        class="text-xs text-gray-500 dark:text-gray-400"
        data-testid="test-case-detail-debug-info"
      >
        <template v-if="debugFlaggedBy">by {{ debugFlaggedBy.name }}</template>
        <template v-if="flaggedDate"> on {{ flaggedDate }}</template>
      </span>
    </div>

    <!-- Comment input when flagging -->
    <div v-if="showCommentInput" class="flex gap-2">
      <UInput
        v-model="comment"
        placeholder="Why is this being flagged? (optional)"
        class="flex-1"
        size="sm"
        autofocus
        @keyup.enter="submitFlag"
        @keyup.escape="cancelFlag"
      />
      <UButton size="sm" color="error" variant="soft" @click="submitFlag">
        Flag
      </UButton>
      <UButton size="sm" variant="ghost" color="neutral" @click="cancelFlag">
        Cancel
      </UButton>
    </div>
  </div>
</template>
