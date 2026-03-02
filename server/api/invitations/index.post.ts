import crypto from 'node:crypto'
import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'
import { sendInvitationEmail } from '~/server/utils/email'

const createInvitationSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER']),
})

export default defineEventHandler(async (event) => {
  rateLimit(event, { max: 10, windowSeconds: 60, key: 'create-invitation' })

  const user = await requireAuth(event)

  const body = await readBody(event)
  const result = createInvitationSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { organizationId, email, role } = result.data

  // Check user is ORGANIZATION_MANAGER of this org (or super admin)
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  })

  if (!user.isAdmin && (!membership || membership.role !== 'ORGANIZATION_MANAGER')) {
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can invite members' })
  }

  // Check if email is already an active member
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: existingUser.id,
        },
      },
    })
    if (existingMembership) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This user is already a member of this organization',
      })
    }
  }

  // Revoke any existing pending invitation for the same org + email
  await prisma.invitation.updateMany({
    where: {
      organizationId,
      email,
      status: 'PENDING',
    },
    data: { status: 'REVOKED' },
  })

  // Create invitation with secure token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      token,
      organizationId,
      email,
      role,
      invitedById: user.id,
      expiresAt,
    },
    include: {
      organization: { select: { name: true } },
    },
  })

  await logActivity(user.id, 'CREATED', 'Invitation', invitation.id, { email, role })

  const origin = getRequestURL(event).origin
  const inviteUrl = `${origin}/invite/${invitation.token}`

  // Attempt to send email via SMTP — failure doesn't break the invitation flow
  const emailSent = await sendInvitationEmail(email, invitation.organization.name, user.name, role, inviteUrl)

  setResponseStatus(event, 201)
  return { invitation, inviteUrl, emailSent }
})
