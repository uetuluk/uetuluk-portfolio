import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratedPage } from './GeneratedPage';
import type { GeneratedLayout, VisitorType } from '@/App';

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

// Mock ComponentMapper
vi.mock('./ComponentMapper', () => ({
  ComponentMapper: ({ section }: { section: { type: string } }) => (
    <div data-testid={`section-${section.type}`}>Section: {section.type}</div>
  ),
}));

// Mock FeedbackButtons
vi.mock('./FeedbackButtons', () => ({
  FeedbackButtons: ({ audienceType, cacheKey }: { audienceType: string; cacheKey: string }) => (
    <div data-testid="feedback-buttons">
      Feedback: {audienceType} - {cacheKey}
    </div>
  ),
}));

// Mock SEO
vi.mock('./SEO', () => ({
  SEO: ({ title }: { title: string }) => <div data-testid="seo">{title}</div>,
}));

describe('GeneratedPage', () => {
  const mockOnReset = vi.fn();
  const mockOnRegenerate = vi.fn();

  const defaultLayout: GeneratedLayout = {
    layout: 'single-column',
    theme: { accent: 'blue' },
    sections: [
      { type: 'Hero', props: { title: 'Test Hero' } },
      { type: 'CardGrid', props: { title: 'Projects' } },
    ],
    _cacheKey: 'test-cache-key',
  };

  const defaultProps = {
    layout: defaultLayout,
    visitorType: 'developer' as VisitorType,
    onReset: mockOnReset,
    onRegenerate: mockOnRegenerate,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error state (no layout)', () => {
    it('renders error title when layout is null', () => {
      render(<GeneratedPage {...defaultProps} layout={null} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows default error message when error is null', () => {
      render(<GeneratedPage {...defaultProps} layout={null} error={null} />);

      expect(screen.getByText('Failed to generate layout')).toBeInTheDocument();
    });

    it('shows custom error message when provided', () => {
      render(<GeneratedPage {...defaultProps} layout={null} error="Custom error occurred" />);

      expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
    });

    it('try again button calls onReset', () => {
      render(<GeneratedPage {...defaultProps} layout={null} />);

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Normal state (with layout)', () => {
    it('renders navigation with portfolio title', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    it('renders change perspective button', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByText('Change perspective')).toBeInTheDocument();
    });

    it('change perspective button calls onReset', () => {
      render(<GeneratedPage {...defaultProps} />);

      const changePerspectiveButton = screen.getByText('Change perspective');
      fireEvent.click(changePerspectiveButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it('renders FeedbackButtons with correct props', () => {
      render(<GeneratedPage {...defaultProps} />);

      const feedbackButtons = screen.getByTestId('feedback-buttons');
      expect(feedbackButtons).toBeInTheDocument();
      expect(feedbackButtons).toHaveTextContent('developer');
      expect(feedbackButtons).toHaveTextContent('test-cache-key');
    });

    it('renders sections using ComponentMapper', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByTestId('section-Hero')).toBeInTheDocument();
      expect(screen.getByTestId('section-CardGrid')).toBeInTheDocument();
    });

    it('renders footer with visitor type label', () => {
      render(<GeneratedPage {...defaultProps} />);

      // Text is split across elements, so we search for partial match
      expect(screen.getByText(/Personalized for/)).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('renders powered by text in footer', () => {
      render(<GeneratedPage {...defaultProps} />);

      expect(screen.getByText('Powered by AI')).toBeInTheDocument();
    });

    it('renders SEO component with visitor type', () => {
      render(<GeneratedPage {...defaultProps} />);

      const seo = screen.getByTestId('seo');
      expect(seo).toHaveTextContent('Portfolio for Developer');
    });
  });

  describe('Layout classes', () => {
    it('applies single-column layout class', () => {
      const layout = { ...defaultLayout, layout: 'single-column' as const };
      render(<GeneratedPage {...defaultProps} layout={layout} />);

      const main = document.querySelector('main');
      expect(main).toHaveClass('max-w-3xl');
    });

    it('applies two-column layout class', () => {
      const layout = { ...defaultLayout, layout: 'two-column' as const };
      render(<GeneratedPage {...defaultProps} layout={layout} />);

      const main = document.querySelector('main');
      expect(main).toHaveClass('max-w-6xl');
    });

    it('applies hero-focused layout class', () => {
      const layout = { ...defaultLayout, layout: 'hero-focused' as const };
      render(<GeneratedPage {...defaultProps} layout={layout} />);

      const main = document.querySelector('main');
      expect(main).toHaveClass('max-w-5xl');
    });

    it('applies grid class for two-column layout', () => {
      const layout = { ...defaultLayout, layout: 'two-column' as const };
      render(<GeneratedPage {...defaultProps} layout={layout} />);

      const gridContainer = document.querySelector('.grid.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Error banner', () => {
    it('shows error banner when error prop is truthy but layout exists', () => {
      render(<GeneratedPage {...defaultProps} error="Some error occurred" />);

      expect(screen.getByText('Showing default layout due to an error')).toBeInTheDocument();
    });

    it('does not show error banner when error is null', () => {
      render(<GeneratedPage {...defaultProps} error={null} />);

      expect(screen.queryByText('Showing default layout due to an error')).not.toBeInTheDocument();
    });
  });

  describe('Different visitor types', () => {
    it('renders recruiter visitor type in footer', () => {
      render(<GeneratedPage {...defaultProps} visitorType="recruiter" />);

      expect(screen.getByText('Recruiter')).toBeInTheDocument();
    });

    it('renders collaborator visitor type in footer', () => {
      render(<GeneratedPage {...defaultProps} visitorType="collaborator" />);

      expect(screen.getByText('Collaborator')).toBeInTheDocument();
    });

    it('renders friend visitor type in footer', () => {
      render(<GeneratedPage {...defaultProps} visitorType="friend" />);

      expect(screen.getByText('Friend')).toBeInTheDocument();
    });
  });
});
