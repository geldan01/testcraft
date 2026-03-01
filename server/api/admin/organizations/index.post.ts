import { z } from 'zod'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  managerEmail: z.string().email('Invalid email address'),
})

// Default RBAC permissions matrix
const ROLES = ['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER'] as const
const OBJECT_TYPES = ['TEST_SUITE', 'TEST_PLAN', 'TEST_CASE', 'TEST_RUN', 'REPORT'] as const
const ACTIONS = ['READ', 'EDIT', 'DELETE'] as const

function buildDefaultRbacPermissions() {
  const permissions: Array<{
    role: (typeof ROLES)[number]
    objectType: (typeof OBJECT_TYPES)[number]
    action: (typeof ACTIONS)[number]
    allowed: boolean
  }> = []

  for (const role of ROLES) {
    for (const objectType of OBJECT_TYPES) {
      for (const action of ACTIONS) {
        let allowed = false
        if (role === 'ORGANIZATION_MANAGER' || role === 'PROJECT_MANAGER') {
          allowed = true
        } else if (role === 'PRODUCT_OWNER' || role === 'QA_ENGINEER') {
          allowed = action === 'READ' || action === 'EDIT'
        } else if (role === 'DEVELOPER') {
          allowed = action === 'READ'
        }
        permissions.push({ role, objectType, action, allowed })
      }
    }
  }
  return permissions
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event)
  const result = createOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0].message })
  }

  const { name, managerEmail } = result.data

  // Find the manager user
  const manager = await prisma.user.findUnique({ where: { email: managerEmail } })
  if (!manager) {
    throw createError({ statusCode: 404, statusMessage: `User with email ${managerEmail} not found` })
  }

  const organization = await prisma.organization.create({
    data: {
      name,
      members: {
        create: {
          userId: manager.id,
          role: 'ORGANIZATION_MANAGER',
        },
      },
      rbacPermissions: {
        createMany: { data: buildDefaultRbacPermissions() },
      },
    },
    include: {
      _count: { select: { members: true, projects: true } },
    },
  })

  await logActivity(admin.id, 'CREATED', 'Organization', organization.id, { name, managerEmail })

  setResponseStatus(event, 201)
  return organization
})
