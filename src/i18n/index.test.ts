import { describe, it, expect } from 'vitest';
import i18n, { supportedLanguages, languageNames } from './index';
import type { SupportedLanguage } from './index';

describe('i18n exports', () => {
  describe('supportedLanguages', () => {
    it('contains all four supported languages', () => {
      expect(supportedLanguages).toEqual(['en', 'zh', 'ja', 'tr']);
    });

    it('is a readonly tuple', () => {
      expect(supportedLanguages.length).toBe(4);
    });
  });

  describe('languageNames', () => {
    it('maps en to English', () => {
      expect(languageNames.en).toBe('English');
    });

    it('maps zh to Chinese characters', () => {
      expect(languageNames.zh).toBe('中文');
    });

    it('maps ja to Japanese characters', () => {
      expect(languageNames.ja).toBe('日本語');
    });

    it('maps tr to Turkish', () => {
      expect(languageNames.tr).toBe('Türkçe');
    });

    it('has entries for all supported languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(languageNames[lang as SupportedLanguage]).toBeDefined();
      });
    });
  });
});

describe('i18n instance', () => {
  it('is exported as default', () => {
    expect(i18n).toBeDefined();
    expect(typeof i18n.t).toBe('function');
  });

  it('has correct namespaces configured', () => {
    const options = i18n.options;
    expect(options.ns).toContain('ui');
    expect(options.ns).toContain('portfolio');
  });

  it('has default namespace set to ui', () => {
    expect(i18n.options.defaultNS).toBe('ui');
  });

  it('has fallback language set to en', () => {
    expect(i18n.options.fallbackLng).toContain('en');
  });

  it('has resources for all supported languages', () => {
    const resources = i18n.options.resources;
    expect(resources).toHaveProperty('en');
    expect(resources).toHaveProperty('zh');
    expect(resources).toHaveProperty('ja');
    expect(resources).toHaveProperty('tr');
  });

  it('has both ui and portfolio namespaces for each language', () => {
    const resources = i18n.options.resources as Record<string, Record<string, unknown>>;
    supportedLanguages.forEach((lang) => {
      expect(resources[lang]).toHaveProperty('ui');
      expect(resources[lang]).toHaveProperty('portfolio');
    });
  });
});
