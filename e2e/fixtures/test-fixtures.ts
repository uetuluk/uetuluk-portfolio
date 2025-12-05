import { test as base, expect } from '@playwright/test';
import {
  mockGeneratedLayout,
  mockFeedbackResponse,
  mockFeedbackRegenerateResponse,
  mockHealthResponse,
} from './mock-data';

type TestFixtures = {
  mockApiResponses: void;
};

export const test = base.extend<TestFixtures>({
  mockApiResponses: [
    async ({ page }, use) => {
      // Mock /api/generate endpoint
      await page.route('**/api/generate', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockGeneratedLayout),
        });
      });

      // Mock /api/feedback endpoint
      await page.route('**/api/feedback', async (route) => {
        const request = route.request();
        const body = request.postDataJSON();

        if (body.feedbackType === 'like') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockFeedbackResponse),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockFeedbackRegenerateResponse),
          });
        }
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

export { expect };
