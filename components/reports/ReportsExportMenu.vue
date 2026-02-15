<script setup lang="ts">
defineProps<{
  loading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  export: [format: 'pdf' | 'csv' | 'json']
}>()

const items = [
  [
    {
      label: 'Export as PDF',
      icon: 'i-lucide-file-text',
      click: () => emit('export', 'pdf'),
    },
    {
      label: 'Export as CSV',
      icon: 'i-lucide-file-spreadsheet',
      click: () => emit('export', 'csv'),
    },
    {
      label: 'Export as JSON',
      icon: 'i-lucide-braces',
      click: () => emit('export', 'json'),
    },
  ],
]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      data-testid="reports-export-btn"
      icon="i-lucide-download"
      variant="outline"
      color="neutral"
      size="sm"
      :loading="loading"
      :disabled="disabled"
    >
      Export
    </UButton>
  </UDropdownMenu>
</template>
