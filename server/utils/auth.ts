import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { prisma } from './db'

interface JwtPayload {
  userId: string
  email: string
}

// Fields to select on User to avoid exposing passwordHash
export const userSelectFields = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  authProvider: true,
  isAdmin: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getUserFromEvent(event: H3Event) {
  // Try Authorization header first, then fall back to auth_token cookie
  // (cookie fallback is needed for browser-initiated requests like <img src>)
  const authHeader = getHeader(event, 'authorization')
  let token: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else {
    token = getCookie(event, 'auth_token')
  }

  if (!token) return null
  try {
    const config = useRuntimeConfig()
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: userSelectFields,
    })
    if (!user || user.status !== 'ACTIVE') return null
    return user
  } catch {
    return null
  }
}

export async function requireAuth(event: H3Event) {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
  return user
}

export function generateToken(userId: string, email: string): string {
  const config = useRuntimeConfig()
  return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '7d' })
}
