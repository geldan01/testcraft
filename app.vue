<script setup lang="ts">
const { appName } = useRuntimeConfig().public

useHead({
  titleTemplate: (title) => title ? `${title} - ${appName}` : appName,
  htmlAttrs: { lang: 'en' },
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="#6366f1" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
