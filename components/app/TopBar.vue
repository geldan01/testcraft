<script setup lang="ts">
defineProps<{
  sidebarCollapsed: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const { currentUser, userInitials, logout } = useAuth()
const { currentProject } = useProject()
const route = useRoute()

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)
  const items: Array<{ label: string; to?: string; icon?: string }> = []

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`

    // Convert path segments to readable labels
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    // Redirect /projects breadcrumb to the project's parent organization
    let to: string | undefined = currentPath
    if (currentPath === '/projects') {
      const orgId = currentProject.value?.organizationId
      to = orgId ? `/organizations/${orgId}` : '/dashboard'
    }

    items.push({
      label,
      to,
    })
  }

  return items
})

const userMenuItems = computed(() => [
  [
    {
      label: currentUser.value?.name ?? 'User',
      slot: 'account',
      disabled: true,
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      onSelect: () => navigateTo('/settings'),
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => logout(),
    },
  ],
])
</script>

<template>
  <header
    data-testid="topbar"
    class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30"
  >
    <div class="flex items-center gap-4 min-w-0">
      <!-- Mobile sidebar toggle -->
      <button
        class="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label="Toggle sidebar"
        @click="emit('toggleSidebar')"
      >
        <UIcon name="i-lucide-menu" class="text-xl" />
      </button>

      <!-- Breadcrumbs -->
      <UBreadcrumb :items="breadcrumbs" class="hidden sm:flex" />
    </div>

    <div class="flex items-center gap-3">
      <!-- Organization switcher -->
      <AppOrgSwitcher />

      <!-- Notifications placeholder -->
      <UButton
        icon="i-lucide-bell"
        variant="ghost"
        color="neutral"
        size="sm"
        data-testid="topbar-notifications"
        aria-label="Notifications"
      />

      <!-- User menu -->
      <UDropdownMenu :items="userMenuItems">
        <UButton data-testid="topbar-user-menu" variant="ghost" color="neutral" class="p-0">
          <UAvatar
            :text="userInitials"
            :src="currentUser?.avatarUrl ?? undefined"
            size="sm"
            :alt="currentUser?.name ?? 'User'"
          />
        </UButton>
      </UDropdownMenu>
    </div>
  </header>
</template>
