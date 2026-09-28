/**
 * Fallback page, used when generation is unavailable: by the Worker when the model fails or the
 * visitor is rate limited, and by the browser when the request itself fails. Emits OpenUI Lang so
 * every path renders through the same Renderer.
 */
import { jsonToOpenUI, type ElementNode } from '@openuidev/lang-core';
import { getContractLibrary, ROOT_COMPONENT, type SectionName } from './schema';

export interface FallbackPortfolio {
  personal: { name: string; title: string; bio: string; resumeUrl?: string };
  projects: Array<{ id: string }>;
  photos?: Array<{ path: string }>;
}

export const DEFAULT_FALLBACK_TITLES = {
  skills: 'Technical Skills',
  experience: 'Experience',
  projects: 'Projects',
  featuredProjects: 'Featured Projects',
  aboutMe: 'About Me',
  photos: 'Photos',
  letsConnect: "Let's Connect",
  getInTouch: 'Get in Touch',
};

export type FallbackTitles = typeof DEFAULT_FALLBACK_TITLES;

function element(typeName: string, props: Record<string, unknown>): ElementNode {
  return { type: 'element', typeName, props, partial: false } as ElementNode;
}

export function buildFallbackLayout(
  visitorTag: string | null | undefined,
  portfolio: FallbackPortfolio,
  titles: FallbackTitles = DEFAULT_FALLBACK_TITLES,
): string {
  const { personal } = portfolio;
  const projectIds = portfolio.projects.map((p) => p.id);
  const hero = (withResume: boolean) =>
    element('Hero', {
      title: personal.name,
      subtitle: personal.title,
      image: '/assets/profile.png',
      ...(withResume && personal.resumeUrl
        ? { cta: { text: 'View Resume', href: personal.resumeUrl } }
        : {}),
    });

  let layout = 'hero-focused';
  let sections: Array<[SectionName, Record<string, unknown>] | ElementNode>;

  switch (visitorTag) {
    case 'recruiter':
      sections = [
        hero(true),
        ['SkillBadges', { title: titles.skills, style: 'detailed' }],
        ['Timeline', { title: titles.experience }],
        ['CardGrid', { title: titles.featuredProjects, columns: 2, items: projectIds.slice(0, 4) }],
      ];
      break;
    case 'developer':
      layout = 'two-column';
      sections = [
        hero(false),
        ['CardGrid', { title: titles.projects, columns: 3, items: projectIds }],
        ['SkillBadges', { title: titles.skills, style: 'detailed' }],
        ['ContactForm', { title: titles.getInTouch, showGitHub: true, showEmail: true }],
      ];
      break;
    case 'collaborator':
      sections = [
        hero(false),
        ['TextBlock', { title: titles.aboutMe, content: personal.bio, style: 'prose' }],
        ['CardGrid', { title: titles.projects, columns: 2, items: projectIds.slice(0, 2) }],
        [
          'ContactForm',
          { title: titles.letsConnect, showEmail: true, showLinkedIn: true, showGitHub: true },
        ],
      ];
      break;
    case 'friend':
    default:
      layout = 'single-column';
      sections = [
        hero(false),
        ['TextBlock', { title: titles.aboutMe, content: personal.bio, style: 'prose' }],
        [
          'ImageGallery',
          { title: titles.photos, images: portfolio.photos?.map((p) => p.path) ?? [] },
        ],
        ['ContactForm', { title: titles.getInTouch, showEmail: true }],
      ];
      break;
  }

  const root = element(ROOT_COMPONENT, {
    layout,
    accent: 'blue',
    sections: sections.map((s) => (Array.isArray(s) ? element(s[0], s[1]) : s)),
  });
  return jsonToOpenUI(root, getContractLibrary());
}
