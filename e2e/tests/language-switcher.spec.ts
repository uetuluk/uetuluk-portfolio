import { test, expect } from '../fixtures/test-fixtures';

test.describe('Language Switcher', () => {
  test('language switcher button is visible', async ({ page }) => {
    await page.goto('/');

    // Language button has a globe icon and "Change language" title
    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await expect(languageButton).toBeVisible();
  });

  test('clicking language button opens dropdown', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    // Dropdown should appear with language options
    await expect(page.getByText('English')).toBeVisible();
  });

  test('dropdown shows all supported languages', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    // Check all 4 supported languages
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();
    await expect(page.getByRole('button', { name: '中文' })).toBeVisible();
    await expect(page.getByRole('button', { name: '日本語' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Türkçe' })).toBeVisible();
  });

  test('selecting Chinese changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    await page.getByRole('button', { name: '中文' }).click();

    // Welcome title should now be in Chinese
    await expect(page.locator('h1')).toContainText('欢迎');
  });

  test('selecting Japanese changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    await page.getByRole('button', { name: '日本語' }).click();

    // Wait for text to change
    await expect(page.locator('h1')).toContainText('ポートフォリオ');
  });

  test('selecting Turkish changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    await page.getByRole('button', { name: 'Türkçe' }).click();

    // Wait for text to change - Turkish welcome text
    await expect(page.locator('h1')).toContainText('Hoş Geldiniz');
  });

  test('document lang attribute updates with language change', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    await page.getByRole('button', { name: '日本語' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  });

  test('language preference persists across reload', async ({ page }) => {
    await page.goto('/');

    // Set language preference to Chinese
    await page.evaluate(() => {
      localStorage.setItem('language-preference', 'zh');
    });

    await page.reload();

    // Check for Chinese content
    await expect(page.locator('h1')).toContainText('欢迎');
  });

  test('dropdown closes after selecting language', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.locator('button[title*="language"], button[aria-label*="language"]').first();
    await languageButton.click();

    // Dropdown should be visible
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

    // Select a language
    await page.getByRole('button', { name: '中文' }).click();

    // Dropdown should close - English option should not be visible
    await expect(page.getByRole('button', { name: 'English' })).not.toBeVisible();
  });
});
