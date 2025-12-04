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

  describe("getClientIP", () => {
    // Recreated getClientIP logic
    function getClientIP(request: Request): string {
      return (
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
        "unknown"
      );
    }

    it("extracts CF-Connecting-IP header when present", () => {
      const request = new Request("https://example.com", {
        headers: { "CF-Connecting-IP": "1.2.3.4" },
      });
      expect(getClientIP(request)).toBe("1.2.3.4");
    });

    it("falls back to X-Forwarded-For when CF-Connecting-IP is missing", () => {
      const request = new Request("https://example.com", {
        headers: { "X-Forwarded-For": "5.6.7.8, 9.10.11.12" },
      });
      expect(getClientIP(request)).toBe("5.6.7.8");
    });

    it("extracts first IP from X-Forwarded-For chain", () => {
      const request = new Request("https://example.com", {
        headers: { "X-Forwarded-For": " 1.1.1.1 , 2.2.2.2, 3.3.3.3" },
      });
      expect(getClientIP(request)).toBe("1.1.1.1");
    });

    it("returns unknown when no IP headers present", () => {
      const request = new Request("https://example.com");
      expect(getClientIP(request)).toBe("unknown");
    });

    it("prefers CF-Connecting-IP over X-Forwarded-For", () => {
      const request = new Request("https://example.com", {
        headers: {
          "CF-Connecting-IP": "1.2.3.4",
          "X-Forwarded-For": "5.6.7.8",
        },
      });
      expect(getClientIP(request)).toBe("1.2.3.4");
    });
  });

  describe("getDefaultCategorizationResult", () => {
    // Recreated function
    const TAG_GUIDELINES: Record<string, string> = {
      friend: "Show personal, casual content",
      recruiter: "Highlight professional achievements",
      developer: "Focus on technical projects",
      collaborator: "Emphasize collaboration opportunities",
    };

    function getDefaultCategorizationResult() {
      return {
        status: "matched" as const,
        tagName: "friend",
        displayName: "Friend",
        guidelines: TAG_GUIDELINES.friend,
        confidence: 1,
        reason: "Default fallback",
      };
    }

    it("returns matched status", () => {
      const result = getDefaultCategorizationResult();
      expect(result.status).toBe("matched");
    });

    it("returns friend as tag name", () => {
      const result = getDefaultCategorizationResult();
      expect(result.tagName).toBe("friend");
    });

    it("returns confidence of 1", () => {
      const result = getDefaultCategorizationResult();
      expect(result.confidence).toBe(1);
    });

    it("returns friend guidelines", () => {
      const result = getDefaultCategorizationResult();
      expect(result.guidelines).toBe("Show personal, casual content");
    });

    it("returns Default fallback as reason", () => {
      const result = getDefaultCategorizationResult();
      expect(result.reason).toBe("Default fallback");
    });
  });

  describe("sanitizeCategorizationResult", () => {
    const ALLOWED_VISITOR_TAGS = ["recruiter", "developer", "collaborator", "friend"];
    const TAG_GUIDELINES: Record<string, string> = {
      friend: "Show personal, casual content",
      recruiter: "Highlight professional achievements",
      developer: "Focus on technical projects",
      collaborator: "Emphasize collaboration opportunities",
    };

    interface CategorizationResult {
      status: "matched" | "created" | "rejected";
      tagName: string;
      displayName: string;
      guidelines: string;
      confidence: number;
      reason: string;
    }

    function sanitizeCategorizationResult(
      result: CategorizationResult
    ): CategorizationResult {
      let tagName = result.tagName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 20);

      if (!tagName) {
        tagName = "friend";
      }

      if (result.status === "matched" && ALLOWED_VISITOR_TAGS.includes(tagName)) {
        return {
          ...result,
          tagName,
          guidelines: TAG_GUIDELINES[tagName] || result.guidelines,
        };
      }

      if (result.status === "rejected") {
        return {
          ...result,
          tagName: "friend",
          guidelines: TAG_GUIDELINES.friend,
        };
      }

      return {
        ...result,
        tagName,
        confidence: Math.min(1, Math.max(0, result.confidence)),
      };
    }

    it("converts tag name to lowercase", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "MyTag",
        displayName: "My Tag",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName).toBe("mytag");
    });

    it("replaces special characters with hyphens", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "my@tag#here",
        displayName: "My Tag",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName).toBe("my-tag-here");
    });

    it("collapses multiple hyphens", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "my---tag",
        displayName: "My Tag",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName).toBe("my-tag");
    });

    it("removes leading and trailing hyphens", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "-mytag-",
        displayName: "My Tag",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName).toBe("mytag");
    });

    it("truncates tag name to 20 characters", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "a".repeat(30),
        displayName: "Long Tag",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName.length).toBe(20);
    });

    it("uses friend for empty tag after sanitization", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "---",
        displayName: "Invalid",
        guidelines: "Some guidelines",
        confidence: 0.8,
        reason: "Test",
      });
      expect(result.tagName).toBe("friend");
    });

    it("uses canonical guidelines for matched known tags", () => {
      const result = sanitizeCategorizationResult({
        status: "matched",
        tagName: "recruiter",
        displayName: "Recruiter",
        guidelines: "Old guidelines",
        confidence: 0.9,
        reason: "Test",
      });
      expect(result.guidelines).toBe("Highlight professional achievements");
    });

    it("forces friend tag for rejected status", () => {
      const result = sanitizeCategorizationResult({
        status: "rejected",
        tagName: "spam",
        displayName: "Spam",
        guidelines: "Spam guidelines",
        confidence: 0.1,
        reason: "Looks suspicious",
      });
      expect(result.tagName).toBe("friend");
      expect(result.guidelines).toBe("Show personal, casual content");
    });

    it("clamps confidence between 0 and 1 (high value)", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "custom",
        displayName: "Custom",
        guidelines: "Custom guidelines",
        confidence: 1.5,
        reason: "Test",
      });
      expect(result.confidence).toBe(1);
    });

    it("clamps confidence between 0 and 1 (negative value)", () => {
      const result = sanitizeCategorizationResult({
        status: "created",
        tagName: "custom",
        displayName: "Custom",
        guidelines: "Custom guidelines",
        confidence: -0.5,
        reason: "Test",
      });
      expect(result.confidence).toBe(0);
    });
  });

  describe("getDefaultLayout", () => {
    interface Project {
      id: string;
      title: string;
      description: string;
    }

    interface Personal {
      name: string;
      title: string;
      bio: string;
      resumeUrl?: string;
    }

    interface PortfolioContent {
      personal: Personal;
      projects: Project[];
    }

    interface GeneratedLayout {
      layout: string;
      theme: { accent: string };
      sections: Array<{
        type: string;
        props: Record<string, unknown>;
      }>;
    }

    function getDefaultLayout(
      visitorTag: string,
      portfolioContent: PortfolioContent
    ): GeneratedLayout {
      const projectIds = portfolioContent.projects.map((p) => p.id);
      const { personal } = portfolioContent;

      const baseLayout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "blue" },
        sections: [
          {
            type: "Hero",
            props: {
              title: personal.name,
              subtitle: personal.title,
              image: "/assets/profile.png",
            },
          },
        ],
      };

      switch (visitorTag) {
        case "recruiter":
          baseLayout.sections[0].props = {
            ...baseLayout.sections[0].props,
            cta: personal.resumeUrl
              ? { text: "View Resume", href: personal.resumeUrl }
              : undefined,
          };
          baseLayout.sections.push(
            {
              type: "SkillBadges",
              props: { title: "Technical Skills", style: "detailed" },
            },
            {
              type: "Timeline",
              props: { title: "Experience" },
            },
            {
              type: "CardGrid",
              props: {
                title: "Featured Projects",
                columns: 2,
                items: projectIds.slice(0, 4),
              },
            }
          );
          break;

        case "developer":
          baseLayout.layout = "two-column";
          baseLayout.sections.push(
            {
              type: "CardGrid",
              props: { title: "Projects", columns: 3, items: projectIds },
            },
            {
              type: "SkillBadges",
              props: { title: "Tech Stack", style: "detailed" },
            },
            {
              type: "ContactForm",
              props: { title: "Connect", showGitHub: true, showEmail: true },
            }
          );
          break;

        case "collaborator":
          baseLayout.sections.push(
            {
              type: "TextBlock",
              props: {
                title: "About Me",
                content: personal.bio,
                style: "prose",
              },
            },
            {
              type: "CardGrid",
              props: {
                title: "Current Projects",
                columns: 2,
                items: projectIds.slice(0, 2),
              },
            },
            {
              type: "ContactForm",
              props: {
                title: "Let's Collaborate",
                showEmail: true,
                showLinkedIn: true,
                showGitHub: true,
              },
            }
          );
          break;

        case "friend":
        default:
          baseLayout.layout = "single-column";
          baseLayout.sections.push(
            {
              type: "TextBlock",
              props: {
                title: "About Me",
                content: personal.bio,
                style: "casual",
              },
            },
            {
              type: "ImageGallery",
              props: { title: "Highlights" },
            }
          );
          break;
      }

      return baseLayout;
    }

    const mockPortfolio: PortfolioContent = {
      personal: {
        name: "Test User",
        title: "Software Engineer",
        bio: "Building cool stuff",
        resumeUrl: "https://example.com/resume.pdf",
      },
      projects: [
        { id: "proj-1", title: "Project 1", description: "Desc 1" },
        { id: "proj-2", title: "Project 2", description: "Desc 2" },
        { id: "proj-3", title: "Project 3", description: "Desc 3" },
        { id: "proj-4", title: "Project 4", description: "Desc 4" },
        { id: "proj-5", title: "Project 5", description: "Desc 5" },
      ],
    };

    describe("recruiter layout", () => {
      it("uses hero-focused layout", () => {
        const layout = getDefaultLayout("recruiter", mockPortfolio);
        expect(layout.layout).toBe("hero-focused");
      });

      it("includes resume CTA when resumeUrl is provided", () => {
        const layout = getDefaultLayout("recruiter", mockPortfolio);
        const heroProps = layout.sections[0].props as { cta?: { text: string; href: string } };
        expect(heroProps.cta?.text).toBe("View Resume");
        expect(heroProps.cta?.href).toBe("https://example.com/resume.pdf");
      });

      it("includes SkillBadges section", () => {
        const layout = getDefaultLayout("recruiter", mockPortfolio);
        const skillSection = layout.sections.find((s) => s.type === "SkillBadges");
        expect(skillSection).toBeDefined();
        expect(skillSection?.props.style).toBe("detailed");
      });

      it("includes Timeline section", () => {
        const layout = getDefaultLayout("recruiter", mockPortfolio);
        const timelineSection = layout.sections.find((s) => s.type === "Timeline");
        expect(timelineSection).toBeDefined();
      });

      it("includes CardGrid with first 4 projects", () => {
        const layout = getDefaultLayout("recruiter", mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === "CardGrid");
        expect(cardGrid?.props.columns).toBe(2);
        expect((cardGrid?.props.items as string[]).length).toBe(4);
      });
    });

    describe("developer layout", () => {
      it("uses two-column layout", () => {
        const layout = getDefaultLayout("developer", mockPortfolio);
        expect(layout.layout).toBe("two-column");
      });

      it("includes CardGrid with all projects", () => {
        const layout = getDefaultLayout("developer", mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === "CardGrid");
        expect(cardGrid?.props.columns).toBe(3);
        expect((cardGrid?.props.items as string[]).length).toBe(5);
      });

      it("includes ContactForm with GitHub and email", () => {
        const layout = getDefaultLayout("developer", mockPortfolio);
        const contactForm = layout.sections.find((s) => s.type === "ContactForm");
        expect(contactForm?.props.showGitHub).toBe(true);
        expect(contactForm?.props.showEmail).toBe(true);
      });
    });

    describe("collaborator layout", () => {
      it("uses hero-focused layout", () => {
        const layout = getDefaultLayout("collaborator", mockPortfolio);
        expect(layout.layout).toBe("hero-focused");
      });

      it("includes TextBlock with bio", () => {
        const layout = getDefaultLayout("collaborator", mockPortfolio);
        const textBlock = layout.sections.find((s) => s.type === "TextBlock");
        expect(textBlock?.props.content).toBe("Building cool stuff");
        expect(textBlock?.props.style).toBe("prose");
      });

      it("includes ContactForm with all contact options", () => {
        const layout = getDefaultLayout("collaborator", mockPortfolio);
        const contactForm = layout.sections.find((s) => s.type === "ContactForm");
        expect(contactForm?.props.showEmail).toBe(true);
        expect(contactForm?.props.showLinkedIn).toBe(true);
        expect(contactForm?.props.showGitHub).toBe(true);
      });

      it("includes CardGrid with first 2 projects", () => {
        const layout = getDefaultLayout("collaborator", mockPortfolio);
        const cardGrid = layout.sections.find((s) => s.type === "CardGrid");
        expect((cardGrid?.props.items as string[]).length).toBe(2);
      });
    });

    describe("friend layout", () => {
      it("uses single-column layout", () => {
        const layout = getDefaultLayout("friend", mockPortfolio);
        expect(layout.layout).toBe("single-column");
      });

      it("includes TextBlock with casual style", () => {
        const layout = getDefaultLayout("friend", mockPortfolio);
        const textBlock = layout.sections.find((s) => s.type === "TextBlock");
        expect(textBlock?.props.style).toBe("casual");
      });

      it("includes ImageGallery", () => {
        const layout = getDefaultLayout("friend", mockPortfolio);
        const gallery = layout.sections.find((s) => s.type === "ImageGallery");
        expect(gallery).toBeDefined();
      });
    });

    describe("unknown visitor tag", () => {
      it("defaults to friend layout", () => {
        const layout = getDefaultLayout("unknown-tag", mockPortfolio);
        expect(layout.layout).toBe("single-column");
      });

      it("includes ImageGallery like friend layout", () => {
        const layout = getDefaultLayout("some-random-tag", mockPortfolio);
        const gallery = layout.sections.find((s) => s.type === "ImageGallery");
        expect(gallery).toBeDefined();
      });
    });

    describe("common layout elements", () => {
      it("always includes Hero section first", () => {
        const layouts = ["recruiter", "developer", "collaborator", "friend"];
        layouts.forEach((tag) => {
          const layout = getDefaultLayout(tag, mockPortfolio);
          expect(layout.sections[0].type).toBe("Hero");
        });
      });

      it("Hero section includes personal info", () => {
        const layout = getDefaultLayout("friend", mockPortfolio);
        const heroProps = layout.sections[0].props;
        expect(heroProps.title).toBe("Test User");
        expect(heroProps.subtitle).toBe("Software Engineer");
        expect(heroProps.image).toBe("/assets/profile.png");
      });

      it("always has blue accent theme", () => {
        const layouts = ["recruiter", "developer", "collaborator", "friend"];
        layouts.forEach((tag) => {
          const layout = getDefaultLayout(tag, mockPortfolio);
          expect(layout.theme.accent).toBe("blue");
        });
      });
    });
  });
});
