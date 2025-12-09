import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

// Mock react-i18next (translations not relevant to functionality testing)
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

// DO NOT mock useTheme - we want to test real integration

describe('ThemeToggle', () => {
  let mockLocalStorage: Record<string, string>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockLocalStorage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });

    // Mock matchMedia - default to light mode
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as typeof window.matchMedia;

    // Clean up document classes before each test
    document.documentElement.classList.remove('light', 'dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('renders button with aria-label', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('has fixed positioning classes', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-6');
    expect(button).toHaveClass('right-6');
  });

  it('applies custom className', () => {
    render(<ThemeToggle className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders an icon inside the button', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  // INTEGRATION TESTS: Real click behavior

  it('clicking the button actually changes the DOM theme class', () => {
    render(<ThemeToggle />);

    // Initial state: system preference (light)
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Click the toggle button
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Theme should change to dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('clicking the button saves preference to localStorage', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should save to localStorage
    expect(mockLocalStorage['theme-preference']).toBe('dark');
  });

  it('multiple clicks cycle through theme states correctly', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Initial: system (light)
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

    // First click: system -> dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(button).toHaveAttribute('aria-label', 'Use system theme');

    // Second click: dark -> system (light)
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

    // Third click: system -> dark again
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('shows correct tooltip for system mode when light', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('shows correct tooltip for system mode when dark', () => {
    // Set system to dark mode
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('shows use system tooltip when preference is explicitly set', () => {
    mockLocalStorage['theme-preference'] = 'dark';

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Use system theme');
    expect(button).toHaveAttribute('title', 'Use system theme');
  });

  it('updates tooltip after click', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Initially system (light) - tooltip says "Switch to dark"
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');

    // Click to switch to dark
    fireEvent.click(button);

    // Now explicit dark - tooltip says "Use system"
    expect(button).toHaveAttribute('aria-label', 'Use system theme');

    // Click to switch back to system
    fireEvent.click(button);

    // Back to system (light) - tooltip says "Switch to dark"
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('respects stored dark theme preference on mount', () => {
    mockLocalStorage['theme-preference'] = 'dark';

    render(<ThemeToggle />);

    // Should apply dark theme from stored preference
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('respects stored light theme preference on mount', () => {
    mockLocalStorage['theme-preference'] = 'light';

    render(<ThemeToggle />);

    // Should apply light theme from stored preference
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('button remains functional after multiple rapid clicks', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');

    // Rapid clicks
    fireEvent.click(button); // system -> dark
    fireEvent.click(button); // dark -> system
    fireEvent.click(button); // system -> dark
    fireEvent.click(button); // dark -> system
    fireEvent.click(button); // system -> dark

    // Should end up on dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(mockLocalStorage['theme-preference']).toBe('dark');
  });
});
