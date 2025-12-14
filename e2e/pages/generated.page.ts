import { Page, Locator } from '@playwright/test';

export class GeneratedPage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly portfolioTitle: Locator;
  readonly changePerspectiveButton: Locator;
  readonly likeButton: Locator;
  readonly dislikeButton: Locator;
  readonly shareButton: Locator;
  readonly thanksMessage: Locator;
  readonly regeneratingMessage: Locator;
  readonly rateLimitMessage: Locator;
  readonly footer: Locator;
  readonly fallbackNotice: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.locator('nav');
    this.portfolioTitle = page.getByText('Portfolio').first();
    this.changePerspectiveButton = page.getByRole('button', { name: /change perspective/i });
    // Use data-testid selectors for more reliable element selection
    this.likeButton = page.getByTestId('like-button');
    this.dislikeButton = page.getByTestId('dislike-button');
    this.shareButton = page.getByTestId('share-button');
    this.thanksMessage = page.getByTestId('thanks-message');
    this.regeneratingMessage = page.getByTestId('regenerating-message');
    this.rateLimitMessage = page.getByTestId('rate-limit-message');
    this.footer = page.locator('footer');
    this.fallbackNotice = page.getByText(/fallback layout/i);
    this.mainContent = page.locator('main');
  }

  async clickLike() {
    await this.likeButton.click();
  }

  async clickDislike() {
    await this.dislikeButton.click();
  }

  async clickChangePerspective() {
    await this.changePerspectiveButton.click();
  }

  async waitForLoad() {
    await this.navbar.waitFor({ state: 'visible', timeout: 15000 });
  }

  getFooterVisitorType(type: string) {
    return this.footer.getByText(new RegExp(type, 'i'));
  }
}
