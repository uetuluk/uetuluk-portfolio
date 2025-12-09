import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccordionSection } from './AccordionSection';

describe('AccordionSection', () => {
  const defaultProps = {
    title: 'FAQ',
    items: [
      { question: 'Question 1', answer: 'Answer 1' },
      { question: 'Question 2', answer: 'Answer 2' },
      { question: 'Question 3', answer: 'Answer 3' },
    ],
  };

  it('renders title correctly', () => {
    render(<AccordionSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('FAQ');
  });

  it('renders all questions', () => {
    render(<AccordionSection {...defaultProps} />);

    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
  });

  it('all items are collapsed by default', () => {
    render(<AccordionSection {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('expands item when clicked', () => {
    render(<AccordionSection {...defaultProps} />);

    const firstButton = screen.getByText('Question 1').closest('button')!;
    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Answer 1')).toBeVisible();
  });

  it('collapses item when clicked again', () => {
    render(<AccordionSection {...defaultProps} />);

    const firstButton = screen.getByText('Question 1').closest('button')!;
    fireEvent.click(firstButton);
    fireEvent.click(firstButton);

    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes other items when opening a new one', () => {
    render(<AccordionSection {...defaultProps} />);

    const firstButton = screen.getByText('Question 1').closest('button')!;
    const secondButton = screen.getByText('Question 2').closest('button')!;

    fireEvent.click(firstButton);
    expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(secondButton);
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    expect(secondButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('respects defaultOpen prop', () => {
    render(<AccordionSection {...defaultProps} defaultOpen={1} />);

    const secondButton = screen.getByText('Question 2').closest('button')!;
    expect(secondButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<AccordionSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
