import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  Env,
  GenerateRequest,
  FeedbackRequest,
  PortfolioContent,
} from "./types";

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

// Import the default export (worker)
import worker from "./index";

// Create mock environment
function createMockEnv(): Env {
  return {
    AI: {
      gateway: vi.fn(() => ({
        run: vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        layout: "single-column",
                        theme: { accent: "blue" },
                        sections: [
                          { type: "Hero", props: { title: "Test" } },
                        ],
                      }),
                    },
                  },
                ],
              }),
          })
        ),
      })),
    } as unknown as Ai,
    AI_GATEWAY_ID: "test-gateway",
    UI_CACHE: {
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
    } as unknown as KVNamespace,
    ASSETS: {
      get: vi.fn(() => Promise.resolve(null)),
    } as unknown as R2Bucket,
    FEEDBACK: {
      writeDataPoint: vi.fn(),
    } as unknown as AnalyticsEngineDataset,
  };
}

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

// Create mock request
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
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = createMockEnv();
  });

  describe("CORS handling", () => {
    it("returns correct CORS headers for OPTIONS request", async () => {
      const request = createMockRequest("https://example.com/api/generate", {
        method: "OPTIONS",
      });

      const response = await worker.fetch(request, mockEnv);

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

      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("GET /api/health", () => {
    it("returns ok status", async () => {
      const request = createMockRequest("https://example.com/api/health", {
        method: "GET",
      });

      const response = await worker.fetch(request, mockEnv);
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

      const response = await worker.fetch(request, mockEnv);
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

      const response = await worker.fetch(request, mockEnv);
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

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      expect(data.sections).toBeDefined();
      expect(data._visitorContext).toBeDefined();
      expect(data._uiHints).toBeDefined();
    });

    it("returns cached layout when available", async () => {
      const cachedLayout = {
        layout: "cached-layout",
        theme: { accent: "green" },
        sections: [],
      };

      // Mock to return cached layout for any layout: prefixed key
      (mockEnv.UI_CACHE.get as ReturnType<typeof vi.fn>).mockImplementation(
        (key: string) => {
          if (key.startsWith("layout:")) {
            return Promise.resolve(cachedLayout);
          }
          return Promise.resolve(null);
        }
      );

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(data.layout).toBe("cached-layout");
    });

    it("returns default layout when AI Gateway not configured", async () => {
      const envWithoutAI = {
        ...mockEnv,
        AI: undefined,
        AI_GATEWAY_ID: undefined,
      } as unknown as Env;

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await worker.fetch(request, envWithoutAI);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      // Default layout for developer is two-column
      expect(data.layout).toBe("two-column");
    });

    it("returns rate-limited response with _rateLimited flag", async () => {
      // Simulate rate limit entry
      (mockEnv.UI_CACHE.get as ReturnType<typeof vi.fn>).mockImplementation(
        (key: string) => {
          if (key.startsWith("ratelimit:generate:")) {
            return Promise.resolve({
              count: 5,
              windowStart: Date.now() - 1000, // Within the window
            });
          }
          return Promise.resolve(null);
        }
      );

      const body: GenerateRequest = {
        visitorTag: "developer",
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest("https://example.com/api/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data._rateLimited).toBe(true);
      expect(data._retryAfter).toBeDefined();
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

      const response = await worker.fetch(request, mockEnv);
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

      const response = await worker.fetch(request, mockEnv);
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

      const response = await worker.fetch(request, mockEnv);
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
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.regenerate).toBe(true);
    });

    it("clears cache on dislike feedback", async () => {
      const body: FeedbackRequest = {
        feedbackType: "dislike",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      await worker.fetch(request, mockEnv);

      expect(mockEnv.UI_CACHE.delete).toHaveBeenCalledWith("cache-123");
    });

    it("writes to Analytics Engine for feedback", async () => {
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

      await worker.fetch(request, mockEnv);

      expect(mockEnv.FEEDBACK.writeDataPoint).toHaveBeenCalledWith({
        blobs: ["developer", "like"],
        doubles: [1],
        indexes: ["session-123"],
      });
    });

    it("returns rate-limited response for dislike when limit exceeded", async () => {
      (mockEnv.UI_CACHE.get as ReturnType<typeof vi.fn>).mockImplementation(
        (key: string) => {
          if (key.startsWith("ratelimit:session-123")) {
            return Promise.resolve({
              lastDislike: Date.now() - 5000, // 5 seconds ago (within 1 minute window)
              count: 1,
            });
          }
          return Promise.resolve(null);
        }
      );

      const body: FeedbackRequest = {
        feedbackType: "dislike",
        audienceType: "developer",
        cacheKey: "cache-123",
        sessionId: "session-123",
      };

      const request = createMockRequest("https://example.com/api/feedback", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.rateLimited).toBe(true);
      expect(data.retryAfter).toBeDefined();
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

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe("Invalid feedback type");
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

      const response = await worker.fetch(request, mockEnv);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });

    it("returns 404 for non-API routes", async () => {
      const request = createMockRequest("https://example.com/some-page", {
        method: "GET",
      });

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
    });
  });

  describe("Asset serving", () => {
    it("serves assets from R2 when found", async () => {
      const mockBody = new ReadableStream();
      (mockEnv.ASSETS.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        body: mockBody,
        httpEtag: '"abc123"',
        httpMetadata: { contentType: "image/png" },
      });

      const request = createMockRequest(
        "https://example.com/assets/image.png",
        {
          method: "GET",
        }
      );

      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("image/png");
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=31536000"
      );
    });

    it("returns 404 when asset not found in R2", async () => {
      (mockEnv.ASSETS.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        null
      );

      const request = createMockRequest(
        "https://example.com/assets/missing.png",
        {
          method: "GET",
        }
      );

      const response = await worker.fetch(request, mockEnv);

      // Falls through to 404 since asset not found
      expect(response.status).toBe(404);
    });
  });
});
