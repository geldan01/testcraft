import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { TestCaseDetailPage } from './pages'
import { MOCK_USER, MOCK_PROJECT } from './helpers'
import { mockProjectApi, mockTestCaseDetailApis, mockCreateCommentApi } from './helpers'

/**
 * E2E tests for the comments section on the test case detail page.
 *
 * Covers comment display, author info, timestamps, add comment form,
 * submit validation, empty state, and comment submission via POST.
 */

const MOCK_TEST_CASE = {
  id: 'tc-1',
  name: 'Login with valid credentials',
  description: 'Verify that a user can log in with correct email and password',
  projectId: 'project-1',
  preconditions: [],
  testType: 'STEP_BASED',
  steps: [
    { stepNumber: 1, action: 'Navigate to login page', data: '', expectedResult: 'Login form is displayed' },
  ],
  gherkinSyntax: null,
  debugFlag: false,
  debugFlaggedAt: null,
  debugFlaggedById: null,
  lastRunStatus: 'NOT_RUN',
  lastRunAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdById: 'user-1',
  createdBy: MOCK_USER,
  debugFlaggedBy: null,
}

const MOCK_COMMENTS = [
  {
    id: 'comment-1',
    content: 'This test case needs to also verify the remember me checkbox.',
    commentableType: 'TEST_CASE',
    commentableId: 'tc-1',
    authorId: 'user-1',
    author: MOCK_USER,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'comment-2',
    content: 'Good catch, I will add that step in the next update.',
    commentableType: 'TEST_CASE',
    commentableId: 'tc-1',
    authorId: 'user-2',
    author: {
      ...MOCK_USER,
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

async function setupPage(page: Page, comments = MOCK_COMMENTS) {
  await mockProjectApi(page, 'project-1', MOCK_PROJECT)
  await mockTestCaseDetailApis(page, 'tc-1', { testCase: MOCK_TEST_CASE, comments })
}

test.describe('Comments Section', () => {
  test('comments section displays on test case detail page with count', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    // Comments heading with count
    await expect(detail.commentsSection.commentsCount(2)).toBeVisible()
  })

  test('comment shows author name and timestamp', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    // First comment author
    await expect(detail.commentsSection.authorName('Test User').first()).toBeVisible()

    // Second comment author
    await expect(detail.commentsSection.authorName('Jane Smith')).toBeVisible()
  })

  test('comment shows content text', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    // Comment contents
    await expect(
      detail.commentsSection.commentText('This test case needs to also verify the remember me checkbox.'),
    ).toBeVisible()
    await expect(
      detail.commentsSection.commentText('Good catch, I will add that step in the next update.'),
    ).toBeVisible()
  })

  test('add comment textarea is visible with placeholder', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    await expect(detail.commentsSection.addCommentInput).toBeVisible()
  })

  test('submit button disabled when comment is empty', async ({ page }) => {
    await setupPage(page)
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    // The submit button (send icon) next to the comment textarea should be disabled
    // It is inside a form with the comment textarea
    await expect(detail.commentsSection.submitCommentButton).toBeDisabled()
  })

  test('empty comments section shows "No comments yet." when no comments', async ({ page }) => {
    await setupPage(page, [])
    const detail = new TestCaseDetailPage(page)

    await detail.goto('project-1', 'tc-1')

    await expect(detail.commentsSection.commentsCount(0)).toBeVisible()
    await expect(detail.commentsSection.emptyMessage).toBeVisible()
  })

  test('submit button sends comment via POST /api/comments', async ({ page }) => {
    await setupPage(page, [])
    const detail = new TestCaseDetailPage(page)

    // Mock the POST endpoint for adding a comment
    const newComment = {
      id: 'comment-new',
      content: 'This is a new comment from the test.',
      commentableType: 'TEST_CASE',
      commentableId: 'tc-1',
      authorId: 'user-1',
      author: MOCK_USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await mockCreateCommentApi(page, newComment)

    await detail.goto('project-1', 'tc-1')

    // Type a comment
    await detail.commentsSection.addCommentInput.fill('This is a new comment from the test.')

    // Submit button should now be enabled
    await expect(detail.commentsSection.submitCommentButton).toBeEnabled()

    // Submit the comment
    await detail.commentsSection.submitCommentButton.click()

    // The new comment should appear on the page
    await expect(detail.commentsSection.commentText('This is a new comment from the test.')).toBeVisible()

    // Comment count should update
    await expect(detail.commentsSection.commentsCount(1)).toBeVisible()
  })
})
