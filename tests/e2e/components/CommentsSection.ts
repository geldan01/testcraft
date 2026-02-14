import type { Page, Locator } from '@playwright/test'

export class CommentsSection {
  constructor(public readonly page: Page) {}

  get heading(): Locator { return this.page.getByRole('heading', { name: /Comments/ }) }
  commentsCount(n: number): Locator { return this.page.getByText(`Comments (${n})`) }
  get emptyMessage(): Locator { return this.page.getByText('No comments yet.') }
  authorName(name: string): Locator { return this.page.getByText(name) }
  commentText(text: string): Locator { return this.page.getByText(text) }
  get addCommentInput(): Locator { return this.page.getByPlaceholder('Add a comment...') }
  get commentForm(): Locator { return this.page.locator('form').filter({ has: this.addCommentInput }) }
  get submitCommentButton(): Locator { return this.commentForm.getByRole('button') }
}
