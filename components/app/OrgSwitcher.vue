<script setup lang="ts">
const { organizations, currentOrg, switchOrg } = useOrganization()

const orgMenuItems = computed(() => {
  const items = organizations.value.map((org) => ({
    label: org.name,
    icon: currentOrg.value?.id === org.id ? 'i-lucide-check' : undefined,
    onSelect: () => switchOrg(org.id),
  }))

  return [
    items,
    [
      {
        label: 'Create Organization',
        icon: 'i-lucide-plus',
        onSelect: () => navigateTo('/organizations'),
      },
    ],
  ]
})
</script>

<template>
  <UDropdownMenu :items="orgMenuItems">
    <UButton
      variant="ghost"
      color="neutral"
      size="sm"
      class="max-w-48"
      trailing-icon="i-lucide-chevrons-up-down"
    >
      <UIcon name="i-lucide-building-2" class="text-base shrink-0" />
      <span class="truncate hidden sm:inline">
        {{ currentOrg?.name ?? 'Select Org' }}
      </span>
    </UButton>
  </UDropdownMenu>
</template>
