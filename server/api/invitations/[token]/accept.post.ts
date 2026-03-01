import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/db'
import { generateToken, userSelectFields } from '~/server/utils/auth'
import { logActivity } from '~/server/utils/activity'

const acceptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .optional(),
})

export default defineEventHandler(async (event) => {
  rateLimit(event, { max: 5, windowSeconds: 60, key: 'accept-invitation' })

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token is required' })
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { id: true, name: true } },
    },
  })

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Invitation not found' })
  }

  if (invitation.status !== 'PENDING') {
    throw createError({ statusCode: 410, statusMessage: 'This invitation is no longer valid' })
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    throw createError({ statusCode: 410, statusMessage: 'This invitation has expired' })
  }

  const body = await readBody(event)
  const parseResult = acceptSchema.safeParse(body || {})
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parseResult.error.issues[0].message,
    })
  }

  const { name, password } = parseResult.data

  // Look up user by invitation email
  let existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  })

  let userId: string

  if (!existingUser) {
    // Case A: No user exists — registration required
    if (!name || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and password are required to create your account',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newUser = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
        passwordHash,
        authProvider: 'EMAIL',
        status: 'ACTIVE',
      },
      select: userSelectFields,
    })
    userId = newUser.id
  } else if (existingUser.status === 'PENDING_INVITATION') {
    // Case B: PENDING_INVITATION user — complete registration
    if (!name || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and password are required to create your account',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        status: 'ACTIVE',
      },
    })
    userId = existingUser.id
  } else if (existingUser.status === 'ACTIVE') {
    // Case C: Active user — just add to org
    userId = existingUser.id
  } else {
    throw createError({
      statusCode: 403,
      statusMessage: 'Your account is suspended. Please contact an administrator.',
    })
  }

  // Create membership + update invitation in a transaction
  await prisma.$transaction(async (tx) => {
    // Check for existing membership (in case of race condition)
    const existing = await tx.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId,
        },
      },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You are already a member of this organization',
      })
    }

    await tx.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
      },
    })

    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })
  })

  await logActivity(userId, 'CREATED', 'OrganizationMember', invitation.organizationId, {
    via: 'invitation',
    invitationId: invitation.id,
  })

  // Fetch the final user and generate JWT
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: userSelectFields,
  })

  const jwt = generateToken(user.id, user.email)

  setResponseStatus(event, 200)
  return { user, token: jwt }
})
