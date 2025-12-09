import { describe, it, expect, beforeEach, vi } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import worker, { getDefaultLayout, extractLinks, sanitizeLayout } from "./index";
import type { GenerateRequest, GeneratedLayout, PortfolioContent, Env } from "./types";
import {
  createMockLayoutAI,
  createMockErrorAI,
  createMockNoContentAI,
  createMockInvalidJsonAI,
  createMockInvalidLayoutAI,
  createMockThrowingAI,
  createMockAI,
  createAIResponse,
} from "./mocks/ai-gateway";

/**
 * AI Gateway Layout Generation Tests
 *
 * Tests for the AI Gateway integration in handleGenerate().
 * Uses mock AI to test success paths, error handling, and edge cases.
 */

// Create mock portfolio content
function createMockPortfolioContent(): PortfolioContent {
  return {
    personal: {
      name: "Test User",
      title: "Developer",
      bio: "Test bio",
      contact: {
        email: "test@example.com",
        linkedin: "https://linkedin.com/in/test",
        github: "https://github.com/test",
      },
    },
    projects: [
      {
        id: "project-1",
        title: "Test Project",
        description: "A test project",
        technologies: ["React", "TypeScript"],
        image: "/assets/project.png",
        links: { demo: "https://example.com" },
        tags: ["web"],
      },
    ],
    experience: [
      {
        id: "exp-1",
        company: "Test Company",
        role: "Developer",
        period: "2020-Present",
        description: "Test description",
      },
    ],
    skills: ["JavaScript", "TypeScript"],
    education: [
      {
        id: "edu-1",
        institution: "Test University",
        degree: "BS Computer Science",
        period: "2016-2020",
      },
    ],
  };
}

// Create mock request with Cloudflare properties
function createMockRequest(
  url: string,
  options: RequestInit = {}
): Request {
  const request = new Request(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  // Add Cloudflare properties
  Object.defineProperty(request, "cf", {
    value: {
      country: "US",
      city: "Austin",
      continent: "NA",
      timezone: "America/Chicago",
      colo: "DFW",
      httpProtocol: "HTTP/2",
    },
  });

  return request;
}

// Type for API responses in tests
type ApiResponse = {
  layout?: string;
  theme?: { accent: string };
  sections?: unknown[];
  error?: string;
  _rateLimited?: boolean;
  _retryAfter?: number;
  _categorization?: unknown;
  _cacheKey?: string;
  _visitorContext?: unknown;
  _uiHints?: unknown;
};

describe("AI Gateway Layout Generation", () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
    vi.restoreAllMocks();
  });

  describe("successful generation", () => {
    it("returns AI-generated layout", async () => {
      const mockLayout: GeneratedLayout = {
        layout: "two-column",
        theme: { accent: "purple" },
        sections: [
          {
            type: "Hero",
            props: { title: "Welcome", subtitle: "AI Generated" },
          },
          {
            type: "Projects",
            props: { projectIds: ["project-1"] },
          },
        ],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBe("two-column");
      expect(data.theme?.accent).toBe("purple");
      expect(data.sections).toHaveLength(2);
    });

    it("caches generated layout", async () => {
      const mockLayout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "green" },
        sections: [{ type: "Hero", props: { title: "Test" } }],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "recruiter",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // First request
      const ctx1 = createExecutionContext();
      await worker.fetch(request, testEnv, ctx1);
      await waitOnExecutionContext(ctx1);

      // Second request without AI should use cache
      const envWithoutAI: Env = {
        ...env,
        AI: undefined as unknown as Ai,
        AI_GATEWAY_ID: undefined as unknown as string,
      };

      const request2 = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx2 = createExecutionContext();
      const response2 = await worker.fetch(request2, envWithoutAI, ctx2);
      await waitOnExecutionContext(ctx2);
      const data2 = (await response2.json()) as ApiResponse;

      // Should return cached layout (green accent) not default
      expect(data2.layout).toBe("hero-focused");
      expect(data2.theme?.accent).toBe("green");
    });
  });

  describe("AI Gateway error handling", () => {
    it("returns default layout when AI returns non-ok response", async () => {
      const mockAI = createMockErrorAI(500, "Internal server error");
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      // Should be default layout
      const defaultLayout = getDefaultLayout(
        "developer",
        createMockPortfolioContent()
      );
      expect(data.layout).toBe(defaultLayout.layout);
    });

    it("returns default layout when AI returns empty response", async () => {
      const mockAI = createMockNoContentAI();
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
    });

    it("returns default layout when AI returns invalid JSON", async () => {
      const mockAI = createMockInvalidJsonAI();
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
    });

    it("returns default layout when AI returns invalid layout structure", async () => {
      const mockAI = createMockInvalidLayoutAI();
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
    });

    it("returns default layout when AI gateway throws error", async () => {
      const mockAI = createMockThrowingAI(new Error("Network timeout"));
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
    });
  });

  describe("custom intent categorization", () => {
    it("uses categorized tag for layout generation", async () => {
      // Mock AI that handles both categorization and layout generation
      const mockAI = createMockAI({
        ok: true,
        status: 200,
        response: createAIResponse(
          JSON.stringify({
            layout: "single-column",
            theme: { accent: "red" },
            sections: [{ type: "Hero", props: { title: "Custom" } }],
          })
        ),
      });

      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        customIntent: "I am an investor looking for opportunities",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      // Categorization info should be included
      expect(data._categorization).toBeDefined();
    });
  });

  describe("link validation", () => {
    it("extracts links from Hero CTA", () => {
      const layout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "blue" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Test",
              cta: { text: "Contact", href: "https://example.com/contact" },
            },
          },
        ],
      };

      const links = extractLinks(layout);
      expect(links).toContain("https://example.com/contact");
    });

    it("sanitizes layout by removing invalid links", () => {
      const layout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "blue" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Test",
              cta: { text: "Contact", href: "https://invalid-link.com" },
            },
          },
        ],
      };

      const invalidLinks = new Set(["https://invalid-link.com"]);
      const sanitized = sanitizeLayout(layout, invalidLinks);

      // CTA should be removed
      expect(sanitized.sections[0].props.cta).toBeUndefined();
      // Title should remain
      expect(sanitized.sections[0].props.title).toBe("Test");
    });

    it("preserves sections without invalid links", () => {
      const layout: GeneratedLayout = {
        layout: "two-column",
        theme: { accent: "green" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Test",
              cta: { text: "Contact", href: "https://valid-link.com" },
            },
          },
          {
            type: "Projects",
            props: { projectIds: ["proj-1"] },
          },
        ],
      };

      const invalidLinks = new Set(["https://other-link.com"]);
      const sanitized = sanitizeLayout(layout, invalidLinks);

      // Both sections should remain unchanged
      expect(sanitized.sections).toHaveLength(2);
      expect(sanitized.sections[0].props.cta).toBeDefined();
    });
  });

  describe("visitor context integration", () => {
    it("includes visitor context in response", async () => {
      const mockLayout: GeneratedLayout = {
        layout: "two-column",
        theme: { accent: "blue" },
        sections: [{ type: "Hero", props: {} }],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(data._visitorContext).toBeDefined();
      expect(data._uiHints).toBeDefined();
      expect(data._cacheKey).toBeDefined();
    });
  });

  describe("link validation integration", () => {
    // Note: validateLink does real HTTP requests in Cloudflare Workers runtime.
    // These tests use links that will fail DNS lookup to trigger the removal path.

    it("removes invalid external links from AI-generated layout", async () => {
      // Use a non-existent domain that will fail DNS lookup
      const mockLayout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "blue" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Welcome",
              subtitle: "Test",
              cta: {
                text: "Invalid Link",
                // This domain doesn't exist, so validateLink will return false
                href: "https://this-domain-does-not-exist-12345.invalid/page",
              },
            },
          },
        ],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      // The CTA should be removed because the link validation failed
      const heroSection = data.sections?.find(
        (s) => (s as { type: string }).type === "Hero"
      ) as { type: string; props: { cta?: unknown; title?: string } } | undefined;
      expect(heroSection).toBeDefined();
      expect(heroSection?.props.cta).toBeUndefined();
      // But title should remain
      expect(heroSection?.props.title).toBe("Welcome");
    }, 15000); // Longer timeout for DNS lookup

    it("preserves mailto: links without validation", async () => {
      // mailto: links are always valid (skipped in validateLink)
      const mockLayout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "green" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Contact",
              cta: {
                text: "Email Me",
                href: "mailto:test@example.com",
              },
            },
          },
        ],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "recruiter",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      // mailto: links are preserved (validation returns true immediately)
      const heroSection = data.sections?.find(
        (s) => (s as { type: string }).type === "Hero"
      ) as { type: string; props: { cta?: { href: string } } } | undefined;
      expect(heroSection?.props.cta).toBeDefined();
      expect(heroSection?.props.cta?.href).toBe("mailto:test@example.com");
    });

    it("preserves relative path links without validation", async () => {
      // Relative paths are always valid (skipped in validateLink)
      const mockLayout: GeneratedLayout = {
        layout: "hero-focused",
        theme: { accent: "purple" },
        sections: [
          {
            type: "Hero",
            props: {
              title: "Resume",
              cta: {
                text: "View Resume",
                href: "/assets/resume.pdf",
              },
            },
          },
        ],
      };

      const mockAI = createMockLayoutAI(mockLayout);
      const testEnv: Env = {
        ...env,
        AI: mockAI,
        AI_GATEWAY_ID: "test-gateway",
      };

      const body: GenerateRequest = {
        visitorTag: "recruiter",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      // Relative paths are preserved (validation returns true immediately)
      const heroSection = data.sections?.find(
        (s) => (s as { type: string }).type === "Hero"
      ) as { type: string; props: { cta?: { href: string } } } | undefined;
      expect(heroSection?.props.cta).toBeDefined();
      expect(heroSection?.props.cta?.href).toBe("/assets/resume.pdf");
    });
  });
});
