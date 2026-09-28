/**
 * Generative UI component contract, shared by the Worker and the browser.
 *
 * This file is the single source of truth for what the model may emit: the Worker turns it into
 * the OpenUI system prompt, and the browser pairs each schema with a React renderer in
 * `library.tsx`. It must stay free of React and DOM imports so the Worker can bundle it.
 *
 * Keep these schemas strict: they are rendered verbatim into the prompt's component signatures,
 * so the model sees exact enums and which fields are optional. The OpenUI parser checks types
 * and enums but not string patterns or number ranges, so the React renderers re-validate props
 * with `sanitizeProps` (see `sanitize.ts`), which drops invalid optional fields and array items
 * (an unsafe link, an image outside /assets) instead of discarding the whole section.
 */
import { z } from 'zod';
import { createLibrary, defineComponent, type Library } from '@openuidev/lang-core';

export const LAYOUTS = ['single-column', 'two-column', 'hero-focused'] as const;
export const ACCENTS = ['blue', 'green', 'purple', 'orange', 'pink'] as const;
export const ROOT_COMPONENT = 'PortfolioPage';

// https URLs, mailto links, or site-relative paths. Rejects javascript:, data:, http: and
// protocol-relative (//host) URLs.
const SAFE_HREF = /^(https:\/\/[^\s]+|mailto:[^\s]+|\/(?!\/)[^\s]*)$/;
// Portfolio images are always served from /assets on this origin. No `..` segments.
const ASSET_PATH = /^\/assets\/(?!.*\.\.)[\w./-]+$/;

const safeHref = z.string().regex(SAFE_HREF);
const assetPath = z.string().regex(ASSET_PATH);

export const heroProps = z.object({
  title: z.string(),
  subtitle: z.string(),
  image: assetPath.optional(),
  cta: z.object({ text: z.string(), href: safeHref }).optional(),
});

export const cardGridProps = z.object({
  title: z.string(),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  items: z.array(z.string()),
});

export const skillBadgesProps = z.object({
  title: z.string(),
  style: z.enum(['compact', 'detailed']).optional(),
  skills: z.array(z.string()).optional(),
});

export const timelineProps = z.object({
  title: z.string(),
  items: z.array(z.string()).optional(),
});

export const contactFormProps = z.object({
  title: z.string(),
  showEmail: z.boolean().optional(),
  showLinkedIn: z.boolean().optional(),
  showGitHub: z.boolean().optional(),
});

export const textBlockProps = z.object({
  title: z.string(),
  content: z.string(),
  style: z.enum(['prose', 'highlight']).optional(),
});

export const imageGalleryProps = z.object({
  title: z.string(),
  images: z.array(assetPath),
});

export const STAT_ICONS = [
  'Calendar',
  'Code',
  'Star',
  'Cpu',
  'Users',
  'Briefcase',
  'Award',
  'GitBranch',
  'Zap',
  'Globe',
] as const;

export const statsCounterProps = z.object({
  title: z.string(),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      suffix: z.string().optional(),
      icon: z.enum(STAT_ICONS).optional(),
    }),
  ),
  animated: z.boolean().optional(),
});

export const techLogosProps = z.object({
  title: z.string(),
  style: z.enum(['grid', 'marquee']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  technologies: z.array(z.string()).optional(),
});

const chartProps = z.object({
  source: z.enum(['github', 'weather']),
  type: z.enum(['area', 'bar', 'line', 'pie', 'radar', 'radial']),
  aggregation: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'byDayOfWeek']).optional(),
  title: z.string().optional(),
  githubUsername: z.string().optional(),
  weatherLocation: z.string().optional(),
  height: z.number().optional(),
});

export const dataChartProps = z.object({
  title: z.string(),
  charts: z.array(chartProps),
  layout: z.enum(['stack', 'grid']).optional(),
});

// Components rendered with @openuidev/react-ui primitives, themed to the site in index.css.
export const calloutProps = z.object({
  title: z.string(),
  description: z.string(),
  variant: z.enum(['neutral', 'info', 'success', 'warning']).optional(),
});

export const faqProps = z.object({
  title: z.string(),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export const stepsProps = z.object({
  title: z.string(),
  steps: z.array(z.object({ title: z.string(), details: z.string() })),
});

/**
 * Framework-agnostic component definitions. `library.tsx` swaps in React renderers; the Worker
 * uses these as-is (with `component: null`) purely to generate the system prompt.
 */
export const componentDefinitions = {
  Hero: {
    props: heroProps,
    description:
      'Page-opening banner. image is a portfolio asset path like "/assets/profile.png". cta links to the resume or a contact page.',
  },
  CardGrid: {
    props: cardGridProps,
    description: 'Grid of project cards. items are project IDs from the portfolio content.',
  },
  SkillBadges: {
    props: skillBadgesProps,
    description:
      'Skill badges. Omit skills to show every skill; "detailed" groups them for technical visitors.',
  },
  Timeline: {
    props: timelineProps,
    description:
      'Work experience timeline. items are experience IDs from the portfolio content; omit to show all.',
  },
  ContactForm: {
    props: contactFormProps,
    description: 'Contact links (email, LinkedIn, GitHub) taken from the portfolio content.',
  },
  TextBlock: {
    props: textBlockProps,
    description: 'A titled paragraph. "highlight" renders an emphasised callout.',
  },
  ImageGallery: {
    props: imageGalleryProps,
    description: 'Photo gallery. images are photo paths from the portfolio content.',
  },
  StatsCounter: {
    props: statsCounterProps,
    description:
      'Headline numbers with optional icons, e.g. years of experience or projects shipped.',
  },
  TechLogos: {
    props: techLogosProps,
    description:
      'Technology logos. Omit technologies to show every skill; "marquee" scrolls horizontally.',
  },
  DataChart: {
    props: dataChartProps,
    description:
      'Live charts. source "github" plots commit activity (use the githubUsername from the available data). source "weather" plots only min/max temperature; use weatherLocation "visitor". Only include sources listed as available.',
  },
  Callout: {
    props: calloutProps,
    description:
      'A short highlighted note, e.g. current availability or what kind of work is being sought. Use at most one per page.',
  },
  FAQ: {
    props: faqProps,
    description:
      'Expandable questions and answers tailored to the visitor, e.g. what roles are of interest or how collaboration works. Answers must be grounded in the portfolio content.',
  },
  Steps: {
    props: stepsProps,
    description:
      'A numbered sequence, e.g. how a collaboration or hiring conversation would proceed. 3-5 steps.',
  },
} as const;

export type SectionName = keyof typeof componentDefinitions;
export const SECTION_NAMES = Object.keys(componentDefinitions) as SectionName[];

/**
 * Build the component library. The root component references the sections through their
 * `.ref`, so this is shared between the prompt-only (Worker) and React (browser) libraries.
 */
export function buildLibrary<C>(
  renderers: Record<SectionName | typeof ROOT_COMPONENT, C>,
): Library<C> {
  const sections = SECTION_NAMES.map((name) =>
    defineComponent({
      name,
      props: componentDefinitions[name].props,
      description: componentDefinitions[name].description,
      component: renderers[name],
    }),
  );

  const root = defineComponent({
    name: ROOT_COMPONENT,
    props: z.object({
      layout: z.enum(LAYOUTS),
      accent: z.enum(ACCENTS),
      sections: z.array(
        z.union(sections.map((s) => s.ref) as [z.ZodType, z.ZodType, ...z.ZodType[]]),
      ),
    }),
    description:
      'The whole page. layout: "single-column" for personal or mobile visits, "two-column" for dense technical content, "hero-focused" to lead with a large banner. accent is the theme colour. sections render top to bottom.',
    component: renderers[ROOT_COMPONENT],
  });

  return createLibrary({ components: [root, ...sections], root: ROOT_COMPONENT });
}

let contractLibrary: Library<null> | undefined;

/**
 * Renderer-less library, used for prompt generation, parsing and serialization. Built on first
 * use: `createLibrary` generates a random id, which Workers forbid in global scope.
 */
export function getContractLibrary(): Library<null> {
  contractLibrary ??= buildLibrary<null>(
    Object.fromEntries([ROOT_COMPONENT, ...SECTION_NAMES].map((name) => [name, null])) as Record<
      SectionName | typeof ROOT_COMPONENT,
      null
    >,
  );
  return contractLibrary;
}

export const rootProps = z.object({
  layout: z.enum(LAYOUTS).optional(),
  accent: z.enum(ACCENTS).optional(),
  sections: z.array(z.unknown()),
});
