import type { Page, Locator } from '@playwright/test'

export class CommentsSection {
  constructor(public readonly page: Page) {}

  get section(): Locator { return this.page.getByTestId('comments-section') }
  get heading(): Locator { return this.page.getByRole('heading', { name: /Comments/ }) }
  commentsCount(n: number): Locator { return this.page.getByTestId('comments-count').filter({ hasText: `Comments (${n})` }) }
  get emptyMessage(): Locator { return this.page.getByTestId('comments-empty-message') }
  authorName(name: string): Locator { return this.page.getByTestId('comments-author-name').filter({ hasText: name }) }
  commentText(text: string): Locator { return this.page.getByTestId('comments-comment-text').filter({ hasText: text }) }
  get addCommentInput(): Locator { return this.page.getByTestId('comments-input') }
  get commentForm(): Locator { return this.page.getByTestId('comments-form') }
  get submitCommentButton(): Locator { return this.page.getByTestId('comments-submit-button') }
}
