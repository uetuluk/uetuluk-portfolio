import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TechLogos } from './TechLogos';

// Mock portfolio.json for default technologies
vi.mock('@/content/portfolio.json', () => ({
  default: {
    skills: ['React', 'TypeScript', 'Python'],
  },
}));

describe('TechLogos', () => {
  const defaultProps = {
    title: 'Tech Stack',
  };

  it('renders title correctly', () => {
    render(<TechLogos {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Tech Stack');
  });

  it('renders provided technologies', () => {
    const technologies = ['Docker', 'Kubernetes', 'AWS'];
    render(<TechLogos {...defaultProps} technologies={technologies} />);

    // Technologies should be rendered as images with titles
    const dockerLogo = screen.getByTitle('Docker');
    expect(dockerLogo).toBeInTheDocument();
  });

  it('falls back to default skills when technologies not provided', () => {
    render(<TechLogos {...defaultProps} />);

    // Default skills from mocked portfolio.json
    expect(screen.getByTitle('React')).toBeInTheDocument();
    expect(screen.getByTitle('TypeScript')).toBeInTheDocument();
    expect(screen.getByTitle('Python')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TechLogos {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('renders in grid style by default', () => {
    const { container } = render(<TechLogos {...defaultProps} />);

    // Grid style has flex-wrap layout
    expect(container.querySelector('.flex-wrap')).toBeInTheDocument();
  });

  it('renders in marquee style when specified', () => {
    const { container } = render(<TechLogos {...defaultProps} style="marquee" />);

    // Marquee style has animate-marquee class
    expect(container.querySelector('.animate-marquee')).toBeInTheDocument();
  });

  it('renders gradient masks in marquee style', () => {
    const { container } = render(<TechLogos {...defaultProps} style="marquee" />);

    // Marquee has gradient fade masks on sides
    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
    expect(container.querySelector('.bg-gradient-to-l')).toBeInTheDocument();
  });

  it('uses Simple Icons CDN for known technologies', () => {
    const technologies = ['React'];
    render(<TechLogos {...defaultProps} technologies={technologies} />);

    const img = screen.getByRole('img', { name: 'React' });
    expect(img).toHaveAttribute('src', 'https://cdn.simpleicons.org/react');
  });

  it('shows text fallback for unknown technologies', () => {
    const technologies = ['UnknownTech'];
    render(<TechLogos {...defaultProps} technologies={technologies} />);

    // Unknown tech should show text badge
    expect(screen.getByText('UnknownTech')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const technologies = ['React'];

    // Test small size
    const { rerender, container } = render(
      <TechLogos {...defaultProps} technologies={technologies} size="sm" />,
    );
    expect(container.querySelector('.w-8')).toBeInTheDocument();

    // Test large size
    rerender(<TechLogos {...defaultProps} technologies={technologies} size="lg" />);
    expect(container.querySelector('.w-16')).toBeInTheDocument();
  });
});
