<script setup lang="ts">
import type {
  ReportFilters,
  StatusBreakdownResponse,
  ExecutionTrendResponse,
  EnvironmentComparisonResponse,
  FlakyTestResponse,
  TopFailingTestResponse,
  TestPlan,
  TestSuite,
  ReportExportData,
  ChartImages,
} from '~/types'
import { exportReportCSV, exportReportJSON, exportReportPDF } from '~/utils/reportExport'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const { currentProject } = useProject()
const { getStatusBreakdown, getExecutionTrend, getEnvironmentComparison, getFlakyTests, getTopFailingTests } = useReports()
const { getTestPlans } = useTestPlan()
const { getTestSuites } = useTestSuite()

useSeoMeta({ title: 'Reports' })

// Filter state
const filters = ref<ReportFilters>({
  timeRange: '7d',
  scope: 'global',
})

// Report data
const loading = ref(true)
const exporting = ref(false)
const statusBreakdown = ref<StatusBreakdownResponse | null>(null)
const executionTrend = ref<ExecutionTrendResponse | null>(null)
const environmentComparison = ref<EnvironmentComparisonResponse | null>(null)
const flakyTests = ref<FlakyTestResponse | null>(null)
const topFailingTests = ref<TopFailingTestResponse | null>(null)

// Scope filter data
const testPlans = ref<TestPlan[]>([])
const testSuites = ref<TestSuite[]>([])

// Chart refs for PDF export
const statusBreakdownChart = ref<{ chart: { getDataURL: (opts: { type: string }) => string } } | null>(null)
const executionTrendChart = ref<{ chart: { getDataURL: (opts: { type: string }) => string } } | null>(null)
const environmentComparisonChart = ref<{ chart: { getDataURL: (opts: { type: string }) => string } } | null>(null)

// Load scope filter options
async function loadScopeOptions() {
  const pid = projectId.value
  const [plansResult, suitesResult] = await Promise.all([
    getTestPlans(pid),
    getTestSuites(pid),
  ])
  testPlans.value = plansResult?.data ?? []
  testSuites.value = suitesResult?.data ?? []
}

// Load all report data
async function loadReportData() {
  loading.value = true
  const pid = projectId.value
  const f = filters.value

  const [sb, et, ec, ft, tf] = await Promise.all([
    getStatusBreakdown(pid, f),
    getExecutionTrend(pid, f),
    getEnvironmentComparison(pid, f),
    getFlakyTests(pid, f),
    getTopFailingTests(pid, f),
  ])

  statusBreakdown.value = sb
  executionTrend.value = et
  environmentComparison.value = ec
  flakyTests.value = ft
  topFailingTests.value = tf
  loading.value = false
}

// Watch filters and reload
watch(filters, () => loadReportData(), { deep: true })

// Initial load
await Promise.all([loadScopeOptions(), loadReportData()])

// Export handler
async function handleExport(format: 'pdf' | 'csv' | 'json') {
  exporting.value = true

  const data: ReportExportData = {
    projectName: currentProject.value?.name ?? 'Project',
    filters: filters.value,
    statusBreakdown: statusBreakdown.value,
    executionTrend: executionTrend.value,
    environmentComparison: environmentComparison.value,
    flakyTests: flakyTests.value,
    topFailingTests: topFailingTests.value,
  }

  try {
    if (format === 'csv') {
      exportReportCSV(data)
    } else if (format === 'json') {
      exportReportJSON(data)
    } else {
      // Capture chart images
      const chartImages: ChartImages = {}

      const sbChart = statusBreakdownChart.value as unknown as { chart?: { getDataURL?: (opts: { type: string }) => string } } | null
      if (sbChart?.chart?.getDataURL) {
        chartImages.statusBreakdown = sbChart.chart.getDataURL({ type: 'png' })
      }

      const etChart = executionTrendChart.value as unknown as { chart?: { getDataURL?: (opts: { type: string }) => string } } | null
      if (etChart?.chart?.getDataURL) {
        chartImages.executionTrend = etChart.chart.getDataURL({ type: 'png' })
      }

      const ecChart = environmentComparisonChart.value as unknown as { chart?: { getDataURL?: (opts: { type: string }) => string } } | null
      if (ecChart?.chart?.getDataURL) {
        chartImages.environmentComparison = ecChart.chart.getDataURL({ type: 'png' })
      }

      await exportReportPDF(data, chartImages)
    }
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-bar-chart-3" class="text-2xl text-indigo-600 dark:text-indigo-400" />
        <h1 data-testid="reports-title" class="text-xl font-bold text-gray-900 dark:text-white">
          Reports
        </h1>
      </div>
      <ReportsExportMenu
        :loading="exporting"
        :disabled="loading"
        @export="handleExport"
      />
    </div>

    <!-- Filters -->
    <ReportsFilterBar
      v-model="filters"
      :test-plans="testPlans"
      :test-suites="testSuites"
    />

    <!-- Charts Row 1: Donut (1/3) + Trend (2/3) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ReportsStatusBreakdown
        ref="statusBreakdownChart"
        :data="statusBreakdown"
        :loading="loading"
      />
      <div class="lg:col-span-2">
        <ReportsExecutionTrend
          ref="executionTrendChart"
          :data="executionTrend"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Charts Row 2: Environment Comparison (full width) -->
    <ReportsEnvironmentComparison
      ref="environmentComparisonChart"
      :data="environmentComparison"
      :loading="loading"
    />

    <!-- Tables Row: Flaky (1/2) + Top Failing (1/2) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReportsFlakyTests
        :data="flakyTests"
        :loading="loading"
        :project-id="projectId"
      />
      <ReportsTopFailingTests
        :data="topFailingTests"
        :loading="loading"
        :project-id="projectId"
      />
    </div>
  </div>
</template>
