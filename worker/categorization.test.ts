import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import {
  categorizeIntent,
  storeNewTag,
  getDefaultCategorizationResult,
  hashString,
} from "./index";
import type { CategorizationResult, Env } from "./types";

/**
 * Categorization Tests
 *
 * Tests for intent categorization using AI and tag storage.
 */

describe("categorizeIntent", () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
  });

  describe("caching behavior", () => {
    it("returns cached result when available", async () => {
      const customIntent = "I am a recruiter";
      const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

      const cachedResult: CategorizationResult = {
        status: "matched",
        tagName: "recruiter",
        displayName: "Recruiter",
        guidelines: "Test guidelines",
        confidence: 0.95,
        reason: "Cached",
      };

      await env.UI_CACHE.put(intentCacheKey, JSON.stringify(cachedResult));

      const result = await categorizeIntent(customIntent, env);

      expect(result).toEqual(cachedResult);
    });

    it("normalizes intent for cache key (lowercase)", async () => {
      const customIntent = "I AM A RECRUITER";
      const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

      const cachedResult: CategorizationResult = {
        status: "matched",
        tagName: "recruiter",
        displayName: "Recruiter",
        guidelines: "Test guidelines",
        confidence: 0.95,
      };

      await env.UI_CACHE.put(intentCacheKey, JSON.stringify(cachedResult));

      const result = await categorizeIntent(customIntent, env);

      expect(result.tagName).toBe("recruiter");
    });

    it("normalizes intent for cache key (trimmed)", async () => {
      const customIntent = "  recruiter  ";
      const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

      const cachedResult: CategorizationResult = {
        status: "matched",
        tagName: "recruiter",
        displayName: "Recruiter",
        guidelines: "Test guidelines",
        confidence: 0.95,
      };

      await env.UI_CACHE.put(intentCacheKey, JSON.stringify(cachedResult));

      const result = await categorizeIntent(customIntent, env);

      expect(result.tagName).toBe("recruiter");
    });

    it("truncates long intents for cache key", async () => {
      const longIntent = "a".repeat(100);
      const normalizedIntent = longIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

      const cachedResult: CategorizationResult = {
        status: "matched",
        tagName: "friend",
        displayName: "Friend",
        guidelines: "Test guidelines",
        confidence: 0.95,
      };

      await env.UI_CACHE.put(intentCacheKey, JSON.stringify(cachedResult));

      const result = await categorizeIntent(longIntent, env);

      expect(result.tagName).toBe("friend");
    });
  });

  describe("fallback behavior", () => {
    it("returns default categorization when AI is not configured", async () => {
      const envWithoutAI = {
        UI_CACHE: env.UI_CACHE,
        AI: undefined,
        AI_GATEWAY_ID: undefined,
      } as unknown as Env;

      const result = await categorizeIntent("test intent", envWithoutAI);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.status).toBe(defaultResult.status);
      expect(result.tagName).toBe(defaultResult.tagName);
      expect(result.confidence).toBe(defaultResult.confidence);
    });

    it("returns default categorization when only AI_GATEWAY_ID is missing", async () => {
      const envWithoutGateway = {
        UI_CACHE: env.UI_CACHE,
        AI: {} as Ai,
        AI_GATEWAY_ID: undefined,
      } as unknown as Env;

      const result = await categorizeIntent("test intent", envWithoutGateway);

      expect(result.tagName).toBe("friend");
    });
  });
});

describe("storeNewTag", () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
  });

  it("stores new tag in KV", async () => {
    const result: CategorizationResult = {
      status: "new_tag",
      tagName: "investor",
      displayName: "Investor",
      guidelines: "Focus on ROI and market potential",
      confidence: 0.85,
      reason: "New tag created",
    };

    await storeNewTag(result, "I am an investor looking for opportunities", env);

    const stored = await env.UI_CACHE.get("tag:investor", "json");

    expect(stored).toBeDefined();
    expect((stored as { tagName: string }).tagName).toBe("investor");
    expect((stored as { displayName: string }).displayName).toBe("Investor");
    expect((stored as { guidelines: string }).guidelines).toBe(
      "Focus on ROI and market potential"
    );
    expect((stored as { isCustom: boolean }).isCustom).toBe(true);
  });

  it("includes original intent in stored tag", async () => {
    const result: CategorizationResult = {
      status: "new_tag",
      tagName: "journalist",
      displayName: "Journalist",
      guidelines: "Press and media focus",
      confidence: 0.9,
    };

    const originalIntent = "I am a journalist writing a tech article";
    await storeNewTag(result, originalIntent, env);

    const stored = await env.UI_CACHE.get("tag:journalist", "json");

    expect((stored as { mappedFrom: string }).mappedFrom).toBe(originalIntent);
  });

  it("includes creation timestamp", async () => {
    const result: CategorizationResult = {
      status: "new_tag",
      tagName: "student",
      displayName: "Student",
      guidelines: "Educational focus",
      confidence: 0.88,
    };

    await storeNewTag(result, "I am a CS student", env);

    const stored = await env.UI_CACHE.get("tag:student", "json");

    expect((stored as { createdAt: string }).createdAt).toBeDefined();
    // Should be a valid ISO date string
    expect(
      new Date((stored as { createdAt: string }).createdAt).toISOString()
    ).toBeTruthy();
  });

  it("does not overwrite existing tag", async () => {
    // First, store an existing tag
    await env.UI_CACHE.put(
      "tag:existing",
      JSON.stringify({
        tagName: "existing",
        displayName: "Original",
        guidelines: "Original guidelines",
        isCustom: true,
      })
    );

    const result: CategorizationResult = {
      status: "new_tag",
      tagName: "existing",
      displayName: "New",
      guidelines: "New guidelines",
      confidence: 0.9,
    };

    await storeNewTag(result, "test intent", env);

    const stored = await env.UI_CACHE.get("tag:existing", "json");

    // Should still have original values
    expect((stored as { displayName: string }).displayName).toBe("Original");
    expect((stored as { guidelines: string }).guidelines).toBe(
      "Original guidelines"
    );
  });

  it("handles missing UI_CACHE gracefully", async () => {
    const envWithoutCache = {
      AI: {} as Ai,
      AI_GATEWAY_ID: "test",
    } as unknown as Env;

    const result: CategorizationResult = {
      status: "new_tag",
      tagName: "test",
      displayName: "Test",
      guidelines: "Test",
      confidence: 0.9,
    };

    // Should not throw
    await expect(
      storeNewTag(result, "test", envWithoutCache)
    ).resolves.toBeUndefined();
  });
});

describe("hashString", () => {
  it("produces consistent hashes for cache keys", () => {
    const intent = "i am a recruiter";
    const hash1 = hashString(intent);
    const hash2 = hashString(intent);

    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different intents", () => {
    const hash1 = hashString("recruiter");
    const hash2 = hashString("developer");

    expect(hash1).not.toBe(hash2);
  });

  it("handles unicode characters", () => {
    const hash = hashString("日本語テスト");

    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });

  it("handles emoji characters", () => {
    const hash = hashString("hello 👋 world");

    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });
});
