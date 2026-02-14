import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
})

// Default RBAC permissions for a new organization
const DEFAULT_RBAC_PERMISSIONS: Array<{
  role: 'ORGANIZATION_MANAGER' | 'PROJECT_MANAGER' | 'PRODUCT_OWNER' | 'QA_ENGINEER' | 'DEVELOPER'
  objectType: 'TEST_SUITE' | 'TEST_PLAN' | 'TEST_CASE' | 'TEST_RUN' | 'REPORT'
  action: 'READ' | 'EDIT' | 'DELETE'
  allowed: boolean
}> = []

// Build default permissions: all roles get READ on everything;
// managers get full access; others get contextual access
const ROLES = ['ORGANIZATION_MANAGER', 'PROJECT_MANAGER', 'PRODUCT_OWNER', 'QA_ENGINEER', 'DEVELOPER'] as const
const OBJECT_TYPES = ['TEST_SUITE', 'TEST_PLAN', 'TEST_CASE', 'TEST_RUN', 'REPORT'] as const
const ACTIONS = ['READ', 'EDIT', 'DELETE'] as const

for (const role of ROLES) {
  for (const objectType of OBJECT_TYPES) {
    for (const action of ACTIONS) {
      let allowed = false
      if (role === 'ORGANIZATION_MANAGER') {
        allowed = true
      } else if (role === 'PROJECT_MANAGER') {
        allowed = true
      } else if (role === 'PRODUCT_OWNER') {
        allowed = action === 'READ' || action === 'EDIT'
      } else if (role === 'QA_ENGINEER') {
        allowed = action === 'READ' || action === 'EDIT'
      } else if (role === 'DEVELOPER') {
        allowed = action === 'READ'
      }
      DEFAULT_RBAC_PERMISSIONS.push({ role, objectType, action, allowed })
    }
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  const result = createOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    })
  }

  const { name } = result.data

  // Create organization with the creator as ORGANIZATION_MANAGER
  const organization = await prisma.organization.create({
    data: {
      name,
      members: {
        create: {
          userId: user.id,
          role: 'ORGANIZATION_MANAGER',
        },
      },
      rbacPermissions: {
        createMany: {
          data: DEFAULT_RBAC_PERMISSIONS,
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  })

  await logActivity(user.id, 'CREATED', 'Organization', organization.id, { name })

  setResponseStatus(event, 201)
  return organization
})
