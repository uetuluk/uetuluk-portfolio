import { Page, Locator } from '@playwright/test';

export class WelcomePage {
  readonly page: Page;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly formLabel: Locator;
  readonly customIntentTextarea: Locator;
  readonly continueButton: Locator;
  readonly quickOptionsText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { level: 1 });
    this.subtitle = page.getByText('To personalize your experience');
    this.formLabel = page.getByText('What brings you here?');
    this.customIntentTextarea = page.getByPlaceholder("I'm interested in...");
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.quickOptionsText = page.getByText('Quick options:');
  }

  async goto() {
    await this.page.goto('/');
  }

  getVisitorTypeButton(type: 'recruiter' | 'developer' | 'collaborator' | 'friend') {
    const labels: Record<string, string> = {
      recruiter: 'Recruiter / HR',
      developer: 'Fellow Developer',
      collaborator: 'Potential Collaborator',
      friend: 'Friend / Family',
    };
    return this.page.getByRole('button', { name: new RegExp(labels[type], 'i') }).first();
  }

  async selectVisitorType(type: 'recruiter' | 'developer' | 'collaborator' | 'friend') {
    await this.getVisitorTypeButton(type).click();
  }

  async submitCustomIntent(intent: string) {
    await this.customIntentTextarea.fill(intent);
    await this.continueButton.click();
  }

  async clearCustomIntent() {
    await this.customIntentTextarea.clear();
  }
}
