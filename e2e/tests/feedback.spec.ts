import { test, expect } from '../fixtures/test-fixtures';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';

test.describe('Feedback Flow', () => {
  test.beforeEach(async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    // Wait for generated page to load
    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
  });

  test('like and dislike buttons are visible', async ({ page }) => {
    const generatedPage = new GeneratedPage(page);

    await expect(generatedPage.likeButton).toBeVisible();
    await expect(generatedPage.dislikeButton).toBeVisible();
  });

  test('like button shows thanks message after click', async ({ page }) => {
    const generatedPage = new GeneratedPage(page);

    await generatedPage.clickLike();

    await expect(generatedPage.thanksMessage).toBeVisible();
  });

  test('share button appears after liking', async ({ page }) => {
    const generatedPage = new GeneratedPage(page);

    await generatedPage.clickLike();

    await expect(generatedPage.shareButton).toBeVisible();
  });

  test('dislike triggers regeneration', async ({ page }) => {
    const generatedPage = new GeneratedPage(page);

    // Listen for regeneration API call
    const regeneratePromise = page.waitForRequest('**/api/generate');

    await generatedPage.clickDislike();

    // Should show regenerating message
    await expect(generatedPage.regeneratingMessage).toBeVisible();

    // Should trigger new API call
    await regeneratePromise;
  });

  test('feedback sends correct data to API', async ({ page }) => {
    const generatedPage = new GeneratedPage(page);

    // Capture the feedback API request
    const requestPromise = page.waitForRequest('**/api/feedback');

    await generatedPage.clickLike();

    const request = await requestPromise;
    const body = request.postDataJSON();

    expect(body.feedbackType).toBe('like');
    expect(body.audienceType).toBeTruthy();
    expect(body.sessionId).toBeTruthy();
  });
});

test.describe('Feedback Rate Limiting', () => {
  test('rate limit shows countdown message', async ({ page }) => {
    // Override mock for rate limited response
    await page.route('**/api/feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Please wait',
          rateLimited: true,
          retryAfter: 60,
        }),
      });
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    await generatedPage.clickDislike();

    await expect(generatedPage.rateLimitMessage).toBeVisible();
  });
});
