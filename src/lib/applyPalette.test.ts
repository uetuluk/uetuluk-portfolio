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
  const lightStyleId = 'dynamic-palette-light';
  const darkStyleId = 'dynamic-palette-dark';

  beforeEach(() => {
    // Clear any existing style elements
    const existingLight = document.getElementById(lightStyleId);
    if (existingLight) existingLight.remove();
    const existingDark = document.getElementById(darkStyleId);
    if (existingDark) existingDark.remove();
  });

  afterEach(() => {
    // Cleanup
    const existingLight = document.getElementById(lightStyleId);
    if (existingLight) existingLight.remove();
    const existingDark = document.getElementById(darkStyleId);
    if (existingDark) existingDark.remove();
  });

  it('sets light mode CSS variables via style element', () => {
    applyPaletteToRoot(mockPalettes);

    const styleEl = document.getElementById(lightStyleId) as HTMLStyleElement;
    expect(styleEl?.textContent).toContain(':root {');
    expect(styleEl?.textContent).toContain('--background: 175 10% 99%;');
    expect(styleEl?.textContent).toContain('--foreground: 175 30% 10%;');
    expect(styleEl?.textContent).toContain('--primary: 175 70% 40%;');
    expect(styleEl?.textContent).toContain('--secondary: 175 25% 92%;');
  });

  it('sets all 19 CSS custom properties in style elements', () => {
    applyPaletteToRoot(mockPalettes);

    const lightStyleEl = document.getElementById(lightStyleId) as HTMLStyleElement;
    const darkStyleEl = document.getElementById(darkStyleId) as HTMLStyleElement;
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
      expect(lightStyleEl?.textContent).toContain(`${varName}:`);
      expect(darkStyleEl?.textContent).toContain(`${varName}:`);
    });
  });

  it('creates style elements with ids for both light and dark modes', () => {
    applyPaletteToRoot(mockPalettes);

    const lightStyleEl = document.getElementById(lightStyleId);
    const darkStyleEl = document.getElementById(darkStyleId);
    expect(lightStyleEl).not.toBeNull();
    expect(darkStyleEl).not.toBeNull();
    expect(lightStyleEl?.tagName.toLowerCase()).toBe('style');
    expect(darkStyleEl?.tagName.toLowerCase()).toBe('style');
  });

  it('appends style elements to document head', () => {
    applyPaletteToRoot(mockPalettes);

    const lightStyleEl = document.getElementById(lightStyleId);
    const darkStyleEl = document.getElementById(darkStyleId);
    expect(lightStyleEl?.parentNode).toBe(document.head);
    expect(darkStyleEl?.parentNode).toBe(document.head);
  });

  it('generates correct .dark CSS ruleset', () => {
    applyPaletteToRoot(mockPalettes);

    const styleEl = document.getElementById(darkStyleId) as HTMLStyleElement;
    expect(styleEl?.textContent).toContain('.dark {');
    expect(styleEl?.textContent).toContain('--background: 175 20% 6%;');
    expect(styleEl?.textContent).toContain('--primary: 175 60% 65%;');
  });

  it('re-uses existing style elements on subsequent calls', () => {
    applyPaletteToRoot(mockPalettes);
    applyPaletteToRoot(mockPalettes);

    const lightStyleElements = document.querySelectorAll(`#${lightStyleId}`);
    const darkStyleElements = document.querySelectorAll(`#${darkStyleId}`);
    expect(lightStyleElements.length).toBe(1);
    expect(darkStyleElements.length).toBe(1);
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

    const lightStyleEl = document.getElementById(lightStyleId) as HTMLStyleElement;
    expect(lightStyleEl?.textContent).toContain('--primary: 210 70% 50%;');

    const darkStyleEl = document.getElementById(darkStyleId) as HTMLStyleElement;
    expect(darkStyleEl?.textContent).toContain('--primary: 210 60% 70%;');
  });

  it('ignores unknown palette keys that are not in CSS_VAR_MAP', () => {
    // Create palette with an extra unknown key
    const paletteWithUnknownKey = {
      light: {
        ...mockPalettes.light,
        unknownKey: '123 45% 67%',
      } as typeof mockPalettes.light,
      dark: {
        ...mockPalettes.dark,
        anotherUnknown: '200 50% 50%',
      } as typeof mockPalettes.dark,
    };

    applyPaletteToRoot(paletteWithUnknownKey);

    const lightStyleEl = document.getElementById(lightStyleId) as HTMLStyleElement;
    const darkStyleEl = document.getElementById(darkStyleId) as HTMLStyleElement;

    // Should not contain the unknown key
    expect(lightStyleEl?.textContent).not.toContain('unknownKey');
    expect(darkStyleEl?.textContent).not.toContain('anotherUnknown');

    // Should still contain valid keys
    expect(lightStyleEl?.textContent).toContain('--background:');
    expect(darkStyleEl?.textContent).toContain('--background:');
  });
});
