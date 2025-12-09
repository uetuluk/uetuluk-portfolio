import { test as base, expect } from '@playwright/test';
import { WelcomePage } from '../pages/welcome.page';
import { GeneratedPage } from '../pages/generated.page';
import { mockLayoutWithNewComponents, mockFeedbackResponse, mockHealthResponse } from '../fixtures/mock-data';

// Custom test fixture with mock for new components
const test = base.extend({
  mockNewComponentsApi: [
    async ({ page }, use) => {
      // Mock /api/generate endpoint with new components layout
      await page.route('**/api/generate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLayoutWithNewComponents),
        });
      });

      // Mock /api/feedback endpoint
      await page.route('**/api/feedback', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockFeedbackResponse),
        });
      });

      // Mock /api/health endpoint
      await page.route('**/api/health', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockHealthResponse),
        });
      });

      await use();
    },
    { auto: true },
  ],
});

test.describe('New Components Rendering', () => {
  test.beforeEach(async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('recruiter');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
  });

  test('renders Stats component with values and labels', async ({ page }) => {
    // Check stats section title
    await expect(page.getByRole('heading', { name: 'By the Numbers' })).toBeVisible();

    // Check stat values
    await expect(page.getByText('8+')).toBeVisible();
    await expect(page.getByText('50+')).toBeVisible();
    await expect(page.getByText('30+')).toBeVisible();

    // Check stat labels
    await expect(page.getByText('Years Experience')).toBeVisible();
    await expect(page.getByText('Projects Completed')).toBeVisible();
    await expect(page.getByText('Happy Clients')).toBeVisible();
  });

  test('renders Tabs component with clickable tabs', async ({ page }) => {
    // Check tabs section title
    await expect(page.getByRole('heading', { name: 'Skills Overview' })).toBeVisible();

    // Check tab buttons
    await expect(page.getByRole('tab', { name: 'Frontend' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Backend' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'DevOps' })).toBeVisible();

    // First tab content should be visible by default
    await expect(page.getByText('React, Vue, TypeScript, Tailwind CSS')).toBeVisible();

    // Click on Backend tab
    await page.getByRole('tab', { name: 'Backend' }).click();
    await expect(page.getByText('Node.js, Python, PostgreSQL, Redis')).toBeVisible();

    // Click on DevOps tab
    await page.getByRole('tab', { name: 'DevOps' }).click();
    await expect(page.getByText('Docker, Kubernetes, AWS, CI/CD')).toBeVisible();
  });

  test('renders Accordion component with expandable items', async ({ page }) => {
    // Check accordion section title
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();

    // Check questions are visible
    await expect(page.getByText('What is your availability?')).toBeVisible();
    await expect(page.getByText('What is your hourly rate?')).toBeVisible();

    // Click to expand first question
    await page.getByText('What is your availability?').click();
    await expect(page.getByText('I am currently available for freelance projects.')).toBeVisible();

    // Click to expand second question (should close first)
    await page.getByText('What is your hourly rate?').click();
    await expect(page.getByText('Please contact me to discuss project details and rates.')).toBeVisible();
  });

  test('renders Testimonials component with quotes and authors', async ({ page }) => {
    // Check testimonials section title
    await expect(page.getByRole('heading', { name: 'What People Say' })).toBeVisible();

    // Check quote content
    await expect(page.getByText(/"Excellent developer!"/)).toBeVisible();

    // Check author info
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('CTO at TechCorp')).toBeVisible();
  });

  test('renders FeatureList component with titles and descriptions', async ({ page }) => {
    // Check feature list section title
    await expect(page.getByRole('heading', { name: 'Why Work With Me' })).toBeVisible();

    // Check feature titles
    await expect(page.getByText('Fast Delivery')).toBeVisible();
    await expect(page.getByText('Clean Code')).toBeVisible();

    // Check feature descriptions
    await expect(page.getByText('Quick turnaround on projects')).toBeVisible();
    await expect(page.getByText('Well-structured and maintainable')).toBeVisible();
  });

  test('renders Alert component with message', async ({ page }) => {
    // Check alert title and message
    await expect(page.getByText('Available Now')).toBeVisible();
    await expect(page.getByText('I am currently accepting new projects!')).toBeVisible();

    // Check alert role
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('New Components Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('recruiter');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
  });

  test('Tabs component has proper ARIA attributes', async ({ page }) => {
    // Check tablist role
    await expect(page.getByRole('tablist')).toBeVisible();

    // Check tabs have proper aria-selected
    const frontendTab = page.getByRole('tab', { name: 'Frontend' });
    await expect(frontendTab).toHaveAttribute('aria-selected', 'true');

    const backendTab = page.getByRole('tab', { name: 'Backend' });
    await expect(backendTab).toHaveAttribute('aria-selected', 'false');

    // Check tabpanel role
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  test('Accordion items have proper aria-expanded', async ({ page }) => {
    const firstQuestion = page.getByText('What is your availability?').locator('..');

    // Initially collapsed
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await page.getByText('What is your availability?').click();
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
  });

  test('Alert component has proper role', async ({ page }) => {
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Available Now');
  });
});

test.describe('New Components Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const welcomePage = new WelcomePage(page);
    await welcomePage.goto();
    await welcomePage.selectVisitorType('recruiter');

    const generatedPage = new GeneratedPage(page);
    await generatedPage.waitForLoad();
  });

  test('Tabs are keyboard navigable', async ({ page }) => {
    // Focus on first tab
    await page.getByRole('tab', { name: 'Frontend' }).focus();

    // Press Enter to ensure tab is interactive
    await page.keyboard.press('Enter');
    await expect(page.getByText('React, Vue, TypeScript, Tailwind CSS')).toBeVisible();
  });

  test('Accordion items are keyboard accessible', async ({ page }) => {
    // Focus on first accordion button
    await page.getByText('What is your availability?').focus();

    // Press Enter to expand
    await page.keyboard.press('Enter');
    await expect(page.getByText('I am currently available for freelance projects.')).toBeVisible();

    // Press Enter again to collapse
    await page.keyboard.press('Enter');
  });
});
