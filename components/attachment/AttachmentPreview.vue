<script setup lang="ts">
import type { Attachment } from '~/types'

const props = defineProps<{
  attachment: Attachment | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isImage = computed(() => {
  return props.attachment?.fileType.startsWith('image/')
})

const isVideo = computed(() => {
  return props.attachment?.fileType.startsWith('video/')
})
</script>

<template>
  <UModal
    :open="open"
    :title="attachment?.fileName ?? 'Preview'"
    @update:open="emit('close')"
  >
    <template #body>
      <div v-if="attachment" class="space-y-4">
        <!-- Image preview -->
        <div v-if="isImage" class="flex justify-center">
          <img
            :src="attachment.fileUrl"
            :alt="attachment.fileName"
            class="max-w-full max-h-[60vh] rounded-lg object-contain"
          />
        </div>

        <!-- Video preview -->
        <div v-else-if="isVideo" class="flex justify-center">
          <video
            :src="attachment.fileUrl"
            controls
            class="max-w-full max-h-[60vh] rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <!-- Non-previewable file -->
        <div v-else class="text-center py-8">
          <UIcon name="i-lucide-file" class="text-4xl text-gray-400 mb-3" />
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {{ attachment.fileName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            This file type cannot be previewed.
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" color="neutral" @click="emit('close')">
          Close
        </UButton>
        <a
          v-if="attachment"
          :href="attachment.fileUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <UButton icon="i-lucide-download">
            Download
          </UButton>
        </a>
      </div>
    </template>
  </UModal>
</template>
