import type { H3Event } from 'h3'
import { prisma } from './db'

type RbacAction = 'READ' | 'EDIT' | 'DELETE'
type ObjectType = 'TEST_CASE' | 'TEST_PLAN' | 'TEST_SUITE' | 'TEST_RUN' | 'COMMENT'

/**
 * Check if a user's role allows a specific action on an object type.
 * Looks up the RbacPermission table for the user's org membership role.
 * If no RBAC entry exists, falls back to a default matrix.
 */
export async function checkRbacPermission(
  userId: string,
  organizationId: string,
  objectType: ObjectType,
  action: RbacAction,
): Promise<boolean> {
  // Look up the user's membership to get their role
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  })

  if (!membership) return false

  // ORGANIZATION_MANAGER and PROJECT_MANAGER always have full access
  if (membership.role === 'ORGANIZATION_MANAGER' || membership.role === 'PROJECT_MANAGER') {
    return true
  }

  // Check the RBAC permissions table
  const permission = await prisma.rbacPermission.findFirst({
    where: {
      organizationId,
      role: membership.role,
      objectType,
      action,
    },
  })

  // If an explicit permission exists, use it
  if (permission) return permission.allowed

  // Default fallback: QA_ENGINEER and PRODUCT_OWNER can edit, DEVELOPER is read-only
  if (action === 'READ') return true
  if (membership.role === 'QA_ENGINEER' || membership.role === 'PRODUCT_OWNER') return true
  return false
}

/**
 * Require RBAC permission or throw 403.
 * Returns the membership for further use.
 */
export async function requireRbacPermission(
  userId: string,
  organizationId: string,
  objectType: ObjectType,
  action: RbacAction,
): Promise<void> {
  const allowed = await checkRbacPermission(userId, organizationId, objectType, action)
  if (!allowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to perform this action',
    })
  }
}
