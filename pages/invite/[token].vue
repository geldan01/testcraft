<script setup lang="ts">
import type { InvitationInfo, AcceptInvitationInput } from '~/types'

definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const token = computed(() => route.params.token as string)

const { getInvitationInfo, acceptInvitation } = useInvitation()
const authStore = useAuthStore()
const orgStore = useOrganizationStore()

// State
const loading = ref(true)
const info = ref<InvitationInfo | null>(null)
const fetchError = ref('')
const accepting = ref(false)
const acceptError = ref('')

// Registration fields (for new users)
const name = ref('')
const password = ref('')
const confirmPassword = ref('')

// Password strength
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { score: 0, label: '', color: '' }

  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' }
  return { score, label: 'Very Strong', color: 'bg-emerald-500' }
})

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true
  return password.value === confirmPassword.value
})

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Load invitation info
async function loadInvitation() {
  loading.value = true
  fetchError.value = ''
  try {
    const result = await getInvitationInfo(token.value)
    if (result) {
      info.value = result
      useSeoMeta({ title: `Join ${result.organizationName}` })
    } else {
      fetchError.value = 'This invitation is invalid, expired, or has already been used.'
    }
  } catch {
    fetchError.value = 'Failed to load invitation details.'
  } finally {
    loading.value = false
  }
}

await loadInvitation()

// Accept handler
async function handleAccept() {
  acceptError.value = ''

  const body: AcceptInvitationInput = {}
  if (!info.value?.existingUser) {
    if (!name.value || !password.value || !confirmPassword.value) {
      acceptError.value = 'Please fill in all fields.'
      return
    }
    if (password.value.length < 8) {
      acceptError.value = 'Password must be at least 8 characters.'
      return
    }
    if (!/[a-z]/.test(password.value)) {
      acceptError.value = 'Password must contain at least one lowercase letter.'
      return
    }
    if (!/[A-Z]/.test(password.value)) {
      acceptError.value = 'Password must contain at least one uppercase letter.'
      return
    }
    if (!/\d/.test(password.value)) {
      acceptError.value = 'Password must contain at least one digit.'
      return
    }
    if (!passwordsMatch.value) {
      acceptError.value = 'Passwords do not match.'
      return
    }
    body.name = name.value
    body.password = password.value
  }

  accepting.value = true
  try {
    const result = await acceptInvitation(token.value, body)
    authStore.user = result.user
    authStore.token = result.token
    authStore._persistToken(result.token)
    await orgStore.fetchOrganizations()
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    acceptError.value = err instanceof Error ? err.message : 'An error occurred. Please try again.'
  } finally {
    accepting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center py-8">
      <UIcon name="i-lucide-loader-2" class="text-3xl text-indigo-500 animate-spin mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading invitation...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="fetchError" class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
        <UIcon name="i-lucide-alert-circle" class="text-red-500 text-xl shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-red-700 dark:text-red-300">Invitation unavailable</p>
          <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ fetchError }}</p>
        </div>
      </div>
      <div class="text-center">
        <NuxtLink
          to="/auth/login"
          class="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Go to login
        </NuxtLink>
      </div>
    </div>

    <!-- Valid invitation -->
    <template v-else-if="info">
      <div class="text-center">
        <div class="w-14 h-14 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
          <UIcon name="i-lucide-building-2" class="text-2xl text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Join {{ info.organizationName }}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          <strong>{{ info.invitedByName }}</strong> invited you to join as a <strong>{{ formatRole(info.role) }}</strong>.
        </p>
      </div>

      <!-- Error message -->
      <div
        v-if="acceptError"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2"
        role="alert"
      >
        <UIcon name="i-lucide-alert-circle" class="text-red-500 text-lg shrink-0 mt-0.5" />
        <p class="text-sm text-red-700 dark:text-red-300">{{ acceptError }}</p>
      </div>

      <!-- Existing user: just confirm -->
      <div v-if="info.existingUser">
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          You already have an account with <strong>{{ info.email }}</strong>. Click below to join the organization.
        </p>
        <UButton
          block
          size="lg"
          :loading="accepting"
          icon="i-lucide-check"
          data-testid="invite-accept-button"
          @click="handleAccept"
        >
          Join Organization
        </UButton>
      </div>

      <!-- New user: registration form -->
      <form v-else class="space-y-4" @submit.prevent="handleAccept">
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          Create your account to join <strong>{{ info.organizationName }}</strong>.
        </p>

        <UFormField label="Email">
          <UInput
            :model-value="info.email"
            readonly
            type="email"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Full name" required>
          <UInput
            v-model="name"
            data-testid="invite-name-input"
            type="text"
            placeholder="John Doe"
            icon="i-lucide-user"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" required>
          <UInput
            v-model="password"
            data-testid="invite-password-input"
            type="password"
            placeholder="Create a strong password"
            icon="i-lucide-lock"
            autocomplete="new-password"
            class="w-full"
          />
          <div v-if="password" class="mt-2 space-y-1">
            <div class="flex gap-1">
              <div
                v-for="i in 5"
                :key="i"
                class="h-1 flex-1 rounded-full transition-colors"
                :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'"
              />
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Password strength: <span class="font-medium">{{ passwordStrength.label }}</span>
            </p>
          </div>
        </UFormField>

        <UFormField
          label="Confirm password"
          required
          :error="!passwordsMatch ? 'Passwords do not match' : undefined"
        >
          <UInput
            v-model="confirmPassword"
            data-testid="invite-confirm-password-input"
            type="password"
            placeholder="Confirm your password"
            icon="i-lucide-lock"
            autocomplete="new-password"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          data-testid="invite-accept-button"
          block
          :loading="accepting"
          size="lg"
          icon="i-lucide-check"
        >
          Create Account & Join
        </UButton>
      </form>

      <!-- Login link -->
      <p class="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?
        {{ ' ' }}
        <NuxtLink
          to="/auth/login"
          class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Sign in
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
