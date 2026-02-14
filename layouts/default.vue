<script setup lang="ts">
const sidebarCollapsed = useState('sidebar-collapsed', () => false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
    <!-- Sidebar -->
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

    <!-- Main content area -->
    <div
      class="flex-1 flex flex-col min-h-screen transition-all duration-200"
      :class="sidebarCollapsed ? 'ml-16' : 'ml-64'"
    >
      <!-- Top bar -->
      <AppTopBar :sidebar-collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />

      <!-- Page content -->
      <main class="flex-1 p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
