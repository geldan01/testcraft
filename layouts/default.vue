<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-gray-800 text-white px-6 py-4">
      <nav class="max-w-7xl mx-auto">
        <h1 class="text-xl font-semibold">TestCraft</h1>
      </nav>
    </header>

    <main class="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
      <slot />
    </main>

    <footer class="bg-gray-100 text-gray-600 px-6 py-4">
      <div class="max-w-7xl mx-auto text-sm">
        &copy; {{ new Date().getFullYear() }} TestCraft
      </div>
    </footer>
  </div>
</template>
