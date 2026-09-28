import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createParser } from '@openuidev/lang-core';
import App from './App';
import { encodeEvent, type GenerateEvent, type GenerateMeta } from '@/genui/protocol';
import { contractLibrary, ROOT_COMPONENT } from '@/genui/schema';

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
    lang,
    isStreaming,
    layoutToken,
    visitorType,
    onReset,
    onRegenerate,
    error,
  }: {
    lang: string;
    isStreaming: boolean;
    layoutToken?: string;
    visitorType: string;
    onReset: () => void;
    onRegenerate: () => void;
    error: string | null;
  }) => (
    <div data-testid="generated-page">
      <span data-testid="visitor-type">{visitorType}</span>
      <span data-testid="lang">{lang}</span>
      <span data-testid="streaming">{String(isStreaming)}</span>
      <span data-testid="layout-token">{layoutToken ?? ''}</span>
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
        'fallbackSections.featuredProjects': 'Featured Projects',
        'fallbackSections.letsConnect': "Let's Connect",
        'fallbackSections.getInTouch': 'Get in Touch',
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

const mockPortfolio = {
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
  photos: [{ path: '/assets/cat.png' }],
};

vi.mock('@/hooks/useTranslatedPortfolio', () => ({
  useTranslatedPortfolio: () => mockPortfolio,
}));

const LAYOUT = 'root = PortfolioPage("single-column", "blue", [Hero("Hi", "There")])';
const META: GenerateMeta = { source: 'ai', layoutToken: 'token-abc' };

/** A /api/generate response whose events are all available immediately. */
function sseResponse(events: GenerateEvent[], status = 200): Response {
  return new Response(events.map(encodeEvent).join(''), {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function layoutResponse(lang = LAYOUT, meta: GenerateMeta = META): Response {
  return sseResponse([
    { event: 'meta', data: meta },
    { event: 'delta', data: { text: lang } },
    { event: 'done', data: {} },
  ]);
}

/** A /api/generate response the test feeds one event at a time. */
function controlledResponse() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) });
  const encoder = new TextEncoder();
  return {
    response: new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
    send: (event: GenerateEvent) => controller.enqueue(encoder.encode(encodeEvent(event))),
    close: () => controller.close(),
  };
}

const parser = createParser(contractLibrary.toJSONSchema(), ROOT_COMPONENT);

function renderedSections(): string[] {
  const root = parser.parse(screen.getByTestId('lang').textContent ?? '').root;
  return ((root?.props as { sections: Array<{ typeName: string }> }).sections ?? []).map(
    (s) => s.typeName,
  );
}

describe('App', () => {
  let mockLocalStorage: Record<string, string>;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;

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
  });

  it('renders SEO, StructuredData, LanguageSwitcher, and ThemeToggle', () => {
    render(<App />);

    expect(screen.getByTestId('seo')).toBeInTheDocument();
    expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('sends the visitor type, custom intent and portfolio content', async () => {
    fetchMock.mockResolvedValue(layoutResponse());
    render(<App />);

    await act(async () => screen.getByText('Select Custom').click());

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body).toEqual({
      visitorTag: 'developer',
      customIntent: 'Custom intent',
      portfolioContent: mockPortfolio,
    });
  });

  it('shows LoadingScreen until the first content arrives, then renders progressively', async () => {
    const stream = controlledResponse();
    fetchMock.mockResolvedValue(stream.response);
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    expect(screen.getByTestId('loading-screen')).toHaveTextContent('Loading for developer');

    await act(async () => stream.send({ event: 'meta', data: META }));
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();

    await act(async () => stream.send({ event: 'delta', data: { text: 'root = PortfolioPage(' } }));
    expect(await screen.findByTestId('generated-page')).toBeInTheDocument();
    expect(screen.getByTestId('streaming')).toHaveTextContent('true');

    await act(async () => {
      stream.send({ event: 'delta', data: { text: '"single-column", "blue", [])' } });
      stream.send({ event: 'done', data: {} });
      stream.close();
    });
    await waitFor(() => expect(screen.getByTestId('streaming')).toHaveTextContent('false'));
    expect(screen.getByTestId('lang')).toHaveTextContent(
      'root = PortfolioPage("single-column", "blue", [])',
    );
    expect(screen.getByTestId('layout-token')).toHaveTextContent('token-abc');
  });

  it('applies the suggested theme as soon as meta arrives on a first visit', async () => {
    const stream = controlledResponse();
    fetchMock.mockResolvedValue(stream.response);
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    await act(async () =>
      stream.send({ event: 'meta', data: { source: 'ai', uiHints: { suggestedTheme: 'dark' } } }),
    );

    // Before any content: no theme flip once the page is visible
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockLocalStorage['portfolio-visited']).toBe('true');
  });

  it('does not override the theme on a repeat visit', async () => {
    mockLocalStorage['portfolio-visited'] = 'true';
    fetchMock.mockResolvedValue(
      layoutResponse(LAYOUT, { source: 'ai', uiHints: { suggestedTheme: 'dark' } }),
    );
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    await screen.findByTestId('generated-page');

    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  describe('fallback layout', () => {
    it.each([
      ['Recruiter', ['Hero', 'SkillBadges', 'Timeline', 'CardGrid']],
      ['Developer', ['Hero', 'CardGrid', 'SkillBadges', 'ContactForm']],
      ['Collaborator', ['Hero', 'TextBlock', 'CardGrid', 'ContactForm']],
      ['Friend', ['Hero', 'TextBlock', 'ImageGallery', 'ContactForm']],
    ])('renders the %s default page when the API fails', async (type, sections) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValue(new Response('Internal error', { status: 500 }));
      render(<App />);

      await act(async () => screen.getByText(`Select ${type}`).click());

      await waitFor(() => expect(screen.getByTestId('generated-page')).toBeInTheDocument());
      await waitFor(() => expect(renderedSections()).toEqual(sections));
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to generate layout');
    });

    it('uses translated section titles', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValue(new Response('Internal error', { status: 500 }));
      render(<App />);

      await act(async () => screen.getByText('Select Recruiter').click());

      await waitFor(() =>
        expect(screen.getByTestId('lang')).toHaveTextContent('Featured Projects'),
      );
    });

    it('renders the default page when the network request fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<App />);

      await act(async () => screen.getByText('Select Developer').click());

      await waitFor(() => expect(renderedSections()).toContain('CardGrid'));
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch');
    });

    it('renders the default page when the stream ends without content', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'meta', data: META },
          { event: 'done', data: {} },
        ]),
      );
      render(<App />);

      await act(async () => screen.getByText('Select Developer').click());

      await waitFor(() => expect(renderedSections()).toContain('CardGrid'));
    });

    it('keeps partial content when the stream is interrupted', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'meta', data: META },
          { event: 'delta', data: { text: 'root = PortfolioPage("single-column"' } },
          { event: 'error', data: { message: 'Generation was interrupted' } },
          { event: 'done', data: {} },
        ]),
      );
      render(<App />);

      await act(async () => screen.getByText('Select Developer').click());

      await waitFor(() => expect(screen.getByTestId('streaming')).toHaveTextContent('false'));
      expect(screen.getByTestId('lang')).toHaveTextContent('root = PortfolioPage("single-column"');
      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });
  });

  it('handleReset clears state and returns to modal', async () => {
    fetchMock.mockResolvedValue(layoutResponse());
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    await screen.findByTestId('generated-page');

    await act(async () => screen.getByText('Reset').click());

    expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
  });

  it('handleRegenerate re-fetches the layout', async () => {
    fetchMock.mockResolvedValueOnce(layoutResponse());
    render(<App />);

    await act(async () => screen.getByText('Select Custom').click());
    await screen.findByTestId('generated-page');

    const REGENERATED = 'root = PortfolioPage("two-column", "green", [Timeline("Work")])';
    fetchMock.mockResolvedValueOnce(layoutResponse(REGENERATED));
    await act(async () => screen.getByText('Regenerate').click());

    await waitFor(() => expect(screen.getByTestId('lang')).toHaveTextContent(REGENERATED));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Regeneration keeps the original custom intent
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string).customIntent).toBe(
      'Custom intent',
    );
  });

  it('shows the fallback with a regenerate-specific error when regeneration fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(layoutResponse());
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    await screen.findByTestId('generated-page');

    fetchMock.mockResolvedValueOnce(new Response('down', { status: 503 }));
    await act(async () => screen.getByText('Regenerate').click());

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to regenerate layout'),
    );
    expect(renderedSections()).toContain('CardGrid');
  });

  it('updates document.documentElement.lang when i18n language changes', () => {
    render(<App />);

    expect(document.documentElement.lang).toBe('en');
  });

  it('logs info when rate limited', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    fetchMock.mockResolvedValue(
      layoutResponse(LAYOUT, { source: 'fallback', rateLimited: true, retryAfter: 30 }),
    );
    render(<App />);

    await act(async () => screen.getByText('Select Developer').click());
    await screen.findByTestId('generated-page');

    await waitFor(() => expect(info).toHaveBeenCalledWith('Rate limited - showing default layout'));
  });
});
