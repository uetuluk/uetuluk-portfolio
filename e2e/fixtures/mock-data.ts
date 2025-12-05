export interface MockGeneratedLayout {
  layout: 'single-column' | 'two-column' | 'hero-focused';
  theme: { accent: string };
  sections: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
  _cacheKey?: string;
  _visitorContext?: {
    geo?: { country?: string; city?: string };
    device?: { type?: 'mobile' | 'tablet' | 'desktop' };
    time?: { timeOfDay?: string };
  };
  _uiHints?: {
    suggestedTheme?: 'light' | 'dark' | 'system';
    preferCompactLayout?: boolean;
  };
}

export const mockGeneratedLayout: MockGeneratedLayout = {
  layout: 'hero-focused',
  theme: { accent: 'blue' },
  sections: [
    {
      type: 'Hero',
      props: {
        title: 'Test User',
        subtitle: 'Software Developer',
        image: '/assets/profile.png',
      },
    },
    {
      type: 'SkillBadges',
      props: {
        title: 'Technical Skills',
        skills: ['TypeScript', 'React', 'Node.js'],
      },
    },
  ],
  _cacheKey: 'test-cache-key-12345',
  _visitorContext: {
    geo: { country: 'US', city: 'San Francisco' },
    device: { type: 'desktop' },
    time: { timeOfDay: 'morning' },
  },
  _uiHints: {
    suggestedTheme: 'light',
    preferCompactLayout: false,
  },
};

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
