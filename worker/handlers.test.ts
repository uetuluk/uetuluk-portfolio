import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import type { GenerateRequest, FeedbackRequest, PortfolioContent, GitHubActivityResponse } from './types';

// Import the worker default export
import worker from './index';

// Mock external API calls (GitHub, Open-Meteo)
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = vi.fn((url: RequestInfo | URL) => {
    const urlStr = typeof url === 'string' ? url : url.toString();

    // Mock GitHub API
    if (urlStr.includes('api.github.com')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              type: 'PushEvent',
              created_at: '2024-01-01T12:00:00Z',
              payload: { commits: [{ sha: 'abc123' }] },
            },
          ]),
      } as Response);
    }

    // Mock Open-Meteo Geocoding API
    if (urlStr.includes('geocoding-api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ latitude: 31.23, longitude: 121.47, name: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' }],
          }),
      } as Response);
    }

    // Mock Open-Meteo Weather API
    if (urlStr.includes('api.open-meteo.com')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            latitude: 31.23,
            longitude: 121.47,
            daily: {
              time: ['2024-01-01', '2024-01-02'],
              temperature_2m_max: [15, 16],
              temperature_2m_min: [5, 6],
            },
            daily_units: {
              temperature_2m_max: '°C',
              temperature_2m_min: '°C',
            },
          }),
      } as Response);
    }

    // Fall back to original fetch for other URLs
    return originalFetch(url);
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

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
      name: 'Test User',
      title: 'Developer',
      bio: 'Test bio',
      contact: {
        email: 'test@example.com',
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test',
      },
    },
    projects: [
      {
        id: 'project-1',
        title: 'Test Project',
        description: 'A test project',
        technologies: ['React', 'TypeScript'],
        image: '/assets/project.png',
        links: { demo: 'https://example.com' },
        tags: ['web'],
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Test Company',
        role: 'Developer',
        period: '2020-Present',
        description: 'Test description',
      },
    ],
    skills: ['JavaScript', 'TypeScript'],
    education: [
      {
        id: 'edu-1',
        institution: 'Test University',
        degree: 'BS Computer Science',
        period: '2016-2020',
      },
    ],
  };
}

// Create mock request with Cloudflare properties
function createMockRequest(url: string, options: RequestInit = {}): Request {
  const request = new Request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  // Add Cloudflare properties
  Object.defineProperty(request, 'cf', {
    value: {
      country: 'US',
      city: 'Austin',
      continent: 'NA',
      timezone: 'America/Chicago',
      colo: 'DFW',
      httpProtocol: 'HTTP/2',
    },
  });

  return request;
}

describe('Worker API Handlers', () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
  });

  describe('CORS handling', () => {
    it('returns correct CORS headers for OPTIONS request', async () => {
      const request = createMockRequest('https://example.com/api/generate', {
        method: 'OPTIONS',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    it('includes CORS headers in POST responses', async () => {
      const body: GenerateRequest = {
        visitorTag: 'developer',
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    }, 10000); // Longer timeout for POST with KV operations
  });

  describe('GET /api/health', () => {
    it('returns ok status', async () => {
      const request = createMockRequest('https://example.com/api/health', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('POST /api/generate', () => {
    it('returns 400 for missing visitorTag', async () => {
      const body = {
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('returns 400 for missing portfolioContent', async () => {
      const body = {
        visitorTag: 'developer',
      };

      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('returns generated layout with visitor context', async () => {
      const body: GenerateRequest = {
        visitorTag: 'developer',
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
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

    it('returns default layout when AI Gateway not configured', async () => {
      // Create env without AI Gateway to test fallback behavior
      const envWithoutAI = {
        ...env,
        AI: undefined as unknown as Ai,
        AI_GATEWAY_ID: undefined as unknown as string,
      };

      const body: GenerateRequest = {
        visitorTag: 'developer',
        portfolioContent: createMockPortfolioContent(),
      };

      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, envWithoutAI, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.layout).toBeDefined();
      // Default layout for developer is two-column
      expect(data.layout).toBe('two-column');
    });

    it('returns cached layout when available', async () => {
      const body: GenerateRequest = {
        visitorTag: 'developer',
        portfolioContent: createMockPortfolioContent(),
      };

      // First request to generate layout
      const request1 = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx1 = createExecutionContext();
      const response1 = await worker.fetch(request1, env, ctx1);
      await waitOnExecutionContext(ctx1);
      const data1 = (await response1.json()) as ApiResponse;

      // Second request should return cached layout
      const request2 = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx2 = createExecutionContext();
      const response2 = await worker.fetch(request2, env, ctx2);
      await waitOnExecutionContext(ctx2);
      const data2 = (await response2.json()) as ApiResponse;

      expect(data1.layout).toBe(data2.layout);
    });
  });

  describe('POST /api/feedback', () => {
    it('returns 400 for missing required fields', async () => {
      const body = {
        feedbackType: 'like',
      };

      const request = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Missing required fields');
    });

    it('returns 400 for missing feedbackType', async () => {
      const body = {
        audienceType: 'developer',
        sessionId: 'session-123',
      };

      const request = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns success for like feedback', async () => {
      const body: FeedbackRequest = {
        feedbackType: 'like',
        audienceType: 'developer',
        cacheKey: 'cache-123',
        sessionId: 'session-123',
      };

      const request = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
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

    it('returns success with regenerate flag for dislike feedback', async () => {
      const body: FeedbackRequest = {
        feedbackType: 'dislike',
        audienceType: 'developer',
        cacheKey: 'cache-123',
        sessionId: 'session-dislike-1',
      };

      const request = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
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

    it('returns 400 for invalid feedback type', async () => {
      const body = {
        feedbackType: 'invalid',
        audienceType: 'developer',
        cacheKey: 'cache-123',
        sessionId: 'session-123',
      };

      const request = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid feedback type');
    });

    it('rate limits dislike requests from same session', async () => {
      const body: FeedbackRequest = {
        feedbackType: 'dislike',
        audienceType: 'developer',
        cacheKey: 'cache-123',
        sessionId: 'session-rate-test',
      };

      // First dislike should succeed
      const request1 = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx1 = createExecutionContext();
      const response1 = await worker.fetch(request1, env, ctx1);
      await waitOnExecutionContext(ctx1);
      const data1 = (await response1.json()) as ApiResponse;

      expect(data1.success).toBe(true);

      // Second dislike within window should be rate limited
      const request2 = createMockRequest('https://example.com/api/feedback', {
        method: 'POST',
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

  describe('Unknown routes', () => {
    it('returns 404 for unknown API routes', async () => {
      const request = createMockRequest('https://example.com/api/unknown-route', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('returns 404 for non-API routes', async () => {
      const request = createMockRequest('https://example.com/some-page', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('Asset serving', () => {
    it('returns 404 when asset not found in R2', async () => {
      const request = createMockRequest('https://example.com/assets/missing.png', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      // Falls through to 404 since asset not found
      expect(response.status).toBe(404);
    });
  });

  describe('Rate limiting', () => {
    it('returns rate limited response when generate endpoint limit reached', async () => {
      const body: GenerateRequest = {
        visitorTag: 'developer',
        portfolioContent: createMockPortfolioContent(),
      };

      // Make 3 requests to hit the rate limit
      for (let i = 0; i < 3; i++) {
        const request = createMockRequest('https://example.com/api/generate', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        const ctx = createExecutionContext();
        await worker.fetch(request, env, ctx);
        await waitOnExecutionContext(ctx);
      }

      // Fourth request should be rate limited
      const request = createMockRequest('https://example.com/api/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as ApiResponse;

      // Response should include rate limited flag but still return valid layout
      expect(response.status).toBe(200);
      expect(data._rateLimited).toBe(true);
      expect(data._retryAfter).toBeDefined();
      expect(data.layout).toBeDefined();
    }, 30000);
  });

  describe('GET /api/github/activity', () => {
    const mockGitHubEvents = [
      {
        type: 'PushEvent',
        created_at: new Date().toISOString(),
        payload: {
          commits: [{ sha: 'abc123' }, { sha: 'def456' }],
          size: 2, // 2 commits in this push
        },
      },
      {
        type: 'PushEvent',
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        payload: {
          commits: [{ sha: 'ghi789' }],
          size: 1, // 1 commit in this push
        },
      },
      {
        type: 'PullRequestEvent', // PR events count as 1
        created_at: new Date().toISOString(),
        payload: {
          action: 'opened',
        },
      },
      {
        type: 'IssuesEvent', // Issue events count as 1
        created_at: new Date().toISOString(),
        payload: {
          action: 'opened',
        },
      },
      {
        type: 'WatchEvent', // Non-tracked event, should be ignored
        created_at: new Date().toISOString(),
      },
      {
        type: 'ForkEvent', // Non-tracked event, should be ignored
        created_at: new Date().toISOString(),
      },
    ];

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns activity data for valid username', async () => {
      // Mock the global fetch for GitHub API
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGitHubEvents),
          });
        }
        return originalFetch(url);
      });

      const request = createMockRequest('https://example.com/api/github/activity?username=testuser', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as GitHubActivityResponse;

      expect(response.status).toBe(200);
      expect(data.contributions).toBeDefined();
      expect(Array.isArray(data.contributions)).toBe(true);
      expect(data.totalCommits).toBe(5); // 2 + 1 from PushEvents + 1 PR + 1 Issue
      expect(data.recentActivity).toBeDefined();

      globalThis.fetch = originalFetch;
    });

    it('uses default username when not provided', async () => {
      const originalFetch = globalThis.fetch;
      let capturedUrl = '';
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('api.github.com')) {
          capturedUrl = url;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return originalFetch(url);
      });

      const request = createMockRequest('https://example.com/api/github/activity', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(capturedUrl).toContain('uetuluk'); // Default username

      globalThis.fetch = originalFetch;
    });

    it('returns cached data when available', async () => {
      // Pre-populate cache
      const cachedData: GitHubActivityResponse = {
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 5,
        recentActivity: 5,
      };
      await env.UI_CACHE.put('github:activity:cacheduser', JSON.stringify(cachedData));

      const request = createMockRequest('https://example.com/api/github/activity?username=cacheduser', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as GitHubActivityResponse;

      expect(response.status).toBe(200);
      expect(data.totalCommits).toBe(5);
      expect(data.contributions).toEqual([{ date: '2024-01-01', count: 5 }]);
    });

    it('returns empty data on GitHub API error', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return originalFetch(url);
      });

      const request = createMockRequest('https://example.com/api/github/activity?username=nonexistent', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);
      const data = (await response.json()) as GitHubActivityResponse;

      expect(response.status).toBe(200);
      expect(data.contributions).toEqual([]);
      expect(data.totalCommits).toBe(0);
      expect(data.recentActivity).toBe(0);

      globalThis.fetch = originalFetch;
    });

    it('includes CORS headers in response', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('api.github.com')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return originalFetch(url);
      });

      const request = createMockRequest('https://example.com/api/github/activity', {
        method: 'GET',
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Content-Type')).toBe('application/json');

      globalThis.fetch = originalFetch;
    });
  });
});
