import { describe, it, expect } from 'vitest';
import { fallbackTitlesFor, LANGUAGE_NAMES, resolveLanguage } from './language';
import { DEFAULT_FALLBACK_TITLES } from './fallback';
import ja from '../i18n/locales/ja/ui.json';

describe('resolveLanguage', () => {
  it.each([
    ['ja', 'ja'],
    ['zh', 'zh'],
    ['en-US', 'en'],
    ['zh-CN', 'zh'],
    ['TR', 'tr'],
  ])('maps %s to %s', (input, expected) => {
    expect(resolveLanguage(input)).toBe(expected);
  });

  it.each([['fr'], [''], ['__proto__'], ['constructor'], [42], [undefined], [null]])(
    'falls back to English for %s',
    (input) => {
      expect(resolveLanguage(input)).toBe('en');
    },
  );
});

describe('fallbackTitlesFor', () => {
  it('uses the translated section titles', () => {
    expect(fallbackTitlesFor('ja')).toEqual({ ...DEFAULT_FALLBACK_TITLES, ...ja.fallbackSections });
    expect(fallbackTitlesFor('ja').aboutMe).not.toBe(DEFAULT_FALLBACK_TITLES.aboutMe);
  });

  it('has a model-facing name for every language', () => {
    for (const language of ['en', 'ja', 'tr', 'zh'] as const) {
      expect(LANGUAGE_NAMES[language]).toBeTruthy();
      expect(Object.keys(fallbackTitlesFor(language))).toEqual(
        Object.keys(DEFAULT_FALLBACK_TITLES),
      );
    }
  });
});
