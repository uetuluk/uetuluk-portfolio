import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { categorizeIntent, getDefaultCategorizationResult, hashString } from './index';
import type { CategorizationResult, Env } from './types';
import {
  createMockCategorizationAI,
  createMockErrorAI,
  createMockNoContentAI,
  createMockInvalidJsonAI,
  createMockThrowingAI,
  createEnvWithMockAI,
} from './mocks/ai-gateway';
import { TAG_GUIDELINES } from './prompts';

/**
 * AI Gateway Categorization Tests
 *
 * Tests for the AI Gateway integration in categorizeIntent().
 * Uses mock AI to test success paths, error handling, and edge cases.
 */

describe('AI Gateway Categorization', () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
  });

  describe('successful categorization', () => {
    it('returns AI result for matched status', async () => {
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'developer',
        displayName: 'Developer',
        guidelines: TAG_GUIDELINES.developer,
        confidence: 0.95,
        reason: 'User identified as developer',
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('I am a developer', testEnv);

      expect(result.status).toBe('matched');
      expect(result.tagName).toBe('developer');
      expect(result.displayName).toBe('Developer');
      expect(result.confidence).toBe(0.95);
    });

    it('caches successful categorization result', async () => {
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'recruiter',
        displayName: 'Recruiter',
        guidelines: TAG_GUIDELINES.recruiter,
        confidence: 0.9,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const customIntent = 'I am a recruiter looking for talent';
      await categorizeIntent(customIntent, testEnv);

      // Verify it was cached
      const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;
      const cached = await env.UI_CACHE.get(intentCacheKey, 'json');

      expect(cached).toBeDefined();
      expect((cached as CategorizationResult).tagName).toBe('recruiter');
    });
  });

  describe('new_tag status', () => {
    it('stores new tag when status is new_tag', async () => {
      const mockResult: CategorizationResult = {
        status: 'new_tag',
        tagName: 'investor',
        displayName: 'Angel Investor',
        guidelines: 'Focus on startup potential, market size, and team',
        confidence: 0.85,
        reason: 'New audience type identified',
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('I am an angel investor', testEnv);

      expect(result.status).toBe('new_tag');
      expect(result.tagName).toBe('investor');

      // Verify the new tag was stored
      const storedTag = await env.UI_CACHE.get('tag:investor', 'json');
      expect(storedTag).toBeDefined();
      expect((storedTag as { tagName: string }).tagName).toBe('investor');
      expect((storedTag as { isCustom: boolean }).isCustom).toBe(true);
    });

    it('includes custom guidelines for new_tag', async () => {
      const customGuidelines = 'Focus on regulatory compliance and data privacy';
      const mockResult: CategorizationResult = {
        status: 'new_tag',
        tagName: 'compliance_officer',
        displayName: 'Compliance Officer',
        guidelines: customGuidelines,
        confidence: 0.88,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('I work in compliance', testEnv);

      expect(result.guidelines).toBe(customGuidelines);
    });
  });

  describe('rejected status', () => {
    it('returns rejected status for inappropriate intents', async () => {
      const mockResult: CategorizationResult = {
        status: 'rejected',
        tagName: 'friend',
        displayName: 'Friend',
        guidelines: TAG_GUIDELINES.friend,
        confidence: 0.2,
        reason: 'Intent could not be categorized appropriately',
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('gibberish nonsense xyz', testEnv);

      expect(result.status).toBe('rejected');
      // Rejected status should still return a valid result
      expect(result.tagName).toBeDefined();
    });
  });

  describe('AI Gateway error handling', () => {
    it('returns default result when AI returns non-ok response', async () => {
      const mockAI = createMockErrorAI(500, 'Internal server error');
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test intent', testEnv);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.tagName).toBe(defaultResult.tagName);
      expect(result.status).toBe(defaultResult.status);
    });

    it('returns default result when AI returns 429 rate limit', async () => {
      const mockAI = createMockErrorAI(429, 'Rate limit exceeded');
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test intent', testEnv);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.tagName).toBe(defaultResult.tagName);
    });

    it('returns default result when AI returns empty response', async () => {
      const mockAI = createMockNoContentAI();
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test intent', testEnv);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.tagName).toBe(defaultResult.tagName);
    });

    it('returns default result when AI returns invalid JSON', async () => {
      const mockAI = createMockInvalidJsonAI();
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test intent', testEnv);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.tagName).toBe(defaultResult.tagName);
    });

    it('returns default result when AI gateway throws error', async () => {
      const mockAI = createMockThrowingAI(new Error('Network failure'));
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test intent', testEnv);
      const defaultResult = getDefaultCategorizationResult();

      expect(result.tagName).toBe(defaultResult.tagName);
    });
  });

  describe('result sanitization', () => {
    it('sanitizes tagName to lowercase with hyphens', async () => {
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'Test Developer!@#',
        displayName: 'Test Developer',
        guidelines: 'Test guidelines',
        confidence: 0.9,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test', testEnv);

      // tagName should be sanitized to lowercase alphanumeric with hyphens
      expect(result.tagName).toMatch(/^[a-z0-9-]+$/);
      // Special characters should be replaced with hyphens
      expect(result.tagName).toBe('test-developer');
    });

    it('preserves valid confidence values from AI', async () => {
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'developer',
        displayName: 'Developer',
        guidelines: 'Test guidelines',
        confidence: 0.85,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test', testEnv);

      expect(result.confidence).toBe(0.85);
    });

    it('truncates overly long guidelines', async () => {
      const longGuidelines = 'A'.repeat(2000);
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'developer',
        displayName: 'Developer',
        guidelines: longGuidelines,
        confidence: 0.9,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      const result = await categorizeIntent('test', testEnv);

      // Guidelines should be truncated
      expect(result.guidelines.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('caching with AI', () => {
    it('uses cache on second call, not AI', async () => {
      const mockResult: CategorizationResult = {
        status: 'matched',
        tagName: 'developer',
        displayName: 'Developer',
        guidelines: TAG_GUIDELINES.developer,
        confidence: 0.95,
      };

      const mockAI = createMockCategorizationAI(mockResult);
      const testEnv = createEnvWithMockAI(env, mockAI);

      // First call should use AI and cache result
      const result1 = await categorizeIntent('I am a developer', testEnv);
      expect(result1.tagName).toBe('developer');

      // Create env without AI to prove cache is used
      const envWithoutAI = {
        UI_CACHE: env.UI_CACHE,
        AI: undefined,
        AI_GATEWAY_ID: undefined,
      } as unknown as Env;

      // Second call should use cache
      const result2 = await categorizeIntent('I am a developer', envWithoutAI);
      expect(result2.tagName).toBe('developer');
    });
  });
});
