import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { generateToken, userSelectFields } from '~/server/utils/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = loginSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      message: result.error.issues[0].message,
    })
  }

  const { email, password } = result.data

  // Find user by email (need passwordHash for verification)
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
  })

  if (!userWithPassword || !userWithPassword.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid email or password',
    })
  }

  // Verify password
  const isValid = await bcrypt.compare(password, userWithPassword.passwordHash)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid email or password',
    })
  }

  // Check user status
  if (userWithPassword.status !== 'ACTIVE') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Account is not active',
    })
  }

  // Get user without passwordHash
  const user = await prisma.user.findUnique({
    where: { id: userWithPassword.id },
    select: userSelectFields,
  })

  // Generate JWT
  const token = generateToken(userWithPassword.id, userWithPassword.email)

  return { user, token }
})
