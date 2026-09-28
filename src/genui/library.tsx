import { useEffect, type ComponentType } from 'react';
import type { z } from 'zod';
import type { ComponentRenderer, ComponentRenderProps, Library } from '@openuidev/react-lang';
import { Callout } from '@openuidev/react-ui/Callout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@openuidev/react-ui/Accordion';
import { Steps, StepsItem } from '@openuidev/react-ui/Steps';
import '@openuidev/react-ui/styles/callout.css';
import '@openuidev/react-ui/styles/accordion.css';
import '@openuidev/react-ui/styles/steps.css';
import { HeroSection } from '@/components/sections/HeroSection';
import { ProjectCardGrid } from '@/components/sections/ProjectCardGrid';
import { SkillBadgeList } from '@/components/sections/SkillBadgeList';
import { ExperienceTimeline } from '@/components/sections/ExperienceTimeline';
import { ContactSection } from '@/components/sections/ContactSection';
import { TextBlock } from '@/components/sections/TextBlock';
import { ImageGallery } from '@/components/sections/ImageGallery';
import { StatsCounter } from '@/components/sections/StatsCounter';
import { TechLogos } from '@/components/sections/TechLogos';
import { DataChart } from '@/components/sections/DataChart';
import { generatePalette, colorNameToHSL } from '@/lib/palette';
import { applyPaletteToRoot } from '@/lib/applyPalette';
import { cn } from '@/lib/utils';
import { buildLibrary, componentDefinitions, rootProps, type SectionName } from './schema';
import { sanitizeProps } from './sanitize';

type Props<N extends SectionName> = z.infer<(typeof componentDefinitions)[N]['props']>;

/**
 * Wrap a section so the model's props are validated and repaired before React sees them. The
 * OpenUI parser only checks component names and required props; this enforces the full schema.
 */
function section<N extends SectionName>(
  name: N,
  render: ComponentType<Props<N>>,
): ComponentRenderer<Props<N>> {
  // The schema and renderer are paired by `name`; TypeScript can't follow that through the
  // generic, so the props are typed at the call site instead.
  const Render = render as ComponentType<object>;
  function Section({ props }: { props: unknown }) {
    const safe = sanitizeProps(componentDefinitions[name].props, props) as object | null;
    return safe ? <Render {...safe} /> : null;
  }
  Section.displayName = `GenUI(${name})`;
  return Section as ComponentRenderer<Props<N>>;
}

const LAYOUT_CLASSES = {
  'single-column': 'max-w-3xl mx-auto',
  'two-column': 'max-w-6xl mx-auto',
  'hero-focused': 'max-w-5xl mx-auto',
} as const;

function PortfolioPage({ props, renderNode }: ComponentRenderProps) {
  const parsed = rootProps.safeParse(props);
  const layout = parsed.success ? (parsed.data.layout ?? 'single-column') : 'single-column';
  const accent = parsed.success ? parsed.data.accent : undefined;
  const sections = parsed.success ? parsed.data.sections : [];

  // Theme the whole site from the model's accent once it has streamed in.
  useEffect(() => {
    if (accent) applyPaletteToRoot(generatePalette(colorNameToHSL(accent)));
  }, [accent]);

  return (
    <main className={cn('genui px-4 py-8', LAYOUT_CLASSES[layout])}>
      <div className={cn(layout === 'two-column' && 'grid md:grid-cols-2 gap-8')}>
        {sections.map((node, index) => {
          const key = (node as { statementId?: string } | null)?.statementId ?? `section-${index}`;
          return (
            <div key={key} className="mb-8">
              {renderNode(node)}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-2xl font-bold mb-6">{children}</h2>;
}

// Each renderer is typed against its own schema; the Library type wants one shared prop type,
// so the assembled library is cast once here.
export const portfolioLibrary = buildLibrary<ComponentRenderer<never>>({
  PortfolioPage: PortfolioPage as ComponentRenderer<never>,
  Hero: section('Hero', HeroSection),
  CardGrid: section('CardGrid', ProjectCardGrid),
  SkillBadges: section('SkillBadges', SkillBadgeList),
  Timeline: section('Timeline', ExperienceTimeline),
  ContactForm: section('ContactForm', ContactSection),
  TextBlock: section('TextBlock', TextBlock),
  ImageGallery: section('ImageGallery', ImageGallery),
  StatsCounter: section('StatsCounter', StatsCounter),
  TechLogos: section('TechLogos', TechLogos),
  DataChart: section('DataChart', DataChart),
  Callout: section('Callout', ({ title, description, variant }) => (
    <Callout variant={variant ?? 'neutral'} title={title} description={description} />
  )),
  FAQ: section('FAQ', ({ title, items }) => (
    <section>
      <SectionHeading>{title}</SectionHeading>
      <Accordion type="single" collapsible variant="card">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger text={item.question} />
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )),
  Steps: section('Steps', ({ title, steps }) => (
    <section>
      <SectionHeading>{title}</SectionHeading>
      <Steps>
        {steps.map((step, index) => (
          <StepsItem key={index} number={index + 1} title={step.title} details={step.details} />
        ))}
      </Steps>
    </section>
  )),
}) as unknown as Library;
