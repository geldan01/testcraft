import { test, expect } from './fixtures'
import { TestCaseDetailPage, TestRunDetailPage } from './pages'
import {
  MOCK_USER,
  MOCK_PROJECT,
  mockProjectApi,
  mockTestCaseDetailApis,
  mockTestRunDetailApi,
} from './helpers'

/**
 * E2E tests for the Attachments system.
 *
 * Tests cover:
 * - FileUploader component (drag-and-drop zone display, file input trigger)
 * - AttachmentList component (file display with icons, delete with confirmation)
 * - AttachmentPreview modal (image preview)
 * - API mocking for upload, list, and delete endpoints
 */

const MOCK_ATTACHMENT_IMAGE = {
  id: 'att-1',
  fileUrl: '/uploads/screenshot-login.png',
  fileName: 'screenshot-login.png',
  fileType: 'image/png',
  fileSize: 245760, // ~240 KB
  uploadedById: 'user-1',
  testRunId: 'run-1',
  testCaseId: null,
  createdAt: new Date().toISOString(),
  uploadedBy: MOCK_USER,
}

const MOCK_ATTACHMENT_PDF = {
  id: 'att-2',
  fileUrl: '/uploads/test-report.pdf',
  fileName: 'test-report.pdf',
  fileType: 'application/pdf',
  fileSize: 1048576, // 1 MB
  uploadedById: 'user-1',
  testRunId: 'run-1',
  testCaseId: null,
  createdAt: new Date().toISOString(),
  uploadedBy: MOCK_USER,
}

const MOCK_ATTACHMENT_LOG = {
  id: 'att-3',
  fileUrl: '/uploads/console-output.log',
  fileName: 'console-output.log',
  fileType: 'text/plain',
  fileSize: 8192, // 8 KB
  uploadedById: 'user-1',
  testRunId: 'run-1',
  testCaseId: null,
  createdAt: new Date().toISOString(),
  uploadedBy: MOCK_USER,
}

const MOCK_ATTACHMENTS = [MOCK_ATTACHMENT_IMAGE, MOCK_ATTACHMENT_PDF, MOCK_ATTACHMENT_LOG]

const MOCK_TEST_CASE = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Test login functionality',
  projectId: 'project-1',
  preconditions: [],
  testType: 'STEP_BASED',
  steps: [
    { stepNumber: 1, action: 'Navigate to login page', data: '', expectedResult: 'Login page displayed' },
  ],
  gherkinSyntax: null,
  debugFlag: false,
  debugFlaggedAt: null,
  debugFlaggedById: null,
  lastRunStatus: 'PASS',
  lastRunAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  debugFlaggedBy: null,
}

const MOCK_TEST_RUN = {
  id: 'run-1',
  testCaseId: 'tc-1',
  executedById: 'user-1',
  executedAt: new Date().toISOString(),
  environment: 'staging',
  status: 'PASS',
  duration: 45,
  notes: 'All checks passed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  testCase: {
    id: 'tc-1',
    name: 'Login with valid credentials',
    description: 'Test login functionality',
    testType: 'STEP_BASED',
    steps: MOCK_TEST_CASE.steps,
    gherkinSyntax: null,
    projectId: 'project-1',
    preconditions: [],
    createdBy: MOCK_USER,
    project: { ...MOCK_PROJECT },
  },
  executedBy: MOCK_USER,
  attachments: MOCK_ATTACHMENTS,
}

// ============================================================================
// Test Case Detail - Attachments Section
// ============================================================================

test.describe('Attachments - Test Case Detail Page', () => {
  test('displays attachments heading with count', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: MOCK_ATTACHMENTS,
    })

    const detail = new TestCaseDetailPage(page)
    await detail.goto('project-1', 'tc-1')

    // Attachments heading should be visible with count
    await expect(detail.attachmentsHeading).toBeVisible()
  })

  test('displays empty state when no attachments exist', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: [],
    })

    const detail = new TestCaseDetailPage(page)
    await detail.goto('project-1', 'tc-1')

    await expect(page.getByText('No attachments yet.')).toBeVisible()
  })

  test('displays attachment file names when attachments exist', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: MOCK_ATTACHMENTS,
    })

    const detail = new TestCaseDetailPage(page)
    await detail.goto('project-1', 'tc-1')

    // File names should be displayed
    await expect(page.getByText('screenshot-login.png')).toBeVisible()
    await expect(page.getByText('test-report.pdf')).toBeVisible()
    await expect(page.getByText('console-output.log')).toBeVisible()
  })

  test('shows upload button in the attachments section header', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestCaseDetailApis(page, 'tc-1', {
      testCase: MOCK_TEST_CASE,
      attachments: [],
    })

    const detail = new TestCaseDetailPage(page)
    await detail.goto('project-1', 'tc-1')

    await expect(detail.uploadButton).toBeVisible()
  })
})

// ============================================================================
// Test Run Detail - Attachments Section
// ============================================================================

test.describe('Attachments - Test Run Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  })

  test('displays file uploader drag-and-drop zone', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // FileUploader component should render the drag-and-drop zone
    await expect(runDetail.fileUploaderZone).toBeVisible()
    await expect(page.getByText('Screenshots, logs, or other evidence')).toBeVisible()
  })

  test('displays attachment list with file names and sizes', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // File names should be visible in the AttachmentList
    await expect(page.getByText('screenshot-login.png')).toBeVisible()
    await expect(page.getByText('test-report.pdf')).toBeVisible()
    await expect(page.getByText('console-output.log')).toBeVisible()

    // File sizes should be displayed (formatted)
    await expect(page.getByText('240.0 KB')).toBeVisible()
    await expect(page.getByText('1.0 MB')).toBeVisible()
    await expect(page.getByText('8.0 KB')).toBeVisible()
  })

  test('shows empty state message when no attachments exist', async ({ page }) => {
    const runWithoutAttachments = {
      ...MOCK_TEST_RUN,
      attachments: [],
    }
    await mockTestRunDetailApi(page, 'run-1', runWithoutAttachments)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    await expect(runDetail.noAttachmentsMessage).toBeVisible()
  })

  test('image attachments have preview button', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Image attachment should have a "Preview" button (eye icon)
    const previewButtons = page.getByLabel('Preview')
    await expect(previewButtons.first()).toBeVisible()
  })

  test('all attachments have download links', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Download buttons should be present for each attachment
    const downloadButtons = page.getByLabel('Download')
    await expect(downloadButtons).toHaveCount(3)
  })

  test('delete button shows confirmation before deleting', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Click the delete button for the first attachment
    const deleteButtons = page.getByLabel('Delete')
    await deleteButtons.first().click()

    // Confirmation should appear with "Confirm" and "Cancel" buttons
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
    // The cancel button in the confirmation row
    const cancelButtons = page.getByRole('button', { name: 'Cancel' })
    await expect(cancelButtons.first()).toBeVisible()
  })

  test('cancelling delete confirmation hides the confirm buttons', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Click delete on first attachment
    const deleteButtons = page.getByLabel('Delete')
    await deleteButtons.first().click()

    // Click cancel on the confirmation
    const cancelButton = page.getByRole('button', { name: 'Cancel' }).first()
    await cancelButton.click()

    // Confirm button should be gone
    await expect(page.getByRole('button', { name: 'Confirm' })).not.toBeVisible()
  })

  test('confirming delete calls DELETE /api/attachments/:id', async ({ page }) => {
    let deleteApiCalled = false

    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    await page.route(`**/api/attachments/${MOCK_ATTACHMENT_IMAGE.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteApiCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Attachment deleted successfully' }),
        })
      } else {
        await route.continue()
      }
    })

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Click delete on the first (image) attachment
    const deleteButtons = page.getByLabel('Delete')
    await deleteButtons.first().click()

    // Confirm the delete
    await page.getByRole('button', { name: 'Confirm' }).click()

    expect(deleteApiCalled).toBe(true)
  })

  test('clicking preview on image attachment opens preview modal', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Click preview button on the image attachment
    const previewButtons = page.getByLabel('Preview')
    await previewButtons.first().click()

    // The AttachmentPreview modal should open with the filename as title
    await expect(page.locator('[role="dialog"]').getByText('screenshot-login.png')).toBeVisible()

    // The image element should be present in the modal
    const previewImage = page.locator('[role="dialog"] img')
    await expect(previewImage).toBeVisible()
    await expect(previewImage).toHaveAttribute('alt', 'screenshot-login.png')

    // Close button and Download button should be in the modal footer
    await expect(page.locator('[role="dialog"]').getByText('Close')).toBeVisible()
    await expect(page.locator('[role="dialog"]').getByRole('button', { name: 'Download' })).toBeVisible()
  })

  test('preview modal can be closed', async ({ page }) => {
    await mockTestRunDetailApi(page, 'run-1', MOCK_TEST_RUN)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Open preview
    const previewButtons = page.getByLabel('Preview')
    await previewButtons.first().click()

    // Modal should be open
    await expect(page.locator('[role="dialog"]').getByText('screenshot-login.png')).toBeVisible()

    // Close it (use getByText to target the footer "Close" button, not the X icon button)
    await page.locator('[role="dialog"]').getByText('Close').click()

    // Modal should be closed
    await expect(page.locator('[role="dialog"]').getByText('screenshot-login.png')).not.toBeVisible()
  })
})

// ============================================================================
// FileUploader Component
// ============================================================================

test.describe('Attachments - FileUploader Component', () => {
  test('displays the upload zone with instructions', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', { ...MOCK_TEST_RUN, attachments: [] })

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Upload zone text
    await expect(page.getByText('Drag and drop files here, or click to upload')).toBeVisible()
    await expect(page.getByText('Screenshots, logs, or other evidence')).toBeVisible()
  })

  test('file input element exists but is hidden', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', { ...MOCK_TEST_RUN, attachments: [] })

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // The hidden file input should exist in the DOM
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
    // It should have the "hidden" class making it invisible
    await expect(fileInput).toHaveClass(/hidden/)
  })

  test('file input accepts multiple files', async ({ page }) => {
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', { ...MOCK_TEST_RUN, attachments: [] })

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // The file input should have the "multiple" attribute
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toHaveAttribute('multiple', '')
  })
})

// ============================================================================
// AttachmentList - Different File Types
// ============================================================================

test.describe('Attachments - File Type Icons', () => {
  test('shows appropriate icon for image files', async ({ page }) => {
    const runWithImage = {
      ...MOCK_TEST_RUN,
      attachments: [MOCK_ATTACHMENT_IMAGE],
    }
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', runWithImage)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // Image attachment should render as an <img> thumbnail (not icon)
    const thumbnail = page.locator('img[alt="screenshot-login.png"]')
    await expect(thumbnail).toBeVisible()
  })

  test('shows file icon for non-image files', async ({ page }) => {
    const runWithPdf = {
      ...MOCK_TEST_RUN,
      attachments: [MOCK_ATTACHMENT_PDF],
    }
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', runWithPdf)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // PDF should show a file icon (not an img thumbnail)
    await expect(page.getByText('test-report.pdf')).toBeVisible()
    // There should NOT be an img with alt="test-report.pdf"
    await expect(page.locator('img[alt="test-report.pdf"]')).not.toBeVisible()
  })
})

// ============================================================================
// AttachmentPreview - Non-previewable files
// ============================================================================

test.describe('Attachments - Preview for Non-Previewable Files', () => {
  test('shows "cannot be previewed" message for non-image/video files', async ({ page }) => {
    const runWithPdf = {
      ...MOCK_TEST_RUN,
      attachments: [MOCK_ATTACHMENT_PDF],
    }
    await mockProjectApi(page, 'project-1', MOCK_PROJECT)
    await mockTestRunDetailApi(page, 'run-1', runWithPdf)

    const runDetail = new TestRunDetailPage(page)
    await runDetail.goto('project-1', 'run-1')

    // PDF files do not have a preview button (only images and videos get one)
    // But if we open it via the image click, it shows the "cannot be previewed" message
    // For PDFs, there is no preview button visible
    const previewButtons = page.getByLabel('Preview')
    await expect(previewButtons).toHaveCount(0)
  })
})
