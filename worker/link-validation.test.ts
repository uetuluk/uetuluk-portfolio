import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractLinks, sanitizeLayout, validateLink } from './index';
import type { GeneratedLayout } from './types';

/**
 * Link Validation Tests
 *
 * Tests for extracting, validating, and sanitizing links
 * from generated layouts.
 */

describe('extractLinks', () => {
  it('extracts Hero CTA link', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            subtitle: 'Test',
            cta: { text: 'View Resume', href: 'https://example.com/resume.pdf' },
          },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toContain('https://example.com/resume.pdf');
  });

  it('returns empty array when no Hero CTA exists', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            subtitle: 'Test',
          },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(0);
  });

  it('returns empty array for non-Hero sections', () => {
    const layout: GeneratedLayout = {
      layout: 'single-column',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'CardGrid',
          props: { title: 'Projects', items: [] },
        },
        {
          type: 'SkillBadges',
          props: { title: 'Skills' },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(0);
  });

  it('extracts multiple links from multiple Hero sections', () => {
    const layout: GeneratedLayout = {
      layout: 'two-column',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: { text: 'Link 1', href: 'https://example.com/1' },
          },
        },
        {
          type: 'CardGrid',
          props: { title: 'Projects' },
        },
        {
          type: 'Hero',
          props: {
            title: 'Test 2',
            cta: { text: 'Link 2', href: 'https://example.com/2' },
          },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(2);
    expect(links).toContain('https://example.com/1');
    expect(links).toContain('https://example.com/2');
  });

  it('handles Hero with cta as non-object', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: 'invalid', // Not an object
          },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(0);
  });

  it('handles Hero with cta missing href', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: { text: 'Click me' }, // No href
          },
        },
      ],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(0);
  });

  it('handles empty sections array', () => {
    const layout: GeneratedLayout = {
      layout: 'single-column',
      theme: { accent: 'blue' },
      sections: [],
    };

    const links = extractLinks(layout);

    expect(links).toHaveLength(0);
  });
});

describe('sanitizeLayout', () => {
  it('removes invalid Hero CTA links', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            subtitle: 'Test',
            cta: { text: 'View Resume', href: 'https://invalid.example.com/404' },
          },
        },
      ],
    };

    const invalidLinks = new Set(['https://invalid.example.com/404']);
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.sections[0].props.cta).toBeUndefined();
    expect(sanitized.sections[0].props.title).toBe('Test');
    expect(sanitized.sections[0].props.subtitle).toBe('Test');
  });

  it('preserves valid Hero CTA links', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: { text: 'View Resume', href: 'https://example.com/valid' },
          },
        },
      ],
    };

    const invalidLinks = new Set(['https://other.example.com/invalid']);
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.sections[0].props.cta).toEqual({
      text: 'View Resume',
      href: 'https://example.com/valid',
    });
  });

  it('does not modify non-Hero sections', () => {
    const layout: GeneratedLayout = {
      layout: 'single-column',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'CardGrid',
          props: { title: 'Projects', items: ['proj-1', 'proj-2'] },
        },
      ],
    };

    const invalidLinks = new Set(['https://example.com/invalid']);
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.sections[0]).toEqual(layout.sections[0]);
  });

  it('preserves layout and theme properties', () => {
    const layout: GeneratedLayout = {
      layout: 'two-column',
      theme: { accent: 'purple' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: { text: 'Click', href: 'https://invalid.com' },
          },
        },
      ],
    };

    const invalidLinks = new Set(['https://invalid.com']);
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.layout).toBe('two-column');
    expect(sanitized.theme.accent).toBe('purple');
  });

  it('handles Hero without cta property', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: { title: 'Test' },
        },
      ],
    };

    const invalidLinks = new Set(['https://example.com']);
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.sections[0].props.cta).toBeUndefined();
  });

  it('handles empty invalid links set', () => {
    const layout: GeneratedLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [
        {
          type: 'Hero',
          props: {
            title: 'Test',
            cta: { text: 'Click', href: 'https://example.com' },
          },
        },
      ],
    };

    const invalidLinks = new Set<string>();
    const sanitized = sanitizeLayout(layout, invalidLinks);

    expect(sanitized.sections[0].props.cta).toBeDefined();
  });
});

describe('validateLink', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true for mailto: links without fetching', async () => {
    const result = await validateLink('mailto:test@example.com');

    expect(result).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns true for relative paths without fetching', async () => {
    const result = await validateLink('/assets/resume.pdf');

    expect(result).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns true for successful HTTP response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    });

    const result = await validateLink('https://example.com/valid');

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/valid',
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('returns false for failed HTTP response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    const result = await validateLink('https://example.com/404');

    expect(result).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const result = await validateLink('https://example.com/error');

    expect(result).toBe(false);
  });

  it('uses HEAD method for efficiency', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    });

    await validateLink('https://example.com/test');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'follow',
      }),
    );
  });
});
