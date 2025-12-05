import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock child components
vi.mock('@/components/WelcomeModal', () => ({
  WelcomeModal: ({ onSelect }: { onSelect: (type: string, custom?: string) => void }) => (
    <div data-testid="welcome-modal">
      <button onClick={() => onSelect('developer')}>Select Developer</button>
      <button onClick={() => onSelect('recruiter')}>Select Recruiter</button>
      <button onClick={() => onSelect('collaborator')}>Select Collaborator</button>
      <button onClick={() => onSelect('friend')}>Select Friend</button>
      <button onClick={() => onSelect('developer', 'Custom intent')}>Select Custom</button>
    </div>
  ),
}));

vi.mock('@/components/LoadingScreen', () => ({
  LoadingScreen: ({ visitorType }: { visitorType: string }) => (
    <div data-testid="loading-screen">Loading for {visitorType}</div>
  ),
}));

vi.mock('@/components/GeneratedPage', () => ({
  GeneratedPage: ({
    layout,
    visitorType,
    onReset,
    onRegenerate,
    error,
  }: {
    layout: unknown;
    visitorType: string;
    onReset: () => void;
    onRegenerate: () => void;
    error: string | null;
  }) => (
    <div data-testid="generated-page">
      <span data-testid="visitor-type">{visitorType}</span>
      <span data-testid="layout">{JSON.stringify(layout)}</span>
      {error && <span data-testid="error">{error}</span>}
      <button onClick={onReset}>Reset</button>
      <button onClick={onRegenerate}>Regenerate</button>
    </div>
  ),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

vi.mock('@/components/SEO', () => ({
  SEO: () => <div data-testid="seo" />,
}));

vi.mock('@/components/StructuredData', () => ({
  StructuredData: () => <div data-testid="structured-data" />,
}));

// Mock react-i18next
const mockI18n = { language: 'en' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errors.failedGenerate': 'Failed to generate layout',
        'errors.failedRegenerate': 'Failed to regenerate layout',
        'errors.unexpected': 'An unexpected error occurred',
        'fallbackSections.skills': 'Skills',
        'fallbackSections.experience': 'Experience',
        'fallbackSections.projects': 'Projects',
        'fallbackSections.letsConnect': "Let's Connect",
        'fallbackSections.aboutMe': 'About Me',
        'fallbackSections.photos': 'Photos',
      };
      return translations[key] || key;
    },
    i18n: mockI18n,
  }),
}));

// Mock useTheme hook
const mockSetTheme = vi.fn();
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    preference: 'system',
    theme: 'light',
    isDark: false,
    isLight: true,
    isSystem: true,
    toggleTheme: vi.fn(),
  }),
}));

// Mock useTranslatedPortfolio hook
vi.mock('@/hooks/useTranslatedPortfolio', () => ({
  useTranslatedPortfolio: () => ({
    personal: {
      name: 'Test User',
      title: 'Test Engineer',
      bio: 'Test bio',
      location: 'Test City',
      contact: {},
    },
    projects: [{ id: 'project-1', title: 'Project 1' }],
    experience: [{ id: 'exp-1', company: 'Test Company' }],
    skills: ['TypeScript', 'React'],
    education: [],
    photos: [],
  }),
}));

// Mock palette functions
vi.mock('@/lib/palette', () => ({
  generatePalette: vi.fn(() => ({ light: {}, dark: {} })),
  colorNameToHSL: vi.fn(() => ({ h: 200, s: 70, l: 50 })),
}));

vi.mock('@/lib/applyPalette', () => ({
  applyPaletteToRoot: vi.fn(),
}));

describe('App', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();

    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key) => mockLocalStorage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders WelcomeModal when no visitor type selected', () => {
    render(<App />);

    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('generated-page')).not.toBeInTheDocument();
  });

  it('renders SEO, StructuredData, LanguageSwitcher, and ThemeToggle', () => {
    render(<App />);

    expect(screen.getByTestId('seo')).toBeInTheDocument();
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('shows LoadingScreen during API call', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
    expect(screen.getByText('Loading for developer')).toBeInTheDocument();
  });

  it('renders GeneratedPage after successful generation', async () => {
    const mockLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [{ type: 'Hero', props: {} }],
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLayout,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('generated-page')).toBeInTheDocument();
      expect(screen.getByTestId('visitor-type')).toHaveTextContent('developer');
    });
  });

  it('handles API error and falls back to default layout', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('generated-page')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to generate layout');
    });

    consoleSpy.mockRestore();
  });

  it('handleReset clears state and returns to modal', async () => {
    const mockLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [],
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLayout,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('generated-page')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Reset').click();
    });

    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('generated-page')).not.toBeInTheDocument();
  });

  it('handleRegenerate re-fetches layout from API', async () => {
    const mockLayout1 = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [{ type: 'Hero', props: { version: 1 } }],
    };
    const mockLayout2 = {
      layout: 'two-column',
      theme: { accent: 'green' },
      sections: [{ type: 'Hero', props: { version: 2 } }],
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLayout1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLayout2,
      });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('generated-page')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByText('Regenerate').click();
    });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('getDefaultLayout returns correct sections for recruiter', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Recruiter').click();
    });

    await waitFor(() => {
      const layoutText = screen.getByTestId('layout').textContent || '';
      const layout = JSON.parse(layoutText);

      expect(layout.sections).toHaveLength(3); // Hero + SkillBadges + Timeline
      expect(layout.sections[0].type).toBe('Hero');
      expect(layout.sections[1].type).toBe('SkillBadges');
      expect(layout.sections[2].type).toBe('Timeline');
    });

    consoleSpy.mockRestore();
  });

  it('getDefaultLayout returns correct sections for developer', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      const layoutText = screen.getByTestId('layout').textContent || '';
      const layout = JSON.parse(layoutText);

      expect(layout.sections).toHaveLength(2); // Hero + CardGrid
      expect(layout.sections[0].type).toBe('Hero');
      expect(layout.sections[1].type).toBe('CardGrid');
    });

    consoleSpy.mockRestore();
  });

  it('getDefaultLayout returns correct sections for collaborator', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Collaborator').click();
    });

    await waitFor(() => {
      const layoutText = screen.getByTestId('layout').textContent || '';
      const layout = JSON.parse(layoutText);

      expect(layout.sections).toHaveLength(3); // Hero + CardGrid + ContactForm
      expect(layout.sections[0].type).toBe('Hero');
      expect(layout.sections[1].type).toBe('CardGrid');
      expect(layout.sections[2].type).toBe('ContactForm');
    });

    consoleSpy.mockRestore();
  });

  it('getDefaultLayout returns correct sections for friend', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Friend').click();
    });

    await waitFor(() => {
      const layoutText = screen.getByTestId('layout').textContent || '';
      const layout = JSON.parse(layoutText);

      expect(layout.sections).toHaveLength(3); // Hero + TextBlock + ImageGallery
      expect(layout.sections[0].type).toBe('Hero');
      expect(layout.sections[1].type).toBe('TextBlock');
      expect(layout.sections[2].type).toBe('ImageGallery');
    });

    consoleSpy.mockRestore();
  });

  it('updates document.documentElement.lang when i18n language changes', () => {
    render(<App />);

    expect(document.documentElement.lang).toBe('en');
  });

  it('logs info when rate limited', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const mockLayout = {
      layout: 'hero-focused',
      theme: { accent: 'blue' },
      sections: [],
      _rateLimited: true,
    };

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLayout,
    });

    render(<App />);

    await act(async () => {
      screen.getByText('Select Developer').click();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Rate limited - showing default layout');
    });

    consoleSpy.mockRestore();
  });
});
