import { HeroSection } from './sections/HeroSection';
import { ProjectCardGrid } from './sections/ProjectCardGrid';
import { SkillBadgeList } from './sections/SkillBadgeList';
import { ExperienceTimeline } from './sections/ExperienceTimeline';
import { ContactSection } from './sections/ContactSection';
import { TextBlock } from './sections/TextBlock';
import { ImageGallery } from './sections/ImageGallery';
import { StatsCounter } from './sections/StatsCounter';
import { TechLogos } from './sections/TechLogos';
import { GitHubActivity } from './sections/GitHubActivity';

interface SectionConfig {
  type: string;
  props: Record<string, unknown>;
}

interface ComponentMapperProps {
  section: SectionConfig;
}

// Map of component types to their React components
// Using 'unknown' intermediate cast to avoid strict type checking issues
// since we're dynamically mapping props from AI-generated JSON
const componentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  Hero: HeroSection as unknown as React.ComponentType<Record<string, unknown>>,
  CardGrid: ProjectCardGrid as unknown as React.ComponentType<Record<string, unknown>>,
  SkillBadges: SkillBadgeList as unknown as React.ComponentType<Record<string, unknown>>,
  Timeline: ExperienceTimeline as unknown as React.ComponentType<Record<string, unknown>>,
  ContactForm: ContactSection as unknown as React.ComponentType<Record<string, unknown>>,
  TextBlock: TextBlock as unknown as React.ComponentType<Record<string, unknown>>,
  ImageGallery: ImageGallery as unknown as React.ComponentType<Record<string, unknown>>,
  StatsCounter: StatsCounter as unknown as React.ComponentType<Record<string, unknown>>,
  TechLogos: TechLogos as unknown as React.ComponentType<Record<string, unknown>>,
  GitHubActivity: GitHubActivity as unknown as React.ComponentType<Record<string, unknown>>,
};

export function ComponentMapper({ section }: ComponentMapperProps) {
  const Component = componentMap[section.type];

  if (!Component) {
    // Fallback for unknown component types
    return (
      <div className="p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
        Unknown component: {section.type}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Component {...section.props} />
    </div>
  );
}
