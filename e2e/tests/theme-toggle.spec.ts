import { test, expect } from '../fixtures/test-fixtures';

test.describe('Theme Toggle', () => {
  // Helper to get theme button using data-testid for reliable selection
  const getThemeButton = (page: import('@playwright/test').Page) =>
    page.getByTestId('theme-toggle');

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

    // Wait for localStorage to be updated (indicates theme change completed)
    await expect(async () => {
      const preference = await page.evaluate(() => localStorage.getItem('theme-preference'));
      expect(preference).toBeTruthy();
    }).toPass({ timeout: 5000 });

    // Verify DOM class actually changed
    const afterClickHasDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // The class should have toggled
    expect(afterClickHasDark).not.toBe(initialHasDark);
  });

  test('multiple clicks cycle through theme states with DOM changes', async ({ page }) => {
    await page.goto('/');

    // Clear any existing preference
    await page.evaluate(() => localStorage.removeItem('theme-preference'));
    await page.reload();

    const themeButton = getThemeButton(page);

    // Helper to wait for theme preference change
    const waitForPreference = async (expected: string) => {
      await expect(async () => {
        const pref = await page.evaluate(() => localStorage.getItem('theme-preference'));
        expect(pref).toBe(expected);
      }).toPass({ timeout: 5000 });
    };

    // Wait for app to mount and set initial preference to 'system'
    await expect(async () => {
      const pref = await page.evaluate(() => localStorage.getItem('theme-preference'));
      expect(pref).toBe('system');
    }).toPass({ timeout: 5000 });

    // First click: system -> explicit (opposite of system)
    // In test environment, system is usually light, so first explicit is dark
    await themeButton.click();

    // Wait for preference to be set to an explicit value (dark or light)
    await expect(async () => {
      const pref = await page.evaluate(() => localStorage.getItem('theme-preference'));
      expect(pref === 'dark' || pref === 'light').toBe(true);
    }).toPass({ timeout: 5000 });

    const afterFirstClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Second click: explicit -> system
    await themeButton.click();
    await waitForPreference('system');

    // Third click: system -> explicit again (same as first)
    await themeButton.click();
    await expect(async () => {
      const pref = await page.evaluate(() => localStorage.getItem('theme-preference'));
      expect(pref === 'dark' || pref === 'light').toBe(true);
    }).toPass({ timeout: 5000 });

    const afterThirdClick = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // First and third should be the same (both explicit opposite of system)
    expect(afterFirstClick).toBe(afterThirdClick);
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
