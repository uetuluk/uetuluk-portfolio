import type { ColorPalette, ThemePalettes } from './palette';

const CSS_VAR_MAP: Record<keyof ColorPalette, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
};

function createOrUpdateStyleElement(
  styleId: string,
  selector: string,
  palette: ColorPalette,
): void {
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const cssRules = Object.entries(palette)
    .map(([key, value]) => {
      const cssVar = CSS_VAR_MAP[key as keyof ColorPalette];
      return cssVar ? `  ${cssVar}: ${value};` : '';
    })
    .filter(Boolean)
    .join('\n');

  styleEl.textContent = `${selector} {\n${cssRules}\n}`;
}

function applyLightModeVariables(lightPalette: ColorPalette): void {
  createOrUpdateStyleElement('dynamic-palette-light', ':root', lightPalette);
}

function applyDarkModeVariables(darkPalette: ColorPalette): void {
  createOrUpdateStyleElement('dynamic-palette-dark', '.dark', darkPalette);
}

export function applyPaletteToRoot(palettes: ThemePalettes): void {
  // Apply light mode variables via dynamic style element
  applyLightModeVariables(palettes.light);

  // Apply dark mode variables via dynamic style element
  applyDarkModeVariables(palettes.dark);
}
