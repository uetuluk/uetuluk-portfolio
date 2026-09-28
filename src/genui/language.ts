/**
 * Visitor language for /api/generate. Shared by the Worker and the browser, so it reads the
 * locale files directly instead of going through i18next.
 */
import { fallbackSections as en } from '../i18n/locales/en/ui.json';
import { fallbackSections as ja } from '../i18n/locales/ja/ui.json';
import { fallbackSections as tr } from '../i18n/locales/tr/ui.json';
import { fallbackSections as zh } from '../i18n/locales/zh/ui.json';
import { DEFAULT_FALLBACK_TITLES, type FallbackTitles } from './fallback';

const FALLBACK_TITLES = { en, ja, tr, zh } satisfies Record<string, Partial<FallbackTitles>>;

export type GenerateLanguage = keyof typeof FALLBACK_TITLES;

/** Language names the model is told to write in. */
export const LANGUAGE_NAMES: Record<GenerateLanguage, string> = {
  en: 'English',
  ja: 'Japanese',
  tr: 'Turkish',
  zh: 'Simplified Chinese',
};

/** Map a client-supplied language (e.g. "ja" or "en-US") to a supported one, else English. */
export function resolveLanguage(value: unknown): GenerateLanguage {
  const base = typeof value === 'string' ? value.toLowerCase().split('-')[0] : '';
  return Object.hasOwn(FALLBACK_TITLES, base) ? (base as GenerateLanguage) : 'en';
}

/** Section titles for the default layout, in the given language. */
export function fallbackTitlesFor(language: GenerateLanguage): FallbackTitles {
  return { ...DEFAULT_FALLBACK_TITLES, ...FALLBACK_TITLES[language] };
}
