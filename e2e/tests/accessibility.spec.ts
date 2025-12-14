import { test, expect } from '../fixtures/test-fixtures';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';

test.describe('Accessibility', () => {
  test('welcome page has proper heading structure', async ({ page }) => {
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Should have exactly one h1
    const h1Count = await page.getByRole('heading', { level: 1 }).count();
    expect(h1Count).toBe(1);
  });

  test('welcome page has h2 for form section', async ({ page }) => {
    await page.goto('/');

    const h2 = page.getByRole('heading', { level: 2 });
    await expect(h2).toBeVisible();
    await expect(h2).toContainText('What brings you here?');
  });

  test('theme toggle button has accessible label', async ({ page }) => {
    await page.goto('/');

    // Use data-testid for reliable selection
    const themeButton = page.getByTestId('theme-toggle');

    const title = await themeButton.getAttribute('title');
    const ariaLabel = await themeButton.getAttribute('aria-label');
    expect(title || ariaLabel).toBeTruthy();
  });

  test('language switcher button has accessible label', async ({ page }) => {
    await page.goto('/');

    // Use data-testid for reliable selection
    const langButton = page.getByTestId('language-switcher');

    const title = await langButton.getAttribute('title');
    const ariaLabel = await langButton.getAttribute('aria-label');

    expect(title || ariaLabel).toBeTruthy();
  });

  test('textarea has placeholder text', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await expect(welcomePage.customIntentTextarea).toHaveAttribute('placeholder');
  });

  test('disabled continue button is properly marked', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await expect(welcomePage.continueButton).toBeDisabled();
  });

  test('visitor type buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Get a visitor type button and verify it can be focused
    // Note: Safari has different tab order than Chrome/Firefox, so we test focusability directly
    const recruiterButton = page.getByRole('button', { name: /recruiter/i }).first();
    await expect(recruiterButton).toBeVisible();

    // Focus the button programmatically and verify it receives focus
    await recruiterButton.focus();

    // Verify the button is now focused
    const isFocused = await recruiterButton.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);

    // Verify button can be activated with keyboard (Enter key)
    await page.keyboard.press('Enter');

    // Should trigger navigation to loading/generated page
    await page.locator('nav').waitFor({ state: 'visible', timeout: 15000 });
  });

  test('generated page has navigation landmark', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Should have a nav element
    await expect(generatedPage.navbar).toBeVisible();
    const navTag = await generatedPage.navbar.evaluate((el) => el.tagName);
    expect(navTag).toBe('NAV');
  });

  test('generated page has main content landmark', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Should have a main element
    await expect(generatedPage.mainContent).toBeVisible();
    const mainTag = await generatedPage.mainContent.evaluate((el) => el.tagName);
    expect(mainTag).toBe('MAIN');
  });

  test('generated page has footer landmark', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Should have a footer element
    await expect(generatedPage.footer).toBeVisible();
    const footerTag = await generatedPage.footer.evaluate((el) => el.tagName);
    expect(footerTag).toBe('FOOTER');
  });

  test('feedback buttons have tooltips', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Like button should have title
    const likeTitle = await generatedPage.likeButton.getAttribute('title');
    expect(likeTitle).toBeTruthy();

    // Dislike button should have title
    const dislikeTitle = await generatedPage.dislikeButton.getAttribute('title');
    expect(dislikeTitle).toBeTruthy();
  });

  test('text is readable - subtitle has valid color', async ({ page }) => {
    await page.goto('/');

    // Check subtitle text color (h1 uses gradient which shows as transparent)
    const subtitleColor = await page.getByText('To personalize your experience').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should have a valid color (not fully transparent)
    expect(subtitleColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(subtitleColor).toBeTruthy();
  });

  test('form label text is readable', async ({ page }) => {
    await page.goto('/');

    // Check form section text color
    const labelColor = await page.getByText('What brings you here?').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    expect(labelColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(labelColor).toBeTruthy();
  });
});
