import { test, expect } from '../fixtures/test-fixtures';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';

test.describe('Custom Intent Flow', () => {
  test('continue button enables when text is entered', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await expect(welcomePage.continueButton).toBeDisabled();

    await welcomePage.customIntentTextarea.fill('I want to hire you');

    await expect(welcomePage.continueButton).toBeEnabled();
  });

  test('continue button disables when text is cleared', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.customIntentTextarea.fill('Some text');
    await expect(welcomePage.continueButton).toBeEnabled();

    await welcomePage.clearCustomIntent();
    await expect(welcomePage.continueButton).toBeDisabled();
  });

  test('continue button stays disabled with only whitespace', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.customIntentTextarea.fill('   ');

    await expect(welcomePage.continueButton).toBeDisabled();
  });

  test('submitting custom intent navigates to generated page', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.submitCustomIntent('I am interested in collaboration');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
    await expect(generatedPage.navbar).toBeVisible();
  });

  test('custom intent is sent in API request', async ({ page }) => {
    const welcomePage = new WelcomePage(page);

    // Capture the API request
    const requestPromise = page.waitForRequest('**/api/generate');

    await welcomePage.goto();
    await welcomePage.submitCustomIntent('Looking for a React developer');

    const request = await requestPromise;
    const body = request.postDataJSON();

    expect(body.customIntent).toBe('Looking for a React developer');
    expect(body.visitorTag).toBe('collaborator'); // Custom intents default to collaborator
  });

  test('textarea accepts multiline input', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    const multilineText = 'Line 1\nLine 2\nLine 3';
    await welcomePage.customIntentTextarea.fill(multilineText);

    await expect(welcomePage.continueButton).toBeEnabled();
    await expect(welcomePage.customIntentTextarea).toHaveValue(multilineText);
  });
});
