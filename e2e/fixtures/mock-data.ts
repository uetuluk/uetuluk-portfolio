import { encodeEvent, type GenerateMeta } from '../../src/genui/protocol';

export const mockGenerateMeta: GenerateMeta = {
  source: 'ai',
  layoutToken: '00000000-0000-4000-8000-000000000001',
  visitorContext: {
    geo: { country: 'US', city: 'San Francisco' },
    device: { type: 'desktop' },
    time: { timeOfDay: 'morning' },
  },
  uiHints: {
    suggestedTheme: 'light',
    preferCompactLayout: false,
  },
};

export const mockGeneratedLang = [
  'root = PortfolioPage("hero-focused", "blue", [hero, skills])',
  'hero = Hero("Test User", "Software Developer", "/assets/profile.png")',
  'skills = SkillBadges("Technical Skills", "compact", ["TypeScript", "React", "Node.js"])',
].join('\n');

/**
 * Body for a mocked /api/generate response: the same event stream the Worker sends. The layout
 * is split into several deltas so the client exercises its incremental path.
 */
export function generateEventStream(
  lang: string = mockGeneratedLang,
  meta: GenerateMeta = mockGenerateMeta,
): string {
  const lines = lang.split('\n');
  return [
    encodeEvent({ event: 'meta', data: meta }),
    ...lines.map((line, i) =>
      encodeEvent({ event: 'delta', data: { text: i < lines.length - 1 ? `${line}\n` : line } }),
    ),
    encodeEvent({ event: 'done', data: {} }),
  ].join('');
}

export const EVENT_STREAM = 'text/event-stream';

export const mockFeedbackResponse = {
  success: true,
  message: 'Thank you for your feedback!',
  regenerate: false,
};

export const mockFeedbackRegenerateResponse = {
  success: true,
  message: 'Regenerating your personalized layout...',
  regenerate: true,
};

export const mockRateLimitedResponse = {
  success: false,
  message: 'Please wait before requesting another regeneration',
  rateLimited: true,
  retryAfter: 60,
};

export const mockHealthResponse = {
  status: 'ok',
};
