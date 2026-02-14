<script setup lang="ts">
import type { Attachment } from '~/types'

const props = withDefaults(
  defineProps<{
    attachments: Attachment[]
    canDelete?: boolean
  }>(),
  {
    canDelete: false,
  },
)

const emit = defineEmits<{
  deleted: [id: string]
}>()

const { deleteAttachment } = useAttachment()

const confirmDeleteId = ref<string | null>(null)
const deleting = ref(false)
const previewAttachment = ref<Attachment | null>(null)
const previewOpen = ref(false)

function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'i-lucide-image'
  if (fileType.startsWith('video/')) return 'i-lucide-video'
  if (fileType.startsWith('audio/')) return 'i-lucide-music'
  if (fileType.includes('pdf')) return 'i-lucide-file-text'
  if (fileType.includes('spreadsheet') || fileType.includes('csv') || fileType.includes('excel'))
    return 'i-lucide-table'
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar'))
    return 'i-lucide-archive'
  if (fileType.includes('text') || fileType.includes('log'))
    return 'i-lucide-file-text'
  return 'i-lucide-file'
}

function isImageType(fileType: string): boolean {
  return fileType.startsWith('image/')
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function openPreview(attachment: Attachment) {
  previewAttachment.value = attachment
  previewOpen.value = true
}

async function handleDelete(id: string) {
  deleting.value = true
  const success = await deleteAttachment(id)
  if (success) {
    emit('deleted', id)
  }
  deleting.value = false
  confirmDeleteId.value = null
}
</script>

<template>
  <div>
    <div v-if="attachments.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
      No attachments
    </div>

    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li
        v-for="attachment in attachments"
        :key="attachment.id"
        class="flex items-center gap-3 py-3"
      >
        <!-- Thumbnail or icon -->
        <div
          class="shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        >
          <img
            v-if="isImageType(attachment.fileType)"
            :src="attachment.fileUrl"
            :alt="attachment.fileName"
            class="w-full h-full object-cover cursor-pointer"
            @click="openPreview(attachment)"
          />
          <UIcon
            v-else
            :name="getFileIcon(attachment.fileType)"
            class="text-lg text-gray-500 dark:text-gray-400"
          />
        </div>

        <!-- File info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ attachment.fileName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatFileSize(attachment.fileSize) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <UButton
            v-if="isImageType(attachment.fileType) || attachment.fileType.startsWith('video/')"
            icon="i-lucide-eye"
            variant="ghost"
            color="neutral"
            size="xs"
            aria-label="Preview"
            @click="openPreview(attachment)"
          />
          <a :href="attachment.fileUrl" target="_blank" rel="noopener noreferrer">
            <UButton
              icon="i-lucide-download"
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Download"
            />
          </a>

          <template v-if="canDelete">
            <UButton
              v-if="confirmDeleteId !== attachment.id"
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              size="xs"
              aria-label="Delete"
              @click="confirmDeleteId = attachment.id"
            />
            <div v-else class="flex items-center gap-1">
              <UButton
                size="xs"
                color="error"
                variant="soft"
                :loading="deleting"
                @click="handleDelete(attachment.id)"
              >
                Confirm
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                @click="confirmDeleteId = null"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </div>
      </li>
    </ul>

    <!-- Preview modal -->
    <AttachmentPreview
      :attachment="previewAttachment"
      :open="previewOpen"
      @close="previewOpen = false"
    />
  </div>
</template>
