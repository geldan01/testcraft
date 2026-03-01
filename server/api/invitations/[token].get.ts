import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  rateLimit(event, { max: 20, windowSeconds: 60, key: 'get-invitation' })

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token is required' })
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  })

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Invitation not found' })
  }

  if (invitation.status !== 'PENDING') {
    const message = invitation.status === 'ACCEPTED'
      ? 'This invitation has already been accepted'
      : invitation.status === 'REVOKED'
        ? 'This invitation has been revoked'
        : 'This invitation has expired'
    throw createError({ statusCode: 410, statusMessage: message })
  }

  // Auto-expire if past expiresAt
  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    })
    throw createError({ statusCode: 410, statusMessage: 'This invitation has expired' })
  }

  // Check if a user with this email already exists and is ACTIVE
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
  })
  const existingActive = existingUser?.status === 'ACTIVE'

  return {
    organizationName: invitation.organization.name,
    invitedByName: invitation.invitedBy.name,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
    existingUser: existingActive,
  }
})
