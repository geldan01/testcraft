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

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  build: {
    transpile: ['echarts', 'vue-echarts', 'resize-detector'],
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    emailFrom: process.env.EMAIL_FROM || 'TestCraft <noreply@testcraft.io>',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    public: {
      appName: 'TestCraft',
    },
  },
})
