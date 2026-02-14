<script setup lang="ts">
const props = defineProps<{
  testRunId?: string
  testCaseId?: string
}>()

const emit = defineEmits<{
  uploaded: [attachment: any]
  error: [message: string]
}>()

const { uploadAttachment } = useAttachment()

const uploading = ref(false)
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFiles(Array.from(files))
  }
  // Reset input so the same file can be re-selected
  if (target) target.value = ''
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  dragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFiles(Array.from(files))
  }
}

async function handleFiles(files: File[]) {
  uploading.value = true

  for (const file of files) {
    const result = await uploadAttachment(file, props.testRunId, props.testCaseId)
    if (result) {
      emit('uploaded', result)
    } else {
      emit('error', `Failed to upload ${file.name}`)
    }
  }

  uploading.value = false
}
</script>

<template>
  <div
    data-testid="test-run-detail-file-uploader-zone"
    class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
    :class="[
      dragging
        ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    ]"
    @click="openFilePicker"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      @change="onFileSelected"
    />

    <div v-if="uploading" class="flex flex-col items-center gap-2">
      <UIcon name="i-lucide-loader-2" class="text-2xl text-indigo-500 animate-spin" />
      <p class="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
    </div>

    <div v-else class="flex flex-col items-center gap-2">
      <UIcon name="i-lucide-upload" class="text-2xl text-gray-400" />
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Drag and drop files here, or click to upload
      </p>
      <p class="text-xs text-gray-400">
        Screenshots, logs, or other evidence
      </p>
    </div>
  </div>
</template>
