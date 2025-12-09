import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertSection } from './AlertSection';

describe('AlertSection', () => {
  const defaultProps = {
    title: 'Notice',
    message: 'This is an important message.',
  };

  it('renders title correctly', () => {
    render(<AlertSection {...defaultProps} />);

    expect(screen.getByText('Notice')).toBeInTheDocument();
  });

  it('renders message correctly', () => {
    render(<AlertSection {...defaultProps} />);

    expect(screen.getByText('This is an important message.')).toBeInTheDocument();
  });

  it('has alert role', () => {
    render(<AlertSection {...defaultProps} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders info variant by default', () => {
    const { container } = render(<AlertSection {...defaultProps} />);

    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('renders success variant', () => {
    const { container } = render(<AlertSection {...defaultProps} variant="success" />);

    expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
  });

  it('renders warning variant', () => {
    const { container } = render(<AlertSection {...defaultProps} variant="warning" />);

    expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
  });

  it('renders error variant', () => {
    const { container } = render(<AlertSection {...defaultProps} variant="error" />);

    expect(container.querySelector('.bg-red-50')).toBeInTheDocument();
  });

  it('does not show dismiss button by default', () => {
    render(<AlertSection {...defaultProps} />);

    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
  });

  it('shows dismiss button when dismissible', () => {
    render(<AlertSection {...defaultProps} dismissible />);

    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
  });

  it('dismisses alert when dismiss button is clicked', () => {
    render(<AlertSection {...defaultProps} dismissible />);

    const dismissButton = screen.getByLabelText('Dismiss alert');
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AlertSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
