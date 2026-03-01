import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [totalUsers, activeUsers, suspendedUsers, totalOrganizations, totalProjects, totalTestCases] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.organization.count(),
      prisma.project.count(),
      prisma.testCase.count(),
    ])

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalOrganizations,
    totalProjects,
    totalTestCases,
  }
})
