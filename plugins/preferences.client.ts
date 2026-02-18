import { usePreferencesStore } from '~/stores/preferences'

export default defineNuxtPlugin(() => {
  const prefsStore = usePreferencesStore()
  prefsStore.initFromStorage()
})
