import { prisma } from './db'

/**
 * Recalculates and updates a TestCase's lastRunStatus and lastRunAt
 * based on the most recent TestRun for that test case.
 *
 * Should be called after any TestRun mutation (create, update, delete)
 * that may change which run is the latest.
 */
export async function updateTestCaseLastRun(testCaseId: string): Promise<void> {
  const latestRun = await prisma.testRun.findFirst({
    where: { testCaseId },
    orderBy: { executedAt: 'desc' },
    select: { status: true, executedAt: true },
  })

  await prisma.testCase.update({
    where: { id: testCaseId },
    data: {
      lastRunStatus: latestRun ? latestRun.status : 'NOT_RUN',
      lastRunAt: latestRun?.executedAt ?? null,
    },
  })
}
