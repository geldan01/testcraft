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

// Provide H3/Nitro server auto-imports as globals for server API handler tests.
// The Nuxt test environment handles Vue auto-imports but not server-side H3 utilities.
// defineEventHandler is an identity function (returns the handler itself).
// Other H3 functions are defined as no-ops here but overridden per-test via vi.stubGlobal.
import { vi } from 'vitest'

;(globalThis as Record<string, unknown>).defineEventHandler = (handler: Function) => handler
;(globalThis as Record<string, unknown>).getRouterParam = vi.fn()
;(globalThis as Record<string, unknown>).readBody = vi.fn()
;(globalThis as Record<string, unknown>).readMultipartFormData = vi.fn()
;(globalThis as Record<string, unknown>).getQuery = vi.fn()
;(globalThis as Record<string, unknown>).setResponseStatus = vi.fn()
;(globalThis as Record<string, unknown>).createError = (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}
