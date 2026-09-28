import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateLink } from './index';

/**
 * Link Validation Tests
 *
 * Tests for validateLink, the reachability and SSRF check applied to external links in a
 * generated layout before it is cached. Link extraction is covered in genui-stream.test.ts.
 */

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
        redirect: 'manual', // Security: don't follow redirects automatically
      }),
    );
  });
});
