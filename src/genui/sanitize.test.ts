import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { sanitizeProps } from './sanitize';
import { heroProps, imageGalleryProps, statsCounterProps, faqProps } from './schema';

describe('sanitizeProps', () => {
  it('returns valid props unchanged', () => {
    const props = { title: 'Hi', subtitle: 'There', image: '/assets/profile.png' };
    expect(sanitizeProps(heroProps, props)).toEqual(props);
  });

  it('returns null when a required field is missing', () => {
    expect(sanitizeProps(heroProps, { subtitle: 'no title' })).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(sanitizeProps(heroProps, 'Hero')).toBeNull();
    expect(sanitizeProps(heroProps, null)).toBeNull();
  });

  it.each([
    ['javascript: URL', 'javascript:alert(1)'],
    ['data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['plain http', 'http://example.com'],
    ['protocol-relative', '//evil.example/x'],
    ['placeholder text', 'Not available'],
  ])('drops a CTA with an unsafe href (%s)', (_, href) => {
    expect(
      sanitizeProps(heroProps, { title: 'a', subtitle: 'b', cta: { text: 'Go', href } }),
    ).toEqual({ title: 'a', subtitle: 'b' });
  });

  it.each(['https://example.com/cv', 'mailto:me@example.com', '/assets/resume.pdf'])(
    'keeps a CTA with a safe href (%s)',
    (href) => {
      expect(
        sanitizeProps(heroProps, { title: 'a', subtitle: 'b', cta: { text: 'Go', href } })?.cta,
      ).toEqual({ text: 'Go', href });
    },
  );

  it('drops an image outside /assets', () => {
    expect(
      sanitizeProps(heroProps, { title: 'a', subtitle: 'b', image: 'https://evil.example/x.png' }),
    ).toEqual({ title: 'a', subtitle: 'b' });
  });

  it('filters individual gallery images, including path traversal', () => {
    expect(
      sanitizeProps(imageGalleryProps, {
        title: 'Photos',
        images: [
          '/assets/a.png',
          '/assets/../../etc/passwd',
          'https://evil.example/b.png',
          '/assets/sub/c.png',
        ],
      }),
    ).toEqual({ title: 'Photos', images: ['/assets/a.png', '/assets/sub/c.png'] });
  });

  it('drops invalid optional fields inside array items but keeps the items', () => {
    expect(
      sanitizeProps(statsCounterProps, {
        title: 'Stats',
        stats: [{ label: 'Users', value: 3, icon: 'users' }],
      }),
    ).toEqual({ title: 'Stats', stats: [{ label: 'Users', value: 3 }] });
  });

  it('drops array items whose required fields are invalid', () => {
    expect(
      sanitizeProps(faqProps, {
        title: 'FAQ',
        items: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2' },
          { question: 'Q3', answer: 'A3' },
        ],
      })?.items,
    ).toEqual([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q3', answer: 'A3' },
    ]);
  });

  it('strips unknown props', () => {
    expect(sanitizeProps(heroProps, { title: 'a', subtitle: 'b', onClick: 'steal()' })).toEqual({
      title: 'a',
      subtitle: 'b',
    });
  });

  it('does not mutate its input', () => {
    const input = { title: 'a', subtitle: 'b', cta: { text: 'x', href: 'javascript:1' } };
    sanitizeProps(heroProps, input);
    expect(input.cta.href).toBe('javascript:1');
  });

  it('gives up rather than looping on an unrepairable schema', () => {
    const schema = z.object({ a: z.string(), b: z.string() });
    expect(sanitizeProps(schema, { a: 1, b: 2 })).toBeNull();
  });
});
