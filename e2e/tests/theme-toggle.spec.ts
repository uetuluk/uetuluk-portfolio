import { test, expect } from '../fixtures/test-fixtures';

test.describe('Theme Toggle', () => {
  // Helper to get theme button - uses title/aria-label attributes
  const getThemeButton = (page: import('@playwright/test').Page) =>
    page.locator('button[title*="Switch"], button[title*="system"], button[aria-label*="Switch"], button[aria-label*="system"]').first();

  test('theme toggle button is visible on welcome page', async ({ page }) => {
    await page.goto('/');

    // Theme toggle is fixed at bottom-right with title/aria-label
    const themeButton = getThemeButton(page);
    await expect(themeButton).toBeVisible();
  });

  test('clicking theme toggle actually changes DOM class', async ({ page }) => {
    await page.goto('/');

    // Clear any existing preference to start fresh
    await page.evaluate(() => localStorage.removeItem('theme-preference'));
    await page.reload();

    // Get initial state - should be system default (light in most cases)
    const initialHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Find and click theme button
    const themeButton = getThemeButton(page);
    await themeButton.click();

    // Wait for DOM to update
    await page.waitForTimeout(100);

    // Verify DOM class actually changed
    const afterClickHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // The class should have toggled
    expect(afterClickHasDark).not.toBe(initialHasDark);

    // Also verify localStorage was saved
    const preference = await page.evaluate(() => localStorage.getItem('theme-preference'));
    expect(preference).toBeTruthy();
  });

  test('multiple clicks cycle through theme states with DOM changes', async ({ page }) => {
    await page.goto('/');

    // Clear any existing preference
    await page.evaluate(() => localStorage.removeItem('theme-preference'));
    await page.reload();

    const themeButton = getThemeButton(page);

    // First click: system -> explicit (opposite of system)
    await themeButton.click();
    await page.waitForTimeout(100);

    const afterFirstClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Second click: explicit -> system
    await themeButton.click();
    await page.waitForTimeout(100);

    const afterSecondClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Third click: system -> explicit again
    await themeButton.click();
    await page.waitForTimeout(100);

    const afterThirdClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // First and third should be the same (both explicit)
    expect(afterFirstClick).toBe(afterThirdClick);
    // Second should be different (back to system)
    expect(afterSecondClick).not.toBe(afterFirstClick);
  });

  test('theme preference persists across page reload', async ({ page }) => {
    await page.goto('/');

    // Set a specific theme in localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'dark');
    });

    await page.reload();

    // Check that dark class is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('light theme preference persists across reload', async ({ page }) => {
    await page.goto('/');

    // Set light theme
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'light');
    });

    await page.reload();

    // Check that light class is applied (no dark class)
    const hasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(hasDark).toBe(false);
  });

  test('theme toggle has accessible tooltip', async ({ page }) => {
    await page.goto('/');

    const themeButton = getThemeButton(page);

    // Button should have a title or aria-label
    const hasTitle = await themeButton.getAttribute('title');
    const hasAriaLabel = await themeButton.getAttribute('aria-label');

    expect(hasTitle || hasAriaLabel).toBeTruthy();
  });

  test('theme applies to generated page as well', async ({ page }) => {
    await page.goto('/');

    // Set dark theme after page loads
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'dark');
    });

    await page.reload();

    // Select a visitor type to go to generated page
    await page.getByRole('button', { name: /recruiter/i }).first().click();

    // Wait for generated page
    await page.locator('nav').waitFor({ state: 'visible', timeout: 15000 });

    // Dark theme should still be applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
