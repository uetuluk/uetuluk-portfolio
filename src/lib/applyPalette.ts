import type { ColorPalette, ThemePalettes } from "./palette";

const CSS_VAR_MAP: Record<keyof ColorPalette, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
};

function applyDarkModeVariables(darkPalette: ColorPalette): void {
  const styleId = "dynamic-palette-dark";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const cssRules = Object.entries(darkPalette)
    .map(([key, value]) => {
      const cssVar = CSS_VAR_MAP[key as keyof ColorPalette];
      return cssVar ? `  ${cssVar}: ${value};` : "";
    })
    .filter(Boolean)
    .join("\n");

  styleEl.textContent = `.dark {\n${cssRules}\n}`;
}

export function applyPaletteToRoot(palettes: ThemePalettes): void {
  const root = document.documentElement;
  const style = root.style;

  // Apply light mode variables to :root
  Object.entries(palettes.light).forEach(([key, value]) => {
    const cssVar = CSS_VAR_MAP[key as keyof ColorPalette];
    if (cssVar) {
      style.setProperty(cssVar, value);
    }
  });

  // Apply dark mode variables via dynamic style element
  applyDarkModeVariables(palettes.dark);
}
