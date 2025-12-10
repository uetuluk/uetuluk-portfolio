import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractVisitorContext, deriveUIHints } from './index';
import type { VisitorContext } from './types';

/**
 * Visitor Context Tests
 *
 * Tests for extracting visitor context from Cloudflare requests
 * and deriving UI hints from that context.
 */

// Helper to create a mock request with CF properties
function createMockCFRequest(
  url: string,
  cfProps: Partial<IncomingRequestCfProperties> = {},
  headers: Record<string, string> = {},
): Request {
  const request = new Request(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0',
      ...headers,
    },
  });

  Object.defineProperty(request, 'cf', {
    value: {
      country: 'US',
      city: 'Austin',
      continent: 'NA',
      timezone: 'America/Chicago',
      colo: 'DFW',
      httpProtocol: 'HTTP/2',
      region: 'Texas',
      ...cfProps,
    },
    writable: false,
    enumerable: true,
  });

  return request;
}

describe('extractVisitorContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T14:00:00Z')); // Monday 2pm UTC
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('geo extraction', () => {
    it('extracts country from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        country: 'GB',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.country).toBe('GB');
    });

    it('extracts city from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        city: 'London',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.city).toBe('London');
    });

    it('extracts continent from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        continent: 'EU',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.continent).toBe('EU');
    });

    it('extracts timezone from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        timezone: 'Europe/London',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.timezone).toBe('Europe/London');
    });

    it('extracts region from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        region: 'California',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.region).toBe('California');
    });

    it('detects EU country correctly when isEUCountry is 1', () => {
      const request = createMockCFRequest('https://example.com', {
        isEUCountry: '1',
      });

      const context = extractVisitorContext(request);

      expect(context.geo.isEUCountry).toBe(true);
    });

    it('detects non-EU country correctly when isEUCountry is undefined', () => {
      const request = createMockCFRequest('https://example.com', {
        isEUCountry: undefined,
      });

      const context = extractVisitorContext(request);

      expect(context.geo.isEUCountry).toBe(false);
    });
  });

  describe('device extraction', () => {
    it('extracts device type from User-Agent', () => {
      const request = createMockCFRequest(
        'https://example.com',
        {},
        {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
      );

      const context = extractVisitorContext(request);

      expect(context.device.type).toBe('mobile');
      expect(context.device.os).toBe('iOS');
    });

    it('detects desktop browser from User-Agent', () => {
      const request = createMockCFRequest(
        'https://example.com',
        {},
        {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0',
        },
      );

      const context = extractVisitorContext(request);

      expect(context.device.type).toBe('desktop');
      expect(context.device.browser).toBe('Chrome');
      expect(context.device.os).toBe('Windows');
    });

    it('handles missing User-Agent header', () => {
      const request = new Request('https://example.com');
      Object.defineProperty(request, 'cf', {
        value: {
          country: 'US',
          timezone: 'America/Chicago',
        },
      });

      const context = extractVisitorContext(request);

      expect(context.device.type).toBe('desktop');
      expect(context.device.browser).toBeUndefined();
    });
  });

  describe('time extraction', () => {
    it('calculates local hour from timezone', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // 12 UTC

      const request = createMockCFRequest('https://example.com', {
        timezone: 'America/New_York', // UTC-5 in winter
      });

      const context = extractVisitorContext(request);

      expect(context.time.localHour).toBe(7); // 12 - 5 = 7 AM
      expect(context.time.timeOfDay).toBe('morning');
    });

    it('detects time of day correctly', () => {
      vi.setSystemTime(new Date('2024-01-15T20:00:00Z')); // 8 PM UTC

      const request = createMockCFRequest('https://example.com', {
        timezone: 'UTC',
      });

      const context = extractVisitorContext(request);

      expect(context.time.timeOfDay).toBe('evening');
    });

    it('detects weekend correctly', () => {
      vi.setSystemTime(new Date('2024-01-13T12:00:00Z')); // Saturday

      const request = createMockCFRequest('https://example.com', {
        timezone: 'UTC',
      });

      const context = extractVisitorContext(request);

      expect(context.time.isWeekend).toBe(true);
    });

    it('falls back to UTC when timezone is missing', () => {
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z')); // 10 AM UTC

      const request = new Request('https://example.com');
      Object.defineProperty(request, 'cf', {
        value: {
          country: 'US',
        },
      });

      const context = extractVisitorContext(request);

      expect(context.time.localHour).toBe(10);
    });
  });

  describe('network extraction', () => {
    it('extracts HTTP protocol from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        httpProtocol: 'HTTP/3',
      });

      const context = extractVisitorContext(request);

      expect(context.network.httpProtocol).toBe('HTTP/3');
    });

    it('extracts colo from CF properties', () => {
      const request = createMockCFRequest('https://example.com', {
        colo: 'LAX',
      });

      const context = extractVisitorContext(request);

      expect(context.network.colo).toBe('LAX');
    });

    it('defaults to HTTP/1.1 when httpProtocol is missing', () => {
      const request = new Request('https://example.com');
      Object.defineProperty(request, 'cf', {
        value: {
          country: 'US',
        },
      });

      const context = extractVisitorContext(request);

      expect(context.network.httpProtocol).toBe('HTTP/1.1');
    });

    it('defaults to unknown when colo is missing', () => {
      const request = new Request('https://example.com');
      Object.defineProperty(request, 'cf', {
        value: {
          country: 'US',
        },
      });

      const context = extractVisitorContext(request);

      expect(context.network.colo).toBe('unknown');
    });
  });

  describe('handles missing CF properties', () => {
    it('handles completely missing cf object', () => {
      const request = new Request('https://example.com');

      const context = extractVisitorContext(request);

      expect(context.geo.country).toBeUndefined();
      expect(context.device.type).toBe('desktop');
      expect(context.network.httpProtocol).toBe('HTTP/1.1');
    });
  });
});

describe('deriveUIHints', () => {
  describe('theme suggestions', () => {
    it('suggests dark theme for evening hours', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'desktop' },
        time: { localHour: 19, timeOfDay: 'evening', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.suggestedTheme).toBe('dark');
    });

    it('suggests dark theme for night hours', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'desktop' },
        time: { localHour: 23, timeOfDay: 'night', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.suggestedTheme).toBe('dark');
    });

    it('suggests light theme for morning hours', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'desktop' },
        time: { localHour: 9, timeOfDay: 'morning', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.suggestedTheme).toBe('light');
    });

    it('suggests system theme for afternoon hours', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'desktop' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.suggestedTheme).toBe('system');
    });
  });

  describe('layout preferences', () => {
    it('prefers compact layout for mobile devices', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'mobile' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.preferCompactLayout).toBe(true);
    });

    it('does not prefer compact layout for desktop devices', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'desktop' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.preferCompactLayout).toBe(false);
    });

    it('does not prefer compact layout for tablet devices', () => {
      const context: VisitorContext = {
        geo: { isEUCountry: false },
        device: { type: 'tablet' },
        time: { localHour: 14, timeOfDay: 'afternoon', isWeekend: false },
        network: { httpProtocol: 'HTTP/2', colo: 'DFW' },
      };

      const hints = deriveUIHints(context);

      expect(hints.preferCompactLayout).toBe(false);
    });
  });
});
