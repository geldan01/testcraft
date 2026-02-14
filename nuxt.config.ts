export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  ssr: process.env.NUXT_SSR !== 'false',
  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@formkit/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    public: {
      appName: 'TestCraft',
    },
  },
})
