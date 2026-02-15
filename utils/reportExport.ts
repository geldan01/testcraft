import type { ReportExportData, ChartImages } from '~/types'

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function generateTimestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function exportReportCSV(data: ReportExportData): void {
  const lines: string[] = []
  const timestamp = generateTimestamp()

  lines.push(`TestCraft Report - ${data.projectName}`)
  lines.push(`Generated: ${timestamp}`)
  lines.push(`Time Range: ${data.filters.timeRange}`)
  lines.push(`Scope: ${data.filters.scope}`)
  lines.push('')

  // Status Breakdown
  if (data.statusBreakdown) {
    lines.push('STATUS BREAKDOWN')
    lines.push('Status,Count,Percentage')
    for (const s of data.statusBreakdown.breakdown) {
      lines.push(`${s.status},${s.count},${s.percentage}%`)
    }
    lines.push(`Total,,${data.statusBreakdown.total}`)
    lines.push('')
  }

  // Execution Trend
  if (data.executionTrend) {
    lines.push('EXECUTION TREND')
    lines.push('Date,Total Executed,Pass Count,Fail Count,Pass Rate')
    for (const t of data.executionTrend.trend) {
      lines.push(`${t.date},${t.totalExecuted},${t.passCount},${t.failCount},${t.passRate}%`)
    }
    lines.push('')
  }

  // Environment Comparison
  if (data.environmentComparison) {
    lines.push('ENVIRONMENT COMPARISON')
    lines.push('Environment,Total Runs,Pass Count,Fail Count,Pass Rate')
    for (const e of data.environmentComparison.environments) {
      lines.push(`${e.environment},${e.totalRuns},${e.passCount},${e.failCount},${e.passRate}%`)
    }
    lines.push('')
  }

  // Flaky Tests
  if (data.flakyTests) {
    lines.push('FLAKY TESTS')
    lines.push('Test Case,Total Runs,Pass,Fail,Flakiness Score,Debug Flag')
    for (const t of data.flakyTests.tests) {
      lines.push(`"${t.testCaseName}",${t.totalRuns},${t.passCount},${t.failCount},${t.flakinessScore}%,${t.debugFlag}`)
    }
    lines.push('')
  }

  // Top Failing Tests
  if (data.topFailingTests) {
    lines.push('TOP FAILING TESTS')
    lines.push('Test Case,Fail Count,Total Runs,Fail Rate,Debug Flag,Last Failed')
    for (const t of data.topFailingTests.tests) {
      lines.push(`"${t.testCaseName}",${t.failCount},${t.totalRuns},${t.failRate}%,${t.debugFlag},${t.lastFailedAt ? formatDate(t.lastFailedAt) : 'N/A'}`)
    }
  }

  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `testcraft-report-${data.projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.csv`)
}

export function exportReportJSON(data: ReportExportData): void {
  const timestamp = generateTimestamp()
  const json = JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectName: data.projectName,
    filters: data.filters,
    statusBreakdown: data.statusBreakdown,
    executionTrend: data.executionTrend,
    environmentComparison: data.environmentComparison,
    flakyTests: data.flakyTests,
    topFailingTests: data.topFailingTests,
  }, null, 2)

  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  triggerDownload(blob, `testcraft-report-${data.projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`)
}

export async function exportReportPDF(data: ReportExportData, chartImages: ChartImages): Promise<void> {
  const pdfMakeModule = await import('pdfmake/build/pdfmake')
  const pdfMake = pdfMakeModule.default || pdfMakeModule

  const timestamp = generateTimestamp()
  const content: unknown[] = []

  // Title
  content.push({
    text: `TestCraft Report - ${data.projectName}`,
    style: 'header',
    margin: [0, 0, 0, 10],
  })
  content.push({
    text: `Generated: ${timestamp} | Time Range: ${data.filters.timeRange} | Scope: ${data.filters.scope}`,
    style: 'subheader',
    margin: [0, 0, 0, 20],
  })

  // Status Breakdown Chart
  if (chartImages.statusBreakdown) {
    content.push({ text: 'Status Breakdown', style: 'sectionHeader', margin: [0, 10, 0, 5] })
    content.push({ image: chartImages.statusBreakdown, width: 400, margin: [0, 0, 0, 10] })
  }

  // Status Breakdown Table
  if (data.statusBreakdown && data.statusBreakdown.breakdown.length > 0) {
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          ['Status', 'Count', 'Percentage'],
          ...data.statusBreakdown.breakdown.map(s => [s.status, String(s.count), `${s.percentage}%`]),
        ],
      },
      margin: [0, 0, 0, 15],
    })
  }

  // Execution Trend Chart
  if (chartImages.executionTrend) {
    content.push({ text: 'Execution Trend', style: 'sectionHeader', margin: [0, 10, 0, 5] })
    content.push({ image: chartImages.executionTrend, width: 500, margin: [0, 0, 0, 15] })
  }

  // Environment Comparison Chart
  if (chartImages.environmentComparison) {
    content.push({ text: 'Environment Comparison', style: 'sectionHeader', margin: [0, 10, 0, 5] })
    content.push({ image: chartImages.environmentComparison, width: 500, margin: [0, 0, 0, 15] })
  }

  // Flaky Tests Table
  if (data.flakyTests && data.flakyTests.tests.length > 0) {
    content.push({ text: 'Flaky Tests', style: 'sectionHeader', margin: [0, 10, 0, 5] })
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto'],
        body: [
          ['Test Case', 'Total Runs', 'Pass', 'Fail', 'Score'],
          ...data.flakyTests.tests.map(t => [
            t.testCaseName,
            String(t.totalRuns),
            String(t.passCount),
            String(t.failCount),
            `${t.flakinessScore}%`,
          ]),
        ],
      },
      margin: [0, 0, 0, 15],
    })
  }

  // Top Failing Tests Table
  if (data.topFailingTests && data.topFailingTests.tests.length > 0) {
    content.push({ text: 'Top Failing Tests', style: 'sectionHeader', margin: [0, 10, 0, 5] })
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          ['Test Case', 'Fail Count', 'Total Runs', 'Fail Rate'],
          ...data.topFailingTests.tests.map(t => [
            t.testCaseName,
            String(t.failCount),
            String(t.totalRuns),
            `${t.failRate}%`,
          ]),
        ],
      },
      margin: [0, 0, 0, 15],
    })
  }

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 10, color: '#666666' },
      sectionHeader: { fontSize: 14, bold: true },
    },
    defaultStyle: { fontSize: 10 },
  }

  pdfMake.createPdf(docDefinition as never).download(
    `testcraft-report-${data.projectName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`,
  )
}
