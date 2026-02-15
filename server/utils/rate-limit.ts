import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)

/**
 * Simple in-memory rate limiter for server API routes.
 * Throws a 429 error if the limit is exceeded.
 * Disabled in development mode to avoid interfering with tests.
 */
export function rateLimit(
  event: H3Event,
  options: {
    /** Maximum requests allowed within the window */
    max: number
    /** Time window in seconds */
    windowSeconds: number
    /** Key prefix to namespace different limiters */
    key?: string
  },
): void {
  if (process.dev) return

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const storeKey = `${options.key ?? 'default'}:${ip}`
  const now = Date.now()

  const entry = store.get(storeKey)

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + options.windowSeconds * 1000 })
    return
  }

  entry.count++

  if (entry.count > options.max) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    })
  }
}
