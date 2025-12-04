import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextBlock } from './TextBlock';

describe('TextBlock', () => {
  const defaultProps = {
    title: 'Test Title',
    content: 'Test content goes here.',
  };

  it('renders title correctly', () => {
    render(<TextBlock {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Title');
  });

  it('renders content correctly', () => {
    render(<TextBlock {...defaultProps} />);

    expect(screen.getByText('Test content goes here.')).toBeInTheDocument();
  });

  it('applies prose style by default', () => {
    const { container } = render(<TextBlock {...defaultProps} />);

    const contentDiv = container.querySelector('.prose');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies highlight style when specified', () => {
    const { container } = render(<TextBlock {...defaultProps} style="highlight" />);

    const contentDiv = container.querySelector('.bg-primary\\/5');
    expect(contentDiv).toBeInTheDocument();
  });

  it('renders blockquote in highlight style', () => {
    render(<TextBlock {...defaultProps} style="highlight" />);

    const blockquote = screen.getByText('Test content goes here.');
    expect(blockquote.tagName.toLowerCase()).toBe('blockquote');
  });

  it('applies custom className', () => {
    const { container } = render(<TextBlock {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('preserves whitespace in content with prose style', () => {
    const multilineContent = 'Line 1\nLine 2\nLine 3';
    const { container } = render(<TextBlock {...defaultProps} content={multilineContent} />);

    const paragraph = container.querySelector('.whitespace-pre-wrap');
    expect(paragraph).toBeInTheDocument();
  });
});
