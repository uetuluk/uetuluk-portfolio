import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

// Mock react-i18next
const mockTranslations: Record<string, string | string[]> = {
  'loading.title': 'Crafting Your Experience',
  'loading.subtitle': 'Our AI is personalizing your view...',
  'loading.recruiter': [
    'Highlighting key achievements...',
    'Preparing skills showcase...',
    'Organizing career timeline...',
  ],
  'loading.developer': [
    'Loading technical projects...',
    'Fetching code samples...',
    'Preparing architecture diagrams...',
  ],
  'loading.collaborator': [
    'Preparing collaboration highlights...',
    'Loading partnership opportunities...',
    'Organizing joint ventures...',
  ],
  'loading.friend': [
    'Loading personal stories...',
    'Preparing fun facts...',
    'Gathering memories...',
  ],
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (options?.returnObjects) {
        return mockTranslations[key] || [];
      }
      return mockTranslations[key] || key;
    },
  }),
}));

// Mock react-spinners
vi.mock('react-spinners', () => ({
  ClipLoader: ({
    'aria-label': ariaLabel,
    color,
    size,
  }: {
    'aria-label'?: string;
    color?: string;
    size?: number;
  }) => (
    <div data-testid="clip-loader" aria-label={ariaLabel} data-color={color} data-size={size} />
  ),
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders title from translations', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      expect(screen.getByText('Crafting Your Experience')).toBeInTheDocument();
    });

    it('renders subtitle from translations', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      expect(screen.getByText('Our AI is personalizing your view...')).toBeInTheDocument();
    });

    it('renders ClipLoader spinner with correct aria-label', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const spinner = screen.getByTestId('clip-loader');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('renders 3 bouncing progress dots', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });
  });

  describe('visitor type messages', () => {
    it('shows recruiter messages for recruiter visitor type', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      expect(screen.getByText('Highlighting key achievements...')).toBeInTheDocument();
      expect(screen.getByText('Preparing skills showcase...')).toBeInTheDocument();
      expect(screen.getByText('Organizing career timeline...')).toBeInTheDocument();
    });

    it('shows developer messages for developer visitor type', () => {
      render(<LoadingScreen visitorType="developer" />);
      expect(screen.getByText('Loading technical projects...')).toBeInTheDocument();
      expect(screen.getByText('Fetching code samples...')).toBeInTheDocument();
    });

    it('shows collaborator messages for collaborator visitor type', () => {
      render(<LoadingScreen visitorType="collaborator" />);
      expect(screen.getByText('Preparing collaboration highlights...')).toBeInTheDocument();
    });

    it('shows friend messages for friend visitor type', () => {
      render(<LoadingScreen visitorType="friend" />);
      expect(screen.getByText('Loading personal stories...')).toBeInTheDocument();
    });

    it('shows no messages when visitorType is null', () => {
      render(<LoadingScreen visitorType={null} />);
      expect(screen.queryByText('Highlighting key achievements...')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading technical projects...')).not.toBeInTheDocument();
    });
  });

  describe('animation styles', () => {
    it('applies animate-pulse class to messages', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const messages = document.querySelectorAll('.animate-pulse');
      expect(messages.length).toBeGreaterThan(0);
    });

    it('applies animation delay to messages based on index', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const messages = document.querySelectorAll('.animate-pulse');
      messages.forEach((msg, index) => {
        const element = msg as HTMLElement;
        expect(element.style.animationDelay).toBe(`${index * 0.5}s`);
      });
    });

    it('applies animation delay to dots based on index', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const dots = document.querySelectorAll('.animate-bounce');
      dots.forEach((dot, index) => {
        const element = dot as HTMLElement;
        expect(element.style.animationDelay).toBe(`${index * 0.15}s`);
      });
    });

    it('sets correct animation duration on messages', () => {
      render(<LoadingScreen visitorType="recruiter" />);
      const messages = document.querySelectorAll('.animate-pulse');
      messages.forEach((msg) => {
        const element = msg as HTMLElement;
        expect(element.style.animationDuration).toBe('2s');
      });
    });
  });

  describe('styling', () => {
    it('has gradient background classes', () => {
      const { container } = render(<LoadingScreen visitorType="recruiter" />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain('bg-gradient-to-br');
    });

    it('is centered on the page', () => {
      const { container } = render(<LoadingScreen visitorType="recruiter" />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain('flex');
      expect(mainDiv.className).toContain('items-center');
      expect(mainDiv.className).toContain('justify-center');
    });
  });
});
