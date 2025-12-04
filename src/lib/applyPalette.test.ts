import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyPaletteToRoot } from './applyPalette';
import type { ThemePalettes } from './palette';

const mockPalettes: ThemePalettes = {
  light: {
    background: '175 10% 99%',
    foreground: '175 30% 10%',
    card: '175 10% 98%',
    cardForeground: '175 30% 10%',
    popover: '175 10% 98%',
    popoverForeground: '175 30% 10%',
    primary: '175 70% 40%',
    primaryForeground: '175 10% 98%',
    secondary: '175 25% 92%',
    secondaryForeground: '175 50% 25%',
    muted: '175 20% 94%',
    mutedForeground: '175 15% 45%',
    accent: '175 40% 90%',
    accentForeground: '175 60% 25%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '175 15% 85%',
    input: '175 15% 85%',
    ring: '175 70% 40%',
  },
  dark: {
    background: '175 20% 6%',
    foreground: '175 15% 95%',
    card: '175 20% 8%',
    cardForeground: '175 15% 95%',
    popover: '175 20% 8%',
    popoverForeground: '175 15% 95%',
    primary: '175 60% 65%',
    primaryForeground: '175 30% 10%',
    secondary: '175 25% 18%',
    secondaryForeground: '175 20% 90%',
    muted: '175 20% 18%',
    mutedForeground: '175 15% 60%',
    accent: '175 30% 20%',
    accentForeground: '175 50% 85%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: '175 20% 20%',
    input: '175 20% 20%',
    ring: '175 60% 70%',
  },
};

describe('applyPaletteToRoot', () => {
  const styleId = 'dynamic-palette-dark';

  beforeEach(() => {
    // Clear any existing style elements
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    // Reset inline styles on root
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    // Cleanup
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    document.documentElement.style.cssText = '';
  });

  it('sets light mode CSS variables on document root', () => {
    applyPaletteToRoot(mockPalettes);

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--background')).toBe('175 10% 99%');
    expect(style.getPropertyValue('--foreground')).toBe('175 30% 10%');
    expect(style.getPropertyValue('--primary')).toBe('175 70% 40%');
    expect(style.getPropertyValue('--secondary')).toBe('175 25% 92%');
  });

  it('sets all 19 CSS custom properties', () => {
    applyPaletteToRoot(mockPalettes);

    const style = document.documentElement.style;
    const expectedVars = [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--destructive-foreground',
      '--border',
      '--input',
      '--ring',
    ];

    expectedVars.forEach((varName) => {
      expect(style.getPropertyValue(varName)).not.toBe('');
    });
  });

  it('creates style element with id for dark mode', () => {
    applyPaletteToRoot(mockPalettes);

    const styleEl = document.getElementById(styleId);
    expect(styleEl).not.toBeNull();
    expect(styleEl?.tagName.toLowerCase()).toBe('style');
  });

  it('appends style element to document head', () => {
    applyPaletteToRoot(mockPalettes);

    const styleEl = document.getElementById(styleId);
    expect(styleEl?.parentNode).toBe(document.head);
  });

  it('generates correct .dark CSS ruleset', () => {
    applyPaletteToRoot(mockPalettes);

    const styleEl = document.getElementById(styleId) as HTMLStyleElement;
    expect(styleEl?.textContent).toContain('.dark {');
    expect(styleEl?.textContent).toContain('--background: 175 20% 6%;');
    expect(styleEl?.textContent).toContain('--primary: 175 60% 65%;');
  });

  it('re-uses existing style element on subsequent calls', () => {
    applyPaletteToRoot(mockPalettes);
    applyPaletteToRoot(mockPalettes);

    const styleElements = document.querySelectorAll(`#${styleId}`);
    expect(styleElements.length).toBe(1);
  });

  it('updates values when called multiple times with different palettes', () => {
    applyPaletteToRoot(mockPalettes);

    const updatedPalettes: ThemePalettes = {
      ...mockPalettes,
      light: {
        ...mockPalettes.light,
        primary: '210 70% 50%',
      },
      dark: {
        ...mockPalettes.dark,
        primary: '210 60% 70%',
      },
    };

    applyPaletteToRoot(updatedPalettes);

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--primary')).toBe('210 70% 50%');

    const styleEl = document.getElementById(styleId) as HTMLStyleElement;
    expect(styleEl?.textContent).toContain('--primary: 210 60% 70%;');
  });
});
