/**
 * Vitest setup file for unit tests.
 *
 * This file runs before all unit tests and sets up the test environment.
 * It provides mocks for browser-only APIs (localStorage, etc.) and
 * common Nuxt auto-imports that are not available in the test environment.
 */

// Mock localStorage for tests that use auth stores
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
