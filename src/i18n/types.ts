import 'i18next';
import type enUI from './locales/en/ui.json';
import type enPortfolio from './locales/en/portfolio.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'ui';
    resources: {
      ui: typeof enUI;
      portfolio: typeof enPortfolio;
    };
  }
}
