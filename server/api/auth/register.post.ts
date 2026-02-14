import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { generateToken } from '~/server/utils/auth'
import { userSelectFields } from '~/server/utils/auth'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = registerSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      message: result.error.issues[0].message,
    })
  }

  const { name, email, password } = result.data

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'A user with this email already exists',
    })
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Check if this is the first user (make them admin)
  const userCount = await prisma.user.count()
  const isAdmin = userCount === 0

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      authProvider: 'EMAIL',
      isAdmin,
    },
    select: userSelectFields,
  })

  // Generate JWT
  const token = generateToken(user.id, user.email)

  setResponseStatus(event, 201)
  return { user, token }
})
