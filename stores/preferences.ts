import { defineStore } from 'pinia'

export type ThemePreference = 'light' | 'dark' | 'system'

interface PreferencesState {
  theme: ThemePreference
}

const STORAGE_KEY = 'testcraft_preferences'

export const usePreferencesStore = defineStore('preferences', {
  state: (): PreferencesState => ({
    theme: 'light',
  }),

  actions: {
    setTheme(theme: ThemePreference): void {
      this.theme = theme
      this._persist()
      this._applyTheme()
    },

    initFromStorage(): void {
      if (import.meta.client) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
              this.theme = parsed.theme
            }
          }
        } catch {
          // Ignore parse errors, use defaults
        }
        this._applyTheme()
      }
    },

    _persist(): void {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: this.theme }))
      }
    },

    _applyTheme(): void {
      if (import.meta.client) {
        const colorMode = useColorMode()
        colorMode.preference = this.theme
      }
    },
  },
})
