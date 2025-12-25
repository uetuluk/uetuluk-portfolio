import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCounter } from './StatsCounter';

describe('StatsCounter', () => {
  const defaultProps = {
    title: 'Key Stats',
    stats: [
      { label: 'Years Experience', value: 5, suffix: '+' },
      { label: 'Projects', value: 15 },
      { label: 'GitHub Stars', value: 100, icon: 'Star' },
    ],
  };

  beforeEach(() => {
    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn(function () {
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title correctly', () => {
    render(<StatsCounter {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Key Stats');
  });

  it('renders all stat labels', () => {
    render(<StatsCounter {...defaultProps} />);

    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('GitHub Stars')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatsCounter {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('renders stat cards with correct structure', () => {
    render(<StatsCounter {...defaultProps} />);

    // Check that we have 3 stat cards
    const statCards = screen.getAllByText(/Years Experience|Projects|GitHub Stars/);
    expect(statCards).toHaveLength(3);
  });

  it('renders values without animation when animated is false', () => {
    render(<StatsCounter {...defaultProps} animated={false} />);

    // Values should be rendered immediately without animation
    expect(screen.getByText('5+')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders suffix with value', () => {
    render(<StatsCounter {...defaultProps} animated={false} />);

    expect(screen.getByText('5+')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatsCounter {...defaultProps} />);

    // The Star icon should be rendered for the third stat
    const container = screen.getByText('GitHub Stars').closest('div');
    expect(container?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders grid with responsive columns', () => {
    const { container } = render(<StatsCounter {...defaultProps} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4');
  });
});
