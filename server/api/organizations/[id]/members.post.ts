import { z } from 'zod'
import { requireAuth, userSelectFields } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER']),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const orgId = getRouterParam(event, 'id')

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID is required' })
  }

  // Check user is ORGANIZATION_MANAGER
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: user.id,
      },
    },
  })

  if (!membership || membership.role !== 'ORGANIZATION_MANAGER') {
    throw createError({ statusCode: 403, statusMessage: 'Only organization managers can invite members' })
  }

  const body = await readBody(event)
  const result = inviteMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { email, role } = result.data

  // Find existing user or create a pending invitation user
  let targetUser = await prisma.user.findUnique({ where: { email } })

  if (!targetUser) {
    // Create a pending invitation user
    targetUser = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        authProvider: 'EMAIL',
        status: 'PENDING_INVITATION',
      },
    })
  }

  // Check if user is already a member
  const existingMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: targetUser.id,
      },
    },
  })

  if (existingMembership) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User is already a member of this organization',
    })
  }

  // Add member
  const newMember = await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId: targetUser.id,
      role,
    },
    include: {
      user: { select: userSelectFields },
    },
  })

  await logActivity(user.id, 'CREATED', 'OrganizationMember', newMember.id, { email, role })

  setResponseStatus(event, 201)
  return newMember
})
