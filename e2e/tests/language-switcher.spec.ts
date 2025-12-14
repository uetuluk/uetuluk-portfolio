import { test, expect } from '../fixtures/test-fixtures';

test.describe('Language Switcher', () => {
  test('language switcher button is visible', async ({ page }) => {
    await page.goto('/');

    // Use data-testid for reliable selection
    const languageButton = page.getByTestId('language-switcher');
    await expect(languageButton).toBeVisible();
  });

  test('clicking language button opens dropdown', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    // Dropdown should appear with language options
    await expect(page.getByTestId('language-option-en')).toBeVisible();
  });

  test('dropdown shows all supported languages', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    // Check all 4 supported languages using data-testid
    await expect(page.getByTestId('language-option-en')).toBeVisible();
    await expect(page.getByTestId('language-option-zh')).toBeVisible();
    await expect(page.getByTestId('language-option-ja')).toBeVisible();
    await expect(page.getByTestId('language-option-tr')).toBeVisible();
  });

  test('selecting Chinese changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    await page.getByTestId('language-option-zh').click();

    // Welcome title should now be in Chinese
    await expect(page.locator('h1')).toContainText('欢迎');
  });

  test('selecting Japanese changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    await page.getByTestId('language-option-ja').click();

    // Wait for text to change
    await expect(page.locator('h1')).toContainText('ポートフォリオ');
  });

  test('selecting Turkish changes UI text', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    await page.getByTestId('language-option-tr').click();

    // Wait for text to change - Turkish welcome text
    await expect(page.locator('h1')).toContainText('Hoş Geldiniz');
  });

  test('document lang attribute updates with language change', async ({ page }) => {
    await page.goto('/');

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    await page.getByTestId('language-option-ja').click();

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

    const languageButton = page.getByTestId('language-switcher');
    await languageButton.click();

    // Dropdown should be visible
    await expect(page.getByTestId('language-option-en')).toBeVisible();

    // Select a language
    await page.getByTestId('language-option-zh').click();

    // Dropdown should close - English option should not be visible
    await expect(page.getByTestId('language-option-en')).not.toBeVisible();
  });
});
