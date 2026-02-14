<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Sign In',
})

const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }

  loading.value = true
  try {
    await login({ email: email.value, password: password.value })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'data' in err) {
      const fetchError = err as { data?: { message?: string; statusMessage?: string } }
      error.value = fetchError.data?.message ?? fetchError.data?.statusMessage ?? 'Invalid email or password.'
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
        Sign in to your account
      </h2>
      <p data-testid="login-subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Welcome back! Enter your credentials to continue.
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

    <!-- Login form -->
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UFormField label="Email address" required>
        <UInput
          v-model="email"
          data-testid="login-email-input"
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
          data-testid="login-password-input"
          type="password"
          placeholder="Enter your password"
          icon="i-lucide-lock"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>

      <div class="flex items-center justify-between">
        <UCheckbox data-testid="login-remember-checkbox" label="Remember me" />
        <NuxtLink
          to="/auth/forgot-password"
          data-testid="login-forgot-password-link"
          class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Forgot password?
        </NuxtLink>
      </div>

      <UButton
        type="submit"
        data-testid="login-submit-button"
        block
        :loading="loading"
        size="lg"
      >
        Sign in
      </UButton>
    </form>

    <!-- Divider -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-default px-2 text-gray-500 dark:text-gray-400">
          Or continue with
        </span>
      </div>
    </div>

    <!-- OAuth buttons -->
    <div class="grid grid-cols-2 gap-3">
      <UButton
        variant="outline"
        color="neutral"
        data-testid="login-oauth-google"
        block
        icon="i-lucide-chrome"
      >
        Google
      </UButton>
      <UButton
        variant="outline"
        color="neutral"
        data-testid="login-oauth-facebook"
        block
        icon="i-lucide-facebook"
      >
        Facebook
      </UButton>
    </div>

    <!-- Register link -->
    <p class="text-center text-sm text-gray-500 dark:text-gray-400">
      Don't have an account?
      {{ ' ' }}
      <NuxtLink
        to="/auth/register"
        data-testid="login-signup-link"
        class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
      >
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>
