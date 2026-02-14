<script setup lang="ts">
const { appName } = useRuntimeConfig().public
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo / Brand -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <div
            class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"
            aria-hidden="true"
          >
            <UIcon name="i-lucide-flask-conical" class="text-white text-xl" />
          </div>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ appName }}
          </span>
        </NuxtLink>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Modern test management platform
        </p>
      </div>

      <!-- Auth card -->
      <UCard class="shadow-lg">
        <slot />
      </UCard>

      <!-- Footer -->
      <p class="mt-8 text-center text-xs text-gray-400 dark:text-gray-400">
        &copy; {{ new Date().getFullYear() }} {{ appName }}. All rights reserved.
      </p>
    </div>
  </div>
</template>
