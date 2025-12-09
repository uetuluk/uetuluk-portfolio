import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureListSection } from './FeatureListSection';

describe('FeatureListSection', () => {
  const defaultProps = {
    title: 'Features',
    features: [
      { title: 'Fast Development', description: 'Quick turnaround on projects', icon: 'rocket' as const },
      { title: 'Clean Code', description: 'Well-structured and maintainable', icon: 'code' as const },
      { title: 'Global Reach', description: 'Work with clients worldwide', icon: 'globe' as const },
    ],
  };

  it('renders title correctly', () => {
    render(<FeatureListSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Features');
  });

  it('renders all feature titles', () => {
    render(<FeatureListSection {...defaultProps} />);

    expect(screen.getByText('Fast Development')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Global Reach')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeatureListSection {...defaultProps} />);

    expect(screen.getByText('Quick turnaround on projects')).toBeInTheDocument();
    expect(screen.getByText('Well-structured and maintainable')).toBeInTheDocument();
    expect(screen.getByText('Work with clients worldwide')).toBeInTheDocument();
  });

  it('renders features without icons', () => {
    const propsWithoutIcons = {
      title: 'Features',
      features: [
        { title: 'Feature 1', description: 'Description 1' },
        { title: 'Feature 2', description: 'Description 2' },
      ],
    };

    render(<FeatureListSection {...propsWithoutIcons} />);

    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('applies correct columns class for 1 column', () => {
    const { container } = render(<FeatureListSection {...defaultProps} columns={1} />);

    expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
  });

  it('applies correct columns class for 3 columns', () => {
    const { container } = render(<FeatureListSection {...defaultProps} columns={3} />);

    expect(container.querySelector('.lg\\:grid-cols-3')).toBeInTheDocument();
  });

  it('defaults to 2 columns', () => {
    const { container } = render(<FeatureListSection {...defaultProps} />);

    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FeatureListSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('renders all icon types correctly', () => {
    const propsWithAllIcons = {
      title: 'Icons',
      features: [
        { title: 'Code', description: 'desc', icon: 'code' as const },
        { title: 'Briefcase', description: 'desc', icon: 'briefcase' as const },
        { title: 'Rocket', description: 'desc', icon: 'rocket' as const },
        { title: 'Star', description: 'desc', icon: 'star' as const },
        { title: 'Heart', description: 'desc', icon: 'heart' as const },
        { title: 'Globe', description: 'desc', icon: 'globe' as const },
      ],
    };

    render(<FeatureListSection {...propsWithAllIcons} />);

    // All feature titles should render
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Briefcase')).toBeInTheDocument();
    expect(screen.getByText('Rocket')).toBeInTheDocument();
    expect(screen.getByText('Star')).toBeInTheDocument();
    expect(screen.getByText('Heart')).toBeInTheDocument();
    expect(screen.getByText('Globe')).toBeInTheDocument();
  });
});
