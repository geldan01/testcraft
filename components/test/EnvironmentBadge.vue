<script setup lang="ts">
const props = defineProps<{
  environment: string
}>()

type BadgeColor = 'info' | 'warning' | 'error' | 'success' | 'neutral'

const colorMap: Record<string, BadgeColor> = {
  development: 'info',
  staging: 'warning',
  production: 'error',
  qa: 'success',
}

const badgeColor = computed<BadgeColor>(() => {
  return colorMap[props.environment.toLowerCase()] ?? 'neutral'
})

const displayName = computed(() => {
  const name = props.environment
  return name.charAt(0).toUpperCase() + name.slice(1)
})
</script>

<template>
  <UBadge
    :color="badgeColor"
    size="sm"
    variant="subtle"
  >
    {{ displayName }}
  </UBadge>
</template>
