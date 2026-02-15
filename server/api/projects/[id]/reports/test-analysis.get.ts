import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { buildReportWhereClause } from '~/server/utils/reportFilters'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project ID is required' })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: project.organizationId,
        userId: user.id,
      },
    },
  })

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this project' })
  }

  const query = getQuery(event)
  const type = query.type as string
  const limit = Math.min(Number(query.limit) || 10, 50)

  if (!type || !['flaky', 'top-failing'].includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Query parameter "type" must be "flaky" or "top-failing"' })
  }

  const where = buildReportWhereClause({
    projectId,
    timeRange: query.timeRange as string | undefined,
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
    scope: query.scope as string | undefined,
    scopeId: query.scopeId as string | undefined,
  })

  // Group runs by testCaseId and status
  const groups = await prisma.testRun.groupBy({
    by: ['testCaseId', 'status'],
    _count: { id: true },
    where,
  })

  // Aggregate per test case
  const caseMap = new Map<string, { totalRuns: number; passCount: number; failCount: number }>()

  for (const g of groups) {
    const data = caseMap.get(g.testCaseId) ?? { totalRuns: 0, passCount: 0, failCount: 0 }
    data.totalRuns += g._count.id
    if (g.status === 'PASS') data.passCount += g._count.id
    if (g.status === 'FAIL') data.failCount += g._count.id
    caseMap.set(g.testCaseId, data)
  }

  let testCaseIds: string[]

  if (type === 'flaky') {
    // Flaky: tests with both PASS and FAIL results
    const flaky = Array.from(caseMap.entries())
      .filter(([, d]) => d.passCount > 0 && d.failCount > 0)
      .map(([id, d]) => ({
        id,
        ...d,
        flakinessScore: Math.round((d.failCount / d.totalRuns) * 100),
      }))
      .sort((a, b) => b.flakinessScore - a.flakinessScore)
      .slice(0, limit)

    testCaseIds = flaky.map(t => t.id)

    // Fetch test case details
    const testCases = await prisma.testCase.findMany({
      where: { id: { in: testCaseIds } },
      select: { id: true, name: true, debugFlag: true, lastRunAt: true },
    })

    const caseDetails = new Map(testCases.map(tc => [tc.id, tc]))

    return {
      tests: flaky.map(t => ({
        testCaseId: t.id,
        testCaseName: caseDetails.get(t.id)?.name ?? 'Unknown',
        totalRuns: t.totalRuns,
        passCount: t.passCount,
        failCount: t.failCount,
        flakinessScore: t.flakinessScore,
        debugFlag: caseDetails.get(t.id)?.debugFlag ?? false,
        lastRunAt: caseDetails.get(t.id)?.lastRunAt?.toISOString() ?? null,
      })),
    }
  } else {
    // Top failing: sorted by fail count descending
    const failing = Array.from(caseMap.entries())
      .filter(([, d]) => d.failCount > 0)
      .map(([id, d]) => ({
        id,
        ...d,
        failRate: Math.round((d.failCount / d.totalRuns) * 100),
      }))
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, limit)

    testCaseIds = failing.map(t => t.id)

    const testCases = await prisma.testCase.findMany({
      where: { id: { in: testCaseIds } },
      select: { id: true, name: true, debugFlag: true, lastRunAt: true },
    })

    const caseDetails = new Map(testCases.map(tc => [tc.id, tc]))

    // Get last failed date for each test case
    const lastFailedRuns = testCaseIds.length > 0
      ? await prisma.testRun.findMany({
          where: {
            testCaseId: { in: testCaseIds },
            status: 'FAIL',
          },
          orderBy: { executedAt: 'desc' },
          select: { testCaseId: true, executedAt: true },
          distinct: ['testCaseId'],
        })
      : []

    const lastFailedMap = new Map(lastFailedRuns.map(r => [r.testCaseId, r.executedAt]))

    return {
      tests: failing.map(t => ({
        testCaseId: t.id,
        testCaseName: caseDetails.get(t.id)?.name ?? 'Unknown',
        failCount: t.failCount,
        totalRuns: t.totalRuns,
        failRate: t.failRate,
        debugFlag: caseDetails.get(t.id)?.debugFlag ?? false,
        lastFailedAt: lastFailedMap.get(t.id)?.toISOString() ?? null,
      })),
    }
  }
})
