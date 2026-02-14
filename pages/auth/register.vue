<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Create Account',
})

const { register } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

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

async function handleSubmit() {
  error.value = ''

  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields.'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }

  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    await register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const fetchError = err as { data?: { message?: string; statusMessage?: string } }
      error.value = fetchError.data?.message ?? fetchError.data?.statusMessage ?? 'Registration failed. Please try again.'
    } else {
      error.value = 'An error occurred. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p data-testid="register-subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Get started with TestCraft in seconds.
      </p>
    </div>

    <!-- Error message -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2"
      role="alert"
    >
      <UIcon name="i-lucide-alert-circle" class="text-red-500 text-lg shrink-0 mt-0.5" />
      <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    </div>

    <!-- Register form -->
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UFormField label="Full name" required>
        <UInput
          v-model="name"
          data-testid="register-name-input"
          type="text"
          placeholder="John Doe"
          icon="i-lucide-user"
          autocomplete="name"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Email address" required>
        <UInput
          v-model="email"
          data-testid="register-email-input"
          type="email"
          placeholder="you@example.com"
          icon="i-lucide-mail"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Password" required>
        <UInput
          v-model="password"
          data-testid="register-password-input"
          type="password"
          placeholder="Create a strong password"
          icon="i-lucide-lock"
          autocomplete="new-password"
          class="w-full"
        />
        <!-- Password strength indicator -->
        <div v-if="password" class="mt-2 space-y-1">
          <div class="flex gap-1">
            <div
              v-for="i in 5"
              :key="i"
              class="h-1 flex-1 rounded-full transition-colors"
              :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'"
            />
          </div>
          <p data-testid="register-password-strength" class="text-xs text-gray-500 dark:text-gray-400">
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
          data-testid="register-confirm-password-input"
          type="password"
          placeholder="Confirm your password"
          icon="i-lucide-lock"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        data-testid="register-submit-button"
        block
        :loading="loading"
        size="lg"
      >
        Create account
      </UButton>
    </form>

    <!-- Divider -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-default px-2 text-gray-500 dark:text-gray-400">
          Or sign up with
        </span>
      </div>
    </div>

    <!-- OAuth buttons -->
    <div class="grid grid-cols-2 gap-3">
      <UButton
        variant="outline"
        color="neutral"
        data-testid="register-oauth-google"
        block
        icon="i-lucide-chrome"
      >
        Google
      </UButton>
      <UButton
        variant="outline"
        color="neutral"
        data-testid="register-oauth-facebook"
        block
        icon="i-lucide-facebook"
      >
        Facebook
      </UButton>
    </div>

    <!-- Login link -->
    <p class="text-center text-sm text-gray-500 dark:text-gray-400">
      Already have an account?
      {{ ' ' }}
      <NuxtLink
        to="/auth/login"
        data-testid="register-signin-link"
        class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
      >
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
