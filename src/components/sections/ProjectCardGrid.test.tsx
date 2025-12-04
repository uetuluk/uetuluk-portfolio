import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCardGrid } from './ProjectCardGrid';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'projects.demo': 'Live Demo',
        'projects.github': 'GitHub',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useTranslatedPortfolio
vi.mock('@/hooks/useTranslatedPortfolio', () => ({
  useTranslatedPortfolio: () => ({
    projects: [
      {
        id: 'project-1',
        title: 'Project One',
        description: 'Description for project one',
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Extra'],
        image: '/project1.jpg',
        links: {
          demo: 'https://demo.example.com',
          github: 'https://github.com/example/project1',
        },
        tags: ['web', 'fullstack'],
      },
      {
        id: 'project-2',
        title: 'Project Two',
        description: 'Description for project two',
        technologies: ['Python', 'FastAPI'],
        image: '/project2.jpg',
        links: {
          github: 'https://github.com/example/project2',
        },
        tags: ['backend'],
      },
    ],
  }),
}));

describe('ProjectCardGrid', () => {
  const defaultProps = {
    title: 'My Projects',
    items: ['project-1', 'project-2'],
  };

  it('renders title correctly', () => {
    render(<ProjectCardGrid {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('My Projects');
  });

  it('renders project cards', () => {
    render(<ProjectCardGrid {...defaultProps} />);

    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Project Two')).toBeInTheDocument();
  });

  it('resolves project IDs to full objects', () => {
    render(<ProjectCardGrid {...defaultProps} />);

    expect(screen.getByText('Description for project one')).toBeInTheDocument();
    expect(screen.getByText('Description for project two')).toBeInTheDocument();
  });

  it('displays project title and description', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-1']} />);

    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.getByText('Description for project one')).toBeInTheDocument();
  });

  it('shows technologies (max 4)', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-1']} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    // "Extra" (5th tech) should not be shown
    expect(screen.queryByText('Extra')).not.toBeInTheDocument();
  });

  it('renders demo link when available', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-1']} />);

    const demoLink = screen.getByRole('link', { name: /Live Demo/i });
    expect(demoLink).toBeInTheDocument();
    expect(demoLink).toHaveAttribute('href', 'https://demo.example.com');
    expect(demoLink).toHaveAttribute('target', '_blank');
  });

  it('renders GitHub link when available', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-1']} />);

    const githubLink = screen.getByRole('link', { name: /GitHub/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/example/project1');
  });

  it('does not render demo link when not available', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-2']} />);

    expect(screen.queryByRole('link', { name: /Live Demo/i })).not.toBeInTheDocument();
  });

  it('applies correct column grid class for 2 columns', () => {
    const { container } = render(<ProjectCardGrid {...defaultProps} columns={2} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-2');
  });

  it('applies correct column grid class for 3 columns (default)', () => {
    const { container } = render(<ProjectCardGrid {...defaultProps} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('applies correct column grid class for 4 columns', () => {
    const { container } = render(<ProjectCardGrid {...defaultProps} columns={4} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('handles missing projects gracefully', () => {
    render(<ProjectCardGrid {...defaultProps} items={['non-existent-project', 'project-1']} />);

    // Should only render the valid project
    expect(screen.getByText('Project One')).toBeInTheDocument();
    expect(screen.queryByText('non-existent-project')).not.toBeInTheDocument();
  });

  it('handles image error with fallback', () => {
    render(<ProjectCardGrid {...defaultProps} items={['project-1']} />);

    const img = screen.getByAltText('Project One');
    fireEvent.error(img);

    expect(img).toHaveAttribute('src');
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('applies custom className', () => {
    const { container } = render(<ProjectCardGrid {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
