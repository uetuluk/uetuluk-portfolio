import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  checkRateLimit,
  updateRateLimit,
  checkGenerateRateLimit,
  updateGenerateRateLimit,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_KEY_PREFIX,
  GENERATE_RATE_LIMIT_MAX,
  GENERATE_RATE_LIMIT_WINDOW_MS,
} from './index';
import type { Env } from './types';

/**
 * Rate Limiting Tests
 *
 * Tests for both session-based rate limiting (dislike feedback)
 * and IP-based rate limiting (generate endpoint).
 */

describe('Rate Limiting', () => {
  beforeEach(async () => {
    // Clear KV cache before each test
    const keys = await env.UI_CACHE.list();
    for (const key of keys.keys) {
      await env.UI_CACHE.delete(key.name);
    }
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Session Rate Limiting (checkRateLimit)', () => {
    const testKey = 'ratelimit:session-test';

    it('returns not limited when no rate limit entry exists', async () => {
      const result = await checkRateLimit(testKey, env);

      expect(result.limited).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('returns limited when within rate limit window', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Create rate limit entry
      await updateRateLimit(testKey, env);

      // Check immediately
      const result = await checkRateLimit(testKey, env);

      expect(result.limited).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('returns not limited after window expires', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Create rate limit entry
      await updateRateLimit(testKey, env);

      // Advance time past the window
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);

      const result = await checkRateLimit(testKey, env);

      expect(result.limited).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('calculates correct retry-after time', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Create rate limit entry
      await updateRateLimit(testKey, env);

      // Advance 30 seconds into the window
      vi.advanceTimersByTime(30 * 1000);

      const result = await checkRateLimit(testKey, env);

      expect(result.limited).toBe(true);
      // Should be ~30 seconds remaining (60 - 30 = 30)
      expect(result.retryAfter).toBeGreaterThanOrEqual(29);
      expect(result.retryAfter).toBeLessThanOrEqual(31);
    });
  });

  describe('updateRateLimit', () => {
    const testKey = 'ratelimit:update-test';

    it('creates rate limit entry in KV', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      await updateRateLimit(testKey, env);

      const stored = await env.UI_CACHE.get(testKey, 'json');
      expect(stored).toBeDefined();
      expect((stored as { lastDislike: number }).lastDislike).toBeDefined();
    });

    it('sets count to 1', async () => {
      await updateRateLimit(testKey, env);

      const stored = await env.UI_CACHE.get(testKey, 'json');
      expect((stored as { count: number }).count).toBe(1);
    });
  });

  describe('Generate Endpoint Rate Limiting (checkGenerateRateLimit)', () => {
    const testIP = '1.2.3.4';

    it('returns not limited on first request', async () => {
      const result = await checkGenerateRateLimit(testIP, env);

      expect(result.limited).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('returns not limited when under max requests', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Make requests up to but not exceeding limit
      for (let i = 0; i < GENERATE_RATE_LIMIT_MAX - 1; i++) {
        await updateGenerateRateLimit(testIP, env);
      }

      const result = await checkGenerateRateLimit(testIP, env);

      expect(result.limited).toBe(false);
    });

    it('returns limited when at max requests in window', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Make requests up to limit
      for (let i = 0; i < GENERATE_RATE_LIMIT_MAX; i++) {
        await updateGenerateRateLimit(testIP, env);
      }

      const result = await checkGenerateRateLimit(testIP, env);

      expect(result.limited).toBe(true);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('resets after window expires', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Hit the rate limit
      for (let i = 0; i < GENERATE_RATE_LIMIT_MAX; i++) {
        await updateGenerateRateLimit(testIP, env);
      }

      // Advance past window
      vi.advanceTimersByTime(GENERATE_RATE_LIMIT_WINDOW_MS + 1000);

      const result = await checkGenerateRateLimit(testIP, env);

      expect(result.limited).toBe(false);
    });

    it('tracks different IPs independently', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const ip1 = '1.1.1.1';
      const ip2 = '2.2.2.2';

      // Hit limit for ip1
      for (let i = 0; i < GENERATE_RATE_LIMIT_MAX; i++) {
        await updateGenerateRateLimit(ip1, env);
      }

      // ip1 should be limited
      const result1 = await checkGenerateRateLimit(ip1, env);
      expect(result1.limited).toBe(true);

      // ip2 should not be limited
      const result2 = await checkGenerateRateLimit(ip2, env);
      expect(result2.limited).toBe(false);
    });
  });

  describe('updateGenerateRateLimit', () => {
    const testIP = '5.6.7.8';

    it('creates entry on first call', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      await updateGenerateRateLimit(testIP, env);

      const key = `${RATE_LIMIT_KEY_PREFIX}generate:${testIP}`;
      const stored = await env.UI_CACHE.get(key, 'json');

      expect(stored).toBeDefined();
      expect((stored as { count: number }).count).toBe(1);
    });

    it('increments count on subsequent calls within window', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      await updateGenerateRateLimit(testIP, env);
      await updateGenerateRateLimit(testIP, env);
      await updateGenerateRateLimit(testIP, env);

      const key = `${RATE_LIMIT_KEY_PREFIX}generate:${testIP}`;
      const stored = await env.UI_CACHE.get(key, 'json');

      expect((stored as { count: number }).count).toBe(3);
    });

    it('resets count after window expires', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // First window
      await updateGenerateRateLimit(testIP, env);
      await updateGenerateRateLimit(testIP, env);

      // Advance past window
      vi.advanceTimersByTime(GENERATE_RATE_LIMIT_WINDOW_MS + 1000);

      // New window
      await updateGenerateRateLimit(testIP, env);

      const key = `${RATE_LIMIT_KEY_PREFIX}generate:${testIP}`;
      const stored = await env.UI_CACHE.get(key, 'json');

      expect((stored as { count: number }).count).toBe(1);
    });

    it('preserves window start time within same window', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
      const initialTime = Date.now();

      await updateGenerateRateLimit(testIP, env);

      // Advance 10 seconds
      vi.advanceTimersByTime(10 * 1000);

      await updateGenerateRateLimit(testIP, env);

      const key = `${RATE_LIMIT_KEY_PREFIX}generate:${testIP}`;
      const stored = await env.UI_CACHE.get(key, 'json');

      expect((stored as { windowStart: number }).windowStart).toBe(initialTime);
    });
  });

  describe('Rate Limit Constants', () => {
    it('RATE_LIMIT_WINDOW_MS is 60 seconds', () => {
      expect(RATE_LIMIT_WINDOW_MS).toBe(60 * 1000);
    });

    it('GENERATE_RATE_LIMIT_MAX is 3', () => {
      expect(GENERATE_RATE_LIMIT_MAX).toBe(3);
    });

    it('GENERATE_RATE_LIMIT_WINDOW_MS is 60 seconds', () => {
      expect(GENERATE_RATE_LIMIT_WINDOW_MS).toBe(60 * 1000);
    });

    it('RATE_LIMIT_KEY_PREFIX is ratelimit:', () => {
      expect(RATE_LIMIT_KEY_PREFIX).toBe('ratelimit:');
    });
  });

  describe('Rate Limiting without cache', () => {
    it('checkGenerateRateLimit returns not limited when UI_CACHE is undefined', async () => {
      const envWithoutCache = {
        AI: {} as Ai,
        AI_GATEWAY_ID: 'test',
      } as unknown as Env;

      const result = await checkGenerateRateLimit('1.2.3.4', envWithoutCache);

      expect(result.limited).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('checkRateLimit returns not limited when UI_CACHE is undefined', async () => {
      const envWithoutCache = {
        AI: {} as Ai,
        AI_GATEWAY_ID: 'test',
      } as unknown as Env;

      const result = await checkRateLimit('test-key', envWithoutCache);

      expect(result.limited).toBe(false);
      expect(result.retryAfter).toBe(0);
    });

    it('updateRateLimit returns early when UI_CACHE is undefined', async () => {
      const envWithoutCache = {
        AI: {} as Ai,
        AI_GATEWAY_ID: 'test',
      } as unknown as Env;

      // Should not throw, just return early
      await expect(updateRateLimit('test-key', envWithoutCache)).resolves.toBeUndefined();
    });

    it('updateGenerateRateLimit returns early when UI_CACHE is undefined', async () => {
      const envWithoutCache = {
        AI: {} as Ai,
        AI_GATEWAY_ID: 'test',
      } as unknown as Env;

      // Should not throw, just return early
      await expect(updateGenerateRateLimit('1.2.3.4', envWithoutCache)).resolves.toBeUndefined();
    });
  });
});
