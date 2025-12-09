import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabsSection } from './TabsSection';

describe('TabsSection', () => {
  const defaultProps = {
    title: 'Skills by Category',
    tabs: [
      { label: 'Frontend', content: 'React, Vue, Angular' },
      { label: 'Backend', content: 'Node.js, Python, Go' },
      { label: 'DevOps', content: 'Docker, Kubernetes, AWS' },
    ],
  };

  it('renders title correctly', () => {
    render(<TabsSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Skills by Category');
  });

  it('renders all tab labels', () => {
    render(<TabsSection {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Frontend' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Backend' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'DevOps' })).toBeInTheDocument();
  });

  it('first tab is selected by default', () => {
    render(<TabsSection {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Frontend' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('React, Vue, Angular')).toBeInTheDocument();
  });

  it('switches tab content when clicked', () => {
    render(<TabsSection {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Backend' }));

    expect(screen.getByRole('tab', { name: 'Backend' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Node.js, Python, Go')).toBeInTheDocument();
  });

  it('respects defaultTab prop', () => {
    render(<TabsSection {...defaultProps} defaultTab={2} />);

    expect(screen.getByRole('tab', { name: 'DevOps' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Docker, Kubernetes, AWS')).toBeInTheDocument();
  });

  it('renders tablist and tabpanel roles', () => {
    render(<TabsSection {...defaultProps} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TabsSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
