import { describe, it, expect, beforeEach } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import type {
  GenerateRequest,
  FeedbackRequest,
  PortfolioContent,
} from "./types";

// Import the worker default export
import worker from "./index";

// Type for API responses in tests
type ApiResponse = {
  status?: string;
  error?: string;
  success?: boolean;
  message?: string;
  layout?: string;
  sections?: unknown[];
  _visitorContext?: unknown;
  _uiHints?: unknown;
  _rateLimited?: boolean;
  _retryAfter?: number;
  regenerate?: boolean;
  rateLimited?: boolean;
  retryAfter?: number;
};

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

describe("Worker API Handlers", () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
  });

  describe("CORS handling", () => {
    it("returns correct CORS headers for OPTIONS request", async () => {
      const request = createMockRequest("https://example.com/api/generate", {
        method: "OPTIONS",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS"
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
    });

    it("includes CORS headers in POST responses", async () => {
      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    }, 10000); // Longer timeout for POST with KV operations
  });

  describe("GET /api/health", () => {
    it("returns ok status", async () => {
      const request = createMockRequest("https://example.com/api/health", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("POST /api/generate", () => {
    it("returns 400 for missing visitorTag", async () => {
      const body = {
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("returns 400 for missing portfolioContent", async () => {
      const body = {
        visitorTag: "developer",
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("returns generated layout with visitor context", async () => {
      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      expect(data.sections).toBeDefined();
      expect(data._visitorContext).toBeDefined();
      expect(data._uiHints).toBeDefined();
    });

    it("returns default layout when AI Gateway not configured", async () => {
      // The test environment won't have AI configured
      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      // Default layout for developer is two-column
      expect(data.layout).toBe("two-column");
    });

    it("returns cached layout when available", async () => {
      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      // First request to generate layout
      const request1 = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx1 = createExecutionContext();
      const response1 = await worker.fetch(request1, env, ctx1);
      await waitOnExecutionContext(ctx1);
      const data1 = (await response1.json()) as ApiResponse;

      // Second request should return cached layout
      const request2 = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx2 = createExecutionContext();
      const response2 = await worker.fetch(request2, env, ctx2);
      await waitOnExecutionContext(ctx2);
      const data2 = (await response2.json()) as ApiResponse;

      expect(data1.layout).toBe(data2.layout);
    });
  });

  describe("POST /api/feedback", () => {
    it("returns 400 for missing required fields", async () => {
      const body = {
        feedbackType: "like",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Missing required fields");
    });

    it("returns 400 for missing feedbackType", async () => {
      const body = {
        audienceType: "developer",
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("returns success for like feedback", async () => {
      const body: FeedbackRequest = {
        feedbackType: "like",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.regenerate).toBe(false);
    });

    it("returns success with regenerate flag for dislike feedback", async () => {
      const body: FeedbackRequest = {
        feedbackType: "dislike",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-dislike-1",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.regenerate).toBe(true);
    });

    it("returns 400 for invalid feedback type", async () => {
      const body = {
        feedbackType: "invalid",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid feedback type");
    });

    it("rate limits dislike requests from same session", async () => {
      const body: FeedbackRequest = {
        feedbackType: "dislike",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-rate-test",
      };

      // First dislike should succeed
      const request1 = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx1 = createExecutionContext();
      const response1 = await worker.fetch(request1, env, ctx1);
      await waitOnExecutionContext(ctx1);
      const data1 = (await response1.json()) as ApiResponse;

      expect(data1.success).toBe(true);

      // Second dislike within window should be rate limited
      const request2 = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const ctx2 = createExecutionContext();
      const response2 = await worker.fetch(request2, env, ctx2);
      await waitOnExecutionContext(ctx2);
      const data2 = (await response2.json()) as ApiResponse;

      expect(data2.success).toBe(false);
      expect(data2.rateLimited).toBe(true);
      expect(data2.retryAfter).toBeDefined();
    });
  });

  describe("Unknown routes", () => {
    it("returns 404 for unknown API routes", async () => {
      const request = createMockRequest(
        "https://example.com/api/unknown-route",
        {
          method: "GET",
        }
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });

    it("returns 404 for non-API routes", async () => {
      const request = createMockRequest("https://example.com/some-page", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });

  describe("Asset serving", () => {
    it("returns 404 when asset not found in R2", async () => {
      const request = createMockRequest(
        "https://example.com/assets/missing.png",
        {
          method: "GET",
        }
      );

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // Falls through to 404 since asset not found
      expect(response.status).toBe(404);
    });
  });
});
