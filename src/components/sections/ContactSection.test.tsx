import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactSection } from './ContactSection';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'contact.email': 'Email',
        'contact.linkedin': 'LinkedIn',
        'contact.linkedinValue': 'View Profile',
        'contact.githubValue': 'View GitHub',
        'contact.intro': 'Get in touch with me',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useTranslatedPortfolio
vi.mock('@/hooks/useTranslatedPortfolio', () => ({
  useTranslatedPortfolio: () => ({
    personal: {
      contact: {
        email: 'test@example.com',
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test',
      },
    },
  }),
}));

describe('ContactSection', () => {
  const defaultProps = {
    title: 'Contact Me',
  };

  it('renders title correctly', () => {
    render(<ContactSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Contact Me');
  });

  it('renders intro text', () => {
    render(<ContactSection {...defaultProps} />);

    expect(screen.getByText('Get in touch with me')).toBeInTheDocument();
  });

  it('shows email link when showEmail=true (default)', () => {
    render(<ContactSection {...defaultProps} />);

    const emailLink = screen.getByRole('link', { name: /Email/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:test@example.com');
  });

  it('hides email link when showEmail=false', () => {
    render(<ContactSection {...defaultProps} showEmail={false} />);

    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('shows LinkedIn link when showLinkedIn=true (default)', () => {
    render(<ContactSection {...defaultProps} />);

    const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/test');
  });

  it('hides LinkedIn link when showLinkedIn=false', () => {
    render(<ContactSection {...defaultProps} showLinkedIn={false} />);

    expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
  });

  it('shows GitHub link when showGitHub=true (default)', () => {
    render(<ContactSection {...defaultProps} />);

    const githubLink = screen.getByRole('link', { name: /GitHub/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test');
  });

  it('hides GitHub link when showGitHub=false', () => {
    render(<ContactSection {...defaultProps} showGitHub={false} />);

    expect(screen.queryByText('View GitHub')).not.toBeInTheDocument();
  });

  it('email link does not have target=_blank', () => {
    render(<ContactSection {...defaultProps} />);

    const emailLink = screen.getByRole('link', { name: /Email/i });
    expect(emailLink).not.toHaveAttribute('target');
  });

  it('external links have target=_blank', () => {
    render(<ContactSection {...defaultProps} />);

    const linkedinLink = screen.getByRole('link', { name: /LinkedIn/i });
    const githubLink = screen.getByRole('link', { name: /GitHub/i });

    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies custom className', () => {
    const { container } = render(<ContactSection {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});
