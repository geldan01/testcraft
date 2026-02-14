<script setup lang="ts">
import type { TestStep, TestType, CreateTestCaseInput } from '~/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Create Test Case',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { createTestCase } = useTestCase()

const name = ref('')
const description = ref('')
const testType = ref<TestType>('STEP_BASED')
const preconditions = ref<string[]>([])
const steps = ref<TestStep[]>([])
const gherkinSyntax = ref('')
const newPrecondition = ref('')
const submitting = ref(false)
const error = ref('')

function addPrecondition() {
  if (newPrecondition.value.trim()) {
    preconditions.value.push(newPrecondition.value.trim())
    newPrecondition.value = ''
  }
}

function removePrecondition(index: number) {
  preconditions.value.splice(index, 1)
}

const isValid = computed(() => {
  if (!name.value.trim()) return false
  if (testType.value === 'STEP_BASED' && steps.value.length === 0) return false
  if (testType.value === 'GHERKIN' && !gherkinSyntax.value.trim()) return false
  return true
})

async function handleSubmit() {
  if (!isValid.value) return

  error.value = ''
  submitting.value = true

  try {
    const data: CreateTestCaseInput = {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      projectId: projectId.value,
      testType: testType.value,
      preconditions: preconditions.value.length > 0 ? preconditions.value : undefined,
    }

    if (testType.value === 'STEP_BASED') {
      data.steps = steps.value
    } else {
      data.gherkinSyntax = gherkinSyntax.value
    }

    const result = await createTestCase(data)
    if (result) {
      await navigateTo(`/projects/${projectId.value}/test-cases/${result.id}`)
    } else {
      error.value = 'Failed to create test case. Please try again.'
    }
  } catch {
    error.value = 'An error occurred. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create Test Case</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400" data-testid="test-case-create-subtitle">
          Define a new test case with steps or Gherkin syntax.
        </p>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-x"
        data-testid="test-case-create-cancel-button"
        @click="navigateTo(`/projects/${projectId}/test-cases`)"
      >
        Cancel
      </UButton>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2"
      role="alert"
    >
      <UIcon name="i-lucide-alert-circle" class="text-red-500 text-lg shrink-0 mt-0.5" />
      <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Basic info -->
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold">Basic Information</h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Test case name" required>
            <UInput
              v-model="name"
              placeholder="e.g., Verify user login with valid credentials"
              class="w-full"
              data-testid="test-case-create-name-input"
            />
          </UFormField>

          <UFormField label="Description">
            <UTextarea
              v-model="description"
              placeholder="Describe what this test case validates..."
              :rows="3"
              class="w-full"
              data-testid="test-case-create-description-input"
            />
          </UFormField>

          <!-- Test type toggle -->
          <UFormField label="Test type" required>
            <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-l-lg transition-colors"
                :class="testType === 'STEP_BASED'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                data-testid="test-case-create-step-based-button"
                @click="testType = 'STEP_BASED'"
              >
                Step-Based
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-r-lg transition-colors"
                :class="testType === 'GHERKIN'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                data-testid="test-case-create-gherkin-button"
                @click="testType = 'GHERKIN'"
              >
                Gherkin (BDD)
              </button>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- Preconditions -->
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold">Preconditions</h2>
        </template>
        <div class="space-y-3">
          <div class="flex gap-2">
            <UInput
              v-model="newPrecondition"
              placeholder="Add a precondition..."
              class="flex-1"
              data-testid="test-case-create-precondition-input"
              @keydown.enter.prevent="addPrecondition"
            />
            <UButton
              icon="i-lucide-plus"
              variant="soft"
              data-testid="test-case-create-add-precondition-button"
              @click="addPrecondition"
            >
              Add
            </UButton>
          </div>

          <ul v-if="preconditions.length > 0" class="space-y-2">
            <li
              v-for="(pre, index) in preconditions"
              :key="index"
              class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
            >
              <UIcon name="i-lucide-check-square" class="text-green-500 shrink-0" />
              <span class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ pre }}</span>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="error"
                size="xs"
                aria-label="Remove precondition"
                @click="removePrecondition(index)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-gray-400 dark:text-gray-400 italic">
            No preconditions added.
          </p>
        </div>
      </UCard>

      <!-- Step builder or Gherkin editor -->
      <UCard>
        <template v-if="testType === 'STEP_BASED'">
          <TestStepBuilder v-model="steps" />
        </template>
        <template v-else>
          <TestGherkinEditor v-model="gherkinSyntax" />
        </template>
      </UCard>

      <!-- Submit -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <UButton
          variant="ghost"
          color="neutral"
          data-testid="test-case-create-cancel-button"
          @click="navigateTo(`/projects/${projectId}/test-cases`)"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          :loading="submitting"
          :disabled="!isValid"
          icon="i-lucide-check"
          data-testid="test-case-create-submit-button"
        >
          Create Test Case
        </UButton>
      </div>
    </form>
  </div>
</template>
