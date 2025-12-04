import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { SEO } from "./SEO";

// Track useHead calls
let useHeadCalls: Array<{
  title?: string;
  meta?: Array<{ name?: string; property?: string; content?: string }>;
  link?: Array<{ rel?: string; href?: string }>;
}> = [];

// Mock @unhead/react
vi.mock("@unhead/react", () => ({
  useHead: (config: {
    title?: string;
    meta?: Array<{ name?: string; property?: string; content?: string }>;
    link?: Array<{ rel?: string; href?: string }>;
  }) => {
    useHeadCalls.push(config);
  },
}));

// Mock react-i18next with configurable language
let mockLanguage = "en";
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
  }),
}));

// Mock useTranslatedPortfolio
const mockPortfolio = {
  personal: {
    name: "Test User",
    title: "Software Engineer",
    bio: "A passionate developer building great software.",
    location: "Austin, TX",
    contact: {
      email: "test@example.com",
      linkedin: "https://linkedin.com/in/testuser",
      github: "https://github.com/testuser",
    },
  },
  projects: [],
  experience: [],
  skills: [],
  education: [],
};

vi.mock("@/hooks/useTranslatedPortfolio", () => ({
  useTranslatedPortfolio: () => mockPortfolio,
}));

describe("SEO", () => {
  beforeEach(() => {
    useHeadCalls = [];
    mockLanguage = "en";
  });

  describe("title generation", () => {
    it("generates default title with name and title", () => {
      render(<SEO />);
      expect(useHeadCalls[0].title).toBe("Test User | Software Engineer");
    });

    it("generates custom title with custom title prop", () => {
      render(<SEO title="Projects" />);
      expect(useHeadCalls[0].title).toBe("Projects | Test User");
    });
  });

  describe("meta tags", () => {
    it("includes primary meta title tag", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const titleMeta = metaTags.find((m) => m.name === "title");
      expect(titleMeta?.content).toBe("Test User | Software Engineer");
    });

    it("includes meta description from bio by default", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const descMeta = metaTags.find((m) => m.name === "description");
      expect(descMeta?.content).toBe(
        "A passionate developer building great software."
      );
    });

    it("uses custom description when provided", () => {
      render(<SEO description="Custom description here" />);
      const metaTags = useHeadCalls[0].meta || [];
      const descMeta = metaTags.find((m) => m.name === "description");
      expect(descMeta?.content).toBe("Custom description here");
    });

    it("adds robots noindex meta when noindex is true", () => {
      render(<SEO noindex />);
      const metaTags = useHeadCalls[0].meta || [];
      const robotsMeta = metaTags.find((m) => m.name === "robots");
      expect(robotsMeta?.content).toBe("noindex, nofollow");
    });

    it("does not include robots meta when noindex is false", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const robotsMeta = metaTags.find((m) => m.name === "robots");
      expect(robotsMeta).toBeUndefined();
    });
  });

  describe("Open Graph tags", () => {
    it("includes og:type", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogType = metaTags.find((m) => m.property === "og:type");
      expect(ogType?.content).toBe("website");
    });

    it("allows custom og:type", () => {
      render(<SEO type="profile" />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogType = metaTags.find((m) => m.property === "og:type");
      expect(ogType?.content).toBe("profile");
    });

    it("includes og:url with default site URL", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogUrl = metaTags.find((m) => m.property === "og:url");
      expect(ogUrl?.content).toBe("https://uetuluk.com");
    });

    it("includes og:site_name with portfolio name", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogSiteName = metaTags.find((m) => m.property === "og:site_name");
      expect(ogSiteName?.content).toBe("Test User Portfolio");
    });

    it("includes og:title", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogTitle = metaTags.find((m) => m.property === "og:title");
      expect(ogTitle?.content).toBe("Test User | Software Engineer");
    });

    it("includes og:description", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogDesc = metaTags.find((m) => m.property === "og:description");
      expect(ogDesc?.content).toBe(
        "A passionate developer building great software."
      );
    });

    it("includes og:image with default image", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogImage = metaTags.find((m) => m.property === "og:image");
      expect(ogImage?.content).toBe("https://uetuluk.com/og-image.png");
    });

    it("prefixes relative image paths with site URL", () => {
      render(<SEO image="/custom-image.png" />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogImage = metaTags.find((m) => m.property === "og:image");
      expect(ogImage?.content).toBe("https://uetuluk.com/custom-image.png");
    });

    it("uses absolute image URLs as-is", () => {
      render(<SEO image="https://example.com/image.png" />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogImage = metaTags.find((m) => m.property === "og:image");
      expect(ogImage?.content).toBe("https://example.com/image.png");
    });

    it("includes og:image:width", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogWidth = metaTags.find((m) => m.property === "og:image:width");
      expect(ogWidth?.content).toBe("1200");
    });

    it("includes og:image:height", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogHeight = metaTags.find((m) => m.property === "og:image:height");
      expect(ogHeight?.content).toBe("630");
    });

    it("includes og:image:alt", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogAlt = metaTags.find((m) => m.property === "og:image:alt");
      expect(ogAlt?.content).toBe("Test User - Software Engineer");
    });
  });

  describe("locale mapping", () => {
    it("maps en to en_US", () => {
      mockLanguage = "en";
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogLocale = metaTags.find((m) => m.property === "og:locale");
      expect(ogLocale?.content).toBe("en_US");
    });

    it("maps zh to zh_CN", () => {
      mockLanguage = "zh";
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogLocale = metaTags.find((m) => m.property === "og:locale");
      expect(ogLocale?.content).toBe("zh_CN");
    });

    it("maps ja to ja_JP", () => {
      mockLanguage = "ja";
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogLocale = metaTags.find((m) => m.property === "og:locale");
      expect(ogLocale?.content).toBe("ja_JP");
    });

    it("maps tr to tr_TR", () => {
      mockLanguage = "tr";
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogLocale = metaTags.find((m) => m.property === "og:locale");
      expect(ogLocale?.content).toBe("tr_TR");
    });

    it("falls back to en_US for unknown languages", () => {
      mockLanguage = "de";
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const ogLocale = metaTags.find((m) => m.property === "og:locale");
      expect(ogLocale?.content).toBe("en_US");
    });
  });

  describe("Twitter Card tags", () => {
    it("includes twitter:card as summary_large_image", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterCard = metaTags.find((m) => m.name === "twitter:card");
      expect(twitterCard?.content).toBe("summary_large_image");
    });

    it("includes twitter:url", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterUrl = metaTags.find((m) => m.name === "twitter:url");
      expect(twitterUrl?.content).toBe("https://uetuluk.com");
    });

    it("includes twitter:title", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterTitle = metaTags.find((m) => m.name === "twitter:title");
      expect(twitterTitle?.content).toBe("Test User | Software Engineer");
    });

    it("includes twitter:description", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterDesc = metaTags.find((m) => m.name === "twitter:description");
      expect(twitterDesc?.content).toBe(
        "A passionate developer building great software."
      );
    });

    it("includes twitter:image", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterImage = metaTags.find((m) => m.name === "twitter:image");
      expect(twitterImage?.content).toBe("https://uetuluk.com/og-image.png");
    });

    it("includes twitter:image:alt", () => {
      render(<SEO />);
      const metaTags = useHeadCalls[0].meta || [];
      const twitterAlt = metaTags.find((m) => m.name === "twitter:image:alt");
      expect(twitterAlt?.content).toBe("Test User - Software Engineer");
    });
  });

  describe("canonical link", () => {
    it("includes canonical link with default URL", () => {
      render(<SEO />);
      const links = useHeadCalls[0].link || [];
      const canonical = links.find((l) => l.rel === "canonical");
      expect(canonical?.href).toBe("https://uetuluk.com");
    });

    it("prefixes relative URLs with site URL for canonical", () => {
      render(<SEO url="/projects" />);
      const links = useHeadCalls[0].link || [];
      const canonical = links.find((l) => l.rel === "canonical");
      expect(canonical?.href).toBe("https://uetuluk.com/projects");
    });

    it("uses absolute URLs as-is for canonical", () => {
      render(<SEO url="https://example.com/page" />);
      const links = useHeadCalls[0].link || [];
      const canonical = links.find((l) => l.rel === "canonical");
      expect(canonical?.href).toBe("https://example.com/page");
    });
  });

  describe("component rendering", () => {
    it("returns null (renders nothing to DOM)", () => {
      const { container } = render(<SEO />);
      expect(container.firstChild).toBeNull();
    });
  });
});
