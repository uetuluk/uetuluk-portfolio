import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialsSection } from './TestimonialsSection';

describe('TestimonialsSection', () => {
  const defaultProps = {
    title: 'What People Say',
    items: [
      {
        quote: 'Great developer to work with!',
        author: 'John Doe',
        role: 'CTO',
        company: 'TechCorp',
      },
      {
        quote: 'Delivered on time and exceeded expectations.',
        author: 'Jane Smith',
        role: 'Product Manager',
      },
    ],
  };

  it('renders title correctly', () => {
    render(<TestimonialsSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What People Say');
  });

  it('renders all testimonial quotes', () => {
    render(<TestimonialsSection {...defaultProps} />);

    expect(screen.getByText(/"Great developer to work with!"/)).toBeInTheDocument();
    expect(screen.getByText(/"Delivered on time and exceeded expectations."/)).toBeInTheDocument();
  });

  it('renders author names', () => {
    render(<TestimonialsSection {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders role and company when provided', () => {
    render(<TestimonialsSection {...defaultProps} />);

    expect(screen.getByText('CTO at TechCorp')).toBeInTheDocument();
    expect(screen.getByText('Product Manager')).toBeInTheDocument();
  });

  it('renders author initials as avatar', () => {
    render(<TestimonialsSection {...defaultProps} />);

    // Both testimonials have authors starting with 'J', so check for multiple
    const initials = screen.getAllByText('J');
    expect(initials.length).toBe(2); // John Doe and Jane Smith
  });

  it('handles testimonial without role or company', () => {
    const propsWithMinimalTestimonial = {
      title: 'Testimonials',
      items: [{ quote: 'Amazing work!', author: 'Bob' }],
    };

    render(<TestimonialsSection {...propsWithMinimalTestimonial} />);

    expect(screen.getByText(/"Amazing work!"/)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<TestimonialsSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
