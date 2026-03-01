import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { logActivity } from '~/server/utils/activity'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const orgId = getRouterParam(event, 'id')
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization ID is required' })
  }

  const organization = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!organization) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  await prisma.organization.delete({ where: { id: orgId } })

  await logActivity(admin.id, 'DELETED', 'Organization', orgId, { name: organization.name })

  return { message: 'Organization deleted successfully' }
})
