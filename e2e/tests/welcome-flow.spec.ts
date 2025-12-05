import { test, expect } from '../fixtures/test-fixtures';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';

test.describe('Welcome Flow', () => {
  test('displays welcome modal on initial visit', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await expect(welcomePage.title).toBeVisible();
    await expect(welcomePage.title).toContainText('Welcome');
    await expect(welcomePage.subtitle).toBeVisible();
    await expect(welcomePage.customIntentTextarea).toBeVisible();
    await expect(welcomePage.continueButton).toBeDisabled();
  });

  test('shows quick options for visitor type selection', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await expect(welcomePage.quickOptionsText).toBeVisible();
    await expect(welcomePage.getVisitorTypeButton('recruiter')).toBeVisible();
    await expect(welcomePage.getVisitorTypeButton('developer')).toBeVisible();
    await expect(welcomePage.getVisitorTypeButton('collaborator')).toBeVisible();
    await expect(welcomePage.getVisitorTypeButton('friend')).toBeVisible();
  });

  test('selecting recruiter transitions to generated page', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.selectVisitorType('recruiter');

    // Loading screen may flash briefly (mock returns instantly)
    // So we just verify we end up at the generated page
    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
    await expect(generatedPage.footer).toBeVisible();
  });

  test('selecting developer loads generated page', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
    await expect(generatedPage.navbar).toBeVisible();
  });

  test('selecting collaborator loads generated page', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.selectVisitorType('collaborator');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
    await expect(generatedPage.navbar).toBeVisible();
  });

  test('selecting friend loads generated page', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.selectVisitorType('friend');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
    await expect(generatedPage.navbar).toBeVisible();
  });

  test('footer shows personalized message for visitor type', async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();

    await welcomePage.selectVisitorType('developer');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();

    // Footer should mention the visitor type
    await expect(generatedPage.footer).toContainText(/fellow developer/i);
  });
});
