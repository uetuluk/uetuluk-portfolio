import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'theme.switchToLight': 'Switch to light mode',
        'theme.switchToDark': 'Switch to dark mode',
        'theme.useSystem': 'Use system theme',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useTheme hook
const mockToggleTheme = vi.fn();
let mockThemeState = {
  preference: 'system' as 'system' | 'light' | 'dark',
  toggleTheme: mockToggleTheme,
  isDark: false,
};

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockThemeState,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeState = {
      preference: 'system',
      toggleTheme: mockToggleTheme,
      isDark: false,
    };
  });

  it('renders button with aria-label', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('shows correct tooltip for system mode when light', () => {
    mockThemeState = {
      preference: 'system',
      toggleTheme: mockToggleTheme,
      isDark: false,
    };

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('shows correct tooltip for system mode when dark', () => {
    mockThemeState = {
      preference: 'system',
      toggleTheme: mockToggleTheme,
      isDark: true,
    };

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('shows use system tooltip when preference is light', () => {
    mockThemeState = {
      preference: 'light',
      toggleTheme: mockToggleTheme,
      isDark: false,
    };

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Use system theme');
    expect(button).toHaveAttribute('title', 'Use system theme');
  });

  it('shows use system tooltip when preference is dark', () => {
    mockThemeState = {
      preference: 'dark',
      toggleTheme: mockToggleTheme,
      isDark: true,
    };

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Use system theme');
    expect(button).toHaveAttribute('title', 'Use system theme');
  });

  it('calls toggleTheme when button is clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has fixed positioning classes', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-6');
    expect(button).toHaveClass('right-6');
  });

  it('renders an icon inside the button', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
