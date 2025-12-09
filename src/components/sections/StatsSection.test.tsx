import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsSection } from './StatsSection';

describe('StatsSection', () => {
  const defaultProps = {
    title: 'Achievements',
    stats: [
      { label: 'Years Experience', value: '8+' },
      { label: 'Projects Completed', value: '50+' },
      { label: 'Happy Clients', value: '30+' },
    ],
  };

  it('renders title correctly', () => {
    render(<StatsSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Achievements');
  });

  it('renders all stats with values and labels', () => {
    render(<StatsSection {...defaultProps} />);

    expect(screen.getByText('8+')).toBeInTheDocument();
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Projects Completed')).toBeInTheDocument();
    expect(screen.getByText('30+')).toBeInTheDocument();
    expect(screen.getByText('Happy Clients')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    const propsWithDescription = {
      ...defaultProps,
      stats: [
        { label: 'Years', value: '8+', description: 'of professional development' },
      ],
    };

    render(<StatsSection {...propsWithDescription} />);

    expect(screen.getByText('of professional development')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<StatsSection {...defaultProps} />);

    const statsElements = screen.getAllByText(/\d+\+/);
    expect(statsElements).toHaveLength(3);
  });

  it('applies correct columns class for 2 columns', () => {
    const { container } = render(<StatsSection {...defaultProps} columns={2} />);

    expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument();
  });

  it('applies correct columns class for 4 columns', () => {
    const { container } = render(<StatsSection {...defaultProps} columns={4} />);

    expect(container.querySelector('.lg\\:grid-cols-4')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatsSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
