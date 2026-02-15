import type { Page } from '@playwright/test'

/**
 * Strip SSR-hydrated state so client-side API mocks control all data.
 *
 * When the dev server has SSR enabled (e.g. reusing an existing server locally),
 * the server pre-populates Pinia stores with real DB data and renders HTML
 * with that data. This causes Vue hydration mismatches when client-side mocks
 * return different data, leaving stale server-rendered DOM elements.
 *
 * This helper:
 * 1. Strips the Pinia state from the __NUXT__ payload
 * 2. Sets serverRendered to false so Vue skips hydration and renders fresh
 *
 * Call this before page.goto() in any test that relies on API mocking.
 */
export async function clearServerState(page: Page) {
  await page.addInitScript(() => {
    let _nuxtValue: any
    Object.defineProperty(window, '__NUXT__', {
      get() { return _nuxtValue },
      set(val) {
        if (val && typeof val === 'object') {
          // Remove server-hydrated Pinia state
          if ('pinia' in val) delete val.pinia
          // Tell Nuxt this wasn't server-rendered so Vue renders fresh
          // instead of trying to hydrate the server-rendered DOM
          val.serverRendered = false
        }
        _nuxtValue = val
      },
      configurable: true,
      enumerable: true,
    })
  })
}

export async function mockProjectApi(page: Page, projectId: string, project: object) {
  await page.route(`**/api/projects/${projectId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(project),
    })
  })
}

export async function mockProjectNotFoundApi(page: Page, projectId: string) {
  await page.route(`**/api/projects/${projectId}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 404, message: 'Not found' }),
    })
  })
}

export async function mockProjectStatsApi(page: Page, stats: object) {
  await page.route('**/api/projects/*/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stats),
    })
  })
}

export async function mockActivityApi(page: Page, activities: object[]) {
  await page.route('**/api/activity*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: activities }),
    })
  })
}

export async function mockProjectsListApi(page: Page, projects: object[]) {
  await page.route('**/api/organizations/*/projects', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    })
  })
}

export async function mockDashboardApis(page: Page, opts: {
  projects?: object[]
  stats?: object
  activity?: object[]
}) {
  await mockProjectsListApi(page, opts.projects ?? [])
  if (opts.stats) await mockProjectStatsApi(page, opts.stats)
  await mockActivityApi(page, opts.activity ?? [])
}

export async function mockTestCasesListApi(page: Page, projectId: string, testCases: object[], paginated = true) {
  await page.route(`**/api/projects/${projectId}/test-cases*`, async (route) => {
    const body = paginated
      ? { data: testCases, total: testCases.length, page: 1, limit: 20, totalPages: Math.ceil(testCases.length / 20) || 1 }
      : testCases
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

export async function mockTestCaseDetailApis(page: Page, caseId: string, opts: {
  testCase: object
  runs?: object[]
  comments?: object[]
  attachments?: object[]
}) {
  await page.route(`**/api/test-cases/${caseId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.testCase),
    })
  })

  await page.route(`**/api/test-cases/${caseId}/runs`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.runs ?? []),
    })
  })

  await page.route(`**/api/test-cases/${caseId}/comments`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.comments ?? []),
    })
  })

  await page.route(`**/api/test-cases/${caseId}/attachments`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.attachments ?? []),
    })
  })
}

export async function mockTestCaseNotFoundApis(page: Page, caseId: string) {
  await page.route(`**/api/test-cases/${caseId}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 404, message: 'Not found' }),
    })
  })

  await page.route(`**/api/test-cases/${caseId}/runs`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.route(`**/api/test-cases/${caseId}/comments`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })

  await page.route(`**/api/test-cases/${caseId}/attachments`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  })
}

export async function mockTestPlansListApi(page: Page, projectId: string, plans: object[]) {
  await page.route(`**/api/projects/${projectId}/test-plans*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: plans, total: plans.length, page: 1, limit: 20, totalPages: 1 }),
    })
  })
}

export async function mockTestPlanDetailApi(page: Page, planId: string, plan: object) {
  await page.route(`**/api/test-plans/${planId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(plan),
    })
  })
}

export async function mockTestPlanNotFoundApi(page: Page, planId: string) {
  await page.route(`**/api/test-plans/${planId}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 404, message: 'Not found' }),
    })
  })
}

export async function mockTestSuitesListApi(page: Page, projectId: string, suites: object[]) {
  await page.route(`**/api/projects/${projectId}/test-suites*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: suites, total: suites.length, page: 1, limit: 20, totalPages: 1 }),
    })
  })
}

export async function mockTestSuiteDetailApi(page: Page, suiteId: string, suite: object) {
  await page.route(`**/api/test-suites/${suiteId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(suite),
    })
  })
}

export async function mockTestSuiteNotFoundApi(page: Page, suiteId: string) {
  await page.route(`**/api/test-suites/${suiteId}`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: 404, message: 'Not found' }),
    })
  })
}

export async function mockTestRunsListApi(page: Page, projectId: string, runs: object[]) {
  await page.route(`**/api/projects/${projectId}/test-runs*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: runs,
        total: runs.length,
        page: 1,
        limit: 20,
        totalPages: Math.ceil(runs.length / 20) || 1,
      }),
    })
  })
}

export async function mockOrgDetailApis(page: Page, orgId: string, opts: {
  org: object
  members?: object[]
  rbac?: object[]
  projects?: object[]
}) {
  await page.route(`**/api/organizations/${orgId}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(opts.org),
      })
    } else {
      await route.continue()
    }
  })

  await page.route(`**/api/organizations/${orgId}/members`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.members ?? []),
    })
  })

  await page.route(`**/api/organizations/${orgId}/rbac`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.rbac ?? []),
    })
  })

  if (opts.projects) {
    await page.route(`**/api/organizations/${orgId}/projects`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(opts.projects),
      })
    })
  }
}

export async function mockSettingsApis(page: Page, orgId: string, opts: {
  members?: object[]
  rbac?: object[]
}) {
  await page.route(`**/api/organizations/${orgId}/members`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.members ?? []),
    })
  })

  await page.route(`**/api/organizations/${orgId}/rbac`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(opts.rbac ?? []),
    })
  })
}

export async function mockLoginApi(page: Page, response: object) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

export async function mockLoginFailApi(page: Page, status = 401, message = 'Invalid email or password') {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ statusCode: status, message }),
    })
  })
}

export async function mockRegisterApi(page: Page, response: object) {
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

export async function mockLogoutApi(page: Page) {
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })
}

export async function mockCreateTestRunApi(page: Page, response: object) {
  await page.route('**/api/test-runs', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    }
  })
}

export async function mockCreateCommentApi(page: Page, response: object) {
  await page.route('**/api/comments', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    }
  })
}

export async function mockCreateOrgApi(page: Page, response: object) {
  await page.route('**/api/organizations', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockStartTestRunApi(page: Page, response: object) {
  await page.route('**/api/test-runs/start', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockCompleteTestRunApi(page: Page, runId: string, response: object) {
  await page.route(`**/api/test-runs/${runId}/complete`, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockTestRunDetailApi(page: Page, runId: string, run: object) {
  await page.route(`**/api/test-runs/${runId}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(run),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockTestRunNotFoundApi(page: Page, runId: string) {
  await page.route(`**/api/test-runs/${runId}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 404, message: 'Test run not found' }),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockTestRunAttachmentsApi(page: Page, runId: string, attachments: object[]) {
  await page.route(`**/api/test-runs/${runId}/attachments`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(attachments),
    })
  })
}

export async function mockUploadAttachmentApi(page: Page, response: object) {
  await page.route('**/api/attachments/upload*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockDeleteAttachmentApi(page: Page, attachmentId: string) {
  await page.route(`**/api/attachments/${attachmentId}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Attachment deleted successfully' }),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockToggleDebugFlagApi(page: Page, caseId: string, response: object) {
  await page.route(`**/api/test-cases/${caseId}/debug-flag`, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      })
    } else {
      await route.continue()
    }
  })
}

export async function mockDeleteTestRunApi(page: Page, runId: string) {
  await page.route(`**/api/test-runs/${runId}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    } else {
      await route.continue()
    }
  })
}

// =============================================================================
// REPORT API MOCKS
// =============================================================================

export async function mockReportStatusBreakdownApi(page: Page, projectId: string, data: object) {
  await page.route(`**/api/projects/${projectId}/reports/status-breakdown*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })
}

export async function mockReportExecutionTrendApi(page: Page, projectId: string, data: object) {
  await page.route(`**/api/projects/${projectId}/reports/execution-trend*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })
}

export async function mockReportEnvironmentComparisonApi(page: Page, projectId: string, data: object) {
  await page.route(`**/api/projects/${projectId}/reports/environment-comparison*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })
}

export async function mockReportTestAnalysisApi(page: Page, projectId: string, data: object) {
  await page.route(`**/api/projects/${projectId}/reports/test-analysis*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    })
  })
}

export async function mockAllReportApis(page: Page, projectId: string, opts: {
  statusBreakdown?: object
  executionTrend?: object
  environmentComparison?: object
  testAnalysis?: object
}) {
  if (opts.statusBreakdown) {
    await mockReportStatusBreakdownApi(page, projectId, opts.statusBreakdown)
  }
  if (opts.executionTrend) {
    await mockReportExecutionTrendApi(page, projectId, opts.executionTrend)
  }
  if (opts.environmentComparison) {
    await mockReportEnvironmentComparisonApi(page, projectId, opts.environmentComparison)
  }
  if (opts.testAnalysis) {
    await mockReportTestAnalysisApi(page, projectId, opts.testAnalysis)
  }
}

export async function mockDebugQueueApi(page: Page, projectId: string, testCases: object[]) {
  await page.route(`**/api/projects/${projectId}/test-cases*`, async (route) => {
    const url = route.request().url()
    // Check if this is a debug flag query
    if (url.includes('debugFlag=true')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: testCases,
          total: testCases.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: testCases,
          total: testCases.length,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      })
    }
  })
}
