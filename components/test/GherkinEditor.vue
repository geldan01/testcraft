<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const content = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Parse Gherkin for syntax highlighting preview
const highlightedContent = computed(() => {
  if (!content.value) return ''

  return content.value
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('Feature:')) {
        return `<span class="text-purple-600 dark:text-purple-400 font-bold">${escapeHtml(line)}</span>`
      }
      if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
        return `<span class="text-blue-600 dark:text-blue-400 font-bold">${escapeHtml(line)}</span>`
      }
      if (trimmed.startsWith('Background:')) {
        return `<span class="text-teal-600 dark:text-teal-400 font-bold">${escapeHtml(line)}</span>`
      }
      if (/^\s*(Given|When|Then|And|But)\s/.test(line)) {
        const keyword = line.match(/^\s*(Given|When|Then|And|But)\s/)?.[1] ?? ''
        const rest = line.replace(/^\s*(Given|When|Then|And|But)\s/, '')
        const indent = line.match(/^\s*/)?.[0] ?? ''
        return `${indent}<span class="text-green-600 dark:text-green-400 font-semibold">${keyword}</span> ${escapeHtml(rest)}`
      }
      if (trimmed.startsWith('#')) {
        return `<span class="text-gray-400 dark:text-gray-400 italic">${escapeHtml(line)}</span>`
      }
      if (trimmed.startsWith('@')) {
        return `<span class="text-orange-500 dark:text-orange-400">${escapeHtml(line)}</span>`
      }
      if (trimmed.startsWith('|')) {
        return `<span class="text-gray-600 dark:text-gray-300">${escapeHtml(line)}</span>`
      }
      if (trimmed.startsWith('Examples:')) {
        return `<span class="text-indigo-600 dark:text-indigo-400 font-bold">${escapeHtml(line)}</span>`
      }

      return escapeHtml(line)
    })
    .join('\n')
})

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

const placeholder = `Feature: User Login
  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user enters "user@example.com" as email
    And the user enters "password123" as password
    And the user clicks the "Sign in" button
    Then the user should be redirected to the dashboard
    And the user should see a welcome message`

const showPreview = ref(false)
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Gherkin Syntax
      </h3>
      <UButton
        :icon="showPreview ? 'i-lucide-code' : 'i-lucide-eye'"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="showPreview = !showPreview"
      >
        {{ showPreview ? 'Edit' : 'Preview' }}
      </UButton>
    </div>

    <!-- Editor -->
    <UTextarea
      v-if="!showPreview"
      v-model="content"
      :placeholder="placeholder"
      :rows="12"
      class="font-mono text-sm w-full"
    />

    <!-- Preview with syntax highlighting -->
    <div
      v-else
      class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-50"
    >
      <pre
        v-if="highlightedContent"
        class="font-mono text-sm whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200"
        v-html="highlightedContent"
      />
      <p v-else class="text-sm text-gray-400 dark:text-gray-400 italic">
        No Gherkin syntax written yet.
      </p>
    </div>
  </div>
</template>
