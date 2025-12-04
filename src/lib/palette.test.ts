import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generatePalette,
  colorNameToHSL,
  generateRandomColor,
  generateRandomHue,
  type HSLColor,
} from "./palette";

describe("palette", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("colorNameToHSL", () => {
    it("converts known color names to correct HSL values", () => {
      expect(colorNameToHSL("blue")).toEqual({ h: 210, s: 70, l: 40 });
      expect(colorNameToHSL("green")).toEqual({ h: 145, s: 70, l: 40 });
      expect(colorNameToHSL("purple")).toEqual({ h: 270, s: 70, l: 40 });
      expect(colorNameToHSL("teal")).toEqual({ h: 175, s: 70, l: 40 });
      expect(colorNameToHSL("orange")).toEqual({ h: 25, s: 70, l: 40 });
    });

    it("handles case-insensitive color names", () => {
      expect(colorNameToHSL("BLUE")).toEqual(colorNameToHSL("blue"));
      expect(colorNameToHSL("Blue")).toEqual(colorNameToHSL("blue"));
      expect(colorNameToHSL("GREEN")).toEqual(colorNameToHSL("green"));
    });

    it("handles color names with whitespace", () => {
      expect(colorNameToHSL("  blue  ")).toEqual(colorNameToHSL("blue"));
      expect(colorNameToHSL("  purple")).toEqual(colorNameToHSL("purple"));
    });

    it("returns random hue for unknown colors", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const unknown = colorNameToHSL("unknowncolor");
      expect(unknown.h).toBe(180); // 0.5 * 360 = 180
      expect(unknown.s).toBe(70);
      expect(unknown.l).toBe(40);
    });
  });

  describe("generateRandomHue", () => {
    it("returns a number between 0 and 359", () => {
      for (let i = 0; i < 10; i++) {
        const hue = generateRandomHue();
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      }
    });

    it("returns integer values", () => {
      const hue = generateRandomHue();
      expect(Number.isInteger(hue)).toBe(true);
    });

    it("uses Math.random for randomness", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.25);
      expect(generateRandomHue()).toBe(90); // 0.25 * 360 = 90
    });
  });

  describe("generateRandomColor", () => {
    it("returns HSLColor with default saturation and lightness", () => {
      const color = generateRandomColor();
      expect(color.s).toBe(70);
      expect(color.l).toBe(40);
      expect(color.h).toBeGreaterThanOrEqual(0);
      expect(color.h).toBeLessThan(360);
    });
  });

  describe("generatePalette", () => {
    it("generates light and dark palettes from base color", () => {
      const base: HSLColor = { h: 210, s: 70, l: 40 };
      const palettes = generatePalette(base);

      expect(palettes).toHaveProperty("light");
      expect(palettes).toHaveProperty("dark");
    });

    it("light palette has all required properties", () => {
      const base: HSLColor = { h: 210, s: 70, l: 40 };
      const { light } = generatePalette(base);

      const requiredKeys = [
        "background",
        "foreground",
        "card",
        "cardForeground",
        "popover",
        "popoverForeground",
        "primary",
        "primaryForeground",
        "secondary",
        "secondaryForeground",
        "muted",
        "mutedForeground",
        "accent",
        "accentForeground",
        "destructive",
        "destructiveForeground",
        "border",
        "input",
        "ring",
      ];

      requiredKeys.forEach((key) => {
        expect(light).toHaveProperty(key);
        expect(typeof light[key as keyof typeof light]).toBe("string");
      });
    });

    it("dark palette has all required properties", () => {
      const base: HSLColor = { h: 210, s: 70, l: 40 };
      const { dark } = generatePalette(base);

      expect(dark).toHaveProperty("background");
      expect(dark).toHaveProperty("primary");
      expect(dark).toHaveProperty("foreground");
      expect(dark).toHaveProperty("destructive");
    });

    it("uses default teal color when no base provided", () => {
      const palettes = generatePalette();
      // Default is teal (h: 175)
      expect(palettes.light.primary).toContain("175");
    });

    it("primary color reflects base hue", () => {
      const base: HSLColor = { h: 210, s: 70, l: 40 };
      const { light } = generatePalette(base);

      expect(light.primary).toContain("210");
    });

    it("destructive colors remain red regardless of base", () => {
      const base: HSLColor = { h: 210, s: 70, l: 40 };
      const { light, dark } = generatePalette(base);

      // Destructive should be red-ish (starts with "0 ")
      expect(light.destructive).toMatch(/^0\s/);
      expect(dark.destructive).toMatch(/^0\s/);
    });

    it("generates different palettes for different base colors", () => {
      const bluePalette = generatePalette({ h: 210, s: 70, l: 40 });
      const greenPalette = generatePalette({ h: 145, s: 70, l: 40 });

      expect(bluePalette.light.primary).not.toBe(greenPalette.light.primary);
      expect(bluePalette.dark.primary).not.toBe(greenPalette.dark.primary);
    });
  });
});
