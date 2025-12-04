export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemePalettes {
  light: ColorPalette;
  dark: ColorPalette;
}

// Color name to HSL hue mapping (matching AI prompt options + extras)
const COLOR_HUE_MAP: Record<string, number> = {
  blue: 210,
  green: 145,
  purple: 270,
  orange: 25,
  pink: 330,
  teal: 175,
  cyan: 185,
  red: 0,
  yellow: 50,
  indigo: 240,
  violet: 280,
  rose: 345,
  amber: 35,
  lime: 85,
  emerald: 155,
  sky: 200,
  slate: 215,
};

// Default base saturation and lightness
const DEFAULT_SATURATION = 70;
const DEFAULT_LIGHTNESS = 40;

// Generate a random hue (0-360)
export function generateRandomHue(): number {
  return Math.floor(Math.random() * 360);
}

// Convert a color name to HSL color
export function colorNameToHSL(colorName: string): HSLColor {
  const normalizedName = colorName.toLowerCase().trim();
  const hue = COLOR_HUE_MAP[normalizedName] ?? generateRandomHue();
  return { h: hue, s: DEFAULT_SATURATION, l: DEFAULT_LIGHTNESS };
}

// Generate random HSL color
export function generateRandomColor(): HSLColor {
  return { h: generateRandomHue(), s: DEFAULT_SATURATION, l: DEFAULT_LIGHTNESS };
}

function hslToString(color: HSLColor): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Default teal color (used as fallback)
const DEFAULT_BASE_COLOR: HSLColor = { h: 175, s: DEFAULT_SATURATION, l: DEFAULT_LIGHTNESS };

export function generatePalette(base: HSLColor = DEFAULT_BASE_COLOR): ThemePalettes {
  const light: ColorPalette = {
    // Backgrounds: Very light, low saturation versions of base
    background: hslToString({ h: base.h, s: 10, l: 99 }),
    foreground: hslToString({ h: base.h, s: 30, l: 10 }),

    // Card: Slightly tinted white
    card: hslToString({ h: base.h, s: 10, l: 98 }),
    cardForeground: hslToString({ h: base.h, s: 30, l: 10 }),

    // Popover: Same as card
    popover: hslToString({ h: base.h, s: 10, l: 98 }),
    popoverForeground: hslToString({ h: base.h, s: 30, l: 10 }),

    // Primary: The main brand color
    primary: hslToString({ h: base.h, s: base.s, l: base.l }),
    primaryForeground: hslToString({ h: base.h, s: 10, l: 98 }),

    // Secondary: Lighter, more muted version
    secondary: hslToString({ h: base.h, s: 25, l: 92 }),
    secondaryForeground: hslToString({ h: base.h, s: 50, l: 25 }),

    // Muted: Very subtle background tint
    muted: hslToString({ h: base.h, s: 20, l: 94 }),
    mutedForeground: hslToString({ h: base.h, s: 15, l: 45 }),

    // Accent: Slightly more vivid for interactive elements
    accent: hslToString({ h: base.h, s: 40, l: 90 }),
    accentForeground: hslToString({ h: base.h, s: 60, l: 25 }),

    // Destructive: Keep red for semantic meaning
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',

    // Borders and inputs: Subtle teal-tinted grays
    border: hslToString({ h: base.h, s: 15, l: 85 }),
    input: hslToString({ h: base.h, s: 15, l: 85 }),
    ring: hslToString({ h: base.h, s: base.s, l: base.l }),
  };

  const dark: ColorPalette = {
    // Backgrounds: Very dark with subtle teal tint
    background: hslToString({ h: base.h, s: 20, l: 6 }),
    foreground: hslToString({ h: base.h, s: 15, l: 95 }),

    // Card: Slightly lighter than background
    card: hslToString({ h: base.h, s: 20, l: 8 }),
    cardForeground: hslToString({ h: base.h, s: 15, l: 95 }),

    // Popover
    popover: hslToString({ h: base.h, s: 20, l: 8 }),
    popoverForeground: hslToString({ h: base.h, s: 15, l: 95 }),

    // Primary: Lighter version for dark backgrounds
    primary: hslToString({
      h: base.h,
      s: clamp(base.s - 10, 0, 100),
      l: clamp(base.l + 25, 0, 100),
    }),
    primaryForeground: hslToString({ h: base.h, s: 30, l: 10 }),

    // Secondary
    secondary: hslToString({ h: base.h, s: 25, l: 18 }),
    secondaryForeground: hslToString({ h: base.h, s: 20, l: 90 }),

    // Muted
    muted: hslToString({ h: base.h, s: 20, l: 18 }),
    mutedForeground: hslToString({ h: base.h, s: 15, l: 60 }),

    // Accent
    accent: hslToString({ h: base.h, s: 30, l: 20 }),
    accentForeground: hslToString({ h: base.h, s: 50, l: 85 }),

    // Destructive: Darker red for dark mode
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',

    // Borders
    border: hslToString({ h: base.h, s: 20, l: 20 }),
    input: hslToString({ h: base.h, s: 20, l: 20 }),
    ring: hslToString({ h: base.h, s: clamp(base.s - 10, 0, 100), l: clamp(base.l + 30, 0, 100) }),
  };

  return { light, dark };
}
