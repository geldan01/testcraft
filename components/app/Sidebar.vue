<script setup lang="ts">
import type { NavigationItem } from '~/types'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const { appName } = useRuntimeConfig().public
const { currentOrg } = useOrganization()
const { currentProject } = useProject()

const mainNavItems = computed<NavigationItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
  },
  {
    label: 'Organizations',
    icon: 'i-lucide-building-2',
    to: '/organizations',
  },
])

const projectNavItems = computed<NavigationItem[]>(() => {
  const projectId = currentProject.value?.id
  if (!projectId) return []

  return [
    {
      label: 'Test Plans',
      icon: 'i-lucide-clipboard-list',
      to: `/projects/${projectId}/test-plans`,
    },
    {
      label: 'Test Suites',
      icon: 'i-lucide-folder-tree',
      to: `/projects/${projectId}/test-suites`,
    },
    {
      label: 'Test Cases',
      icon: 'i-lucide-test-tubes',
      to: `/projects/${projectId}/test-cases`,
    },
    {
      label: 'Runs History',
      icon: 'i-lucide-history',
      to: `/projects/${projectId}/runs`,
    },
    {
      label: 'Debug Queue',
      icon: 'i-lucide-bug',
      to: `/projects/${projectId}/debug-queue`,
    },
  ]
})

const bottomNavItems = computed<NavigationItem[]>(() => [
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings',
  },
])

function isActive(path: string): boolean {
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex flex-col transition-all duration-200"
    :class="collapsed ? 'w-16' : 'w-64'"
    data-testid="sidebar"
    role="navigation"
    aria-label="Main navigation"
  >
    <!-- Logo / Brand -->
    <div
      class="h-16 flex items-center border-b border-gray-200 dark:border-gray-800 px-4 shrink-0"
      :class="collapsed ? 'justify-center' : 'gap-3'"
    >
      <div
        class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <UIcon name="i-lucide-flask-conical" class="text-white text-base" />
      </div>
      <span
        v-if="!collapsed"
        data-testid="sidebar-brand"
        class="text-lg font-bold text-gray-900 dark:text-white truncate"
      >
        {{ appName }}
      </span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-6">
      <!-- Main nav -->
      <div>
        <p
          v-if="!collapsed"
          class="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider"
        >
          Navigation
        </p>
        <ul class="space-y-1">
          <li v-for="item in mainNavItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              :data-testid="`sidebar-nav-${item.label.toLowerCase().replace(/ /g, '-')}`"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                collapsed ? 'justify-center' : '',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <UIcon :name="item.icon" class="text-lg shrink-0" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Project nav (only when a project is selected) -->
      <div v-if="projectNavItems.length > 0">
        <p
          v-if="!collapsed"
          class="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider"
        >
          {{ currentProject?.name ?? 'Project' }}
        </p>
        <USeparator v-else class="mb-2" />
        <ul class="space-y-1">
          <li v-for="item in projectNavItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              :data-testid="`sidebar-nav-${item.label.toLowerCase().replace(/ /g, '-')}`"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                isActive(item.to)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                collapsed ? 'justify-center' : '',
              ]"
              :title="collapsed ? item.label : undefined"
            >
              <UIcon :name="item.icon" class="text-lg shrink-0" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-gray-200 dark:border-gray-800 py-4 px-2 space-y-1 shrink-0">
      <NuxtLink
        v-for="item in bottomNavItems"
        :key="item.to"
        :to="item.to"
        :data-testid="`sidebar-nav-${item.label.toLowerCase()}`"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="[
          isActive(item.to)
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
          collapsed ? 'justify-center' : '',
        ]"
        :title="collapsed ? item.label : undefined"
      >
        <UIcon :name="item.icon" class="text-lg shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </NuxtLink>

      <!-- Collapse toggle -->
      <button
        data-testid="sidebar-collapse-toggle"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
        :class="collapsed ? 'justify-center' : ''"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="emit('toggle')"
      >
        <UIcon
          :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          class="text-lg shrink-0"
        />
        <span v-if="!collapsed" class="truncate">Collapse</span>
      </button>
    </div>
  </aside>
</template>
