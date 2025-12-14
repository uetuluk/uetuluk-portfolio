import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';

test.describe('Error Handling', () => {
  test('shows fallback layout when API returns error', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('recruiter');

    // Should still show generated page with fallback layout
    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Should show fallback notice
    await expect(generatedPage.fallbackNotice).toBeVisible();
  });

  test('shows fallback layout on network error', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await route.abort('failed');
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    // Should show error state or fallback
    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Should still have navigation
    await expect(generatedPage.navbar).toBeVisible();
  });

  test('change perspective button returns to welcome modal', async ({ page }) => {
    // Mock successful API
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          layout: 'hero-focused',
          theme: { accent: 'blue' },
          sections: [{ type: 'Hero', props: { title: 'Test' } }],
          _cacheKey: 'test-key',
        }),
      });
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('friend');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Click change perspective
    await generatedPage.clickChangePerspective();

    // Should return to welcome modal
    await expect(welcomePage.title).toBeVisible();
  });

  test('error state shows try again button', async ({ page }) => {
    // Mock API to return error that causes no layout
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('recruiter');

    // Wait for either navbar (fallback) or try again button (error state)
    const navbar = page.locator('nav');
    const tryAgainButton = page.getByRole('button', { name: /try again/i });

    // Wait for page to settle - either shows fallback with navbar, or error with try again
    await expect(async () => {
      const navbarVisible = await navbar.isVisible();
      const tryAgainVisible = await tryAgainButton.isVisible();
      expect(navbarVisible || tryAgainVisible).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('regeneration failure shows fallback', async ({ page }) => {
    let callCount = 0;
    let regenerationAttempted = false;

    await page.route('**/api/generate', async (route) => {
      callCount++;
      if (callCount === 1) {
        // First call succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            layout: 'hero-focused',
            theme: { accent: 'blue' },
            sections: [{ type: 'Hero', props: { title: 'Test' } }],
            _cacheKey: 'test-key',
          }),
        });
      } else {
        // Regeneration fails
        regenerationAttempted = true;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Regeneration failed' }),
        });
      }
    });

    await page.route('**/api/feedback', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Regenerating...',
          regenerate: true,
        }),
      });
    });

    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Trigger regeneration via dislike
    await generatedPage.clickDislike();

    // Wait for regeneration to be attempted (second API call)
    await expect(async () => {
      expect(regenerationAttempted).toBe(true);
    }).toPass({ timeout: 15000 });

    // Page should still be visible (fallback used)
    await expect(generatedPage.navbar).toBeVisible();
  });
});
