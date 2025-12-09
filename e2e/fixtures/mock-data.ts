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

// Layout with new component types for testing
export const mockLayoutWithNewComponents: MockGeneratedLayout = {
  layout: 'single-column',
  theme: { accent: 'purple' },
  sections: [
    {
      type: 'Hero',
      props: {
        title: 'Test User',
        subtitle: 'Full Stack Developer',
        image: '/assets/profile.png',
      },
    },
    {
      type: 'Stats',
      props: {
        title: 'By the Numbers',
        stats: [
          { label: 'Years Experience', value: '8+' },
          { label: 'Projects Completed', value: '50+' },
          { label: 'Happy Clients', value: '30+' },
        ],
        columns: 3,
      },
    },
    {
      type: 'Tabs',
      props: {
        title: 'Skills Overview',
        tabs: [
          { label: 'Frontend', content: 'React, Vue, TypeScript, Tailwind CSS' },
          { label: 'Backend', content: 'Node.js, Python, PostgreSQL, Redis' },
          { label: 'DevOps', content: 'Docker, Kubernetes, AWS, CI/CD' },
        ],
      },
    },
    {
      type: 'Accordion',
      props: {
        title: 'Frequently Asked Questions',
        items: [
          { question: 'What is your availability?', answer: 'I am currently available for freelance projects.' },
          { question: 'What is your hourly rate?', answer: 'Please contact me to discuss project details and rates.' },
        ],
      },
    },
    {
      type: 'Testimonials',
      props: {
        title: 'What People Say',
        items: [
          { quote: 'Excellent developer!', author: 'John Doe', role: 'CTO', company: 'TechCorp' },
        ],
      },
    },
    {
      type: 'FeatureList',
      props: {
        title: 'Why Work With Me',
        features: [
          { title: 'Fast Delivery', description: 'Quick turnaround on projects', icon: 'rocket' },
          { title: 'Clean Code', description: 'Well-structured and maintainable', icon: 'code' },
        ],
        columns: 2,
      },
    },
    {
      type: 'Alert',
      props: {
        title: 'Available Now',
        message: 'I am currently accepting new projects!',
        variant: 'success',
      },
    },
  ],
  _cacheKey: 'test-cache-key-new-components',
  _visitorContext: {
    geo: { country: 'US', city: 'Austin' },
    device: { type: 'desktop' },
    time: { timeOfDay: 'afternoon' },
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
