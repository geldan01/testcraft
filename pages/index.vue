<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
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
