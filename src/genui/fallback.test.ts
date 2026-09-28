import { describe, it, expect } from 'vitest';
import { createParser, type ElementNode } from '@openuidev/lang-core';
import { buildFallbackLayout, DEFAULT_FALLBACK_TITLES, type FallbackPortfolio } from './fallback';
import { contractLibrary, componentDefinitions, ROOT_COMPONENT, type SectionName } from './schema';
import { sanitizeProps } from './sanitize';

const parser = createParser(contractLibrary.toJSONSchema(), ROOT_COMPONENT);

const portfolio: FallbackPortfolio = {
  personal: { name: 'Test "Quoted" User', title: 'Engineer', bio: 'Line one.\nLine two.' },
  projects: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }, { id: 'p5' }],
  photos: [{ path: '/assets/a.png' }, { path: '/assets/b.png' }],
};

function parse(lang: string) {
  const result = parser.parse(lang);
  const root = result.root as ElementNode;
  const sections = (root.props as { sections: ElementNode[] }).sections;
  return { result, root, sections, byName: (n: string) => sections.find((s) => s.typeName === n) };
}

describe('buildFallbackLayout', () => {
  it.each([
    ['recruiter', 'hero-focused', ['Hero', 'SkillBadges', 'Timeline', 'CardGrid']],
    ['developer', 'two-column', ['Hero', 'CardGrid', 'SkillBadges', 'ContactForm']],
    ['collaborator', 'hero-focused', ['Hero', 'TextBlock', 'CardGrid', 'ContactForm']],
    ['friend', 'single-column', ['Hero', 'TextBlock', 'ImageGallery', 'ContactForm']],
    ['unknown-tag', 'single-column', ['Hero', 'TextBlock', 'ImageGallery', 'ContactForm']],
    [null, 'single-column', ['Hero', 'TextBlock', 'ImageGallery', 'ContactForm']],
  ])('builds the %s page', (tag, layout, sections) => {
    const { result, root } = parse(buildFallbackLayout(tag, portfolio));

    expect(result.meta.errors).toEqual([]);
    expect(root.props).toMatchObject({ layout, accent: 'blue' });
    expect((root.props as { sections: ElementNode[] }).sections.map((s) => s.typeName)).toEqual(
      sections,
    );
  });

  it('produces props that pass the render-time schema for every section', () => {
    for (const tag of ['recruiter', 'developer', 'collaborator', 'friend']) {
      for (const section of parse(buildFallbackLayout(tag, portfolio)).sections) {
        const schema = componentDefinitions[section.typeName as SectionName].props;
        // Skipped positional args arrive as null; the sanitizer drops them so the component
        // default applies. Every real value must survive.
        const present = Object.fromEntries(
          Object.entries(section.props as Record<string, unknown>).filter(([, v]) => v !== null),
        );
        expect(sanitizeProps(schema, section.props)).toEqual(present);
      }
    }
  });

  it('passes a skipped middle positional argument as null', () => {
    // ContactForm(title, showEmail, showLinkedIn, showGitHub) with showLinkedIn unset
    const contact = parse(buildFallbackLayout('developer', portfolio)).byName('ContactForm');
    expect(contact?.props).toEqual({
      title: 'Get in Touch',
      showEmail: true,
      showLinkedIn: null,
      showGitHub: true,
    });
    expect(sanitizeProps(componentDefinitions.ContactForm.props, contact?.props)).toEqual({
      title: 'Get in Touch',
      showEmail: true,
      showGitHub: true,
    });
  });

  it('escapes quotes and newlines in portfolio text', () => {
    const { byName } = parse(buildFallbackLayout('collaborator', portfolio));

    expect(byName('Hero')?.props).toMatchObject({ title: 'Test "Quoted" User' });
    expect(byName('TextBlock')?.props).toMatchObject({ content: 'Line one.\nLine two.' });
  });

  it('uses project IDs, capped per visitor type', () => {
    expect(
      parse(buildFallbackLayout('recruiter', portfolio)).byName('CardGrid')?.props,
    ).toMatchObject({
      items: ['p1', 'p2', 'p3', 'p4'],
    });
    expect(
      parse(buildFallbackLayout('developer', portfolio)).byName('CardGrid')?.props,
    ).toMatchObject({
      items: ['p1', 'p2', 'p3', 'p4', 'p5'],
    });
  });

  it('adds a resume CTA for recruiters only when a resume URL exists', () => {
    expect(
      parse(buildFallbackLayout('recruiter', portfolio)).byName('Hero')?.props,
    ).not.toHaveProperty('cta');

    const withResume = {
      ...portfolio,
      personal: { ...portfolio.personal, resumeUrl: 'https://example.com/cv.pdf' },
    };
    expect(parse(buildFallbackLayout('recruiter', withResume)).byName('Hero')?.props).toMatchObject(
      {
        cta: { text: 'View Resume', href: 'https://example.com/cv.pdf' },
      },
    );
    expect(
      parse(buildFallbackLayout('developer', withResume)).byName('Hero')?.props,
    ).not.toHaveProperty('cta');
  });

  it('uses the provided translated titles', () => {
    const titles = { ...DEFAULT_FALLBACK_TITLES, aboutMe: '自己紹介', photos: '写真' };
    const { byName } = parse(buildFallbackLayout('friend', portfolio, titles));

    expect(byName('TextBlock')?.props).toMatchObject({ title: '自己紹介' });
    expect(byName('ImageGallery')?.props).toMatchObject({
      title: '写真',
      images: ['/assets/a.png', '/assets/b.png'],
    });
  });

  it('handles a portfolio without photos', () => {
    const { byName } = parse(buildFallbackLayout('friend', { ...portfolio, photos: undefined }));

    expect(byName('ImageGallery')?.props).toMatchObject({ images: [] });
  });
});
