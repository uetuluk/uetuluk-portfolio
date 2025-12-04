import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Worker Pure Functions Tests
 *
 * These tests verify the logic of pure functions in the worker.
 * Since the functions are not exported from index.ts, we recreate them here
 * to test the patterns. In production, consider exporting these functions
 * for better testability.
 */

// Recreated parseUserAgent logic (matches worker/index.ts)
function parseUserAgent(ua: string | null): {
  type: "mobile" | "tablet" | "desktop";
  browser?: string;
  os?: string;
} {
  if (!ua) {
    return { type: "desktop" };
  }

  let type: "mobile" | "tablet" | "desktop" = "desktop";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    type = "mobile";
  } else if (/tablet|ipad|android(?!.*mobile)|kindle|silk/i.test(ua)) {
    type = "tablet";
  }

  let browser: string | undefined;
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opera|opr\//i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";

  let os: string | undefined;
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { type, browser, os };
}

// Recreated getTimeContext logic (matches worker/index.ts)
function getTimeContext(timezone?: string): {
  localHour: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  isWeekend: boolean;
} {
  let localHour: number;
  let isWeekend: boolean;

  try {
    if (timezone) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
        weekday: "short",
      });
      const parts = formatter.formatToParts(now);
      localHour = parseInt(
        parts.find((p) => p.type === "hour")?.value || "12",
        10
      );
      const weekday = parts.find((p) => p.type === "weekday")?.value || "";
      isWeekend = weekday === "Sat" || weekday === "Sun";
    } else {
      const now = new Date();
      localHour = now.getUTCHours();
      isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
    }
  } catch {
    const now = new Date();
    localHour = now.getUTCHours();
    isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
  }

  let timeOfDay: "morning" | "afternoon" | "evening" | "night";
  if (localHour >= 5 && localHour < 12) timeOfDay = "morning";
  else if (localHour >= 12 && localHour < 17) timeOfDay = "afternoon";
  else if (localHour >= 17 && localHour < 21) timeOfDay = "evening";
  else timeOfDay = "night";

  return { localHour, timeOfDay, isWeekend };
}

// Simple hash function (matches worker/index.ts pattern)
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

describe("Worker Pure Functions", () => {
  describe("parseUserAgent", () => {
    it("returns desktop type for null user agent", () => {
      const result = parseUserAgent(null);
      expect(result.type).toBe("desktop");
    });

    it("returns desktop type for empty string", () => {
      const result = parseUserAgent("");
      expect(result.type).toBe("desktop");
    });

    describe("mobile detection", () => {
      it("detects iPhone", () => {
        const ua =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15";
        expect(parseUserAgent(ua).type).toBe("mobile");
      });

      it("detects Android mobile", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 10; SM-G960U Mobile) AppleWebKit/537.36";
        expect(parseUserAgent(ua).type).toBe("mobile");
      });

      it("detects Windows Phone", () => {
        const ua = "Mozilla/5.0 (Windows Phone 10.0) AppleWebKit/537.36";
        expect(parseUserAgent(ua).type).toBe("mobile");
      });
    });

    describe("tablet detection", () => {
      it("detects iPad", () => {
        const ua =
          "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15";
        expect(parseUserAgent(ua).type).toBe("tablet");
      });

      it("detects Android tablet (no mobile keyword)", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 10; SM-T860) AppleWebKit/537.36";
        expect(parseUserAgent(ua).type).toBe("tablet");
      });

      it("detects Kindle", () => {
        const ua = "Mozilla/5.0 (Linux; U; Android 4.0.3; en-us; Kindle)";
        expect(parseUserAgent(ua).type).toBe("tablet");
      });
    });

    describe("browser detection", () => {
      it("detects Chrome browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
        expect(parseUserAgent(ua).browser).toBe("Chrome");
      });

      it("detects Safari browser (not Chrome)", () => {
        const ua =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15";
        expect(parseUserAgent(ua).browser).toBe("Safari");
      });

      it("detects Edge browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0 Safari/537.36 Edg/91.0.864.59";
        expect(parseUserAgent(ua).browser).toBe("Edge");
      });

      it("detects Firefox browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0";
        expect(parseUserAgent(ua).browser).toBe("Firefox");
      });

      it("detects Opera browser", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 OPR/77.0";
        expect(parseUserAgent(ua).browser).toBe("Opera");
      });
    });

    describe("OS detection", () => {
      it("detects Windows OS", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
        expect(parseUserAgent(ua).os).toBe("Windows");
      });

      it("detects macOS", () => {
        const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
        expect(parseUserAgent(ua).os).toBe("macOS");
      });

      it("detects iOS", () => {
        const ua =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";
        expect(parseUserAgent(ua).os).toBe("iOS");
      });

      it("detects Android", () => {
        const ua = "Mozilla/5.0 (Linux; Android 10; SM-G960U)";
        expect(parseUserAgent(ua).os).toBe("Android");
      });

      it("detects Linux", () => {
        const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";
        expect(parseUserAgent(ua).os).toBe("Linux");
      });
    });
  });

  describe("getTimeContext", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns morning for hours 5-11", () => {
      vi.setSystemTime(new Date("2024-01-15T09:00:00Z"));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe("morning");
      expect(result.localHour).toBe(9);
    });

    it("returns afternoon for hours 12-16", () => {
      vi.setSystemTime(new Date("2024-01-15T14:00:00Z"));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe("afternoon");
    });

    it("returns evening for hours 17-20", () => {
      vi.setSystemTime(new Date("2024-01-15T18:00:00Z"));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe("evening");
    });

    it("returns night for hours 21-4", () => {
      vi.setSystemTime(new Date("2024-01-15T23:00:00Z"));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe("night");
    });

    it("returns night for early morning hours", () => {
      vi.setSystemTime(new Date("2024-01-15T03:00:00Z"));

      const result = getTimeContext();
      expect(result.timeOfDay).toBe("night");
    });

    it("detects weekend correctly (Saturday)", () => {
      vi.setSystemTime(new Date("2024-01-13T12:00:00Z")); // Saturday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(true);
    });

    it("detects weekend correctly (Sunday)", () => {
      vi.setSystemTime(new Date("2024-01-14T12:00:00Z")); // Sunday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(true);
    });

    it("detects weekday correctly", () => {
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z")); // Monday

      const result = getTimeContext();
      expect(result.isWeekend).toBe(false);
    });

    it("handles valid timezone", () => {
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

      // America/New_York is UTC-5 in winter
      const result = getTimeContext("America/New_York");
      expect(result.localHour).toBe(7);
      expect(result.timeOfDay).toBe("morning");
    });

    it("falls back to UTC for invalid timezone", () => {
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

      const result = getTimeContext("Invalid/Timezone");
      expect(result.localHour).toBe(12);
    });
  });

  describe("hashString", () => {
    it("returns consistent hash for same input", () => {
      const hash1 = hashString("test");
      const hash2 = hashString("test");
      expect(hash1).toBe(hash2);
    });

    it("returns different hashes for different inputs", () => {
      const hash1 = hashString("test1");
      const hash2 = hashString("test2");
      expect(hash1).not.toBe(hash2);
    });

    it("returns a string", () => {
      const hash = hashString("test");
      expect(typeof hash).toBe("string");
    });

    it("handles empty string", () => {
      const hash = hashString("");
      expect(hash).toBe("0");
    });

    it("returns base36 encoded value", () => {
      const hash = hashString("test");
      expect(hash).toMatch(/^[0-9a-z]+$/);
    });

    it("handles long strings", () => {
      const longString = "a".repeat(10000);
      const hash = hashString(longString);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("handles special characters", () => {
      const hash = hashString("hello@world#123");
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});
