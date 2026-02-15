<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
})

useSeoMeta({
  title: 'TestCraft - Test Case Management',
  description: 'Manage your test cases, plans, and runs with TestCraft.',
})

const authStore = useAuthStore()

// Initialize auth from storage
authStore.initFromStorage()

// Redirect based on auth state
if (authStore.token) {
  await navigateTo('/dashboard', { replace: true })
} else {
  await navigateTo('/auth/login', { replace: true })
}
</script>

<template>
  <div />
</template>
