import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratedPage } from './GeneratedPage';
import type { VisitorType } from '@/App';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errors.title': 'Something went wrong',
        'errors.defaultMessage': 'Failed to generate layout',
        'errors.tryAgain': 'Try Again',
        'errors.fallbackNotice': 'Showing default layout due to an error',
        'navigation.portfolio': 'Portfolio',
        'navigation.changePerspective': 'Change perspective',
        'footer.personalizedFor': 'Personalized for',
        'footer.poweredBy': 'Powered by AI',
        'seo.portfolioFor': 'Portfolio for',
        'visitorTypes.developer.label': 'Developer',
        'visitorTypes.recruiter.label': 'Recruiter',
        'visitorTypes.collaborator.label': 'Collaborator',
        'visitorTypes.friend.label': 'Friend',
      };
      return translations[key] || key;
    },
  }),
}));

// The page renders through the real OpenUI Renderer and component library. Section components
// have their own tests, so stub them to expose exactly the props that reach them.
const stub = vi.hoisted(() => (name: string) => {
  const Stub = (props: Record<string, unknown>) => (
    <div data-testid={`section-${name}`} data-props={JSON.stringify(props)}>
      {String(props.title ?? '')}
    </div>
  );
  Stub.displayName = `Stub(${name})`;
  return Stub;
});
vi.mock('@/components/sections/HeroSection', () => ({ HeroSection: stub('Hero') }));
vi.mock('@/components/sections/ProjectCardGrid', () => ({ ProjectCardGrid: stub('CardGrid') }));
vi.mock('@/components/sections/SkillBadgeList', () => ({ SkillBadgeList: stub('SkillBadges') }));
vi.mock('@/components/sections/ExperienceTimeline', () => ({
  ExperienceTimeline: stub('Timeline'),
}));
vi.mock('@/components/sections/ContactSection', () => ({ ContactSection: stub('ContactForm') }));
vi.mock('@/components/sections/TextBlock', () => ({ TextBlock: stub('TextBlock') }));
vi.mock('@/components/sections/ImageGallery', () => ({ ImageGallery: stub('ImageGallery') }));
vi.mock('@/components/sections/StatsCounter', () => ({ StatsCounter: stub('StatsCounter') }));
vi.mock('@/components/sections/TechLogos', () => ({ TechLogos: stub('TechLogos') }));
vi.mock('@/components/sections/DataChart', () => ({ DataChart: stub('DataChart') }));

// Mock FeedbackButtons
vi.mock('./FeedbackButtons', () => ({
  FeedbackButtons: ({
    audienceType,
    layoutToken,
  }: {
    audienceType: string;
    layoutToken?: string;
  }) => (
    <div data-testid="feedback-buttons">
      Feedback: {audienceType} - {layoutToken}
    </div>
  ),
}));

// Mock SEO
vi.mock('./SEO', () => ({
  SEO: ({ title }: { title: string }) => <div data-testid="seo">{title}</div>,
}));

const page = (layout: string, sections: string[]) =>
  [`root = PortfolioPage("${layout}", "blue", [${sections.map((_, i) => `s${i}`).join(', ')}])`]
    .concat(sections.map((s, i) => `s${i} = ${s}`))
    .join('\n');

const DEFAULT_LANG = page('single-column', [
  'Hero("Test Hero", "Subtitle")',
  'CardGrid("Projects", 2, ["project-1"])',
]);

function propsOf(testId: string) {
  return JSON.parse(screen.getByTestId(testId).getAttribute('data-props')!);
}

describe('GeneratedPage', () => {
  const mockOnReset = vi.fn();
  const mockOnRegenerate = vi.fn();

  const defaultProps = {
    lang: DEFAULT_LANG,
    isStreaming: false,
    layoutToken: 'token-123',
    visitorType: 'developer' as VisitorType,
    onReset: mockOnReset,
    onRegenerate: mockOnRegenerate,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error state (no layout)', () => {
    it('renders error title when there is no layout and nothing is streaming', () => {
      render(<GeneratedPage {...defaultProps} lang="" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows default error message when error is null', () => {
      render(<GeneratedPage {...defaultProps} lang="" />);

      expect(screen.getByText('Failed to generate layout')).toBeInTheDocument();
    });

    it('shows custom error message when provided', () => {
      render(<GeneratedPage {...defaultProps} lang="" error="Custom error message" />);

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('try again button calls onReset', () => {
      render(<GeneratedPage {...defaultProps} lang="" />);

      fireEvent.click(screen.getByText('Try Again'));

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Normal state (with layout)', () => {
    it('renders navigation with portfolio title', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    it('change perspective button calls onReset', () => {
      render(<GeneratedPage {...defaultProps} />);

      fireEvent.click(screen.getByText('Change perspective'));

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('passes the layout token to FeedbackButtons', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByTestId('feedback-buttons')).toHaveTextContent(
        'Feedback: developer - token-123',
      );
    });

    it('renders sections from OpenUI Lang in order', () => {
      render(<GeneratedPage {...defaultProps} />);

      const sections = screen.getAllByTestId(/^section-/).map((el) => el.dataset.testid);
      expect(sections).toEqual(['section-Hero', 'section-CardGrid']);
      expect(propsOf('section-CardGrid')).toEqual({
        title: 'Projects',
        columns: 2,
        items: ['project-1'],
      });
    });

    it('renders footer with visitor type label', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByText(/Personalized for/)).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('renders SEO component with visitor type', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByTestId('seo')).toHaveTextContent('Portfolio for Developer');
    });

    it('marks the content busy while streaming', () => {
      const { container } = render(<GeneratedPage {...defaultProps} isStreaming />);

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });
  });

  describe('Streaming', () => {
    it('renders the sections that have arrived so far', () => {
      const partial =
        'root = PortfolioPage("single-column", "blue", [hero, grid])\nhero = Hero("Test Hero", "Sub")';
      const { rerender } = render(<GeneratedPage {...defaultProps} lang={partial} isStreaming />);

      expect(screen.getByTestId('section-Hero')).toBeInTheDocument();
      expect(screen.queryByTestId('section-CardGrid')).not.toBeInTheDocument();

      rerender(
        <GeneratedPage
          {...defaultProps}
          lang={`${partial}\ngrid = CardGrid("Projects", 2, ["project-1"])`}
          isStreaming={false}
        />,
      );
      expect(screen.getByTestId('section-CardGrid')).toBeInTheDocument();
    });

    it('does not render a section whose required props have not arrived yet', () => {
      render(
        <GeneratedPage
          {...defaultProps}
          lang={'root = PortfolioPage("single-column", "blue", [hero])\nhero = Hero("Only title'}
          isStreaming
        />,
      );

      expect(screen.queryByTestId('section-Hero')).not.toBeInTheDocument();
    });
  });

  describe('Prop validation at the render boundary', () => {
    it('drops an unsafe CTA link but keeps the section', () => {
      render(
        <GeneratedPage
          {...defaultProps}
          lang={page('single-column', [
            'Hero("Hi", "There", "/assets/profile.png", {text: "Click", href: "javascript:alert(1)"})',
          ])}
        />,
      );

      expect(propsOf('section-Hero')).toEqual({
        title: 'Hi',
        subtitle: 'There',
        image: '/assets/profile.png',
      });
    });

    it('drops images outside /assets', () => {
      render(
        <GeneratedPage
          {...defaultProps}
          lang={page('single-column', [
            'ImageGallery("Photos", ["/assets/a.png", "https://evil.example/x.png", "/assets/../secret"])',
          ])}
        />,
      );

      expect(propsOf('section-ImageGallery').images).toEqual(['/assets/a.png']);
    });

    it('drops invalid optional values like unknown icons', () => {
      render(
        <GeneratedPage
          {...defaultProps}
          lang={page('single-column', [
            'StatsCounter("Stats", [{label: "Users", value: 3, icon: "users"}, {label: "Bad", value: "x"}])',
          ])}
        />,
      );

      expect(propsOf('section-StatsCounter').stats).toEqual([{ label: 'Users', value: 3 }]);
    });

    it('does not render unknown components', () => {
      render(
        <GeneratedPage
          {...defaultProps}
          lang={page('single-column', ['Hero("Hi", "There")', 'Bogus("x")'])}
        />,
      );

      expect(screen.getAllByTestId(/^section-/)).toHaveLength(1);
    });
  });

  describe('Layout classes', () => {
    it.each([
      ['single-column', 'max-w-3xl'],
      ['two-column', 'max-w-6xl'],
      ['hero-focused', 'max-w-5xl'],
    ])('applies %s layout class', (layout, className) => {
      const { container } = render(
        <GeneratedPage {...defaultProps} lang={page(layout, ['Hero("Hi", "There")'])} />,
      );

      expect(container.querySelector('main.genui')).toHaveClass(className);
    });

    it('applies grid class for two-column layout', () => {
      const { container } = render(
        <GeneratedPage {...defaultProps} lang={page('two-column', ['Hero("Hi", "There")'])} />,
      );

      expect(container.querySelector('main.genui > div')).toHaveClass('grid', 'md:grid-cols-2');
    });
  });

  describe('Error banner', () => {
    it('shows error banner when error prop is truthy but layout exists', () => {
      render(<GeneratedPage {...defaultProps} error="Some error" />);

      expect(screen.getByText('Showing default layout due to an error')).toBeInTheDocument();
    });

    it('does not show error banner when error is null', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.queryByText('Showing default layout due to an error')).not.toBeInTheDocument();
    });
  });

  describe('Different visitor types', () => {
    it.each([
      ['recruiter', 'Recruiter'],
      ['collaborator', 'Collaborator'],
      ['friend', 'Friend'],
    ])('renders %s visitor type in footer', (visitorType, label) => {
      render(<GeneratedPage {...defaultProps} visitorType={visitorType as VisitorType} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
