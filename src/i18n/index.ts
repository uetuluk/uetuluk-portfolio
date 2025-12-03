import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enUI from './locales/en/ui.json';
import enPortfolio from './locales/en/portfolio.json';
import zhUI from './locales/zh/ui.json';
import zhPortfolio from './locales/zh/portfolio.json';
import jaUI from './locales/ja/ui.json';
import jaPortfolio from './locales/ja/portfolio.json';
import trUI from './locales/tr/ui.json';
import trPortfolio from './locales/tr/portfolio.json';

export const supportedLanguages = ['en', 'zh', 'ja', 'tr'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  tr: 'Türkçe',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { ui: enUI, portfolio: enPortfolio },
      zh: { ui: zhUI, portfolio: zhPortfolio },
      ja: { ui: jaUI, portfolio: jaPortfolio },
      tr: { ui: trUI, portfolio: trPortfolio },
    },
    fallbackLng: 'en',
    defaultNS: 'ui',
    ns: ['ui', 'portfolio'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language-preference',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
